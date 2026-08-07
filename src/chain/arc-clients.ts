// Client and account construction for Arc. Single place that touches the key.
import "dotenv/config";
import { createPublicClient, createWalletClient, http, webSocket } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "./arc-constants.js";

export function publicClient() {
  return createPublicClient({ chain: arcTestnet, transport: http() });
}

/// WSS client for log subscriptions. eth_subscribe with address+topic filters is
/// supported on the public endpoint (verified in the spike, test S4).
export function wsClient() {
  return createPublicClient({ chain: arcTestnet, transport: webSocket() });
}

export function keeperAccount() {
  const pk = process.env.DEMO_PRIVATE_KEY;
  if (!pk) throw new Error("DEMO_PRIVATE_KEY missing from .env");
  return privateKeyToAccount(pk as `0x${string}`);
}

export function walletClient() {
  return createWalletClient({
    account: keeperAccount(),
    chain: arcTestnet,
    transport: http(),
  });
}
