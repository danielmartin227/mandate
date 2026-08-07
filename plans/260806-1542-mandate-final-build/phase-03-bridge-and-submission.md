# Phase 03: BridgeRule + submission

**Priority:** Bridge is cuttable, submission is not. **Status:** BRIDGE HALF COMPLETE 2026-08-06 (pulled forward from 9 Aug). Submission half is owner work, not started. **Window:** 2026-08-09.
**Live Bridge rule:** `0x11016575c46b62a656c6e5dd261430ad97f9aec3` (verified on Arcscan, onchain `minInterval`)

## Context

- [plan.md](plan.md), [phase-00-spike.md](phase-00-spike.md)
- S5 passed, so Bridge was never cut.

## Two halves, split at 14:00

**Before 14:00:** BridgeRule.
**14:00 = HARD FREEZE.** No feature work after it, whatever the state.
**After 14:00:** video, deck, submission. Submit Sunday evening. Monday is buffer only.

## Requirements

Bridge:
- `BridgeRule.execute()` calls `TokenMessengerV2.depositForBurn` directly, no backend in the money path
- Destination domain 6 (Base Sepolia), amount = surplus above floor
- Attestation fetched and `receiveMessage` completed on Base Sepolia (script side, this half is offchain by CCTP design)

Submission:
- 3-minute video stating DeFi track + which core products were used
- Deck updated from `presentation/cp2-deck.md` to final
- Repo public, README accurate to what actually shipped
- Portal submission with repo + deck + video links

## Files

- `contracts/BridgeRule.sol`
- `src/bridge/fetch-attestation-and-mint.ts`
- `presentation/final-deck.md` + `.pdf`
- README update

## Steps

1. BridgeRule using exact params proven in S5, especially the max-fee minimum.
2. Deploy, verify, execute once with real funds, capture both chains' tx hashes.
3. Attestation + mint script, run end to end.
4. **14:00 freeze.** Update README to describe only what shipped.
5. Record video: problem, sentence in, compile + refusal, confirm, live execution, Arcscan proof, the AI-free claim.
6. Update deck. Submit. Verify the submission actually registered.

## Todo

- [x] BridgeRule.sol
- [x] deploy + verify + live execution (burn initiated by the contract; `TooSoon` refusal proven with real surplus present, then bridged after the window)
- [x] attestation + mint script (`src/bridge/fetch-attestation-and-mint.ts`, `scripts/complete-pending-mint.ts`; attestation proven in 11s, destination mint replays from `data/pending-mint.json`)
- [x] README truth pass (2026-08-07: removed the Circle App Kits claim, which was never built; removed Foundry, which was dropped for solc-js; corrected the Sweep trigger; added live addresses and run instructions)
- [ ] 14:00 Sunday freeze (not yet reached)
- [ ] video recorded (OWNER)
- [ ] deck finalized (OWNER)
- [ ] submitted and confirmed on portal (OWNER, project creation closes 2026-08-09 06:00 GMT+7)

## Blocked on owner, not on code

- **Base Sepolia ETH** at the destination address. The burn and the attestation are proven; only the final `receiveMessage` needs gas on the destination chain. This is offchain by CCTP's design, so it does not weaken the onchain claim.
- **Portal project creation**, which closes before the final deadline.

## Success criteria

Submitted before Sunday midnight with a working demo, honest README, and a video that states the track and the core products.

Build half met 2026-08-07: all three templates live and verified, README honest to what shipped. Submission half is owner work.

## Risks

- Bridge overruns into submission time: the 14:00 freeze exists precisely for this, do not negotiate with it
- Video takes longer than expected: script it before recording, one take per segment
- README overclaiming: never say "audited"; say "fixed, verified templates". Say split lands "within seconds", not atomically.

## Security

- Final sensitive-file sweep before the last push: `.env`, keys, `CLAUDE.md`, `.claude/`, `context/session-status-*`
- Em-dash / en-dash grep on everything including the deck

## Next

Monday 10 Aug: buffer only. No new features. Fix only what is broken in the submission itself.
