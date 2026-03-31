// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IConfidentialTreasury} from "./interfaces/IConfidentialTreasury.sol";

/// @title AuditorAccess
/// @notice Manages selective auditor disclosure of member balances for regulatory compliance.
///         Admin grants/revokes logical access; the auditor calls requestAudit to signal
///         intent, then the gateway/relayer calls revealAudit with the plaintext balance.
contract AuditorAccess is ZamaEthereumConfig {
    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /// @notice Emitted when the admin grants auditor access to a member's balance.
    event AuditorAccessGranted(address indexed member, address indexed auditor);

    /// @notice Emitted when the admin revokes auditor access to a member's balance.
    event AuditorAccessRevoked(address indexed member, address indexed auditor);

    /// @notice Emitted when the auditor requests decryption of a member's balance.
    event AuditRequested(address indexed member);

    /// @notice Emitted when the auditor reveals the decrypted balance on-chain.
    event AuditRevealed(address indexed member, uint64 balance);

    // -------------------------------------------------------------------------
    // Custom Errors
    // -------------------------------------------------------------------------

    /// @notice Caller is not authorised to perform this action.
    error Unauthorized();

    /// @notice The address is not an active DAO member.
    error NotMember();

    /// @notice Auditor access has not been granted for this member.
    error AccessNotGranted();

    /// @notice A decryption request is already in flight.
    error DecryptionPending();

    // -------------------------------------------------------------------------
    // State — FR-014, FR-018
    // -------------------------------------------------------------------------

    address public admin;
    address public auditor;
    IConfidentialTreasury public treasury;

    /// @notice Tracks whether the admin has granted the auditor logical access to a member.
    mapping(address => bool) public auditorGrants;

    /// @notice Stores the most recent revealed plaintext balance per member.
    mapping(address => uint64) public auditResults;

    /// @notice Tracks which member is currently pending decryption.
    address public pendingMember;

    /// @notice FR-018: guard against concurrent decryption requests.
    bool public isDecryptionPending;

    /// @notice Gateway address permitted to call revealAudit (fhEVM relayer or keeper).
    address public gateway;

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    modifier onlyAuditor() {
        if (msg.sender != auditor) revert Unauthorized();
        _;
    }

    modifier onlyGateway() {
        if (msg.sender != gateway && msg.sender != admin) revert Unauthorized();
        _;
    }

    // -------------------------------------------------------------------------
    // Constructor — FR-014
    // -------------------------------------------------------------------------

    /// @param _auditor  The designated auditor address.
    /// @param _treasury Address of the deployed ConfidentialTreasury.
    constructor(address _auditor, address _treasury) {
        admin    = msg.sender;
        gateway  = msg.sender; // update post-deploy via setGateway
        auditor  = _auditor;
        treasury = IConfidentialTreasury(_treasury);
    }

    // -------------------------------------------------------------------------
    // Admin Setters — FR-014
    // -------------------------------------------------------------------------

    /// @notice Update the auditor address. Only callable by admin.
    /// @param _auditor The new auditor address.
    function setAuditor(address _auditor) external onlyAdmin {
        auditor = _auditor;
    }

    /// @notice Update the gateway address permitted to call revealAudit.
    ///         Only callable by admin.
    function setGateway(address _gateway) external onlyAdmin {
        gateway = _gateway;
    }

    // -------------------------------------------------------------------------
    // Access Management — FR-010, FR-011, FR-019
    // -------------------------------------------------------------------------

    /// @notice Grant the auditor FHE ACL access to a member's balance handle.
    ///         Calls treasury.grantAuditorAccess so the Treasury (which owns the handle)
    ///         issues the FHE.allow — FR-019 AC-3.
    ///         Only callable by admin.
    /// @param member The DAO member whose balance the auditor may decrypt.
    function grantAccess(address member) external onlyAdmin {
        if (!treasury.members(member)) revert NotMember();
        auditorGrants[member] = true;
        // Treasury owns the handle; it must issue the ACL grant — FR-019
        treasury.grantAuditorAccess(member, auditor);
        emit AuditorAccessGranted(member, auditor);
    }

    /// @notice Revoke logical auditor access to a member's balance.
    ///         Note: fhEVM ACL grants are append-only; this is a logical flag only — FR-011 AC-2.
    ///         Only callable by admin.
    /// @param member The DAO member whose access is being revoked.
    function revokeAccess(address member) external onlyAdmin {
        auditorGrants[member] = false;
        emit AuditorAccessRevoked(member, auditor);
    }

    // -------------------------------------------------------------------------
    // Audit Operations — FR-012, FR-013, FR-018
    // -------------------------------------------------------------------------

    /// @notice Request decryption of a member's balance.
    ///         Signals intent to the gateway/relayer; the ACL grant was already issued
    ///         via grantAuditorAccess. The gateway then calls revealAudit with the plaintext.
    ///         Only callable by the registered auditor.
    /// @param member The DAO member whose balance should be decrypted.
    function requestAudit(address member) external onlyAuditor {
        if (!auditorGrants[member]) revert AccessNotGranted();
        if (isDecryptionPending) revert DecryptionPending();

        isDecryptionPending = true;
        pendingMember = member;

        // Balance handle ACL was already granted to auditor via grantAuditorAccess
        // No additional FHE op needed here — gateway reads handle off-chain

        emit AuditRequested(member);
    }

    /// @notice Record the decrypted balance on-chain after the fhEVM relayer has
    ///         processed the makePubliclyDecryptable request.
    ///         Callable by anyone (typically the auditor or a keeper).
    /// @param member      The member whose balance was decrypted (must match pendingMember).
    /// @param plainBalance The plaintext balance value returned by the fhEVM relayer.
    function revealAudit(address member, uint64 plainBalance) external onlyGateway {
        if (!isDecryptionPending) revert AccessNotGranted();
        if (member != pendingMember) revert Unauthorized();

        isDecryptionPending = false;
        pendingMember = address(0);

        auditResults[member] = plainBalance;
        emit AuditRevealed(member, plainBalance);
    }
}
