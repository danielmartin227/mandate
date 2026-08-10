// Execution log. Same pattern as rule-store: a JSON file is the right size.
// The watcher appends here after each execute() call; the UI reads it.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

import bundledExecutions from "../../data/executions.json" with { type: "json" };

const EXECUTIONS_FILE = "data/executions.json";

export type Execution = {
  ruleAddress: string;
  template: string;
  outcome: string;
  timestamp: string;
  txHash?: string;
  /// What caused this entry. "payment" and "schedule" are the keeper; "manual"
  /// is a human calling the permissionless execute() with no keeper running.
  trigger?: "deploy" | "payment" | "schedule" | "manual";
};

export function loadExecutions(): Execution[] {
  if (!existsSync(EXECUTIONS_FILE)) return bundledExecutions as unknown as Execution[];
  try {
    return JSON.parse(readFileSync(EXECUTIONS_FILE, "utf8"));
  } catch {
    return [];
  }
}

export function appendExecution(exec: Execution) {
  if (!existsSync("data")) mkdirSync("data");
  const all = loadExecutions();
  all.push(exec);
  // Keep the last 200 entries to avoid unbounded growth.
  const trimmed = all.slice(-200);
  writeFileSync(EXECUTIONS_FILE, JSON.stringify(trimmed, null, 2));
}
