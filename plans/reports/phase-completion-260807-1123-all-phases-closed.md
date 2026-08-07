# All plan phases closed

**Date:** 2026-08-07
**Plan:** `plans/260806-1542-mandate-final-build/`
**Verdict:** every build item in phases 00-03 is done. Remaining items are owner work (video, deck, portal) and one time gate (Sunday 14:00 freeze).

## Status per phase

| Phase | Status | Evidence |
|---|---|---|
| 00 Spike | COMPLETE 6 Aug | 5/5 tests, spike report |
| 01 Split + watcher | COMPLETE 6 Aug | `0x56c0e4aa...c3cfab` verified |
| 02 Interpreter + UI + Sweep | COMPLETE 7 Aug | `0xa10269b7...abd751` verified, battery 13/13 |
| 03 Bridge + submission | Bridge COMPLETE 6 Aug, submission is owner work | `0x11016575...f9aec3` verified, `TooSoon` refusal proven |

All three templates live and source-verified on Arcscan. Build ran two days ahead of plan.

## Work done this session to close the phases

**Phase 02 gaps closed**
- SweepRule wired end to end: interpreter schema, prompt, validation, executor, state reader, keeper, deploy path. Deployed, verified, swept 1.5 USDC above a 1 USDC floor.
- Interpreter battery extended to 13 cases with template-identity assertions, so a sweep compiled as a bridge now fails rather than passing as "compiled". 13/13.
- Scheduled ticker added for BridgeRule inside the keeper.
- Execution feed made real: the keeper writes `data/executions.json`, which the UI polls. Before this it only ever showed deployments.
- AI-free claim re-greppped after the changes: one file imports the SDK, nothing in the runtime path does.

**Phase 03 gaps closed**
- README truth pass. Removed two overclaims: Circle App Kits (listed in the stack, never built, not even a dependency) and Foundry (dropped for solc-js). Corrected the Sweep trigger row. Added live addresses and run instructions. Removed the App Kits claim from the UI footer too.

**Defects found and fixed while verifying**
- Keeper poller swallowed every error and, on failure, re-read only the last 5 blocks forever. At Arc's ~5 blocks/sec that is a permanent blind spot; it silently missed a real payment during testing. Now scans a committed block cursor in chunks and surfaces errors. Re-tested live.
- Two superseded BridgeRules were still active in the store with an incompatible `ruleState()` shape, decoding to nonsense, and the new ticker was about to poke them. Added a `retired` flag.
- `next` and `react` were in package.json but never installed, so the UI had never run. Installing them reverted `@anthropic-ai/sdk` to 0.52.0, which has no `output_config` and silently breaks structured outputs. Pinned 0.115.0.
- Next build needed a `.js` to `.ts` resolution alias for the shared `src/` modules; `app/` was outside typechecking.
- Model prose now dash-normalized in code. A refusal came back with an em-dash, which no pre-commit hook catches at runtime.
- Stored execution outcomes no longer embed explorer URLs, which the feed was rendering next to its own link.

## Deliberate divergences from the plan spec

1. **Sweep has no schedule.** Spec said "on schedule"; as built it is threshold-driven. This gives three distinct triggers (payment, threshold, schedule) instead of two schedule-driven templates. The interpreter refuses a scheduled same-chain sweep and says why. README and phase file updated to match.
2. **No node-cron runner.** Scheduled execution is a ticker inside the keeper, so one process instead of two. The tick simulates first, so an early tick costs no gas and the contract still enforces the schedule.
3. `data/rules.json` is `data/deployed-rules.json`.

## Verified green

`tsc --noEmit` clean including `app/`, `next build` clean, all four API routes exercised over HTTP against the live chain, no em-dash or en-dash anywhere in source or plans.

## Open, owner only

- Portal project creation, closes 2026-08-09 06:00 GMT+7. Hardest deadline, before the submission deadline.
- Base Sepolia ETH for the CCTP destination mint. Burn and attestation proven; `data/pending-mint.json` replays it.
- UI visual design.
- Video, deck, portal submission.
- Deployer down to ~0.8 USDC. Faucet is 20 USDC per 2h.

## Unresolved questions

1. **Nothing is committed.** Two commits in history, both 27 Jul; the entire build is untracked local work. Biggest risk to the submission. Should I commit now, and does `.gitignore` need a review pass first?
2. `data/` and `artifacts/` are gitignored, so `deployed-rules.json` would not ship. Judges may want the deployed addresses as evidence. Commit that file as an exception?
3. `app/page.tsx` is 340 lines, over the 200-line guideline. Left alone because the visual design is being replaced. Split it during the redesign?
4. RESOLVED, but carries an action. `presentation/cp2-deck.md` does still claim App Kits (slide 51) and Foundry (slides 53, 59). Left as-is: that deck was submitted 27 Jul and those lines were accurate as a forward plan at the time. **The final deck must not repeat either claim.** App Kits were never built and Foundry was dropped for solc-js on 6 Aug.
