// Deploy a BridgeRule to Arc and verify its source on Arcscan.
//
// Usage: tsx scripts/deploy-bridge-rule.ts <recipientAddress> <floorUsdc>
//
// Example: tsx scripts/deploy-bridge-rule.ts 0xAbC...123 5000
//   -> bridge surplus above 5000 USDC to the recipient on Base Sepolia
import { encodeAbiParameters, formatUnits, pad, parseUnits } from "viem";
import { publicClient, walletClient, keeperAccount } from "../src/chain/arc-clients.js";
import { explorerAddress, explorerTx, USDC_DECIMALS } from "../src/chain/arc-constants.js";
import { BASE_SEPOLIA_DOMAIN } from "../src/chain/cctp-constants.js";
import { compileContract } from "./compile-contracts.js";
import { verifyContract, waitForVerification } from "./verify-on-blockscout.js";
import { saveRule } from "../src/rules/rule-store.js";

async function main() {
  const [recipientArg, floorArg] = process.argv.slice(2);
  if (!recipientArg?.startsWith("0x")) {
    throw new Error("usage: deploy-bridge-rule.ts <recipientAddress> <floorUsdc>");
  }
  const floorUsdc = Number(floorArg);
  if (!Number.isFinite(floorUsdc) || floorUsdc <= 0) {
    throw new Error("floor must be a positive number (in USDC, e.g. 5000)");
  }

  const recipient = recipientArg as `0x${string}`;
  const mintRecipient = pad(recipient, { size: 32 });
  const floor6d = parseUnits(String(floorUsdc), USDC_DECIMALS);

  const account = keeperAccount();
  const pub = publicClient();
  const wallet = walletClient();

  const balance = await pub.getBalance({ address: account.address });
  console.log("deployer", account.address, formatUnits(balance, 18), "USDC");
  if (balance === 0n) throw new Error("deployer unfunded, use faucet.circle.com");

  const template = "BridgeRule";
  console.log(`compiling ${template}`);
  const { abi, bytecode, standardJsonInput, solcVersion } = compileContract(template);

  console.log(
    `deploying ${template} dest=${BASE_SEPOLIA_DOMAIN} recipient=${recipient} floor=${floorUsdc} USDC`,
  );

  const args = [BASE_SEPOLIA_DOMAIN, mintRecipient, floor6d, account.address] as const;
  const hash = await wallet.deployContract({ abi: abi as any, bytecode, args: args as any });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error("deployment reverted");
  const address = receipt.contractAddress!;

  console.log("  tx      ", explorerTx(hash));
  console.log("  contract", explorerAddress(address));
  console.log("  gasUsed ", receipt.gasUsed);

  saveRule({
    template,
    address,
    deployTx: hash,
    params: {
      destinationDomain: BASE_SEPOLIA_DOMAIN,
      mintRecipient: recipient,
      floor: floorUsdc,
      owner: account.address,
    },
    abi,
    deployedAt: new Date().toISOString(),
  });

  // Constructor args for Blockscout verification.
  const constructorArgs = encodeAbiParameters(
    [{ type: "uint32" }, { type: "bytes32" }, { type: "uint256" }, { type: "address" }],
    [BASE_SEPOLIA_DOMAIN, mintRecipient, floor6d, account.address],
  ).slice(2);

  console.log("verifying source");
  await verifyContract({ address, standardJsonInput, solcVersion, constructorArgs });
  await waitForVerification(address);

  console.log("\nbridge rule address:", address);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
