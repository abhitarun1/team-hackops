const hre = require("hardhat");

async function main() {
  console.log("Deploying smart contracts...");

  // Deploy DIDRegistry
  const DIDRegistry = await hre.ethers.getContractFactory("DIDRegistry");
  const didRegistry = await DIDRegistry.deploy();
  await didRegistry.waitForDeployment();
  const didRegistryAddress = await didRegistry.getAddress();
  console.log("DIDRegistry deployed to:", didRegistryAddress);

  // Deploy CredentialStatusRegistry
  const CredentialStatusRegistry = await hre.ethers.getContractFactory("CredentialStatusRegistry");
  const credentialRegistry = await CredentialStatusRegistry.deploy();
  await credentialRegistry.waitForDeployment();
  const credentialRegistryAddress = await credentialRegistry.getAddress();
  console.log("CredentialStatusRegistry deployed to:", credentialRegistryAddress);

  // Save deployment addresses
  const networkInfo = await hre.ethers.provider.getNetwork();

  const deploymentInfo = {
    network: hre.network.name,
    chainId: networkInfo.chainId.toString(),
    contracts: {
      DIDRegistry: didRegistryAddress,
      CredentialStatusRegistry: credentialRegistryAddress
    },
    deployedAt: new Date().toISOString()
  };

  console.log("\nDeployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Verify contracts on block explorer (if on testnet/mainnet)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await didRegistry.deploymentTransaction().wait(5);
    await credentialRegistry.deploymentTransaction().wait(5);

    console.log("Verifying contracts on block explorer...");
    try {
      await hre.run("verify:verify", {
        address: didRegistryAddress,
        constructorArguments: []
      });
      await hre.run("verify:verify", {
        address: credentialRegistryAddress,
        constructorArguments: []
      });
    } catch (error) {
      console.log("Verification error:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

