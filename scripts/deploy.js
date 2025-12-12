const hre = require("hardhat");

async function main() {
  console.log("Deploying LinkIO contract...");

  const LinkIO = await hre.ethers.getContractFactory("LinkIO");
  const linkIO = await LinkIO.deploy();

  await linkIO.waitForDeployment();

  const address = await linkIO.getAddress();
  console.log(`LinkIO deployed to: ${address}`);

  // Verify on Etherscan if not on localhost
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await linkIO.deploymentTransaction().wait(5);

    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
