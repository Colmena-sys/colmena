import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();
  const feeBps = 150;

  console.log("Deploying Colmena stack with:", deployer.address);

  const Dao = await ethers.getContractFactory("ColmenaDAO");
  const dao = await Dao.deploy(deployer.address);
  await dao.waitForDeployment();

  const Treasury = await ethers.getContractFactory("TreasuryVault");
  const treasury = await Treasury.deploy(deployer.address);
  await treasury.waitForDeployment();

  const Verifier = await ethers.getContractFactory("MilestoneVerifier");
  const verifier = await Verifier.deploy(deployer.address);
  await verifier.waitForDeployment();

  const Revenue = await ethers.getContractFactory("RevenueSharing");
  const revenue = await Revenue.deploy(deployer.address);
  await revenue.waitForDeployment();

  const BackerNft = await ethers.getContractFactory("BackerNFT");
  const backerNft = await BackerNft.deploy(deployer.address);
  await backerNft.waitForDeployment();

  const ImpactNft = await ethers.getContractFactory("ImpactNFT");
  const impactNft = await ImpactNft.deploy(deployer.address);
  await impactNft.waitForDeployment();

  const Token = await ethers.getContractFactory("ColmenaToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();

  const Factory = await ethers.getContractFactory("ColmenaFactory");
  const factory = await Factory.deploy(
    deployer.address,
    await dao.getAddress(),
    await treasury.getAddress(),
    await verifier.getAddress(),
    await revenue.getAddress(),
    await backerNft.getAddress(),
    await impactNft.getAddress(),
    feeBps
  );
  await factory.waitForDeployment();

  const governanceRole = await factory.GOVERNANCE_ROLE();
  await (await factory.grantRole(governanceRole, await dao.getAddress())).wait();

  const registrarRole = await revenue.REGISTRAR_ROLE();
  await (await revenue.grantRole(registrarRole, await factory.getAddress())).wait();

  const treasurerRole = await treasury.TREASURER_ROLE();
  await (await treasury.grantRole(treasurerRole, await dao.getAddress())).wait();

  const verifierRole = await verifier.VERIFIER_ROLE();
  await (await verifier.grantRole(verifierRole, await dao.getAddress())).wait();

  const tokenMinterRole = await token.MINTER_ROLE();
  await (await token.grantRole(tokenMinterRole, await dao.getAddress())).wait();

  await (await backerNft.grantRole(ethers.ZeroHash, await factory.getAddress())).wait();
  await (await impactNft.grantRole(ethers.ZeroHash, await factory.getAddress())).wait();

  console.log("ColmenaDAO:", await dao.getAddress());
  console.log("TreasuryVault:", await treasury.getAddress());
  console.log("MilestoneVerifier:", await verifier.getAddress());
  console.log("RevenueSharing:", await revenue.getAddress());
  console.log("BackerNFT:", await backerNft.getAddress());
  console.log("ImpactNFT:", await impactNft.getAddress());
  console.log("ColmenaToken:", await token.getAddress());
  console.log("ColmenaFactory:", await factory.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});