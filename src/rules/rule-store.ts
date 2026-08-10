// Persistence for deployed rules. A JSON file is the right size for this project:
// a handful of rules, single process, no concurrent writers.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
// Statically imported so a serverless bundle carries the store even when the
// working directory it was written in is gone. Local runs still read the file,
// which is the only copy that changes.
import bundledRules from "../../data/deployed-rules.json" with { type: "json" };

export const RULES_FILE = "data/deployed-rules.json";

export type DeployedRule = {
  template: string;
  address: `0x${string}`;
  deployTx: string;
  params: Record<string, string | number>;
  abi: unknown[];
  deployedAt: string;
  /// The sentence this rule was compiled from. Set from phase 02 onward.
  sourceSentence?: string;
  /// Superseded by a later version of the same template. The contract stays
  /// onchain and anyone can still call execute() on it, but the keeper must not
  /// poke it and the UI must not list it: an older template version has a
  /// different ruleState() shape, so decoding it yields silent nonsense.
  retired?: boolean;
};

export function loadRules(): DeployedRule[] {
  if (!existsSync(RULES_FILE)) return bundledRules as unknown as DeployedRule[];
  return JSON.parse(readFileSync(RULES_FILE, "utf8"));
}

/// Rules the keeper acts on and the UI shows. Everything else is history.
export function loadActiveRules(): DeployedRule[] {
  return loadRules().filter((r) => !r.retired);
}

/// Mark a rule retired. Returns false when no such rule is stored.
export function retireRule(address: string): boolean {
  const rules = loadRules();
  const rule = rules.find((r) => r.address.toLowerCase() === address.toLowerCase());
  if (!rule) return false;
  rule.retired = true;
  writeFileSync(RULES_FILE, JSON.stringify(rules, null, 2));
  return true;
}

export function saveRule(rule: DeployedRule) {
  if (!existsSync("data")) mkdirSync("data");
  const rules = loadRules().filter((r) => r.address !== rule.address);
  rules.push(rule);
  writeFileSync(RULES_FILE, JSON.stringify(rules, null, 2));
}

/// Look up by address, or take the most recent active rule when none is given.
/// An explicit address still finds a retired rule, so it can be inspected.
export function findRule(address?: string): DeployedRule | undefined {
  if (!address) return loadActiveRules().pop();
  return loadRules().find((r) => r.address.toLowerCase() === address.toLowerCase());
}

/// Most recently deployed active rule of a given template.
export function findLatestByTemplate(template: string): DeployedRule | undefined {
  return loadActiveRules().filter((r) => r.template === template).pop();
}

export function rulesByTemplate(template: string): DeployedRule[] {
  return loadActiveRules().filter((r) => r.template === template);
}
