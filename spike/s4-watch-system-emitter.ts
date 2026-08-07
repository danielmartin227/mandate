// S4: can we watch incoming USDC via the EIP-7708 system emitter?
// Open question 4 in context/latest.md: does the public WSS honor eth_subscribe
// with address + topic filters? Fallback is getLogs polling.
//
// Needs no funded wallet: it watches live chain traffic from other people.
//
// Part A: WSS subscribe, unfiltered Transfer from the emitter.
// Part B: WSS subscribe filtered to a specific `to` address seen in part A.
// Part C: getLogs polling fallback over a recent block range.
import { createPublicClient, webSocket, http, parseAbiItem, formatUnits } from "viem";
import { arcTestnet, SYSTEM_EMITTER } from "./arc-config.js";

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

const wssClient = createPublicClient({ chain: arcTestnet, transport: webSocket() });
const httpClient = createPublicClient({ chain: arcTestnet, transport: http() });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- Part A ----------
console.log("A: WSS subscribe, emitter Transfer, unfiltered (25s)");
const seen: { to: string; value: bigint }[] = [];
const unsubA = wssClient.watchEvent({
  address: SYSTEM_EMITTER,
  event: TRANSFER_EVENT,
  poll: false, // force eth_subscribe, no polling fallback
  onLogs: (logs) => {
    for (const l of logs) {
      seen.push({ to: l.args.to as string, value: l.args.value as bigint });
      if (seen.length <= 5) {
        console.log(
          `   log to=${l.args.to} value=${formatUnits(l.args.value as bigint, 18)} (18d) block=${l.blockNumber}`,
        );
      }
    }
  },
  onError: (e) => console.log("   WSS ERROR:", e.message),
});
await sleep(25_000);
unsubA();
console.log(`A result: ${seen.length} logs -> ${seen.length > 0 ? "eth_subscribe WORKS" : "NO LOGS (inconclusive or unsupported)"}`);

// ---------- Part B ----------
const target = seen.find((s) => s.to && s.to !== "0x0000000000000000000000000000000000000000")?.to;
if (target) {
  console.log(`\nB: WSS subscribe filtered to=${target} (25s)`);
  let filteredCount = 0;
  const unsubB = wssClient.watchEvent({
    address: SYSTEM_EMITTER,
    event: TRANSFER_EVENT,
    args: { to: target as `0x${string}` },
    poll: false,
    onLogs: (logs) => {
      filteredCount += logs.length;
      console.log(`   filtered hit: ${logs.length} log(s), total ${filteredCount}`);
    },
    onError: (e) => console.log("   WSS ERROR:", e.message),
  });
  await sleep(25_000);
  unsubB();
  console.log(`B result: ${filteredCount} filtered logs (0 is fine if that address went quiet)`);
} else {
  console.log("\nB: skipped, no usable address from part A");
}

// ---------- Part C ----------
console.log("\nC: getLogs polling fallback, last 50 blocks");
const head = await httpClient.getBlockNumber();
const logs = await httpClient.getLogs({
  address: SYSTEM_EMITTER,
  event: TRANSFER_EVENT,
  fromBlock: head - 50n,
  toBlock: head,
});
console.log(`C result: ${logs.length} logs over blocks ${head - 50n}..${head} -> ${logs.length > 0 ? "getLogs FALLBACK WORKS" : "no traffic in range"}`);

process.exit(0);
