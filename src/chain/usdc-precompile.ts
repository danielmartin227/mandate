// USDC helpers. The 6-decimal precompile is the only interface used for amounts.
import { formatUnits, parseUnits } from "viem";
import { USDC_DECIMALS, NATIVE_DECIMALS } from "./arc-constants.js";

export const ERC20_ABI = [
  {
    type: "function", name: "balanceOf", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }],
  },
  {
    type: "function", name: "transfer", stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function", name: "approve", stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
] as const;

/// Format a 6-decimal USDC amount for display.
export const formatUsdc = (amount: bigint) => formatUnits(amount, USDC_DECIMALS);

/// Parse a human amount into 6 decimals.
export const parseUsdc = (amount: string) => parseUnits(amount, USDC_DECIMALS);

/// Format an 18-decimal value from the system emitter. DISPLAY ONLY.
/// Never feed the result of this back into a payout amount.
export const formatEmitterValue = (value: bigint) => formatUnits(value, NATIVE_DECIMALS);
