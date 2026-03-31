// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {euint64} from "@fhevm/solidity/lib/FHE.sol";

/// @title IConfidentialTreasury
/// @notice Interface for the ShieldDAO ConfidentialTreasury contract.
///         Manages encrypted per-member ETH balances using Zama fhEVM euint64 handles.
interface IConfidentialTreasury {
    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /// @notice Emitted when a new member is added to the DAO.
    /// @param member The address of the newly added member.
    event MemberAdded(address indexed member);

    /// @notice Emitted when a member is removed from the DAO.
    /// @param member The address of the removed member.
    event MemberRemoved(address indexed member);

    /// @notice Emitted when a member deposits ETH into the treasury.
    /// @param member  The depositing member address.
    /// @param amount  The plaintext ETH amount deposited (msg.value).
    event Deposited(address indexed member, uint256 amount);

    /// @notice Emitted when a member withdraws ETH from the treasury.
    /// @param member  The withdrawing member address.
    /// @param amount  The plaintext ETH amount withdrawn.
    event Withdrawn(address indexed member, uint256 amount);

    /// @notice Emitted when governance disburses ETH to a recipient.
    /// @param recipient The address receiving the disbursement.
    /// @param amount    The plaintext ETH amount disbursed.
    event Disbursed(address indexed recipient, uint256 amount);

    // -------------------------------------------------------------------------
    // Custom Errors
    // -------------------------------------------------------------------------

    /// @notice Caller is not authorised to perform this action.
    error Unauthorized();

    /// @notice The address is already an active DAO member.
    error AlreadyMember();

    /// @notice The address is not an active DAO member.
    error NotMember();

    /// @notice A deposit was attempted with msg.value == 0.
    error ZeroDeposit();

    /// @notice The treasury does not hold enough ETH to fulfil the request.
    error InsufficientFunds();

    /// @notice A low-level ETH transfer failed.
    error TransferFailed();

    // -------------------------------------------------------------------------
    // Member Management — FR-001, FR-002
    // -------------------------------------------------------------------------

    /// @notice Returns true if the given address is an active DAO member.
    /// @param member The address to query.
    function members(address member) external view returns (bool);

    /// @notice Add an address as an active DAO member.
    ///         Initialises the member's encrypted balance to FHE.asEuint64(0).
    ///         Only callable by the admin.
    /// @param member The address to admit.
    function addMember(address member) external;

    /// @notice Remove an active DAO member.
    ///         Preserves the member's encrypted balance handle (funds remain claimable).
    ///         Only callable by the admin.
    /// @param member The address to remove.
    function removeMember(address member) external;

    // -------------------------------------------------------------------------
    // Treasury Operations — FR-003, FR-004, FR-005
    // -------------------------------------------------------------------------

    /// @notice Deposit ETH into the treasury and add msg.value to the caller's
    ///         encrypted balance.  Only callable by active members.
    ///         Reverts with ZeroDeposit if msg.value == 0.
    function deposit() external payable;

    /// @notice Withdraw a plaintext ETH amount from the caller's encrypted balance.
    ///         Uses homomorphic overflow guard so the effective withdrawal is zero
    ///         when amount exceeds the current balance.
    ///         Only callable by active members.
    /// @param amount The plaintext ETH amount to withdraw.
    function withdraw(uint256 amount) external;

    /// @notice Disburse ETH from the treasury to a recipient.
    ///         Only callable by the registered ConfidentialGovernance contract.
    /// @param recipient The address to receive the ETH.
    /// @param amount    The plaintext ETH amount to transfer.
    function disburse(address recipient, uint256 amount) external;

    // -------------------------------------------------------------------------
    // View / Auditor — FR-019
    // -------------------------------------------------------------------------

    /// @notice Return the encrypted balance handle for a member.
    /// @param member The member address to query.
    /// @return The euint64 ciphertext handle for the member's balance.
    function getBalanceHandle(address member) external view returns (euint64);

    /// @notice Grant an auditor FHE ACL access to a member's balance handle.
    ///         Only callable by the registered AuditorAccess contract.
    /// @param member  The member whose balance handle will be shared.
    /// @param auditor The auditor address to receive ACL access.
    function grantAuditorAccess(address member, address auditor) external;

    // -------------------------------------------------------------------------
    // Admin Setters — FR-014
    // -------------------------------------------------------------------------

    /// @notice Set the ConfidentialGovernance contract address.
    ///         Only callable by the admin.
    /// @param governance The new governance contract address.
    function setGovernance(address governance) external;

    /// @notice Set the AuditorAccess contract address.
    ///         Only callable by the admin.
    /// @param auditorAccess The new AuditorAccess contract address.
    function setAuditorAccess(address auditorAccess) external;
}
