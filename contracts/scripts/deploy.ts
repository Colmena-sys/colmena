import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";

type DeployedContracts = Record<string, string>;

type DeploymentOutput = {
  network: string;
  chainId: number;
  deployedAt: string;
  contracts: DeployedContracts;
};

async function main() {
  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();

  const networkName = process.env.HARDHAT_NETWORK ?? "hardhat";
  const feeBps = Number(process.env.PLATFORM_FEE_BPS ?? "150");

  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 1_000) {
    throw new Error("PLATFORM_FEE_BPS debe ser entero entre 0 y 1000");
  }

  const { chainId } = await ethers.provider.getNetwork();

  console.log(`Deploying Colmena stack on ${networkName} (chainId=${chainId}) with deployer ${deployer.address}`);

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

  const defaultAdminRole = await backerNft.DEFAULT_ADMIN_ROLE();
  await (await backerNft.grantRole(defaultAdminRole, await factory.getAddress())).wait();
  await (await impactNft.grantRole(defaultAdminRole, await factory.getAddress())).wait();

  const contracts: DeployedContracts = {
    ColmenaDAO: await dao.getAddress(),
    TreasuryVault: await treasury.getAddress(),
    MilestoneVerifier: await verifier.getAddress(),
    RevenueSharing: await revenue.getAddress(),
    BackerNFT: await backerNft.getAddress(),
    ImpactNFT: await impactNft.getAddress(),
    ColmenaToken: await token.getAddress(),
    ColmenaFactory: await factory.getAddress(),
  };

  Object.entries(contracts).forEach(([name, address]) => {
    console.log(`${name}: ${address}`);
  });

  const output: DeploymentOutput = {
    network: networkName,
    chainId: Number(chainId),
    deployedAt: new Date().toISOString(),
    contracts,
  };

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const deploymentsDir = path.resolve(scriptDir, "../deployments");
  const deploymentFile = path.join(deploymentsDir, "contracts.json");
  const rootDeploymentsDir = path.resolve(scriptDir, "../../deployments");
  const rootDeploymentFile = path.join(rootDeploymentsDir, "contracts.json");
  const frontendDeploymentsDir = path.resolve(scriptDir, "../../apps/web/public/deployments");
  const frontendDeploymentFile = path.join(frontendDeploymentsDir, "contracts.json");

  await mkdir(deploymentsDir, { recursive: true });
  await writeFile(deploymentFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  await mkdir(rootDeploymentsDir, { recursive: true });
  await writeFile(rootDeploymentFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  await mkdir(frontendDeploymentsDir, { recursive: true });
  await writeFile(frontendDeploymentFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Deployment addresses exported to ${deploymentFile}`);
  console.log(`Root deployment file exported to ${rootDeploymentFile}`);
  console.log(`Frontend deployment file exported to ${frontendDeploymentFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
