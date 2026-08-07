// The full setup path: sentence -> AI compile -> human preview -> confirm -> deploy.
//
// Usage:
//   tsx scripts/compile-and-deploy.ts "route 10% of every payment to 0x..."
//   tsx scripts/compile-and-deploy.ts "..." --confirm
//
// WITHOUT --confirm this only previews. That is the point: the AI's output is
// shown to a human and stops there. Nothing reaches the chain until a person
// looks at the readback and acts. This is the answer to "what if the AI
// compiles it wrong" - a wrong rule is visible here, before it exists onchain,
// and it is the last moment a model has any influence on the system.
import { compileSentence } from "../src/interpreter/compile-sentence-to-rule.js";
import { deployRuleTemplate } from "../src/rules/deploy-rule-template.js";
import { explorerAddress } from "../src/chain/arc-constants.js";

const sentence = process.argv[2];
const confirmed = process.argv.includes("--confirm");
if (!sentence) {
  console.error('usage: compile-and-deploy.ts "<sentence>" [--confirm]');
  process.exit(1);
}

console.log(`sentence: "${sentence}"`);
console.log("compiling (this is the only model call in the system)...\n");

const result = await compileSentence(sentence);

if (result.kind === "refusal") {
  console.log("REFUSED");
  console.log(" ", result.reason);
  console.log("\nNothing was deployed. Rewrite the sentence and try again.");
} else {
  console.log("COMPILED");
  console.log("  template:", result.template);
  console.log("  readback:", result.readback);
  console.log("  parameters:");
  for (const [k, v] of Object.entries(result.params)) console.log(`    ${k} = ${v}`);

  if (!confirmed) {
    console.log("\nPREVIEW ONLY. Nothing has been deployed.");
    console.log("If the readback above is exactly what you want, rerun with --confirm:");
    console.log(`  npx tsx scripts/compile-and-deploy.ts "${sentence}" --confirm`);
  } else {
    console.log("\nconfirmed by human, deploying...");
    console.log("from here on there is no model in the loop.\n");

    const rule = await deployRuleTemplate(result.template, {
      templateArgs: result.deployArgs.slice(1), // drop the template name
      sourceSentence: sentence,
    });

    console.log("\nrule live:", explorerAddress(rule.address));
    console.log("start the keeper to enforce it: npm run watch");
  }
}
