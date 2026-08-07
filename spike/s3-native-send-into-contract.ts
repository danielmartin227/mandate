// S3: the deposit-path question the whole "rule contract IS the treasury" design rests on.
// Sends native-interface USDC (msg.value, 18d) to the deployed probe, then checks:
//   1. does it land at all (receive() present)
//   2. does the 6-decimal precompile see it
//   3. does the system emitter log it with to = contract (this is what the watcher needs)
//   4. can the contract move it back out through the precompile
import { createPublicClient, createWalletClient, http, parseUnits, formatUnits, parseAbiItem } from "viem";
import { readFileSync } from "node:fs";
import { arcTestnet, demoAccount, SYSTEM_EMITTER } from "./arc-config.js";

const { address, abi } = JSON.parse(readFileSync("./deployed-probe.json", "utf8"));
const account = demoAccount();
const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http() });

const AMOUNT_USDC = "0.25";
const value = parseUnits(AMOUNT_USDC, 18); // native interface is 18 decimals

console.log(`sending ${AMOUNT_USDC} USDC natively to probe ${address}`);
const hash = await walletClient.sendTransaction({ to: address, value });
const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log("status  ", receipt.status, receipt.status === "success" ? "(receive() OK)" : "(REVERTED)");
console.log("tx      ", hash);

const [erc20Bal, nativeBal] = await Promise.all([
  publicClient.readContract({ address, abi, functionName: "erc20Balance" }) as Promise<bigint>,
  publicClient.readContract({ address, abi, functionName: "nativeBalance" }) as Promise<bigint>,
]);
console.log("erc20Balance  (6d) ", erc20Bal, "=", formatUnits(erc20Bal, 6));
console.log("nativeBalance (18d)", nativeBal, "=", formatUnits(nativeBal, 18));
console.log(
  "precompile sees native deposit?",
  erc20Bal * 10n ** 12n === nativeBal ? "YES" : "NO, DESIGN PROBLEM",
);

// Did the system emitter log this deposit with to = contract?
const logs = await publicClient.getLogs({
  address: SYSTEM_EMITTER,
  event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)"),
  args: { to: address },
  fromBlock: receipt.blockNumber - 2n,
  toBlock: receipt.blockNumber,
});
console.log(`emitter logs with to=contract: ${logs.length}`, logs.length > 0 ? "(watcher path CONFIRMED)" : "(PROBLEM: watcher would miss this)");
for (const l of logs) console.log("   value", formatUnits(l.args.value as bigint, 18), "18d");

// Can the contract pay out through the precompile?
const half = erc20Bal / 2n;
if (half > 0n) {
  console.log(`\nsweeping ${formatUnits(half, 6)} USDC back out via precompile`);
  const outHash = await walletClient.writeContract({
    address, abi, functionName: "sweepTo", args: [account.address, half],
  });
  const outReceipt = await publicClient.waitForTransactionReceipt({ hash: outHash });
  console.log("status", outReceipt.status, outReceipt.status === "success" ? "(payout path OK)" : "(REVERTED)");
  console.log("tx    ", outHash);
}
