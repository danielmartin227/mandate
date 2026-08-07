// Fetch a CCTP V2 attestation and replay the mint on Base Sepolia.
//
// This is the offchain half of the bridge. The onchain half (approve + burn)
// happens inside BridgeRule.execute(). This script does NOT touch the rule
// contract; it operates on the CCTP message the burn emitted.
//
// Usage: tsx src/bridge/fetch-attestation-and-mint.ts <burnTxHash>
//
// If Base Sepolia ETH is missing, saves the attestation to data/ and exits 0
// so the mint can be retried later without re-polling.
import "dotenv/config";
import { createPublicClient, createWalletClient, http, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import {
  ARC_DOMAIN,
  ATTESTATION_API,
  MESSAGE_TRANSMITTER_V2,
  MESSAGE_TRANSMITTER_ABI,
} from "../chain/cctp-constants.js";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";

const PENDING_FILE = "data/cctp-pending-mint.json";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const burnTxHash = process.argv[2];
  let message: string | undefined;
  let attestation: string | undefined;

  // If called without a tx hash, try to resume from a saved pending mint.
  if (!burnTxHash) {
    if (!existsSync(PENDING_FILE)) {
      throw new Error("usage: fetch-attestation-and-mint.ts <burnTxHash>");
    }
    console.log("resuming from saved pending mint");
    const saved = JSON.parse(readFileSync(PENDING_FILE, "utf8"));
    message = saved.message;
    attestation = saved.attestation;
    if (!message || !attestation) {
      throw new Error("saved file missing message or attestation");
    }
  }

  // Poll for attestation if we have a tx hash and no saved attestation.
  if (burnTxHash && !attestation) {
    console.log(`polling attestation for burn tx ${burnTxHash}`);
    const url = `${ATTESTATION_API}/${ARC_DOMAIN}?transactionHash=${burnTxHash}`;
    const started = Date.now();
    const TIMEOUT = 20 * 60_000;

    while (Date.now() - started < TIMEOUT) {
      const res = await fetch(url);
      if (res.ok) {
        const body: any = await res.json();
        const m = body?.messages?.[0];
        if (m?.status === "complete" && m.attestation && m.attestation !== "PENDING") {
          message = m.message;
          attestation = m.attestation;
          const elapsed = Math.round((Date.now() - started) / 1000);
          console.log(`  attested after ${elapsed}s`);
          break;
        }
        console.log(`  status=${m?.status ?? "none"} ...`);
      } else {
        console.log(`  http ${res.status} ...`);
      }
      await sleep(10_000);
    }

    if (!message || !attestation) {
      console.log("  no attestation within timeout");
      process.exit(1);
    }

    // Save so we can retry the mint without re-polling.
    if (!existsSync("data")) mkdirSync("data");
    writeFileSync(
      PENDING_FILE,
      JSON.stringify({ burnTxHash, message, attestation }, null, 2),
    );
    console.log("  saved to", PENDING_FILE);
  }

  // Mint on Base Sepolia.
  console.log("minting on Base Sepolia");
  const pk = process.env.DEMO_PRIVATE_KEY;
  if (!pk) throw new Error("DEMO_PRIVATE_KEY missing from .env");
  const account = privateKeyToAccount(pk as `0x${string}`);

  const base = createPublicClient({ chain: baseSepolia, transport: http() });
  const baseEth = await base.getBalance({ address: account.address });
  console.log("  Base Sepolia ETH:", formatUnits(baseEth, 18));

  if (baseEth === 0n) {
    console.log("  NO ETH. Attestation saved; mint pending faucet.");
    console.log("  Get ETH, then rerun without a tx hash to resume.");
    process.exit(0);
  }

  const baseWallet = createWalletClient({ account, chain: baseSepolia, transport: http() });
  const mintHash = await baseWallet.writeContract({
    address: MESSAGE_TRANSMITTER_V2,
    abi: MESSAGE_TRANSMITTER_ABI,
    functionName: "receiveMessage",
    args: [message as `0x${string}`, attestation as `0x${string}`],
  });

  const mintReceipt = await base.waitForTransactionReceipt({ hash: mintHash });
  console.log("  status:", mintReceipt.status);
  console.log("  tx:", `https://sepolia.basescan.org/tx/${mintHash}`);

  if (mintReceipt.status === "success") {
    console.log("\nmint COMPLETE");
  } else {
    console.log("\nmint FAILED");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
