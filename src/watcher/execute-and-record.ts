// Poke a rule and write what happened to the execution log the UI reads.
//
// Every path that calls execute() outside the one-off scripts goes through here,
// so the log is the same whether a payment triggered it or the schedule did.
import { executeRule, describeOutcome } from "../rules/rule-executor.js";
import { appendExecution, type Execution } from "../rules/execution-store.js";
import type { DeployedRule } from "../rules/rule-store.js";

export type Trigger = NonNullable<Execution["trigger"]>;

/// Drop a trailing explorer link (and the comma introducing it) from an outcome.
export function stripExplorerUrl(text: string): string {
  return text.replace(/,?\s*https?:\/\/\S+/g, "").trim();
}

export async function executeAndRecord(
  rule: DeployedRule,
  trigger: Trigger,
): Promise<void> {
  const outcome = await executeRule(rule);
  const description = describeOutcome(outcome, rule.template);
  console.log(`  -> ${description}`);

  // A scheduled tick that finds the rule not due is the normal case on most
  // ticks, and logging it would bury the real events. A payment that arrives
  // and still produces no action is worth showing: that IS the rule refusing.
  if (outcome.kind === "not-ready" && trigger === "schedule") return;

  appendExecution({
    ruleAddress: rule.address,
    template: rule.template,
    // The console form ends with an explorer URL, which is useful in a terminal
    // and noise in the UI: the row already carries txHash and builds its own link.
    outcome: stripExplorerUrl(description),
    timestamp: new Date().toISOString(),
    txHash: outcome.kind === "executed" ? outcome.hash : undefined,
    trigger,
  });
}
