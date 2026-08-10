// POST /api/deploy
// Compiles a Solidity template, deploys it to Arc, verifies on Arcscan, and
// records the rule. No model involved: the AI already left after /api/compile.
import { NextResponse } from "next/server";
import { deployRuleTemplate } from "../../../src/rules/deploy-rule-template.js";
import { appendExecution } from "../../../src/rules/execution-store.js";

/// Deploying reads Solidity from contracts/ and signs with a local key. On a
/// hosted build neither is available, so refuse in one plain sentence rather
/// than letting a filesystem error reach the browser.
const DEPLOY_UNAVAILABLE =
  "Deploying a rule runs from the CLI in this build, because it compiles Solidity and signs with a local key. Clone the repo and follow the README to deploy this rule to Arc.";

export async function POST(request: Request) {
  try {
    if (process.env.VERCEL) {
      return NextResponse.json({ error: DEPLOY_UNAVAILABLE }, { status: 501 });
    }
    const body = await request.json();
    const { template, deployArgs, sentence } = body ?? {};

    if (typeof template !== "string" || !template) {
      return NextResponse.json(
        { error: "template is required" },
        { status: 400 },
      );
    }
    if (!Array.isArray(deployArgs)) {
      return NextResponse.json(
        { error: "deployArgs must be an array" },
        { status: 400 },
      );
    }

    const logs: string[] = [];
    const rule = await deployRuleTemplate(template, {
      templateArgs: deployArgs,
      sourceSentence: sentence,
      log: (line) => logs.push(line),
    });

    // Record the deployment as the first execution event for this rule.
    appendExecution({
      ruleAddress: rule.address,
      template: rule.template,
      outcome: "deployed",
      timestamp: rule.deployedAt,
      txHash: rule.deployTx,
      trigger: "deploy",
    });

    return NextResponse.json({
      address: rule.address,
      deployTx: rule.deployTx,
      template: rule.template,
      logs,
    });
  } catch (e: any) {
    console.error("[/api/deploy]", e);
    // A missing contracts/ or artifacts/ file means this build cannot compile
    // templates. Say that, rather than surfacing a raw filesystem error.
    const message = /ENOENT|no such file/i.test(String(e?.message))
      ? DEPLOY_UNAVAILABLE
      : (e.message ?? "deploy failed");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
