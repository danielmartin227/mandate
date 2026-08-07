# Phase 02 report: the interpreter (compile once, then leave)

Date: 2026-08-06, ~20:50 GMT+7. Unblocked when the owner supplied the API key.
Phase: [phase-02-interpreter-and-ui.md](../260806-1542-mandate-final-build/phase-02-interpreter-and-ui.md)

## Status: interpreter COMPLETE and proven end to end. UI and Sweep not started.

## The differentiator now runs

`sentence -> AI compile -> human preview -> confirm -> deploy -> keeper enforces, AI gone.`

Proven in one pass:

1. `"route 5% of every incoming payment to 0x99189B..."`
2. Compiled to SplitRule, savingsBps 500, with a plain-English readback
3. Preview only. Nothing deployed until `--confirm`
4. Deployed + Blockscout-verified: [`0x005861b9bc42957178aa2e2e47adf63eb5dcb915`](https://testnet.arcscan.app/address/0x005861b9bc42957178aa2e2e47adf63eb5dcb915)
5. Keeper split a 2 USDC payment, routed exactly 0.1 (5%): [`0x15a4b5e9`](https://testnet.arcscan.app/tx/0x15a4b5e93fc04848bd7786aa44791e6b0c649a5ab58f3fcfbae52b5f8d92548a)

Model: `claude-opus-5`, one call, structured outputs (`output_config.format`), effort `high`.

## The AI-free claim is now checkable, not just stated

Only three files touch the model, and all three are setup or test:

```
src/interpreter/compile-sentence-to-rule.ts
scripts/compile-and-deploy.ts
scripts/test-interpreter.ts
```

The entire runtime path (watcher, executor, state readers, store, CCTP, both contracts) greps clean for any model reference. A judge can verify the central claim in one command.

## Refusal battery: 9/9

Refuses: missing address; vague share and schedule; needs an external price signal; multiple recipients; meaningless input. Compiles: percentages in digits and in words; monthly and weekly bridges.

Refusals name the specific missing thing, e.g. *"You haven't given the savings address, so I can't compile this - please provide the full 0x destination for the 10% share."*

## The bug worth demoing

The first battery run scored 8/9. On the clean sentence `route 10% ... to 0x99189B...` the model set `decision: compile` and wrote the address into the readback prose, but returned **`savingsAddress: ""`**. Reproduced at roughly 1 in 3.

**This is the "what if the AI compiles wrong" scenario, occurring for real, and the validator caught it.** Structured outputs guarantee the shape; they guarantee nothing about the meaning. `validateCompiled()` re-checks every value and turned a malformed compile into a refusal, so nothing wrong could reach a deploy call. The system failed closed.

Fixed by sharpening the two address field descriptions (stating that mentioning an address in the readback does not populate the field) and raising effort from `medium` to `high`, since this call runs once per rule and its output goes onchain permanently. 5/5 then 9/9 after.

Worth saying out loud in the video: the defense is not that the model never errs, it is that a model error becomes a refusal instead of a wrong rule.

## Design notes

- **Validation is a real layer, not decoration.** Addresses checked with viem `isAddress`, bps range-checked, floor parsed as a positive number. Failures degrade to refusals with the reason shown.
- **Refusal is framed as the expected answer** for a large share of inputs, not an error path.
- **`deployRuleTemplate()` extracted** to `src/rules/` so the AI path and the plain human path join the same road onto chain. The no-AI CLI deploy still works unchanged.
- **`sourceSentence` recorded** on each deployed rule for provenance.
- Removed `process.exit()` from the success paths: it triggered a libuv teardown assertion on Windows that looked like a crash.

## Not done

- **UI.** Nothing beyond CLI. The full flow is demoable from a terminal today.
- **SweepRule.** Third template still missing; pitch says three.

## Costs

Wallet ~5.8 USDC. Deploy 519,490 gas (~0.010 USDC).

## Unresolved questions

1. Ship a UI, or record the demo on the CLI? The CLI shows the determinism story more legibly; a UI presents better and costs hours we have.
2. SweepRule: the pitch says three templates and two exist. Cut the claim, or build it?
3. Base Sepolia ETH still missing, so the CCTP destination mint is still unproven end to end.
4. `plans/` and `data/` publication decision still open.
5. Nothing is committed yet. The whole build is local.
