// Complete a bridge whose destination mint has not been submitted yet.
//
// Usage: tsx scripts/complete-pending-mint.ts
//
// Reads data/pending-mint.json (written when a bridge burned but the mint could
// not be submitted, usually for want of destination gas) and submits it.
//
// Worth noting for the demo: the burn already happened onchain and the attestation
// is a signed, public artifact. The funds are not stuck pending our backend. CCTP
// destinationCaller is zero, so ANYONE can submit this and complete the transfer.
import { readFileSync, existsSync } from "node:fs";
import { mintOnBaseSepolia } from "../src/bridge/cctp-attestation.js";

const PENDING_FILE = "data/pending-mint.json";
if (!existsSync(PENDING_FILE)) {
  console.log("no pending mint");
  process.exit(0);
}

const pending = JSON.parse(readFileSync(PENDING_FILE, "utf8"));
console.log("burn tx", pending.burnTx);
console.log("submitting attestation on Base Sepolia...");

const result = await mintOnBaseSepolia({
  message: pending.message,
  attestation: pending.attestation,
});

if (!result.minted) {
  console.log("not completed:", "reason" in result ? result.reason : "unknown");
  console.log("get Base Sepolia ETH from a public faucet, then rerun");
  process.exit(1);
}
console.log("MINTED", result.explorer);
console.log("BRIDGE COMPLETE: Arc -> Base Sepolia");
