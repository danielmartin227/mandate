// Deploy a rule template directly, without the interpreter.
//
// Usage: tsx scripts/deploy-rule.ts SplitRule <savingsAddress> <bps>
//        tsx scripts/deploy-rule.ts SweepRule <destinationAddress> <floorUsdc>
//        tsx scripts/deploy-rule.ts BridgeRule <floorUsdc> <recipient> <intervalSeconds> [domain]
//
// This is the no-AI path: parameters straight from a human. The compile flow in
// compile-and-deploy.ts joins the same road at deployRuleTemplate().
import { TEMPLATES } from "../src/rules/rule-templates.js";
import { deployRuleTemplate } from "../src/rules/deploy-rule-template.js";

const [template, ...templateArgs] = process.argv.slice(2);
if (!template) {
  console.error(
    "usage: deploy-rule.ts <Template> <args...>\n" +
      Object.values(TEMPLATES).map((t) => "  " + t.usage).join("\n"),
  );
  process.exit(1);
}

const rule = await deployRuleTemplate(template, { templateArgs });
console.log("\nrule address:", rule.address);
