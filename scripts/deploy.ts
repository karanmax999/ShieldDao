import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = deployer.address;
  console.log("Deployer:", deployerAddress);

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, `(chainId: ${network.chainId})`);

  // Use deployer as auditor for demo; override with AUDITOR_ADDRESS env var if set
  const auditorAddress = process.env.AUDITOR_ADDRESS || deployerAddress;
  console.log("Auditor:", auditorAddress);

  // -------------------------------------------------------------------------
  // 1. Deploy ConfidentialTreasury
  // -------------------------------------------------------------------------
  console.log("\n[1/3] Deploying ConfidentialTreasury...");
  const TreasuryFactory = await ethers.getContractFactory("ConfidentialTreasury");
  const treasury = await TreasuryFactory.deploy();
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  const treasuryTx = treasury.deploymentTransaction()!.hash;
  console.log("  ConfidentialTreasury:", treasuryAddress);
  console.log("  tx:", treasuryTx);

  // -------------------------------------------------------------------------
  // 2. Deploy ConfidentialGovernance(treasury, VOTING_PERIOD=100, quorum=1)
  // -------------------------------------------------------------------------
  console.log("\n[2/3] Deploying ConfidentialGovernance...");
  const GovernanceFactory = await ethers.getContractFactory("ConfidentialGovernance");
  const governance = await GovernanceFactory.deploy(treasuryAddress, 100, 1);
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  const governanceTx = governance.deploymentTransaction()!.hash;
  console.log("  ConfidentialGovernance:", governanceAddress);
  console.log("  tx:", governanceTx);

  // -------------------------------------------------------------------------
  // 3. Deploy AuditorAccess(auditor, treasury)
  // -------------------------------------------------------------------------
  console.log("\n[3/3] Deploying AuditorAccess...");
  const AuditorAccessFactory = await ethers.getContractFactory("AuditorAccess");
  const auditorAccess = await AuditorAccessFactory.deploy(auditorAddress, treasuryAddress);
  await auditorAccess.waitForDeployment();
  const auditorAccessAddress = await auditorAccess.getAddress();
  const auditorAccessTx = auditorAccess.deploymentTransaction()!.hash;
  console.log("  AuditorAccess:", auditorAccessAddress);
  console.log("  tx:", auditorAccessTx);

  // -------------------------------------------------------------------------
  // 4. Post-wiring
  // -------------------------------------------------------------------------
  console.log("\n[Post-wiring]");

  let tx = await treasury.setGovernance(governanceAddress);
  await tx.wait();
  console.log("  treasury.setGovernance ✓");

  tx = await treasury.setAuditorAccess(auditorAccessAddress);
  await tx.wait();
  console.log("  treasury.setAuditorAccess ✓");

  tx = await (governance as any).setGateway(deployerAddress);
  await tx.wait();
  console.log("  governance.setGateway ✓");

  tx = await (auditorAccess as any).setGateway(deployerAddress);
  await tx.wait();
  console.log("  auditorAccess.setGateway ✓");

  // -------------------------------------------------------------------------
  // 5. Add deployer as member in both contracts
  // -------------------------------------------------------------------------
  console.log("\n[Membership]");

  tx = await treasury.addMember(deployerAddress);
  await tx.wait();
  console.log("  treasury.addMember(deployer) ✓");

  tx = await (governance as any).addMember(deployerAddress);
  await tx.wait();
  console.log("  governance.addMember(deployer) ✓");

  // -------------------------------------------------------------------------
  // 6. Grant auditor access to deployer's balance
  // -------------------------------------------------------------------------
  console.log("\n[Auditor access]");

  tx = await (auditorAccess as any).grantAccess(deployerAddress);
  await tx.wait();
  console.log("  auditorAccess.grantAccess(deployer) ✓");

  // -------------------------------------------------------------------------
  // 7. Save deployments.json
  // -------------------------------------------------------------------------
  const blockNumber = await ethers.provider.getBlockNumber();

  const deployments = {
    network: network.name,
    treasury: treasuryAddress,
    governance: governanceAddress,
    auditorAccess: auditorAccessAddress,
    deployer: deployerAddress,
    blockNumber,
    txHashes: {
      treasury: treasuryTx,
      governance: governanceTx,
      auditorAccess: auditorAccessTx,
    },
    timestamp: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "..", "deployments.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployments, null, 2));

  // -------------------------------------------------------------------------
  // 8. Summary
  // -------------------------------------------------------------------------
  console.log("\n=== Deployment Complete ===");
  console.log("ConfidentialTreasury  :", treasuryAddress);
  console.log("ConfidentialGovernance:", governanceAddress);
  console.log("AuditorAccess         :", auditorAccessAddress);
  console.log("Block number          :", blockNumber);
  console.log("Saved to deployments.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
