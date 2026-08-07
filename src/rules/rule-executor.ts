// Calling execute() on a deployed rule. Shared by the manual scripts, the payment
// watcher, and the scheduled runner, so every path takes the identical route:
// simulate first, then send, then decode what the contract actually did.
//
// Template-agnostic on purpose. It does not know what a split or a bridge is; it
// pokes a public function and reports the event the contract emitted. Adding a
// template requires no change here.
//
// execute() is permissionless, so nothing in this module holds privileged
// authority over any rule. That is what makes the keeper disposable.
import { BaseError, ContractFunctionRevertedError, decodeEventLog } from "viem";
import { publicClient, walletClient, keeperAccount } from "../chain/arc-clients.js";
import { explorerTx } from "../chain/arc-constants.js";
import { formatUsdc } from "../chain/usdc-precompile.js";
import type { DeployedRule } from "./rule-store.js";

export type ExecuteOutcome =
  | { kind: "executed"; hash: string; event?: string; args?: Record<string, unknown> }
  | { kind: "not-ready"; reason: string }
  | { kind: "error"; message: string };

/// Revert names that mean "the rule declined to act", not "something broke".
/// Every one of these is a normal outcome of poking a rule that is not due.
const BENIGN_REVERTS: Record<string, string> = {
  NothingToSplit: "nothing pending, no action",
  ShareRoundsToZero: "pending amount rounds to zero, waiting for more",
  NothingToSweep: "balance at or below the floor, nothing to sweep",
  NothingToBridge: "balance at or below the floor, nothing to bridge",
  TooSoon: "schedule not yet due, the contract is refusing an early bridge",
};

export async function executeRule(rule: DeployedRule): Promise<ExecuteOutcome> {
  const pub = publicClient();
  const wallet = walletClient();
  const account = keeperAccount();

  try {
    // Simulate first so a rule that is not due costs no gas and produces a clear
    // reason instead of an opaque revert.
    const { request } = await pub.simulateContract({
      address: rule.address,
      abi: rule.abi as any,
      functionName: "execute",
      account,
    });

    const hash = await wallet.writeContract(request);
    const receipt = await pub.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") {
      return { kind: "error", message: `execute reverted, tx ${hash}` };
    }

    // Report what the contract itself said happened, rather than re-deriving it.
    const decoded = decodeRuleEvent(rule, receipt.logs);
    return { kind: "executed", hash, ...decoded };
  } catch (e: any) {
    const errorName = decodeRevertName(e);
    if (errorName && BENIGN_REVERTS[errorName]) {
      return { kind: "not-ready", reason: BENIGN_REVERTS[errorName] };
    }
    return { kind: "error", message: errorName ?? e.shortMessage ?? e.message ?? String(e) };
  }
}

/// Decode the first event the rule emitted in its own execute() transaction.
function decodeRuleEvent(rule: DeployedRule, logs: readonly any[]) {
  for (const log of logs) {
    if (log.address.toLowerCase() !== rule.address.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({ abi: rule.abi as any, ...log });
      return { event: decoded.eventName as string, args: decoded.args as Record<string, unknown> };
    } catch {
      // not an event from this ABI, keep looking
    }
  }
  return {};
}

/// Pull the custom error name out of a viem contract revert, if there is one.
/// Custom Solidity errors do not appear in shortMessage, so string matching the
/// message is unreliable; walk the error chain for the decoded name instead.
function decodeRevertName(e: unknown): string | undefined {
  if (!(e instanceof BaseError)) return undefined;
  const revert = e.walk((err) => err instanceof ContractFunctionRevertedError);
  if (revert instanceof ContractFunctionRevertedError) {
    return revert.data?.errorName ?? revert.reason;
  }
  return undefined;
}

/// All three templates emit an event named RuleExecuted, with different arguments.
/// Disambiguate on the template, never on the event name alone.
export function describeOutcome(outcome: ExecuteOutcome, template?: string): string {
  switch (outcome.kind) {
    case "executed": {
      const a = outcome.args ?? {};
      if (outcome.event === "RuleExecuted" && template === "SplitRule") {
        return `split ${formatUsdc(a.incoming as bigint)} USDC, routed ${formatUsdc(a.routedToSavings as bigint)} to savings, ${explorerTx(outcome.hash)}`;
      }
      if (outcome.event === "RuleExecuted" && template === "SweepRule") {
        return `swept ${formatUsdc(a.swept as bigint)} USDC above the floor, ${explorerTx(outcome.hash)}`;
      }
      if (outcome.event === "RuleExecuted" && template === "BridgeRule") {
        return `bridging ${formatUsdc(a.bridged as bigint)} USDC to Base Sepolia, ${explorerTx(outcome.hash)}`;
      }
      return `executed, ${explorerTx(outcome.hash)}`;
    }
    case "not-ready":
      return outcome.reason;
    case "error":
      return `ERROR ${outcome.message}`;
  }
}
