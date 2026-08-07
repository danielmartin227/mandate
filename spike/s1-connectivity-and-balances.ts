// S1: baseline connectivity and the dual-interface balance read.
// Proves: RPC reachable, chain ID correct, and that native (18d) and precompile (6d)
// report the SAME underlying balance for one address.
import { createPublicClient, http, formatUnits } from "viem";
import {
  arcTestnet,
  USDC_ERC20_PRECOMPILE,
  ERC20_ABI,
  demoAccount,
} from "./arc-config.js";

const client = createPublicClient({ chain: arcTestnet, transport: http() });
const account = demoAccount();

const [chainId, block, gasPrice, nativeBalance] = await Promise.all([
  client.getChainId(),
  client.getBlockNumber(),
  client.getGasPrice(),
  client.getBalance({ address: account.address }),
]);

const [erc20Balance, decimals, symbol] = await Promise.all([
  client.readContract({
    address: USDC_ERC20_PRECOMPILE,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account.address],
  }),
  client.readContract({
    address: USDC_ERC20_PRECOMPILE,
    abi: ERC20_ABI,
    functionName: "decimals",
  }),
  client.readContract({
    address: USDC_ERC20_PRECOMPILE,
    abi: ERC20_ABI,
    functionName: "symbol",
  }),
]);

console.log("address       ", account.address);
console.log("chainId       ", chainId, chainId === 5042002 ? "OK" : "MISMATCH");
console.log("block         ", block);
console.log("gasPrice      ", gasPrice);
console.log("precompile    ", symbol, "decimals", decimals);
console.log("native  (18d) ", nativeBalance, "=", formatUnits(nativeBalance, 18));
console.log("erc20   (6d)  ", erc20Balance, "=", formatUnits(erc20Balance, 6));

// The core Arc claim: one balance, two interfaces. Scale 6d up by 10^12 and compare.
const erc20AsNative = erc20Balance * 10n ** 12n;
console.log(
  "same balance? ",
  erc20AsNative === nativeBalance
    ? "YES (identical once scaled)"
    : `NO (native=${nativeBalance} vs erc20*1e12=${erc20AsNative})`,
);

if (nativeBalance === 0n) {
  console.log("\nWALLET UNFUNDED. Fund from faucet.circle.com, then rerun.");
}
