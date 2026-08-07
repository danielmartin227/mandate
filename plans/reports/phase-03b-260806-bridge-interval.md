# Phase 03b report: onchain schedule enforcement

Date: 2026-08-06, ~20:15 GMT+7.
Supersedes the open question in [phase-03 report](phase-03-260806-bridge-rule.md).

## Status: DONE. "Monthly" is now a property of the contract, not a promise from the keeper.

## Live contract

`BridgeRule` with interval: [`0x11016575c46b62a656c6e5dd261430ad97f9aec3`](https://testnet.arcscan.app/address/0x11016575c46b62a656c6e5dd261430ad97f9aec3)
Floor 1 USDC, destination domain 6, minInterval 120s. Verified on Arcscan in 7s.

## Changes

- `minInterval` (immutable) and `lastExecutedAt` added; `execute()` reverts `TooSoon(nextAllowedAt)` inside the window
- `nextAllowedAt()` and `isReady()` views; `ruleState()` extended to 7 fields
- `destinationDomain == 26` now rejected in the constructor. Previously refused only by our deploy tooling, so a hand-deployed rule could have burned to Arc's own domain with nowhere to mint
- `lastExecutedAt = 0` means never executed, so the first bridge is allowed immediately

## The test that previously did not work

Earlier the interval check was masked: after a bridge the balance sits exactly at the floor, so `NothingToBridge` fired first and `TooSoon` was never reached. Isolating it requires surplus present AND being inside the window.

| Step | State | Result |
|---|---|---|
| 1. fund 1.4, execute | surplus 0.4, never executed | bridged 0.4, [`0x00987baf`](https://testnet.arcscan.app/tx/0x00987bafd56af248666e75a3e9774a76f4d5c119bf298a1d499f8f6fe7d52eeb), attested 6s |
| 2. fund 0.5, execute inside window | **surplus 0.5 available, ready=false** | **refused: TooSoon** |
| 3. wait 125s, execute | surplus 0.5, ready=true | bridged 0.5, [`0x6706f936`](https://testnet.arcscan.app/tx/0x6706f9367ecddade510f9718a73eef4066528e8cd50d230000a16b60a69af779), attested 6s |

Step 2 is the one that matters: real money sitting there, eligible by every measure except the schedule, and the contract refuses. Step 3 proves the refusal is temporary rather than a stuck rule.

## Why this was worth doing

Before: a keeper poking in a loop would bridge on every deposit. "Bridge surplus monthly" was a backend behaviour, and a judge asking "what stops this firing constantly" had no good answer.

Now both conditions live in the contract. A hostile keeper achieves nothing but wasted gas. This is a demo scenario: poke it early on camera, let it refuse, then let the window open.

## Costs

Deploy 643,730 gas (~0.013 USDC), up from 521,086 for the interval-free version. ~7.8 USDC left in the demo wallet.

## Superseded, do not demo

- `0x650cc26b...` first BridgeRule, source drifted
- `0x83a9e5a6...` no interval

## Unresolved questions

1. LLM API key: still absent. Phase 02 still fully blocked. Still the differentiator.
2. Destination mint still pending Base Sepolia ETH. Burn side fully proven three times over; `data/pending-mint.json` replays via `scripts/complete-pending-mint.ts`.
3. `withdraw()` untested on both templates.
4. Sweep template not started.
5. Payment watcher will still poke a BridgeRule on deposit. Harmless now (the contract refuses), but the scheduled runner is the honest driver for it.
6. `plans/` and `data/` publication decision still open.
