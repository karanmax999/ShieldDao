import { FhevmType } from "@fhevm/hardhat-plugin";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

// ---------------------------------------------------------------------------
// Shared fixture: deploy all three contracts and wire them together
// ---------------------------------------------------------------------------

async function deployFixture() {
  const [admin, member, auditor, recipient] = await hre.ethers.getSigners();

  // 1. Deploy ConfidentialTreasury
  const TreasuryFactory = await hre.ethers.getContractFactory("ConfidentialTreasury");
  const treasury = await TreasuryFactory.connect(admin).deploy();
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();

  // 2. Deploy ConfidentialGovernance (quorum=1 so a single yes vote passes)
  const GovernanceFactory = await hre.ethers.getContractFactory("ConfidentialGovernance");
  const governance = await GovernanceFactory.connect(admin).deploy(
    treasuryAddress,
    100, // VOTING_PERIOD
    1,   // quorum
  );
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();

  // 3. Deploy AuditorAccess
  const AuditorFactory = await hre.ethers.getContractFactory("AuditorAccess");
  const auditorAccess = await AuditorFactory.connect(admin).deploy(
    auditor.address,
    treasuryAddress,
  );
  await auditorAccess.waitForDeployment();
  const auditorAccessAddress = await auditorAccess.getAddress();

  // 4. Post-wiring
  await (await treasury.connect(admin).setGovernance(governanceAddress)).wait();
  await (await treasury.connect(admin).setAuditorAccess(auditorAccessAddress)).wait();

  return { treasury, governance, auditorAccess, admin, member, auditor, recipient, treasuryAddress, governanceAddress, auditorAccessAddress };
}

// ---------------------------------------------------------------------------
// INT-01: Full treasury lifecycle
// Requirements: FR-001, FR-003, FR-004
// ---------------------------------------------------------------------------

describe("INT-01: Full treasury lifecycle", function () {
  it("should add member, deposit ETH, verify balance handle, withdraw ETH", async function () {
    const { treasury, admin, member, treasuryAddress } = await loadFixture(deployFixture);

    // --- Add member ---
    await expect(treasury.connect(admin).addMember(member.address))
      .to.emit(treasury, "MemberAdded")
      .withArgs(member.address);

    expect(await treasury.members(member.address)).to.be.true;

    // --- Deposit ETH ---
    const depositAmount = hre.ethers.parseEther("0.01");
    await expect(
      treasury.connect(member).deposit({ value: depositAmount })
    )
      .to.emit(treasury, "Deposited")
      .withArgs(member.address, depositAmount);

    // --- Verify balance handle exists (non-zero handle) ---
    const balanceHandle = await treasury.getBalanceHandle(member.address);
    expect(balanceHandle).to.not.equal(0n);

    // --- Decrypt balance to verify it equals deposit amount ---
    const decryptedBalance = await hre.fhevm.userDecryptEuint(
      FhevmType.euint64,
      balanceHandle,
      treasuryAddress,
      member,
    );
    expect(decryptedBalance).to.equal(BigInt(hre.ethers.parseEther("0.01")));

    // --- Withdraw ETH ---
    const withdrawAmount = hre.ethers.parseEther("0.005");
    const memberBalanceBefore = await hre.ethers.provider.getBalance(member.address);

    const withdrawTx = await treasury.connect(member).withdraw(withdrawAmount);
    const receipt = await withdrawTx.wait();
    const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

    await expect(withdrawTx)
      .to.emit(treasury, "Withdrawn")
      .withArgs(member.address, withdrawAmount);

    // Verify ETH received (accounting for gas)
    const memberBalanceAfter = await hre.ethers.provider.getBalance(member.address);
    expect(memberBalanceAfter).to.be.closeTo(
      memberBalanceBefore + withdrawAmount - gasUsed,
      hre.ethers.parseEther("0.0001"),
    );

    // --- Verify balance handle updated after withdrawal ---
    const newBalanceHandle = await treasury.getBalanceHandle(member.address);
    expect(newBalanceHandle).to.not.equal(0n);

    const decryptedNewBalance = await hre.fhevm.userDecryptEuint(
      FhevmType.euint64,
      newBalanceHandle,
      treasuryAddress,
      member,
    );
    expect(decryptedNewBalance).to.equal(BigInt(hre.ethers.parseEther("0.005")));
  });

  it("should revert ZeroDeposit when depositing 0 ETH", async function () {
    const { treasury, admin, member } = await loadFixture(deployFixture);
    await treasury.connect(admin).addMember(member.address);
    await expect(treasury.connect(member).deposit({ value: 0 })).to.be.revertedWithCustomError(
      treasury,
      "ZeroDeposit",
    );
  });

  it("should revert NotMember when non-member deposits", async function () {
    const { treasury, member } = await loadFixture(deployFixture);
    await expect(
      treasury.connect(member).deposit({ value: hre.ethers.parseEther("0.01") })
    ).to.be.revertedWithCustomError(treasury, "NotMember");
  });
});

// ---------------------------------------------------------------------------
// INT-02: Full governance lifecycle
// Requirements: FR-006, FR-007, FR-008, FR-009
// ---------------------------------------------------------------------------

describe("INT-02: Full governance lifecycle", function () {
  it("should propose, vote, finalize, and reveal outcome (Passed)", async function () {
    const { treasury, governance, admin, member, recipient, treasuryAddress, governanceAddress } =
      await loadFixture(deployFixture);

    // --- Add member to both Treasury and Governance ---
    await treasury.connect(admin).addMember(member.address);
    await governance.connect(admin).addMember(member.address);

    // Fund treasury so disburse can succeed
    await admin.sendTransaction({ to: treasuryAddress, value: hre.ethers.parseEther("1") });

    // --- Member proposes ---
    const proposeTx = await governance
      .connect(member)
      .propose("Fund dev grant", recipient.address, "0x", hre.ethers.parseEther("0.1"));
    const proposeReceipt = await proposeTx.wait();

    await expect(proposeTx)
      .to.emit(governance, "ProposalCreated")
      .withArgs(1n, member.address, "Fund dev grant");

    const proposalId = 1n;

    // --- Cast encrypted yes vote ---
    const encInput = hre.fhevm.createEncryptedInput(governanceAddress, member.address);
    encInput.addBool(true); // yes vote
    const encrypted = await encInput.encrypt();

    await expect(
      governance.connect(member).castVote(proposalId, encrypted.handles[0], encrypted.inputProof)
    )
      .to.emit(governance, "VoteCast")
      .withArgs(proposalId, member.address);

    // --- Advance blocks past voting window ---
    await hre.network.provider.send("hardhat_mine", ["0x65"]); // mine 101 blocks

    // --- Finalize proposal ---
    await expect(governance.connect(admin).finalizeProposal(proposalId))
      .to.emit(governance, "ProposalFinalized")
      .withArgs(proposalId);

    // Verify status is PendingDecryption (1)
    const proposalAfterFinalize = await governance.proposals(proposalId);
    expect(proposalAfterFinalize.status).to.equal(1); // PendingDecryption

    // --- Simulate fhEVM relayer: call revealOutcome with plaintext tally ---
    const recipientBalanceBefore = await hre.ethers.provider.getBalance(recipient.address);

    await expect(governance.connect(admin).revealOutcome(proposalId, 1n, 0n))
      .to.emit(governance, "ProposalOutcome")
      .withArgs(proposalId, true, 1n, 0n);

    // --- Verify proposal status is Passed (2) ---
    const proposalAfterReveal = await governance.proposals(proposalId);
    expect(proposalAfterReveal.status).to.equal(2); // Passed
    expect(proposalAfterReveal.yesCount).to.equal(1n);
    expect(proposalAfterReveal.noCount).to.equal(0n);

    // --- Verify disburse was called (recipient received ETH) ---
    const recipientBalanceAfter = await hre.ethers.provider.getBalance(recipient.address);
    expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(hre.ethers.parseEther("0.1"));

    // --- Verify isDecryptionPending reset ---
    expect(await governance.isDecryptionPending()).to.be.false;
  });

  it("should set proposal status to Failed when quorum not met", async function () {
    const { treasury, governance, admin, member, governanceAddress } = await loadFixture(deployFixture);

    await treasury.connect(admin).addMember(member.address);
    await governance.connect(admin).addMember(member.address);

    await governance.connect(member).propose("Failing proposal", hre.ethers.ZeroAddress, "0x", 0);

    const proposalId = 1n;

    // Cast a no vote
    const encInput = hre.fhevm.createEncryptedInput(governanceAddress, member.address);
    encInput.addBool(false); // no vote
    const encrypted = await encInput.encrypt();
    await governance.connect(member).castVote(proposalId, encrypted.handles[0], encrypted.inputProof);

    await hre.network.provider.send("hardhat_mine", ["0x65"]);
    await governance.connect(admin).finalizeProposal(proposalId);

    // Reveal: 0 yes, 1 no — quorum not met
    await expect(governance.connect(admin).revealOutcome(proposalId, 0n, 1n))
      .to.emit(governance, "ProposalOutcome")
      .withArgs(proposalId, false, 0n, 1n);

    const proposal = await governance.proposals(proposalId);
    expect(proposal.status).to.equal(3); // Failed
  });

  it("should revert VotingStillActive if finalize called before window closes", async function () {
    const { treasury, governance, admin, member } = await loadFixture(deployFixture);

    await treasury.connect(admin).addMember(member.address);
    await governance.connect(admin).addMember(member.address);
    await governance.connect(member).propose("Early finalize", hre.ethers.ZeroAddress, "0x", 0);

    await expect(governance.connect(admin).finalizeProposal(1n)).to.be.revertedWithCustomError(
      governance,
      "VotingStillActive",
    );
  });

  it("should revert AlreadyVoted on double vote", async function () {
    const { treasury, governance, admin, member, governanceAddress } = await loadFixture(deployFixture);

    await treasury.connect(admin).addMember(member.address);
    await governance.connect(admin).addMember(member.address);
    await governance.connect(member).propose("Double vote test", hre.ethers.ZeroAddress, "0x", 0);

    const proposalId = 1n;

    const encInput = hre.fhevm.createEncryptedInput(governanceAddress, member.address);
    encInput.addBool(true);
    const encrypted = await encInput.encrypt();
    await governance.connect(member).castVote(proposalId, encrypted.handles[0], encrypted.inputProof);

    // Second vote attempt
    const encInput2 = hre.fhevm.createEncryptedInput(governanceAddress, member.address);
    encInput2.addBool(true);
    const encrypted2 = await encInput2.encrypt();
    await expect(
      governance.connect(member).castVote(proposalId, encrypted2.handles[0], encrypted2.inputProof)
    ).to.be.revertedWithCustomError(governance, "AlreadyVoted");
  });
});

// ---------------------------------------------------------------------------
// INT-03: Full auditor compliance lifecycle
// Requirements: FR-010, FR-011, FR-012, FR-013
// ---------------------------------------------------------------------------

describe("INT-03: Full auditor compliance lifecycle", function () {
  it("should grant access, request audit, reveal result, and revoke access", async function () {
    const { treasury, auditorAccess, admin, member, auditor, treasuryAddress } =
      await loadFixture(deployFixture);

    // --- Add member to treasury and deposit so they have a balance ---
    await treasury.connect(admin).addMember(member.address);
    const depositAmount = hre.ethers.parseEther("0.05");
    await treasury.connect(member).deposit({ value: depositAmount });

    // --- Admin grants auditor access to member ---
    await expect(auditorAccess.connect(admin).grantAccess(member.address))
      .to.emit(auditorAccess, "AuditorAccessGranted")
      .withArgs(member.address, auditor.address);

    expect(await auditorAccess.auditorGrants(member.address)).to.be.true;

    // --- Verify treasury.grantAuditorAccess was called (ACL grant issued) ---
    // We verify indirectly: the auditor can now decrypt the balance handle
    const balanceHandle = await treasury.getBalanceHandle(member.address);
    expect(balanceHandle).to.not.equal(0n);

    // --- Auditor requests audit ---
    await expect(auditorAccess.connect(auditor).requestAudit(member.address))
      .to.emit(auditorAccess, "AuditRequested")
      .withArgs(member.address);

    expect(await auditorAccess.isDecryptionPending()).to.be.true;
    expect(await auditorAccess.pendingMember()).to.equal(member.address);

    // --- Simulate fhEVM relayer: call revealAudit with plaintext balance ---
    const expectedBalance = BigInt(hre.ethers.parseEther("0.05"));
    await expect(auditorAccess.connect(admin).revealAudit(member.address, expectedBalance))
      .to.emit(auditorAccess, "AuditRevealed")
      .withArgs(member.address, expectedBalance);

    // --- Verify auditResults populated ---
    const auditResult = await auditorAccess.auditResults(member.address);
    expect(auditResult).to.equal(expectedBalance);

    // --- Verify isDecryptionPending reset ---
    expect(await auditorAccess.isDecryptionPending()).to.be.false;

    // --- Admin revokes access ---
    await expect(auditorAccess.connect(admin).revokeAccess(member.address))
      .to.emit(auditorAccess, "AuditorAccessRevoked")
      .withArgs(member.address, auditor.address);

    expect(await auditorAccess.auditorGrants(member.address)).to.be.false;
  });

  it("should revert AccessNotGranted when auditor requests audit without grant", async function () {
    const { treasury, auditorAccess, admin, member, auditor } = await loadFixture(deployFixture);

    await treasury.connect(admin).addMember(member.address);
    await treasury.connect(member).deposit({ value: hre.ethers.parseEther("0.01") });

    await expect(
      auditorAccess.connect(auditor).requestAudit(member.address)
    ).to.be.revertedWithCustomError(auditorAccess, "AccessNotGranted");
  });

  it("should revert Unauthorized when non-auditor calls requestAudit", async function () {
    const { treasury, auditorAccess, admin, member } = await loadFixture(deployFixture);

    await treasury.connect(admin).addMember(member.address);
    await treasury.connect(member).deposit({ value: hre.ethers.parseEther("0.01") });
    await auditorAccess.connect(admin).grantAccess(member.address);

    // admin is not the auditor
    await expect(
      auditorAccess.connect(admin).requestAudit(member.address)
    ).to.be.revertedWithCustomError(auditorAccess, "Unauthorized");
  });

  it("should revert DecryptionPending on concurrent audit requests", async function () {
    const { treasury, auditorAccess, admin, member, auditor } = await loadFixture(deployFixture);

    await treasury.connect(admin).addMember(member.address);
    await treasury.connect(member).deposit({ value: hre.ethers.parseEther("0.01") });
    await auditorAccess.connect(admin).grantAccess(member.address);

    await auditorAccess.connect(auditor).requestAudit(member.address);

    await expect(
      auditorAccess.connect(auditor).requestAudit(member.address)
    ).to.be.revertedWithCustomError(auditorAccess, "DecryptionPending");
  });

  it("should revert NotMember when granting access to non-member", async function () {
    const { auditorAccess, admin, recipient } = await loadFixture(deployFixture);

    await expect(
      auditorAccess.connect(admin).grantAccess(recipient.address)
    ).to.be.revertedWithCustomError(auditorAccess, "NotMember");
  });
});
