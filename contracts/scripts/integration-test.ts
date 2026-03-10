import assert from "node:assert/strict";
import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  const [admin, creator, backer] = await ethers.getSigners();
  const feeBps = 150n;

  console.log("Running integration test with deployer:", admin.address);

  const dao = await ethers.deployContract("ColmenaDAO", [admin.address]);
  const treasury = await ethers.deployContract("TreasuryVault", [admin.address]);
  const verifier = await ethers.deployContract("MilestoneVerifier", [admin.address]);
  const revenue = await ethers.deployContract("RevenueSharing", [admin.address]);
  const backerNft = await ethers.deployContract("BackerNFT", [admin.address]);
  const impactNft = await ethers.deployContract("ImpactNFT", [admin.address]);
  const token = await ethers.deployContract("ColmenaToken", [admin.address]);

  const factory = (await ethers.deployContract("ColmenaFactory", [
    admin.address,
    await dao.getAddress(),
    await treasury.getAddress(),
    await verifier.getAddress(),
    await revenue.getAddress(),
    await backerNft.getAddress(),
    await impactNft.getAddress(),
    feeBps,
  ])) as any;

  await (await revenue.grantRole(await revenue.REGISTRAR_ROLE(), await factory.getAddress())).wait();
  await (await backerNft.grantRole(await backerNft.DEFAULT_ADMIN_ROLE(), await factory.getAddress())).wait();
  await (await impactNft.grantRole(await impactNft.DEFAULT_ADMIN_ROLE(), await factory.getAddress())).wait();
  await (await token.grantRole(await token.MINTER_ROLE(), await dao.getAddress())).wait();

  // 1) Create project/campaign from creator account
  const createTx = await factory.connect(creator).createCampaign(
    [ethers.parseEther("1"), ethers.parseEther("2")],
    "ipfs://colmena-campaign"
  );
  const createReceipt = await createTx.wait();
  assert.ok(createReceipt, "Campaign creation receipt should exist");

  const campaignCreatedLog = createReceipt.logs
    .map((log: unknown) => {
      try {
        return factory.interface.parseLog(log as any);
      } catch {
        return null;
      }
    })
    .find((parsed: any) => parsed?.name === "CampaignCreated");

  assert.ok(campaignCreatedLog, "CampaignCreated event must be emitted");
  const campaignAddress = campaignCreatedLog.args.campaign as `0x${string}`;
  assert.ok(campaignAddress, "Campaign address should exist");

  // 2) Fund project with a backer
  const campaign = (await ethers.getContractAt("CampaignEscrow", campaignAddress)) as any;
  const donationAmount = ethers.parseEther("1");
  await (await campaign.connect(backer).donate({ value: donationAmount })).wait();

  // 3) Read contract state and validate accounting
  const expectedFee = (donationAmount * feeBps) / 10_000n;
  const expectedNet = donationAmount - expectedFee;

  const campaignCount = await factory.campaignCount();
  const totalGrossDonations = await campaign.totalGrossDonations();
  const totalNetContributions = await campaign.totalNetContributions();
  const totalBackers = await campaign.totalBackers();
  const backerContribution = await campaign.contributions(backer.address);

  assert.equal(campaignCount, 1n, "Factory should register one campaign");
  assert.equal(totalGrossDonations, donationAmount, "Gross donations should equal funded value");
  assert.equal(totalNetContributions, expectedNet, "Net contributions should discount fee");
  assert.equal(totalBackers, 1n, "First donation should register a backer");
  assert.equal(backerContribution, expectedNet, "Backer net contribution should match expected value");

  console.log("Integration test passed.");
  console.log("Campaign:", campaignAddress);
  console.log("Gross:", totalGrossDonations.toString());
  console.log("Net:", totalNetContributions.toString());
}

main().catch((error) => {
  console.error("Integration test failed:", error);
  process.exitCode = 1;
});
