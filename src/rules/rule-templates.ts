// Registry of deployable rule templates.
//
// Each template declares its constructor shape and how to turn CLI arguments into
// constructor arguments. Adding a template means adding an entry here, not editing
// the deploy script.
import { pad, type Address } from "viem";
import { parseUsdc } from "../chain/usdc-precompile.js";

export type TemplateSpec = {
  name: string;
  /// ABI types for the constructor, used to encode args for Blockscout verification.
  constructorTypes: { type: string }[];
  usage: string;
  /// Turn positional CLI args plus the deployer address into constructor args.
  buildArgs(
    cli: string[],
    owner: Address,
  ): { args: readonly unknown[]; params: Record<string, string | number> };
  /// One line describing what a deployed instance does, from its stored params.
  /// Lives here because only the registry knows each template's param shape.
  summarize(params: Record<string, string | number>): string;
  /// True when the rule fires on a schedule rather than on an incoming payment.
  /// The keeper watches payments for the rest and ticks these on a timer.
  scheduled?: boolean;
};

const SPLIT_RULE: TemplateSpec = {
  name: "SplitRule",
  constructorTypes: [{ type: "address" }, { type: "uint16" }, { type: "address" }],
  usage: "SplitRule <savingsAddress> <bps>",
  buildArgs(cli, owner) {
    const [savings, bpsArg] = cli;
    if (!savings?.startsWith("0x")) throw new Error("savings address required");
    const bps = Number(bpsArg);
    if (!Number.isInteger(bps) || bps <= 0 || bps > 10_000) {
      throw new Error("bps must be an integer in 1..10000");
    }
    return {
      args: [savings as Address, bps, owner],
      params: { savings, savingsBps: bps, owner },
    };
  },
  summarize: (p) => `${Number(p.savingsBps) / 100}% of each incoming payment to ${p.savings}`,
};

const SWEEP_RULE: TemplateSpec = {
  name: "SweepRule",
  constructorTypes: [{ type: "address" }, { type: "uint256" }, { type: "address" }],
  usage: "SweepRule <destinationAddress> <floorUsdc>",
  buildArgs(cli, owner) {
    const [destination, floorArg] = cli;
    if (!destination?.startsWith("0x")) throw new Error("destination address required");
    const floor = parseUsdc(floorArg);
    if (floor === 0n) throw new Error("floor must be greater than zero");
    return {
      args: [destination as Address, floor, owner],
      params: { destination, floor: floorArg, owner },
    };
  },
  summarize: (p) => `surplus above ${p.floor} USDC to ${p.destination}`,
};

const BRIDGE_RULE: TemplateSpec = {
  name: "BridgeRule",
  // Constructor order: (destinationDomain, mintRecipient, floor, minInterval, owner).
  constructorTypes: [
    { type: "uint32" }, { type: "bytes32" }, { type: "uint256" },
    { type: "uint64" }, { type: "address" },
  ],
  usage:
    "BridgeRule <floorUsdc> <recipientAddress> <intervalSeconds> [destinationDomain=6]",
  buildArgs(cli, owner) {
    const [floorArg, recipient, intervalArg, domainArg] = cli;
    if (!floorArg) throw new Error("floor amount required, in USDC");
    if (!recipient?.startsWith("0x")) throw new Error("recipient address required");
    // The contract rejects a zero floor, so catch it here with a clearer message.
    const floor = parseUsdc(floorArg);
    if (floor === 0n) throw new Error("floor must be greater than zero");
    // Base Sepolia. Verified lane from Arc (domain 26) in the spike.
    const domain = domainArg ? Number(domainArg) : 6;
    if (!Number.isInteger(domain)) throw new Error("destinationDomain must be an integer");
    // Bridging to Arc's own domain would burn funds with nowhere to mint. The
    // contract does not reject this, so it is refused here at deployment time.
    if (domain === 26) throw new Error("destinationDomain 26 is Arc itself; refusing");
    // CCTP expects the recipient left-padded into bytes32.
    const mintRecipient = pad(recipient as Address, { size: 32 });
    const interval = Number(intervalArg);
    if (!Number.isInteger(interval) || interval < 0) {
      throw new Error("intervalSeconds must be a non-negative integer");
    }

    return {
      args: [domain, mintRecipient, floor, BigInt(interval), owner],
      params: {
        floorUsdc: floorArg,
        recipient,
        mintRecipient,
        destinationDomain: domain,
        minIntervalSeconds: interval,
        owner,
      },
    };
  },
  summarize: (p) =>
    `surplus above ${p.floorUsdc} USDC to ${p.recipient} on domain ${p.destinationDomain}, at most every ${p.minIntervalSeconds}s`,
  scheduled: true,
};

export const TEMPLATES: Record<string, TemplateSpec> = {
  SplitRule: SPLIT_RULE,
  SweepRule: SWEEP_RULE,
  BridgeRule: BRIDGE_RULE,
};

/// Summary of a stored rule, tolerant of a template the registry does not know
/// (an old rule in the JSON store must never crash the keeper).
export function summarizeRule(
  template: string,
  params: Record<string, string | number>,
): string {
  const spec = TEMPLATES[template];
  if (!spec) return "";
  try {
    return spec.summarize(params);
  } catch {
    return "";
  }
}

/// Schedule-driven templates are poked on a timer, not by incoming payments.
export function isScheduled(template: string): boolean {
  return TEMPLATES[template]?.scheduled === true;
}

export function getTemplate(name: string): TemplateSpec {
  const spec = TEMPLATES[name];
  if (!spec) {
    throw new Error(
      `unknown template "${name}". Available:\n` +
        Object.values(TEMPLATES).map((t) => "  " + t.usage).join("\n"),
    );
  }
  return spec;
}
