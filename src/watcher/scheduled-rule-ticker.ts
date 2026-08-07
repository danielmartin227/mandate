// Timer for schedule-driven rules (BridgeRule).
//
// Payment-reactive rules are driven by the emitter log; a rule whose condition is
// "enough time has passed" has no log to react to, so something must poke it.
// The tick is deliberately dumb: it calls execute() and lets the CONTRACT decide.
// A tick before the window is due reverts with TooSoon and costs no gas, because
// the executor simulates first. The schedule is enforced onchain, never here.
import type { DeployedRule } from "../rules/rule-store.js";
import { executeAndRecord } from "./execute-and-record.js";

/// Ticks are cheap (a simulate call) and the contract rejects early attempts, so
/// this only needs to be well below the shortest interval a demo would use.
export const DEFAULT_TICK_MS = 60_000;

export type TickerHandle = { stop(): void };

export function tickScheduledRules(
  rules: DeployedRule[],
  intervalMs = DEFAULT_TICK_MS,
): TickerHandle {
  if (rules.length === 0) return { stop() {} };

  let running = false;

  const tick = async () => {
    // Skip if the previous round is still in flight: a slow chain must not
    // stack overlapping execute() calls on the same rule.
    if (running) return;
    running = true;
    try {
      for (const rule of rules) {
        const time = new Date().toISOString().slice(11, 19);
        console.log(`[${time}] tick ${rule.template} ${rule.address.slice(0, 10)}...`);
        await executeAndRecord(rule, "schedule");
      }
    } finally {
      running = false;
    }
  };

  const timer = setInterval(tick, intervalMs);
  // Run one immediately so a rule that is already due does not wait a full cycle.
  void tick();

  return {
    stop() {
      clearInterval(timer);
    },
  };
}
