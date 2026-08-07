# Phase 03a report: BridgeRule (pulled forward from 9 Aug)

Date: 2026-08-06, ~17:55 GMT+7. Pulled forward while phase 02 stays blocked on the LLM key.
Phase: [phase-03-bridge-and-submission.md](../260806-1542-mandate-final-build/phase-03-bridge-and-submission.md)

## Status: bridge burn path COMPLETE. Destination mint blocked on Base Sepolia ETH only.

## What runs

`BridgeRule` deployed and source-verified: [`0x83a9e5a6c0f6cdfb6174d3c28ab63dc09abfe97c`](https://testnet.arcscan.app/address/0x83a9e5a6c0f6cdfb6174d3c28ab63dc09abfe97c), floor 1 USDC, destination domain 6.

**The contract calls `TokenMessengerV2.depositForBurn` itself.** No backend wallet in the money path. Live run: balance 1.4 USDC, floor 1 USDC, bridged 0.4 USDC, floor retained.

- Burn tx: [`0xd20d2ce8`](https://testnet.arcscan.app/tx/0xd20d2ce8d60b9c6029089ba02ec26b6940bca2d5994d0ca02584dbe7b81f750d)
- Attestation: returned in under 1s (earlier runs 6s and 11s)
- Mint: pending Base Sepolia ETH; message + attestation saved to `data/pending-mint.json`, replayable via `scripts/complete-pending-mint.ts`

Floor guard verified: poking a rule sitting exactly at its floor refuses with `NothingToBridge` and costs no gas (caught at simulation).

## Correction to an earlier claim

I previously reported a schedule-enforcement test as passing. It did not. After a bridge the balance sits exactly at the floor, so the floor check trips first and the interval branch was never reached. That test proved floor enforcement twice. **Schedule enforcement was never demonstrated**, and in the current contract there is no onchain interval to demonstrate.

## Two open design consequences

The deployed contract has no `minInterval`, so:

1. **"Monthly" is enforced by the keeper, not by the contract.** A keeper that pokes in a loop will bridge on every deposit above the floor. Nothing is lost or stolen (funds go to the fixed `mintRecipient`), but the cadence in the sentence is a backend promise rather than an onchain rule. If a judge asks "what stops the bridge firing constantly", the honest answer today is "nothing onchain". Adding `minInterval` + `lastExecutedAt` is roughly 6 lines and one redeploy.
2. **No `destinationDomain == 26` guard in the contract.** Bridging to Arc's own domain would burn with nowhere to mint. I refuse it at deploy time in `rule-templates.ts`, so it cannot happen through our tooling, but the contract itself would accept it.

Neither blocks the demo. Both are cheap. My recommendation is to add the interval before the video, because the schedule is part of the pitch ("bridge surplus monthly") and it is the one place where the current build cannot back a sentence the product claims.

## Refactors done along the way

- `src/rules/rule-templates.ts`: template registry. Adding a template no longer means editing the deploy script.
- `src/rules/rule-executor.ts`: now template-agnostic. Decodes the event the contract emitted rather than re-deriving amounts from a Split-shaped `ruleState`, which would have silently decoded garbage for Bridge.
- `src/rules/rule-state-readers.ts`: per-template `ruleState` decoders, kept separate on purpose.
- Both templates emit `RuleExecuted` with different arguments, so `describeOutcome` disambiguates on template, never on event name.

`tsc --noEmit` clean. All files under 200 lines.

## Superseded

`0x650cc26b2785acbd3c7b03ad91560db9e4448f81` was an earlier BridgeRule whose source no longer matches the repo. It works and is verified, but `data/deployed-rules.json` now points at the current one. Do not demo the old address.

## Wallet

~9.7 USDC left. Deploy 521,086 gas (~0.010 USDC). Volume still a non-issue.

## Unresolved questions

1. Add `minInterval` to BridgeRule before the video? (recommend yes)
2. LLM API key: still absent, phase 02 still fully blocked, still the differentiator.
3. `withdraw()` remains untested on both templates.
4. Should the payment watcher drive BridgeRule at all, or only the scheduled runner? Currently the watcher only tracks whatever is in the rule store, so a deposit to a BridgeRule triggers an immediate bridge.
5. `plans/` and `data/` publication decision still open.
