// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {externalEbool} from "@fhevm/solidity/lib/FHE.sol";

/// @title IConfidentialGovernance
/// @notice Interface for the ShieldDAO ConfidentialGovernance contract.
///         Manages proposals, encrypted vote tallying, and async result decryption
///         using Zama fhEVM homomorphic operations.
interface IConfidentialGovernance {
    // -------------------------------------------------------------------------
    // Enums
    // -------------------------------------------------------------------------

    /// @notice Lifecycle status of a governance proposal.
    enum ProposalStatus {
        Active,             // Voting window is open
        PendingDecryption,  // Voting closed, awaiting fhEVM tally decryption
        Passed,             // Decryption complete — quorum met and yes > no
        Failed              // Decryption complete — quorum not met or no >= yes
    }

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /// @notice Emitted when a new proposal is created.
    /// @param proposalId Monotonically incrementing proposal identifier (starts at 1).
    /// @param proposer   The member address that created the proposal.
    /// @param description Human-readable description of the proposal.
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);

    /// @notice Emitted when a member casts an encrypted vote.
    ///         Vote direction is intentionally omitted to preserve privacy.
    /// @param proposalId The proposal being voted on.
    /// @param voter      The member address that cast the vote.
    event VoteCast(uint256 indexed proposalId, address indexed voter);

    /// @notice Emitted when tally decryption is requested after the voting window closes.
    /// @param proposalId The proposal whose tally decryption was requested.
    event ProposalFinalized(uint256 indexed proposalId);

    /// @notice Emitted when the fhEVM decryption callback delivers the tally result.
    /// @param proposalId The proposal whose outcome was determined.
    /// @param passed     True if the proposal passed (quorum met and yes > no).
    /// @param yesCount   Plaintext count of yes votes (aggregate only, never individual).
    /// @param noCount    Plaintext count of no votes (aggregate only, never individual).
    event ProposalOutcome(uint256 indexed proposalId, bool passed, uint64 yesCount, uint64 noCount);

    // -------------------------------------------------------------------------
    // Custom Errors
    // -------------------------------------------------------------------------

    /// @notice Caller is not an active DAO member.
    error NotMember();

    /// @notice The referenced proposal is not in the Active status.
    error ProposalNotActive();

    /// @notice The current block is outside the proposal's voting window.
    error VotingWindowClosed();

    /// @notice The caller has already voted on this proposal.
    error AlreadyVoted();

    /// @notice Finalization was attempted before the voting window has closed.
    error VotingStillActive();

    /// @notice A decryption request is already in flight; concurrent requests are not allowed.
    error DecryptionPending();

    // -------------------------------------------------------------------------
    // Member Management — FR-006, FR-007 (mirrors CT membership for governance)
    // -------------------------------------------------------------------------

    /// @notice Add an address as an active DAO member in the governance contract.
    ///         Only callable by the admin.
    /// @param member The address to admit.
    function addMember(address member) external;

    /// @notice Remove an active DAO member from the governance contract.
    ///         Only callable by the admin.
    /// @param member The address to remove.
    function removeMember(address member) external;

    // -------------------------------------------------------------------------
    // Governance Operations — FR-006, FR-007, FR-008
    // -------------------------------------------------------------------------

    /// @notice Create a new governance proposal.
    ///         Only callable by active members.
    /// @param description Human-readable description of the proposal.
    /// @param target      Contract address to call if the proposal passes (zero address for no execution).
    /// @param callData    Encoded calldata to forward to `target` on execution.
    /// @param value       ETH value (in wei) to disburse from the treasury if the proposal passes.
    /// @return proposalId The newly assigned proposal identifier.
    function propose(
        string calldata description,
        address target,
        bytes calldata callData,
        uint256 value
    ) external returns (uint256 proposalId);

    /// @notice Cast an encrypted vote on an active proposal.
    ///         Only callable by active members within the voting window.
    ///         Each member may vote at most once per proposal.
    /// @param proposalId    The proposal to vote on.
    /// @param encryptedVote The user-encrypted boolean vote (true = yes, false = no).
    /// @param inputProof    The fhEVM input proof validating `encryptedVote`.
    function castVote(
        uint256 proposalId,
        externalEbool encryptedVote,
        bytes calldata inputProof
    ) external;

    /// @notice Trigger tally decryption after the voting window has closed.
    ///         Callable by anyone. Submits an async FHE.requestDecryption() for both
    ///         encryptedYesCount and encryptedNoCount.
    /// @param proposalId The proposal to finalize.
    function finalizeProposal(uint256 proposalId) external;
}
