// POST /api/deploy
// Compiles a Solidity template, deploys it to Arc, verifies on Arcscan, and
// records the rule. No model involved: the AI already left after /api/compile.
import { NextResponse } from "next/server";
import { deployRuleTemplate } from "../../../src/rules/deploy-rule-template.js";
import { appendExecution } from "../../../src/rules/execution-store.js";

export async function POST(request: Request) {
  try {
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
    return NextResponse.json(
      { error: e.message ?? "deploy failed" },
      { status: 500 },
    );
  }
}
