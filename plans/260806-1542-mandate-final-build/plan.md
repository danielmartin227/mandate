---
status: build complete
created: 2026-08-06
updated: 2026-08-07
owner: Daniel 227
---

# Mandate: Final Build Plan (4 days)

Collapsed plan. Gates 1-3 of `idea-to-phaseplan` folded in as constraints, not documents.
Rationale: 28 build hours left; separate constitution/spec/clarify artifacts ship nothing.

## Hard facts

- Now: 2026-08-06 15:42 GMT+7
- Final deadline: 2026-08-10 18:59 GMT+7 (AoE 2026-08-10 11:59 UTC)
- Internal submit target: Sunday 2026-08-09 evening
- Project creation on portal closes: 2026-08-09 06:00 GMT+7 (BEFORE final deadline)
- Code written so far: none

## Approved decisions (2026-08-06)

1. Rule contract IS the treasury. Each rule owns its address and holds its USDC. Needs `receive()`.
2. One interface per contract: ERC-20 precompile `0x3600...0000` (6d) only. Emitter logs (18d) are detection only, never arithmetic.
3. No Foundry. solc-js + viem. 15-min `foundryup` escape hatch, then permanent fallback.
4. One Next.js app, JSON file persistence. No auth, no DB, no wallet-connect, no mobile.
5. BridgeRule calls `TokenMessengerV2.depositForBurn` directly. Backend death does not stop the rule.
6. Accept thin App Kit story (Send in deposit flow only). Do not route treasury funds through a backend wallet to manufacture usage.

## Constitution constraints (carried from Gate 1, enforced every commit)

- Delta that must never be diluted: "AI touches money zero times after compile"
- No "Arc" in the product name
- No em-dash / en-dash (pre-commit hook + manual grep)
- No AI attribution in commits or PRs
- Identity: Daniel 227 / danielmartin4374227@gmail.com / gh danielmartin227
- `CLAUDE.md`, `.claude/`, `context/session-status-*`, `.env` stay out of the public repo
- Never say "audited templates". Say "fixed, verified templates"
- Deck and voice must stay distinct from Parley and GrantGuard

## Phases

| Phase | Window | Status | File |
|---|---|---|---|
| 00 Spike | 6 Aug, 3h box | COMPLETE 6 Aug, 5/5 passed | [phase-00-spike.md](phase-00-spike.md) |
| 01 Split + watcher | 7 Aug | COMPLETE 6 Aug, a day early | [phase-01-split-and-watcher.md](phase-01-split-and-watcher.md) |
| 02 Interpreter + UI + Sweep | 8 Aug | COMPLETE 7 Aug, a day early | [phase-02-interpreter-and-ui.md](phase-02-interpreter-and-ui.md) |
| 03 Bridge + submission | 9 Aug | Bridge COMPLETE 6 Aug. Submission is owner work | [phase-03-bridge-and-submission.md](phase-03-bridge-and-submission.md) |

**All build work in this plan is done.** What remains is the UI visual design (owner is inserting it), the video, the deck, and the portal submission.

Each phase ends in a shippable state. Phase 01 alone is a submittable MVP.

## Non-negotiable gates

- ~~**22:00 tonight:** CCTP cut decision.~~ **RESOLVED 2026-08-06 16:15: BRIDGE IS IN.**
  All 5 spike tests passed. maxFee 0 accepted (no minimum), attestation in 11s.
  See [spike report](../reports/spike-260806-1542-arc-cctp-emitter.md).
- **14:00 Sunday 9 Aug:** hard feature freeze. Everything after is video, deck, submission.
- Cut order: Bridge first, then UI polish. Never cut: Split, watcher, refusal scenario.

## Owner tasks

1. ~~Obtain LLM API key.~~ DONE, in `.env`.
2. Verify project exists on Encode portal. Creation closes Sun 06:00 GMT+7. **STILL OPEN, hardest deadline.**
3. Faucet: faucet.circle.com, 20 USDC per 2h per address. Deployer is down to ~0.8 USDC; top up before recording.
4. Base Sepolia ETH from a public faucet (needed for destination mint). **STILL OPEN.**
5. Insert the UI visual design. The backend contract is stable: `POST /api/compile`, `POST /api/deploy`, `GET /api/rules`, `GET /api/executions`.
6. Nothing is committed yet. The whole build is local and untracked.

## Dependencies

- Phase 01 blocked by S1-S4. Phase 02 blocked by owner task 1. Phase 03 blocked by S5.
