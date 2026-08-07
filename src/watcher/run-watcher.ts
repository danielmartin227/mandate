// The keeper. Watches every deployed rule and pokes execute() when funds arrive.
//
// Usage: tsx src/watcher/run-watcher.ts [--poll]
//
// Deliberately unprivileged: it calls a permissionless function and holds no
// authority over any rule. Kill it and the rules remain enforceable by anyone.
import { watchIncomingPayments, pollIncomingPayments } from "./incoming-payment-watcher.js";
import { loadActiveRules } from "../rules/rule-store.js";
import { isScheduled, summarizeRule } from "../rules/rule-templates.js";
import { executeAndRecord } from "./execute-and-record.js";
import { tickScheduledRules } from "./scheduled-rule-ticker.js";
import { formatEmitterValue } from "../chain/usdc-precompile.js";
import { explorerAddress } from "../chain/arc-constants.js";

const usePolling = process.argv.includes("--poll");

// Retired rules are skipped: they are superseded versions whose ABI no longer
// matches the current template, and poking them would act on a stale contract.
const rules = loadActiveRules();
if (rules.length === 0) {
  console.log("no active rules; run scripts/deploy-rule.ts first");
  process.exit(1);
}

// Two kinds of rule, two triggers. Payment-reactive rules wait on the emitter
// log; schedule-driven rules are poked on a timer and refuse onchain if early.
const scheduledRules = rules.filter((r) => isScheduled(r.template));
const paymentRules = rules.filter((r) => !isScheduled(r.template));

const byAddress = new Map(paymentRules.map((r) => [r.address.toLowerCase(), r]));
const addresses = paymentRules.map((r) => r.address);

console.log(
  `keeper watching ${paymentRules.length} payment-reactive rule(s) via ${usePolling ? "HTTP polling" : "WSS subscription"}` +
    (scheduledRules.length ? ` and ticking ${scheduledRules.length} scheduled rule(s)` : ""),
);
for (const r of rules) {
  const summary = summarizeRule(r.template, r.params);
  console.log(`  ${r.template} ${r.address}${summary ? ` (${summary})` : ""}`);
  console.log(`    ${explorerAddress(r.address)}`);
}
console.log("");

// Coalesce bursts: several payments can land in one block, and one execute()
// settles all of them. A short delay also lets state catch up before we read it.
const pendingTimers = new Map<string, NodeJS.Timeout>();
const SETTLE_DELAY_MS = 1500;

function scheduleExecute(address: string) {
  const key = address.toLowerCase();
  clearTimeout(pendingTimers.get(key));
  pendingTimers.set(
    key,
    setTimeout(async () => {
      pendingTimers.delete(key);
      const rule = byAddress.get(key);
      if (!rule) return;
      await executeAndRecord(rule, "payment");
    }, SETTLE_DELAY_MS),
  );
}

const onPayment = (p: {
  to: `0x${string}`; from: `0x${string}`; value: bigint; txHash: `0x${string}`;
}) => {
  const time = new Date().toISOString().slice(11, 19);
  console.log(
    `[${time}] incoming ${formatEmitterValue(p.value)} USDC to ${p.to.slice(0, 10)}... from ${p.from.slice(0, 10)}...`,
  );
  scheduleExecute(p.to);
};

// An address filter with no addresses would subscribe to every USDC movement on
// the chain, so skip the subscription entirely when only scheduled rules exist.
const paymentHandle = addresses.length
  ? usePolling
    ? pollIncomingPayments(addresses, onPayment, undefined, (e) =>
        console.error("poll error:", e.message),
      )
    : watchIncomingPayments(addresses, onPayment, (e) => {
        console.error("WSS error:", e.message);
        console.error("restart with --poll to use the HTTP fallback");
      })
  : { stop() {} };

const tickerHandle = tickScheduledRules(scheduledRules);

console.log("waiting for payments. ctrl-c to stop.\n");

process.on("SIGINT", () => {
  paymentHandle.stop();
  tickerHandle.stop();
  console.log("\nkeeper stopped. rules remain enforceable: anyone can still call execute().");
  process.exit(0);
});
