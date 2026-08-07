# Phase 01 report: SplitRule + watcher

Date: 2026-08-06, finished ~17:20 GMT+7. Budgeted for 7 Aug, done a day early.
Phase: [phase-01-split-and-watcher.md](../260806-1542-mandate-final-build/phase-01-split-and-watcher.md)

## Status: COMPLETE. This alone is a submittable MVP.

## What runs

`SplitRule` deployed and source-verified on Arcscan: [`0x56c0e4aa9610dfced62438bfa5db5cfd20c3cfab`](https://testnet.arcscan.app/address/0x56c0e4aa9610dfced62438bfa5db5cfd20c3cfab), 10% to savings, verified in 7s via the Blockscout API. No Foundry involved.

Keeper watches the system emitter and pokes `execute()` when funds land. Both payment interfaces confirmed caught by a SINGLE filter:

| Interface | Payment | Routed | Execution tx |
|---|---|---|---|
| native (18d, msg.value) | 1.2 USDC | 0.12 | [`0xd776e7e1`](https://testnet.arcscan.app/tx/0xd776e7e1d941b79fbfbec09e65fabf24c487b31689daa7aecd58f71b19cb1e3d) |
| ERC-20 precompile (6d) | 0.6 USDC | 0.06 | [`0x00a89ff0`](https://testnet.arcscan.app/tx/0x00a89ff01d59e6ea876c408e8aef8e1b84b27d100178574be361bbc57cdc51c4) |

**That table is the Arc-only technical hook, now proven rather than asserted.** On a normal EVM chain a native transfer is invisible to a log filter; here one emitter filter catches both interfaces.

Manual execution without any keeper also verified: 2 USDC in, 0.2 out, arithmetic checked exactly. This is the evidence behind "the rule survives our backend dying".

## Accounting design

`processedBalance` tracks what has already been split. `pendingAmount()` is the balance above it. This batches multiple deposits into one split, identical to splitting each separately except for rounding, which always favours the treasury. `withdraw()` can only touch already-split funds, so the treasurer cannot pull deposits out ahead of the rule.

## Bug found and fixed

Custom Solidity errors (`NothingToSplit`) do not appear in viem's `shortMessage`, so the original string matching classified a benign no-op as `ERROR`. Replaced with proper error-chain walking via `ContractFunctionRevertedError`. Surfaced by accident when a `kill` failed to take and two keepers raced the same payment.

**That accident proved a safety property worth demoing:** two independent keepers cannot double-split. The loser's transaction reverts with `NothingToSplit`. Permissionless `execute()` is safe against concurrent callers, including hostile ones.

## Fallback is real code, not a claim

The HTTP polling watcher was exercised end to end and correctly detected a payment. Selected with `--poll`. WSS remains the default.

## Files

- `contracts/SplitRule.sol`
- `src/chain/` arc-constants, arc-clients, usdc-precompile
- `src/rules/` rule-store, rule-executor
- `src/watcher/` incoming-payment-watcher, run-watcher
- `scripts/` compile-contracts, deploy-rule, verify-on-blockscout, send-test-payment, execute-rule-manually

All files under 200 lines. `tsc --noEmit` clean.

## Economics

Deploy 519,490 gas (~0.010 USDC). Each execute is far cheaper. ~12.6 USDC still in the demo wallet after all testing. Faucet volume is a non-issue.

## Unresolved questions

1. LLM API key still absent. Phase 02 is fully blocked on it, and it is the differentiator.
2. `withdraw()` is untested. Low risk, worth one call before the demo.
3. Rounding dust: deposits below 10 units of 6-decimal USDC round to zero and stay pending. Correct behaviour, but worth one demo sentence if a judge probes.
4. Should `plans/` and `data/deployed-rules.json` be published in the public repo? Still unanswered from the spike report.
