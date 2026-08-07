// Shared Arc Testnet constants for the spike. Values verified in context/latest.md.
import "dotenv/config";
import { defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
      webSocket: ["wss://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: "https://testnet.arcscan.app" },
  },
});

// USDC has one balance behind two interfaces on Arc:
// native (18 decimals, pays gas, arrives as msg.value) and this ERC-20 precompile (6 decimals).
export const USDC_ERC20_PRECOMPILE =
  "0x3600000000000000000000000000000000000000" as const;

// EIP-7708 system emitter: logs a Transfer for EVERY USDC movement, in 18 decimals.
export const SYSTEM_EMITTER =
  "0xfffffffffffffffffffffffffffffffffffffffe" as const;

export const TRANSFER_TOPIC0 =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" as const;

// CCTP V2
export const CCTP = {
  arcDomain: 26,
  baseSepoliaDomain: 6,
  tokenMessengerV2: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA" as const,
  messageTransmitterV2: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as const,
  attestationApi: "https://iris-api-sandbox.circle.com/v2/messages",
};

export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

export function demoAccount() {
  const pk = process.env.DEMO_PRIVATE_KEY;
  if (!pk) throw new Error("DEMO_PRIVATE_KEY missing from spike/.env");
  return privateKeyToAccount(pk as `0x${string}`);
}
