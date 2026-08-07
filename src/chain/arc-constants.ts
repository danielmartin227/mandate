// Arc Testnet constants. Every value here was verified first-party and re-proven
// in the 2026-08-06 spike. See plans/reports/spike-260806-1542-arc-cctp-emitter.md.
import { defineChain } from "viem";

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
  blockExplorers: { default: { name: "Arcscan", url: "https://testnet.arcscan.app" } },
});

/// USDC ERC-20 precompile: 6 decimals. All contract arithmetic uses this interface.
export const USDC_ERC20_PRECOMPILE =
  "0x3600000000000000000000000000000000000000" as const;

/// EIP-7708 system emitter: emits a Transfer for EVERY USDC movement, in 18 decimals.
/// One filter here catches native and ERC-20 payments alike. Detection only:
/// these 18-decimal values must never enter payout arithmetic.
export const SYSTEM_EMITTER =
  "0xfffffffffffffffffffffffffffffffffffffffe" as const;

export const USDC_DECIMALS = 6;
export const NATIVE_DECIMALS = 18;

export function explorerTx(hash: string) {
  return `https://testnet.arcscan.app/tx/${hash}`;
}

export function explorerAddress(address: string) {
  return `https://testnet.arcscan.app/address/${address}`;
}
