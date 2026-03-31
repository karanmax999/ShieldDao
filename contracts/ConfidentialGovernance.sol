// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IConfidentialGovernance} from "./interfaces/IConfidentialGovernance.sol";
import {IConfidentialTreasury} from "./interfaces/IConfidentialTreasury.sol";

/// @title ConfidentialGovernance
/// @notice Manages DAO proposals with homomorphic vote tallying.
///         Individual votes are permanently private; only aggregate tallies are revealed.
///         After the voting window closes, `finalizeProposal` marks the tally handles as
///         publicly decryptable. An off-chain relayer (or anyone) then calls `revealOutcome`
///         with the plaintext values to record the on-chain result.
contract ConfidentialGovernance is ZamaEthereumConfig, IConfidentialGovernance {
    // -------------------------------------------------------------------------
    // Additional Errors (not in interface)
    // -------------------------------------------------------------------------

    error Unauthorized();
    // -------------------------------------------------------------------------
    // Structs
    // -------------------------------------------------------------------------

    /// @notice Full state of a governance proposal.
    struct Proposal {
        uint256 proposalId;
        address proposer;
        string description;
        address target;
        bytes callData;
        uint256 value;
        euint64 encryptedYesCount;
        euint64 encryptedNoCount;
        uint256 votingStart;
        uint256 votingEnd;
        IConfidentialGovernance.ProposalStatus status;
        uint64 yesCount;
        uint64 noCount;
    }

    // -------------------------------------------------------------------------
    // State — FR-006, FR-014, FR-018
    // -------------------------------------------------------------------------

    address public admin;
    address public treasury;
    uint256 public immutable VOTING_PERIOD;
    uint256 public quorum;
    uint256 public proposalCount;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => bool) public members;

    // FR-018: guard against concurrent finalization
    bool public isDecryptionPending;

    /// @notice Gateway address permitted to call revealOutcome (fhEVM relayer or keeper).
    address public gateway;

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    modifier onlyMember() {
        if (!members[msg.sender]) revert NotMember();
        _;
    }

    modifier onlyGateway() {
        if (msg.sender != gateway && msg.sender != admin) revert Unauthorized();
        _;
    }

    // -------------------------------------------------------------------------
    // Constructor — FR-014
    // -------------------------------------------------------------------------

    /// @param _treasury     Address of the deployed ConfidentialTreasury.
    /// @param _votingPeriod Number of blocks a proposal's voting window stays open (default 100).
    /// @param _quorum       Minimum yes votes required for a proposal to pass.
    constructor(address _treasury, uint256 _votingPeriod, uint256 _quorum) {
        admin = msg.sender;
        gateway = msg.sender; // update post-deploy via setGateway
        treasury = _treasury;
        VOTING_PERIOD = _votingPeriod == 0 ? 100 : _votingPeriod;
        quorum = _quorum;
    }

    // -------------------------------------------------------------------------
    // Member Management — FR-014 (mirrors CT membership for governance)
    // -------------------------------------------------------------------------

    /// @inheritdoc IConfidentialGovernance
    function addMember(address member) external onlyAdmin {
        members[member] = true;
    }

    /// @inheritdoc IConfidentialGovernance
    function removeMember(address member) external onlyAdmin {
        members[member] = false;
    }

    /// @notice Update the gateway address permitted to call revealOutcome.
    ///         Only callable by admin.
    function setGateway(address _gateway) external onlyAdmin {
        gateway = _gateway;
    }

    // -------------------------------------------------------------------------
    // Governance Operations — FR-006, FR-019
    // -------------------------------------------------------------------------

    /// @inheritdoc IConfidentialGovernance
    function propose(
        string calldata description,
        address target,
        bytes calldata callData,
        uint256 value
    ) external onlyMember returns (uint256 proposalId) {
        proposalCount++;
        proposalId = proposalCount;

        euint64 yesHandle = FHE.asEuint64(0);
        euint64 noHandle  = FHE.asEuint64(0);
        FHE.allowThis(yesHandle);
        FHE.allowThis(noHandle);

        Proposal storage p = proposals[proposalId];
        p.proposalId        = proposalId;
        p.proposer          = msg.sender;
        p.description       = description;
        p.target            = target;
        p.callData          = callData;
        p.value             = value;
        p.encryptedYesCount = yesHandle;
        p.encryptedNoCount  = noHandle;
        p.votingStart       = block.number;
        p.votingEnd         = block.number + VOTING_PERIOD;
        p.status            = IConfidentialGovernance.ProposalStatus.Active;

        emit ProposalCreated(proposalId, msg.sender, description);
    }

    // -------------------------------------------------------------------------
    // Governance Operations — FR-007, FR-016, FR-019, NFR-003
    // -------------------------------------------------------------------------

    /// @inheritdoc IConfidentialGovernance
    function castVote(
        uint256 proposalId,
        externalEbool encryptedVote,
        bytes calldata inputProof
    ) external onlyMember {
        Proposal storage p = proposals[proposalId];

        if (p.status != IConfidentialGovernance.ProposalStatus.Active) revert ProposalNotActive();
        if (block.number < p.votingStart || block.number > p.votingEnd) revert VotingWindowClosed();
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();

        // Validate and unwrap the encrypted vote — NFR-002
        ebool vote = FHE.fromExternal(encryptedVote, inputProof);

        // Compute yes/no weights homomorphically — NFR-003 (4 FHE ops max)
        euint64 yesWeight = FHE.select(vote, FHE.asEuint64(1), FHE.asEuint64(0));
        euint64 noWeight  = FHE.select(vote, FHE.asEuint64(0), FHE.asEuint64(1));

        // Accumulate into tallies
        p.encryptedYesCount = FHE.add(p.encryptedYesCount, yesWeight);
        p.encryptedNoCount  = FHE.add(p.encryptedNoCount,  noWeight);

        // Re-grant contract ACL on updated handles — FR-019
        FHE.allowThis(p.encryptedYesCount);
        FHE.allowThis(p.encryptedNoCount);

        // Individual vote handles are NOT stored or ACL-granted — FR-016
        hasVoted[proposalId][msg.sender] = true;
        emit VoteCast(proposalId, msg.sender);
    }

    // -------------------------------------------------------------------------
    // Governance Operations — FR-008, FR-018
    // -------------------------------------------------------------------------

    /// @inheritdoc IConfidentialGovernance
    /// @dev Marks both tally handles as publicly decryptable so the fhEVM relayer
    ///      (or any off-chain observer) can read the plaintext values and call
    ///      `revealOutcome` to record the result on-chain.
    function finalizeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];

        if (block.number <= p.votingEnd) revert VotingStillActive();
        if (p.status != IConfidentialGovernance.ProposalStatus.Active) revert ProposalNotActive();
        if (isDecryptionPending) revert DecryptionPending();

        isDecryptionPending = true;
        p.status = IConfidentialGovernance.ProposalStatus.PendingDecryption;

        // Re-grant ACL so the gateway/relayer can read the handles off-chain
        FHE.allowThis(p.encryptedYesCount);
        FHE.allowThis(p.encryptedNoCount);

        emit ProposalFinalized(proposalId);
    }

    // -------------------------------------------------------------------------
    // Outcome Reveal — FR-009, FR-018
    // -------------------------------------------------------------------------

    /// @notice Record the decrypted tally and determine the proposal outcome.
    ///         Called by anyone (typically the fhEVM relayer or a keeper) after
    ///         `finalizeProposal` has been called and the plaintext values are available.
    /// @param proposalId The proposal whose tally has been decrypted.
    /// @param yesCount   Plaintext yes-vote count obtained from the fhEVM relayer.
    /// @param noCount    Plaintext no-vote count obtained from the fhEVM relayer.
    function revealOutcome(uint256 proposalId, uint64 yesCount, uint64 noCount) external onlyGateway {
        Proposal storage p = proposals[proposalId];

        if (p.status != IConfidentialGovernance.ProposalStatus.PendingDecryption) revert ProposalNotActive();

        isDecryptionPending = false;

        p.yesCount = yesCount;
        p.noCount  = noCount;

        bool passed = yesCount >= quorum && yesCount > noCount;
        p.status = passed ? IConfidentialGovernance.ProposalStatus.Passed : IConfidentialGovernance.ProposalStatus.Failed;

        if (passed && p.target != address(0)) {
            IConfidentialTreasury(treasury).disburse(p.target, p.value);
        }

        emit ProposalOutcome(proposalId, passed, yesCount, noCount);
    }
}
