// Send a USDC payment to a rule address, simulating an incoming treasury deposit.
//
// Usage: tsx scripts/send-test-payment.ts <ruleAddress> <amount> [--erc20]
//
// Default uses the NATIVE interface (msg.value, 18 decimals), which is the harder
// case: it only works because the rule template has receive(). Pass --erc20 to
// send through the 6-decimal precompile instead. The watcher must catch both,
// which is exactly what the single system-emitter filter gives us.
import { parseUnits, formatUnits } from "viem";
import { publicClient, walletClient, keeperAccount } from "../src/chain/arc-clients.js";
import { explorerTx, USDC_ERC20_PRECOMPILE, NATIVE_DECIMALS } from "../src/chain/arc-constants.js";
import { ERC20_ABI, parseUsdc } from "../src/chain/usdc-precompile.js";

const [ruleAddress, amount] = process.argv.slice(2);
const useErc20 = process.argv.includes("--erc20");
if (!ruleAddress?.startsWith("0x") || !amount) {
  throw new Error("usage: send-test-payment.ts <ruleAddress> <amount> [--erc20]");
}

const pub = publicClient();
const wallet = walletClient();
const account = keeperAccount();

console.log(`paying ${amount} USDC to ${ruleAddress} via ${useErc20 ? "ERC-20 precompile (6d)" : "native interface (18d)"}`);

let hash: `0x${string}`;
if (useErc20) {
  hash = await wallet.writeContract({
    address: USDC_ERC20_PRECOMPILE,
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [ruleAddress as `0x${string}`, parseUsdc(amount)],
  });
} else {
  hash = await wallet.sendTransaction({
    to: ruleAddress as `0x${string}`,
    value: parseUnits(amount, NATIVE_DECIMALS),
  });
}

const receipt = await pub.waitForTransactionReceipt({ hash });
console.log("status", receipt.status);
console.log("tx    ", explorerTx(hash));

const remaining = await pub.getBalance({ address: account.address });
console.log("payer balance now", formatUnits(remaining, NATIVE_DECIMALS), "USDC");
