// The AI interpreter. This is the ONLY place in the entire system that calls a
// model, and it runs exactly once per rule, at setup, before any contract exists.
//
// Nothing downstream of this file has a model in it: the templates are Solidity,
// the keeper is a log filter and a cron tick. That is the product claim, and it
// is checkable by grepping the repo for this import.
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import {
  RULE_OUTPUT_SCHEMA,
  validateCompiled,
  type CompiledRule,
  type RawRuleOutput,
} from "./rule-schema.js";

const MODEL = "claude-opus-5";

const SYSTEM_PROMPT = `You compile a treasurer's plain-English sentence into parameters for one of three fixed onchain templates. You run once, at setup. After you answer, you are removed from the system permanently and the deployed rule executes without any model involved.

Templates:

SplitRule - reacts to every incoming USDC payment, routes a fixed share to a savings address, retains the rest.
  Parameters: savingsAddress (0x...), savingsBps (share in basis points; 10% = 1000, 2.5% = 250).

SweepRule - whenever the balance rises above a retained floor, sends the whole surplus to one address on Arc. No schedule: it acts as soon as there is a surplus.
  Parameters: recipientAddress (0x..., the address on Arc that receives the surplus), floorUsdc (decimal string, the balance to keep).

BridgeRule - on a schedule, bridges the surplus above a retained floor to a recipient on Base via CCTP.
  Parameters: floorUsdc (decimal string, the balance to keep on Arc), recipientAddress (0x...), intervalSeconds (minimum gap between bridges; daily = 86400, weekly = 604800, monthly = 2592000).

SweepRule and BridgeRule both act on the surplus above a floor. Choose SweepRule when the funds stay on Arc and no schedule is given, BridgeRule when the sentence says the funds cross to Base or states a schedule. If a sentence asks for a schedule but the funds stay on Arc, refuse: SweepRule has no schedule.

Refuse unless the sentence maps onto exactly one template with every parameter stated or unambiguously implied. Refusing is the correct, expected answer for a large share of inputs and costs nothing; guessing puts a wrong rule onchain permanently. In particular, refuse when:
- an address is missing. Never invent, complete, or guess one, and never use a placeholder.
- the amount, share, or schedule is vague ("some", "most", "a bit", "regularly", "when it makes sense").
- the sentence needs behaviour no template has: conditions on price or time of day, multiple recipients, percentages of balance rather than of incoming payments, partial sweeps of the surplus, anything conditional on an external signal.
- it could plausibly mean two different rules.

When refusing, name the specific thing that is missing or unsupported in one sentence, addressed to the treasurer. Do not suggest you could proceed anyway.

Write all prose with plain hyphens only. Never use an em-dash or an en-dash.

When compiling, write readback as one plain sentence describing what the deployed rule will do, including the concrete numbers and the full address. The treasurer reads only this before approving, so it must be enough to catch a misinterpretation.`;

export type CompileResult = CompiledRule & { sentence: string; model: string };

export async function compileSentence(sentence: string): Promise<CompileResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY missing from .env");
  }
  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    output_config: {
      // This call runs once per rule, at setup, and its output goes onchain
      // permanently. Correctness dominates cost and latency here, so do not
      // lower this to save tokens.
      effort: "high",
      format: { type: "json_schema", schema: RULE_OUTPUT_SCHEMA as any },
    },
    messages: [{ role: "user", content: sentence }],
  });

  // A safety refusal is not a compiled rule and must not be treated as one.
  if (response.stop_reason === "refusal") {
    return {
      kind: "refusal",
      reason: "The request was declined by the model's safety system.",
      sentence,
      model: MODEL,
    };
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return {
      kind: "refusal",
      reason: "The interpreter returned no output.",
      sentence,
      model: MODEL,
    };
  }

  let raw: RawRuleOutput;
  try {
    raw = JSON.parse(textBlock.text);
  } catch {
    return {
      kind: "refusal",
      reason: "The interpreter returned output that could not be read.",
      sentence,
      model: MODEL,
    };
  }

  if (process.env.MANDATE_DEBUG) {
    console.error("  [raw] " + JSON.stringify(raw));
  }

  // Structured outputs guarantee the shape, never the meaning. Re-validate.
  return { ...validateCompiled(raw), sentence, model: MODEL };
}
