# Phase 01: SplitRule + watcher

**Priority:** highest, never cut. **Status:** COMPLETE 2026-08-06, a day early.
**Results:** [phase 01 report](../reports/phase-01-260806-split-and-watcher.md)
**Live rule:** `0x56c0e4aa9610dfced62438bfa5db5cfd20c3cfab` (verified on Arcscan)

## Context

- [plan.md](plan.md), [phase-00-spike.md](phase-00-spike.md), `context/latest.md`

## Purpose

End of this day = a submittable MVP on its own. Send USDC to a mandate, watch the split land, click through to Arcscan.

## Requirements

Functional:
- `SplitRule` holds USDC, routes N basis points of each incoming payment to a savings address, remainder stays
- Permissionless `execute()`, callable by anyone
- Parameters onchain and readable
- Watcher detects incoming payments via system emitter and calls `execute()` within seconds
- Contract verified on Arcscan

Non-functional:
- No AI anywhere in this path. That is the point.
- Backend can be killed and `execute()` still callable by hand

## Architecture

```
payer -> (native or ERC-20 USDC) -> SplitRule address
             emitter log to=ruleAddr (18d, detection only)
                          |
                    watcher (viem)
                          |
                    execute()  -> transfer bps/10000 to savings (precompile, 6d)
```

## Files to create

- `contracts/SplitRule.sol`
- `scripts/compile-contracts.ts` (solc-js)
- `scripts/deploy-rule.ts` (viem)
- `scripts/verify-on-blockscout.ts`
- `src/watcher/incoming-payment-watcher.ts`
- `src/chain/arc-clients.ts`, `src/chain/usdc-precompile.ts`

## Steps

1. Write `SplitRule.sol`: immutable savings address + bps, `receive()`, permissionless `execute()`, `Executed` event.
2. Compile with solc-js, deploy to Arc, verify on Arcscan.
3. Manual `execute()` once by hand to prove the contract works before automation exists.
4. Build the watcher on the emitter filter proven in S4 (subscribe or poll, whichever passed).
5. End to end: fund the rule, watcher fires, split lands, capture tx hashes.

## Todo

- [x] SplitRule.sol
- [x] compile pipeline
- [x] deploy + Arcscan verification
- [x] manual execute() proof
- [x] watcher
- [x] end-to-end run with recorded tx hashes

## Success criteria

Recorded Arcscan links for: deployment, an incoming payment, the automatic split. Contract source verified. Backend killed, `execute()` still works from `cast`/viem by hand.

## Risks

- Decimals mixing: enforced by Decision 2, precompile only in arithmetic
- Reentrancy: no external calls beyond USDC precompile transfers; keep `execute()` trivial and ordered
- Rounding on bps: floor, remainder stays with the treasury, document it

## Security

- No owner keys in the contract beyond what a demo needs. Prefer fully immutable params.
- Never let the watcher hold more authority than "call a public function".

## Next

Phase 02 adds the interpreter on top. Sweep reuses this contract shape.
