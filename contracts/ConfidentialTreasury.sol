// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IConfidentialTreasury} from "./interfaces/IConfidentialTreasury.sol";

/// @title ConfidentialTreasury
/// @notice Manages encrypted per-member ETH balances using Zama fhEVM euint64 handles.
///         Supports confidential deposit, withdraw, and governance-triggered disburse.
contract ConfidentialTreasury is ZamaEthereumConfig, ReentrancyGuard, IConfidentialTreasury {
    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    mapping(address => bool) public members;
    mapping(address => euint64) private balances;

    // -------------------------------------------------------------------------
    // Events & Errors
    // -------------------------------------------------------------------------

    event Transfer(address indexed from, address indexed to);
    error InsufficientBalance();

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

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor() {
        admin = msg.sender;
    }

    // -------------------------------------------------------------------------
    // Admin Setters — FR-014
    // -------------------------------------------------------------------------

    /// @inheritdoc IConfidentialTreasury
    function setGovernance(address _governance) external onlyAdmin {
        governance = _governance;
    }

    /// @inheritdoc IConfidentialTreasury
    function setAuditorAccess(address _auditorAccess) external onlyAdmin {
        auditorAccess = _auditorAccess;
    }

    // -------------------------------------------------------------------------
    // Member Management — FR-001, FR-002
    // -------------------------------------------------------------------------

    /// @inheritdoc IConfidentialTreasury
    function addMember(address member) external onlyAdmin {
        if (members[member]) revert AlreadyMember();
        members[member] = true;
        euint64 zero = FHE.asEuint64(0);
        FHE.allowThis(zero);
        balances[member] = zero;
        emit MemberAdded(member);
    }

    /// @inheritdoc IConfidentialTreasury
    function removeMember(address member) external onlyAdmin {
        if (!members[member]) revert NotMember();
        members[member] = false;
        // Balance handle is preserved — funds remain claimable
        emit MemberRemoved(member);
    }

    // -------------------------------------------------------------------------
    // Treasury Operations — FR-003
    // -------------------------------------------------------------------------

    /// @inheritdoc IConfidentialTreasury
    function deposit() external payable nonReentrant onlyMember {
        if (msg.value == 0) revert ZeroDeposit();
        require(msg.value <= type(uint64).max, "Amount exceeds uint64 max");
        euint64 depositAmount = FHE.asEuint64(uint64(msg.value));
        euint64 newBalance = FHE.add(balances[msg.sender], depositAmount);
        FHE.allowThis(newBalance);
        FHE.allow(newBalance, msg.sender);
        balances[msg.sender] = newBalance;
        emit Deposited(msg.sender, msg.value);
    }

    // -------------------------------------------------------------------------
    // Treasury Operations — FR-004
    // -------------------------------------------------------------------------

    /// @inheritdoc IConfidentialTreasury
    function withdraw(uint256 amount) external nonReentrant onlyMember {
        euint64 withdrawAmount = FHE.asEuint64(uint64(amount));
        // canWithdraw is true when withdrawAmount <= currentBalance
        ebool canWithdraw = FHE.le(withdrawAmount, balances[msg.sender]);
        // Guard against overdraft: if can't withdraw, keep current balance
        euint64 newBalance = FHE.select(
            canWithdraw,
            FHE.sub(balances[msg.sender], withdrawAmount),
            balances[msg.sender]
        );
        FHE.allowThis(newBalance);
        FHE.allow(newBalance, msg.sender);
        balances[msg.sender] = newBalance;

        // Checks-effects-interactions: state updated before ETH transfer
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();
        emit Withdrawn(msg.sender, amount);
    }

    // -------------------------------------------------------------------------
    // Treasury Operations — FR-005
    // -------------------------------------------------------------------------

    /// @inheritdoc IConfidentialTreasury
    function disburse(address recipient, uint256 amount) external nonReentrant {
        if (msg.sender != governance) revert Unauthorized();
        if (address(this).balance < amount) revert InsufficientFunds();
        (bool success, ) = recipient.call{value: amount}("");
        if (!success) revert TransferFailed();
        emit Disbursed(recipient, amount);
    }

    // -------------------------------------------------------------------------
    // View / Auditor — FR-019
    // -------------------------------------------------------------------------

    /// @inheritdoc IConfidentialTreasury
    function getBalanceHandle(address member) external view returns (euint64) {
        return balances[member];
    }

    /// @inheritdoc IConfidentialTreasury
    function grantAuditorAccess(address member, address auditor) external {
        if (msg.sender != auditorAccess) revert Unauthorized();
        // Grant the auditor address permission to decrypt the handle
        FHE.allow(balances[member], auditor);
        // Also grant the AuditorAccess contract itself permission so it can
        // call FHE.makePubliclyDecryptable on the handle during requestAudit
        FHE.allow(balances[member], auditorAccess);
    }

    // -------------------------------------------------------------------------
    // Confidential Transfer — NEW FEATURE
    // -------------------------------------------------------------------------

    /// @notice Transfer an encrypted amount from msg.sender to another member.
    /// @param to              The recipient member.
    /// @param encryptedAmount The FHE-encrypted amount to transfer.
    /// @param inputProof      The ZK-proof for the encrypted input.
    function transfer(address to, bytes calldata encryptedAmount, bytes calldata inputProof) external onlyMember {
        if (!members[to]) revert NotMember();

        euint64 amount = FHE.asEuint64(encryptedAmount, inputProof);
        
        // Check if sender has enough balance (homomorphically)
        ebool canTransfer = FHE.le(amount, balances[msg.sender]);
        
        // Update sender balance: if canTransfer, subtract else keep
        euint64 senderNewBal = FHE.select(canTransfer, FHE.sub(balances[msg.sender], amount), balances[msg.sender]);
        FHE.allowThis(senderNewBal);
        FHE.allow(senderNewBal, msg.sender);
        balances[msg.sender] = senderNewBal;

        // Update recipient balance: if canTransfer, add else keep current recipient balance
        // Note: we must use select to ensure the recipient ONLY gets the funds if canTransfer is true
        euint64 amountToAdd = FHE.select(canTransfer, amount, FHE.asEuint64(0));
        euint64 recipientNewBal = FHE.add(balances[to], amountToAdd);
        FHE.allowThis(recipientNewBal);
        FHE.allow(recipientNewBal, to);
        balances[to] = recipientNewBal;

        emit Transfer(msg.sender, to);
    }

    // -------------------------------------------------------------------------
    // Receive ETH
    // -------------------------------------------------------------------------

    receive() external payable {}
}
