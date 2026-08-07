// S5: CCTP V2 burn on Arc -> attestation -> mint on Base Sepolia.
// THE decision gate for the Bridge template. Also resolves open question 3:
// the max-fee minimum for a transfer originating from Arc.
//
// Hypothesis: Arc has no Fast Transfer, so a standard transfer
// (minFinalityThreshold 2000) should carry maxFee 0 and no minimum amount.
import {
  createPublicClient, createWalletClient, http, parseUnits, formatUnits,
  pad, encodeFunctionData,
} from "viem";
import { baseSepolia } from "viem/chains";
import { arcTestnet, demoAccount, USDC_ERC20_PRECOMPILE, ERC20_ABI, CCTP } from "./arc-config.js";

const account = demoAccount();
const arc = createPublicClient({ chain: arcTestnet, transport: http() });
const arcWallet = createWalletClient({ account, chain: arcTestnet, transport: http() });

const AMOUNT = parseUnits("0.1", 6); // 6 decimals: burnToken is the ERC-20 precompile
const MAX_FEE = 0n;                  // hypothesis under test
const STANDARD_FINALITY = 2000;      // 1000 = fast (not available on Arc)

const TOKEN_MESSENGER_ABI = [{
  type: "function", name: "depositForBurn", stateMutability: "nonpayable",
  inputs: [
    { name: "amount", type: "uint256" },
    { name: "destinationDomain", type: "uint32" },
    { name: "mintRecipient", type: "bytes32" },
    { name: "burnToken", type: "address" },
    { name: "destinationCaller", type: "bytes32" },
    { name: "maxFee", type: "uint256" },
    { name: "minFinalityThreshold", type: "uint32" },
  ],
  outputs: [],
}] as const;

const MESSAGE_TRANSMITTER_ABI = [{
  type: "function", name: "receiveMessage", stateMutability: "nonpayable",
  inputs: [{ name: "message", type: "bytes" }, { name: "attestation", type: "bytes" }],
  outputs: [{ type: "bool" }],
}] as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- 1. approve ----------
console.log("1. approving TokenMessengerV2 for", formatUnits(AMOUNT, 6), "USDC");
const approveHash = await arcWallet.writeContract({
  address: USDC_ERC20_PRECOMPILE, abi: ERC20_ABI, functionName: "approve",
  args: [CCTP.tokenMessengerV2, AMOUNT],
});
const approveReceipt = await arc.waitForTransactionReceipt({ hash: approveHash });
console.log("   ", approveReceipt.status, approveHash);

// ---------- 2. depositForBurn ----------
console.log(`2. depositForBurn -> domain ${CCTP.baseSepoliaDomain}, maxFee ${MAX_FEE}, finality ${STANDARD_FINALITY}`);
let burnHash: `0x${string}`;
try {
  burnHash = await arcWallet.writeContract({
    address: CCTP.tokenMessengerV2, abi: TOKEN_MESSENGER_ABI, functionName: "depositForBurn",
    args: [
      AMOUNT,
      CCTP.baseSepoliaDomain,
      pad(account.address, { size: 32 }),
      USDC_ERC20_PRECOMPILE,
      pad("0x0", { size: 32 }),
      MAX_FEE,
      STANDARD_FINALITY,
    ],
  });
} catch (e: any) {
  console.log("   BURN REVERTED:", e.shortMessage ?? e.message);
  console.log("   -> maxFee 0 rejected. Retry with a nonzero maxFee to find the minimum.");
  process.exit(1);
}
const burnReceipt = await arc.waitForTransactionReceipt({ hash: burnHash });
console.log("   ", burnReceipt.status, burnHash);
console.log("    explorer https://testnet.arcscan.app/tx/" + burnHash);
if (burnReceipt.status !== "success") { console.log("   BURN FAILED"); process.exit(1); }
console.log("    -> maxFee 0 ACCEPTED from Arc (open question 3 resolved)");

// ---------- 3. attestation ----------
console.log("3. polling attestation (up to 20 min)");
const url = `${CCTP.attestationApi}/${CCTP.arcDomain}?transactionHash=${burnHash}`;
let message: string | undefined, attestation: string | undefined;
const started = Date.now();
while (Date.now() - started < 20 * 60_000) {
  const res = await fetch(url);
  if (res.ok) {
    const body: any = await res.json();
    const m = body?.messages?.[0];
    if (m?.status === "complete" && m.attestation && m.attestation !== "PENDING") {
      message = m.message; attestation = m.attestation;
      console.log(`   attested after ${Math.round((Date.now() - started) / 1000)}s`);
      break;
    }
    console.log(`   status=${m?.status ?? "none"} ...`);
  } else {
    console.log(`   http ${res.status} ...`);
  }
  await sleep(10_000);
}
if (!message || !attestation) { console.log("   NO ATTESTATION IN 20 MIN -> treat as FAIL"); process.exit(1); }

// ---------- 4. mint on Base Sepolia ----------
console.log("4. minting on Base Sepolia");
const base = createPublicClient({ chain: baseSepolia, transport: http() });
const baseEth = await base.getBalance({ address: account.address });
console.log("   Base Sepolia ETH:", formatUnits(baseEth, 18));
if (baseEth === 0n) {
  console.log("   NO ETH. Burn+attestation PROVEN; mint pending faucet.");
  console.log("   Saved to cctp-pending-mint.json, rerun mint later.");
  const { writeFileSync } = await import("node:fs");
  writeFileSync("./cctp-pending-mint.json", JSON.stringify({ burnHash, message, attestation }, null, 2));
  process.exit(0);
}
const baseWallet = createWalletClient({ account, chain: baseSepolia, transport: http() });
const mintHash = await baseWallet.writeContract({
  address: CCTP.messageTransmitterV2, abi: MESSAGE_TRANSMITTER_ABI,
  functionName: "receiveMessage", args: [message as `0x${string}`, attestation as `0x${string}`],
});
const mintReceipt = await base.waitForTransactionReceipt({ hash: mintHash });
console.log("   ", mintReceipt.status, mintHash);
console.log("    explorer https://sepolia.basescan.org/tx/" + mintHash);
console.log(mintReceipt.status === "success" ? "\nS5 FULL PASS -> BRIDGE IS IN" : "\nMINT FAILED");
