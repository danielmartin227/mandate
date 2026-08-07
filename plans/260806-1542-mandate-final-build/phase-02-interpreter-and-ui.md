# Phase 02: Interpreter + UI + SweepRule

**Priority:** the differentiator. Refusal scenario never cut. **Status:** COMPLETE 2026-08-07 (interpreter 2026-08-06, Sweep and wiring 2026-08-07). **Window:** 2026-08-08, finished a day early.
**Live Sweep rule:** `0xa10269b7df3fa969381f9bfd251634a8a3abd751` (verified on Arcscan)
**Live rule compiled from a sentence:** `0x005861b9bc42957178aa2e2e47adf63eb5dcb915`

## Context

- [plan.md](plan.md), [phase-01-split-and-watcher.md](phase-01-split-and-watcher.md)
- Owner task cleared: LLM API key in `.env`

## Divergences from this spec (deliberate)

1. **Sweep has no schedule.** The spec said "move surplus above a floor, on schedule". As built, Sweep is threshold-driven: it acts as soon as a surplus exists. This gives the three templates three genuinely distinct triggers (payment, threshold, schedule) instead of two schedule-driven ones, and it is what the interpreter, the README, and the refusal cases now describe. A sentence asking for a scheduled same-chain sweep is refused, with that reason given.
2. **Scheduled execution lives in the keeper, not a separate node-cron runner.** `src/watcher/scheduled-rule-ticker.ts` ticks schedule-driven templates inside `run-watcher`, so there is one keeper process rather than two. node-cron was not needed; the tick simulates first, so an early tick costs no gas and the contract still enforces the schedule.
3. `data/rules.json` is `data/deployed-rules.json`, alongside `data/executions.json` for the feed.

## Purpose

Make "AI compiles once, then leaves" visible on screen. This is what separates Mandate from ArcFlux and from arc-fintech.

## Requirements

- One constrained LLM call: sentence -> `{template, params}` or explicit refusal
- Ambiguous input refused, never guessed
- Compiled rule rendered back as plain English + raw params
- Nothing deploys without a human click
- After deploy, no LLM call exists anywhere in the runtime path
- SweepRule: move surplus above a floor, on schedule

## Architecture

```
sentence -> POST /api/compile -> schema-bound LLM call
                                  |
                     {template, params} | {refusal, reason}
                                  |
                     preview card + confirm button   <- AI's last contact
                                  |
                     POST /api/deploy -> viem deploy + verify
                                  |
              ================ AI-free zone ================
              watcher (Split) + node-cron (Sweep) -> execute()
```

## Files to create

- `app/page.tsx` (sentence input, preview card, rule list, live feed)
- `app/api/compile/route.ts`
- `app/api/deploy/route.ts`
- `src/interpreter/compile-sentence-to-rule.ts` (schema + prompt + refusal)
- `src/interpreter/rule-schema.ts`
- `contracts/SweepRule.sol`
- `src/keeper/scheduled-sweep-runner.ts`
- `data/rules.json`

## Steps

1. Rule schema first (types are the contract between LLM and chain).
2. Compile endpoint with strict JSON output + refusal path. Test the refusal before the happy path.
3. Preview + confirm UI. Deploy only from the confirm action.
4. SweepRule contract, reusing Phase 01 shape and compile/deploy scripts.
5. node-cron runner for schedules. Demo interval must be short enough to show live.
6. Live feed listing executions with Arcscan links.

## Todo

- [x] rule schema
- [x] compile endpoint + refusal path
- [x] preview + confirm UI (functional; owner is inserting the visual design)
- [x] deploy endpoint
- [x] SweepRule.sol + deploy + verify
- [x] cron runner (as a ticker inside the keeper, see divergence 2)
- [x] live execution feed
- [x] grep the runtime path to prove zero LLM calls after deploy

## Success criteria

Three scripted demo sentences: one compiles to Split, one to Sweep, one is refused with a readable reason. A reviewer can see, in the repo, that no model is called after deploy.

**MET 2026-08-07.** `scripts/test-interpreter.ts` runs 13 cases, 13/13 as expected: 7 refusals and 6 compiles across all three templates, with template-identity assertions so a sweep compiled as a bridge fails the test rather than passing as "compiled".

The AI-free claim is greppable and was re-checked after the Sweep work: exactly one file imports the model SDK (`src/interpreter/compile-sentence-to-rule.ts`), and the only things that import the interpreter are the compile endpoint and two scripts. Nothing in the keeper, the executor, or the contracts touches a model.

## Risks

- LLM key missing: blocks the whole phase, owner task tonight
- Over-building UI: budget is one day for interpreter + UI + Sweep together. No design system, no polish pass.
- Prompt overfit to demo sentences: keep at least one unrehearsed sentence in testing

## Security

- API key server-side only, never in client bundle
- Compiled params validated against schema before they reach a deploy call, not just trusted from the model
- Deploy endpoint must not accept arbitrary bytecode from the client

## Next

Phase 03 adds Bridge if the S5 spike passed.
