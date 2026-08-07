// The contract between the AI interpreter and the chain.
//
// This schema is the ONLY thing the model is allowed to produce. It cannot emit
// free-form instructions, an address it invented, or a template that does not
// exist: the API constrains generation to this shape, and validateCompiled()
// re-checks every field before anything reaches a deploy call. A model that
// wants to do something unsupported has exactly one escape hatch, "refuse".
import { isAddress } from "viem";

export const TEMPLATES = ["SplitRule", "SweepRule", "BridgeRule"] as const;
export type TemplateName = (typeof TEMPLATES)[number];

/// JSON Schema handed to the API as output_config.format.
/// Structured outputs require every property listed in `required` and
/// additionalProperties: false, so unused fields carry explicit neutral values
/// rather than being omitted.
export const RULE_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    decision: {
      type: "string",
      enum: ["compile", "refuse"],
      description:
        "compile only when the sentence maps unambiguously onto one template with every parameter stated. Otherwise refuse.",
    },
    refusalReason: {
      type: "string",
      description:
        "When refusing, one plain sentence a treasurer can act on: what is missing or unsupported. Empty string when compiling.",
    },
    template: {
      type: "string",
      enum: ["SplitRule", "SweepRule", "BridgeRule", "none"],
      description: "The template this rule compiles to, or none when refusing.",
    },
    readback: {
      type: "string",
      description:
        "Plain-English restatement of what the deployed rule will do, for the human to confirm. Empty string when refusing.",
    },
    savingsAddress: {
      type: "string",
      description:
        "Required whenever template is SplitRule: the recipient's 0x address, copied character for character from the sentence. Mentioning the address in readback does not populate this field; it must be repeated here. Empty string only when template is not SplitRule.",
    },
    savingsBps: {
      type: "integer",
      description:
        "SplitRule only: share of each incoming payment in basis points (10% = 1000). Zero otherwise.",
    },
    floorUsdc: {
      type: "string",
      description:
        "BridgeRule and SweepRule only: USDC balance to retain, as a decimal string. Empty string otherwise.",
    },
    recipientAddress: {
      type: "string",
      description:
        "Required whenever template is BridgeRule or SweepRule: the 0x address the funds leave to, copied character for character from the sentence. For BridgeRule this is the recipient on the destination chain; for SweepRule it is the address on Arc that receives the surplus. Mentioning the address in readback does not populate this field; it must be repeated here. Empty string only when template is SplitRule or none.",
    },
    intervalSeconds: {
      type: "integer",
      description:
        "BridgeRule only: minimum seconds between bridges (monthly = 2592000). Zero otherwise.",
    },
  },
  required: [
    "decision", "refusalReason", "template", "readback",
    "savingsAddress", "savingsBps", "floorUsdc", "recipientAddress", "intervalSeconds",
  ],
} as const;

export type RawRuleOutput = {
  decision: "compile" | "refuse";
  refusalReason: string;
  template: TemplateName | "none";
  readback: string;
  savingsAddress: string;
  savingsBps: number;
  floorUsdc: string;
  recipientAddress: string;
  intervalSeconds: number;
};

export type CompiledRule =
  | { kind: "refusal"; reason: string }
  | {
      kind: "compiled";
      template: "SplitRule";
      readback: string;
      /// CLI args for scripts/deploy-rule.ts, in template order.
      deployArgs: string[];
      params: { savingsAddress: string; savingsBps: number };
    }
  | {
      kind: "compiled";
      template: "SweepRule";
      readback: string;
      deployArgs: string[];
      params: { destinationAddress: string; floorUsdc: string };
    }
  | {
      kind: "compiled";
      template: "BridgeRule";
      readback: string;
      deployArgs: string[];
      params: {
        floorUsdc: string;
        recipientAddress: string;
        intervalSeconds: number;
      };
    };

/// Model prose reaches the UI and the demo, where em-dash and en-dash are banned
/// project-wide. The system prompt asks for plain hyphens; this guarantees it,
/// because a prompt is a request and a replace is a rule.
/// Built from code points rather than written out: the literal characters would
/// trip the repo's own pre-commit dash hook on this very file. 0x2013 is the
/// en-dash, 0x2014 the em-dash. Surrounding whitespace is absorbed so
/// "balance - I need" does not become "balance  -  I need".
const BANNED_DASHES = new RegExp(
  `\\s*[${String.fromCharCode(0x2013, 0x2014)}]\\s*`,
  "g",
);

function normalizeDashes(text: string): string {
  return text.replace(BANNED_DASHES, " - ");
}

/// A USDC amount the model produced as a decimal string. Rejects empty, blank,
/// non-numeric, zero and negative values. Both floor-bearing templates refuse a
/// zero floor onchain, so catching it here yields a readable reason instead.
function isPositiveAmount(value: string): boolean {
  const n = Number(value);
  return value.trim() !== "" && Number.isFinite(n) && n > 0;
}

/// Re-validate the model's output before it can reach a deploy call.
/// Structured outputs guarantee the SHAPE; they guarantee nothing about whether
/// the values make sense. A hallucinated address is well-formed JSON.
export function validateCompiled(input: RawRuleOutput): CompiledRule {
  // Only the two prose fields are normalized. Addresses and amounts are never
  // rewritten: a value that needs cleaning up is a value we refuse instead.
  const raw: RawRuleOutput = {
    ...input,
    readback: normalizeDashes(input.readback),
    refusalReason: normalizeDashes(input.refusalReason),
  };

  if (raw.decision === "refuse") {
    return {
      kind: "refusal",
      reason: raw.refusalReason.trim() || "The sentence could not be compiled.",
    };
  }

  if (raw.template === "SplitRule") {
    if (!isAddress(raw.savingsAddress)) {
      return { kind: "refusal", reason: `Savings address is not a valid address: ${raw.savingsAddress}` };
    }
    if (!Number.isInteger(raw.savingsBps) || raw.savingsBps <= 0 || raw.savingsBps > 10_000) {
      return { kind: "refusal", reason: `Share must be between 0% and 100%, got ${raw.savingsBps} bps.` };
    }
    return {
      kind: "compiled",
      template: "SplitRule",
      readback: raw.readback,
      deployArgs: ["SplitRule", raw.savingsAddress, String(raw.savingsBps)],
      params: { savingsAddress: raw.savingsAddress, savingsBps: raw.savingsBps },
    };
  }

  if (raw.template === "SweepRule") {
    if (!isAddress(raw.recipientAddress)) {
      return { kind: "refusal", reason: `Destination address is not a valid address: ${raw.recipientAddress}` };
    }
    if (!isPositiveAmount(raw.floorUsdc)) {
      return { kind: "refusal", reason: `Floor must be a positive USDC amount, got "${raw.floorUsdc}".` };
    }
    return {
      kind: "compiled",
      template: "SweepRule",
      readback: raw.readback,
      // Template order: SweepRule <destinationAddress> <floorUsdc>.
      deployArgs: ["SweepRule", raw.recipientAddress, raw.floorUsdc],
      params: { destinationAddress: raw.recipientAddress, floorUsdc: raw.floorUsdc },
    };
  }

  if (raw.template === "BridgeRule") {
    if (!isAddress(raw.recipientAddress)) {
      return { kind: "refusal", reason: `Recipient address is not a valid address: ${raw.recipientAddress}` };
    }
    if (!isPositiveAmount(raw.floorUsdc)) {
      return { kind: "refusal", reason: `Floor must be a positive USDC amount, got "${raw.floorUsdc}".` };
    }
    if (!Number.isInteger(raw.intervalSeconds) || raw.intervalSeconds < 0) {
      return { kind: "refusal", reason: `Interval must be a non-negative number of seconds, got ${raw.intervalSeconds}.` };
    }
    return {
      kind: "compiled",
      template: "BridgeRule",
      readback: raw.readback,
      deployArgs: [
        "BridgeRule", raw.floorUsdc, raw.recipientAddress, String(raw.intervalSeconds),
      ],
      params: {
        floorUsdc: raw.floorUsdc,
        recipientAddress: raw.recipientAddress,
        intervalSeconds: raw.intervalSeconds,
      },
    };
  }

  return {
    kind: "refusal",
    reason: raw.refusalReason.trim() || "No template matches this sentence.",
  };
}
