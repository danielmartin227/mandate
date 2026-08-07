// Print the onchain state of deployed rules.
//
// Usage: tsx scripts/show-rule-state.ts [ruleAddress]
//        with no argument, prints every rule in the store.
//
// Read-only: no transaction, no key needed beyond the RPC.
import { explorerAddress } from "../src/chain/arc-constants.js";
import { loadRules, findRule } from "../src/rules/rule-store.js";
import { describeRuleState } from "../src/rules/rule-state-readers.js";
import { summarizeRule } from "../src/rules/rule-templates.js";

const target = process.argv[2];
const rules = target ? [findRule(target)].filter((r) => r !== undefined) : loadRules();

if (rules.length === 0) {
  console.log(target ? `no rule found at ${target}` : "no deployed rules");
  process.exit(1);
}

for (const rule of rules) {
  const summary = summarizeRule(rule.template, rule.params);
  console.log(`\n${rule.template} ${rule.address}${rule.retired ? "  [RETIRED]" : ""}`);
  if (rule.retired) {
    // Its ruleState() shape belongs to an older version of the template, so a
    // decode here would print confident nonsense. Skip it.
    console.log("  superseded, not read");
    continue;
  }
  if (summary) console.log(`  ${summary}`);
  if (rule.sourceSentence) console.log(`  from: "${rule.sourceSentence}"`);
  console.log(`  ${explorerAddress(rule.address)}`);
  try {
    for (const line of await describeRuleState(rule)) console.log("  " + line);
  } catch (e: any) {
    // A rule whose ABI predates the current template still lives in the store.
    console.log(`  state unreadable: ${e.shortMessage ?? e.message}`);
  }
}
