// Call execute() on a rule by hand, with no keeper running.
//
// Usage: tsx scripts/execute-rule-manually.ts [ruleAddress]
//        defaults to the most recently deployed rule, of any template.
//
// This is the proof behind the central claim: the keeper is a convenience, not a
// dependency. execute() is permissionless, so the treasurer, a bystander, or a
// block explorer can enforce the rule if our backend never comes back.
import { publicClient } from "../src/chain/arc-clients.js";
import { explorerAddress, USDC_ERC20_PRECOMPILE } from "../src/chain/arc-constants.js";
import { formatUsdc, ERC20_ABI } from "../src/chain/usdc-precompile.js";
import { findRule } from "../src/rules/rule-store.js";
import { executeRule, describeOutcome } from "../src/rules/rule-executor.js";
import { appendExecution } from "../src/rules/execution-store.js";
import { stripExplorerUrl } from "../src/watcher/execute-and-record.js";
import { describeRuleState, readSplitState } from "../src/rules/rule-state-readers.js";

const rule = findRule(process.argv[2]);
if (!rule) throw new Error("no deployed rule found; run scripts/deploy-rule.ts first");

const pub = publicClient();

const usdcBalance = (address: `0x${string}`) =>
  pub.readContract({
    address: USDC_ERC20_PRECOMPILE,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address],
  }) as Promise<bigint>;

console.log("rule    ", explorerAddress(rule.address));
console.log("template", rule.template);
for (const line of await describeRuleState(rule)) console.log("  " + line);

// SplitRule is the one template whose payout arithmetic can be checked against
// an independent balance reading, so measure the recipient before and after.
const split = rule.template === "SplitRule" ? await readSplitState(rule) : undefined;
const savingsBefore = split ? await usdcBalance(split.savings) : 0n;
if (split) console.log("  savings balance", formatUsdc(savingsBefore), "USDC (before)");

console.log("\ncalling execute()...");
const outcome = await executeRule(rule);
const description = describeOutcome(outcome, rule.template);
console.log(description);

// Record it so the UI shows keeper-free enforcement the same as keeper-driven.
appendExecution({
  ruleAddress: rule.address,
  template: rule.template,
  outcome: stripExplorerUrl(description),
  timestamp: new Date().toISOString(),
  txHash: outcome.kind === "executed" ? outcome.hash : undefined,
  trigger: "manual",
});

console.log("\nafter:");
for (const line of await describeRuleState(rule)) console.log("  " + line);

if (split && outcome.kind === "executed" && outcome.args) {
  const savingsAfter = await usdcBalance(split.savings);
  const incoming = outcome.args.incoming as bigint;
  const expected = (incoming * BigInt(split.savingsBps)) / 10_000n;
  const actual = savingsAfter - savingsBefore;
  console.log("  savings balance", formatUsdc(savingsAfter), "USDC");
  console.log(
    "  arithmetic     ",
    actual === expected
      ? `CORRECT (${formatUsdc(expected)} expected, ${formatUsdc(actual)} received)`
      : `MISMATCH expected ${formatUsdc(expected)} got ${formatUsdc(actual)}`,
  );
}
