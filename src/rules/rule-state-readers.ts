// Template-specific ruleState() readers. Each template returns a different tuple,
// so these must stay separate: decoding one with the other's shape yields silent
// nonsense rather than an error.
import { publicClient } from "../chain/arc-clients.js";
import { formatUsdc } from "../chain/usdc-precompile.js";
import type { DeployedRule } from "./rule-store.js";

export type SplitState = {
  savings: `0x${string}`;
  savingsBps: number;
  balance: bigint;
  pending: bigint;
  processed: bigint;
};

export type BridgeState = {
  destinationDomain: number;
  mintRecipient: `0x${string}`;
  floor: bigint;
  balance: bigint;
  surplus: bigint;
  /// Unix seconds. Zero means the rule has never executed, so a bridge is allowed now.
  nextAllowedAt: bigint;
  /// Both the floor and the schedule permit a bridge right now.
  ready: boolean;
};

export type SweepState = {
  destination: `0x${string}`;
  floor: bigint;
  balance: bigint;
  surplus: bigint;
  totalSwept: bigint;
};

export async function readSplitState(rule: DeployedRule): Promise<SplitState> {
  const r = (await publicClient().readContract({
    address: rule.address,
    abi: rule.abi as any,
    functionName: "ruleState",
  })) as [`0x${string}`, number, bigint, bigint, bigint];
  return { savings: r[0], savingsBps: r[1], balance: r[2], pending: r[3], processed: r[4] };
}

export async function readSweepState(rule: DeployedRule): Promise<SweepState> {
  const r = (await publicClient().readContract({
    address: rule.address,
    abi: rule.abi as any,
    functionName: "ruleState",
  })) as [`0x${string}`, bigint, bigint, bigint, bigint];
  return { destination: r[0], floor: r[1], balance: r[2], surplus: r[3], totalSwept: r[4] };
}

export async function readBridgeState(rule: DeployedRule): Promise<BridgeState> {
  const r = (await publicClient().readContract({
    address: rule.address,
    abi: rule.abi as any,
    functionName: "ruleState",
  })) as [number, `0x${string}`, bigint, bigint, bigint, bigint, boolean];
  return {
    destinationDomain: r[0], mintRecipient: r[1], floor: r[2],
    balance: r[3], surplus: r[4], nextAllowedAt: r[5], ready: r[6],
  };
}

/// Human-readable lines of a rule's current onchain state, whatever its template.
/// Used by the manual execute script and available to any status view; keeps the
/// per-template tuple decoding in this module rather than spread across callers.
export async function describeRuleState(rule: DeployedRule): Promise<string[]> {
  switch (rule.template) {
    case "SplitRule": {
      const s = await readSplitState(rule);
      return [
        `savings  ${s.savings} (${s.savingsBps / 100}%)`,
        `balance  ${formatUsdc(s.balance)} USDC`,
        `pending  ${formatUsdc(s.pending)} USDC`,
        `processed ${formatUsdc(s.processed)} USDC`,
      ];
    }
    case "SweepRule": {
      const s = await readSweepState(rule);
      return [
        `destination ${s.destination}`,
        `floor    ${formatUsdc(s.floor)} USDC`,
        `balance  ${formatUsdc(s.balance)} USDC`,
        `surplus  ${formatUsdc(s.surplus)} USDC`,
        `swept    ${formatUsdc(s.totalSwept)} USDC total`,
      ];
    }
    case "BridgeRule": {
      const s = await readBridgeState(rule);
      return [
        `recipient ${s.mintRecipient} on domain ${s.destinationDomain}`,
        `floor    ${formatUsdc(s.floor)} USDC`,
        `balance  ${formatUsdc(s.balance)} USDC`,
        `surplus  ${formatUsdc(s.surplus)} USDC`,
        s.nextAllowedAt === 0n
          ? "schedule never bridged, allowed now"
          : `schedule next allowed at ${new Date(Number(s.nextAllowedAt) * 1000).toISOString()}`,
        `ready    ${s.ready}`,
      ];
    }
    default:
      return [`no state reader for template ${rule.template}`];
  }
}
