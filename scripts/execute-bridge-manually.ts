// Trigger a BridgeRule by hand and follow the CCTP transfer through to the mint.
//
// Usage: tsx scripts/execute-bridge-manually.ts [ruleAddress]
//
// The burn is done BY THE CONTRACT, not by this script. All this does is poke a
// public function and then help complete the destination side, which anyone can do.
import { writeFileSync } from "node:fs";
import { findRule, findLatestByTemplate } from "../src/rules/rule-store.js";
import { readBridgeState } from "../src/rules/rule-state-readers.js";
import { executeRule, describeOutcome } from "../src/rules/rule-executor.js";
import { formatUsdc } from "../src/chain/usdc-precompile.js";
import { explorerAddress } from "../src/chain/arc-constants.js";
import { fetchAttestation, mintOnBaseSepolia } from "../src/bridge/cctp-attestation.js";

const rule = process.argv[2] ? findRule(process.argv[2]) : findLatestByTemplate("BridgeRule");
if (!rule) throw new Error("no deployed BridgeRule found");

console.log("rule", explorerAddress(rule.address));
const before = await readBridgeState(rule);
console.log("  balance ", formatUsdc(before.balance), "USDC");
console.log("  floor   ", formatUsdc(before.floor), "USDC");
console.log("  surplus ", formatUsdc(before.surplus), "USDC");
console.log("  domain  ", before.destinationDomain, "(Base Sepolia)");
console.log(
  "  schedule",
  before.nextAllowedAt === 0n
    ? "never executed, bridge allowed now"
    : `next allowed at ${new Date(Number(before.nextAllowedAt) * 1000).toISOString()}`,
);
console.log("  ready   ", before.ready);

console.log("\ncalling execute()...");
const outcome = await executeRule(rule);
console.log(describeOutcome(outcome, rule.template));
if (outcome.kind !== "executed") process.exit(0);

const after = await readBridgeState(rule);
console.log("  balance now", formatUsdc(after.balance), "USDC (floor retained)");

console.log("\nfetching CCTP attestation...");
const att = await fetchAttestation(outcome.hash);
if (!att) {
  console.log("no attestation within timeout");
  process.exit(1);
}
writeFileSync(
  "data/pending-mint.json",
  JSON.stringify({ burnTx: outcome.hash, ...att }, null, 2),
);

console.log("\nminting on Base Sepolia...");
const mint = await mintOnBaseSepolia(att);
if (!mint.minted) {
  console.log("  mint not completed:", "reason" in mint ? mint.reason : "unknown");
  console.log("  attestation saved to data/pending-mint.json; rerun scripts/complete-pending-mint.ts");
  process.exit(0);
}
console.log("  MINTED", mint.explorer);
console.log("\nBRIDGE COMPLETE: Arc -> Base Sepolia");
