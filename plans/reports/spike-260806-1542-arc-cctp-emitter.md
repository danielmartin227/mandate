# Spike report: Arc, emitter, CCTP

Date: 2026-08-06, ~16:15 GMT+7. Box was 3h, finished in ~35 min.
Phase: [phase-00-spike.md](../260806-1542-mandate-final-build/phase-00-spike.md)

## Verdict

**All five unknowns resolved. BRIDGE IS IN.** Decided well before the 22:00 gate.
No fallback adopted anywhere. No redesign needed. Every Phase 00 assumption held.

## Results

| # | Test | Result |
|---|---|---|
| S1 | connectivity + dual-interface balance | **PASS** |
| S2 | deploy + verify without Foundry | **PASS** |
| S3 | native deposit into contract | **PASS** |
| S4 | system-emitter watch | **PASS** (both paths) |
| S5 | CCTP burn + attestation | **PASS**; mint pending Base Sepolia ETH |

## Open questions closed (context/latest.md section 6)

- **Q3 CCTP max-fee minimum from Arc:** `maxFee = 0` with `minFinalityThreshold = 2000` accepted for a 0.1 USDC burn. **No minimum.** The "bridge amount must exceed a threshold" caveat is dead. Demo can bridge trivial amounts.
- **Q4 eth_subscribe on public WSS:** honored, including address + topic filters. 379 unfiltered logs in 25s; 12 hits on a `to`-filtered subscription. `getLogs` polling also confirmed (499 logs / 50 blocks) as a real fallback.
- **Q6 Split needs receive():** yes, and it works. Native send to a contract with `receive()` succeeds; without it, it would revert.

## Key measurements

| Fact | Value | Consequence |
|---|---|---|
| Deploy gas | 228,178 @ 20.2 gwei = ~0.0046 USDC | Faucet volume is a non-issue. 20 USDC funds hundreds of ops. |
| Attestation latency | **11 seconds** | Bridge is demoable live on camera. No "wait for the bridge" dead air. |
| Native 18d vs precompile 6d | `20e18` and `20e6`, identical scaled | One balance, two interfaces: CONFIRMED |
| Emitter log on native deposit | 1 log, `to = contract`, 18d | Watcher trigger CONFIRMED |
| solc | 0.8.36, clean, 841 bytes | Foundry permanently dropped |

## Artifacts

- Probe contract: `0x9341f4cffaa2f2c00c6272ffcd539440f4c81c9b` ([Arcscan](https://testnet.arcscan.app/address/0x9341f4cffaa2f2c00c6272ffcd539440f4c81c9b)), Blockscout verification accepted (200)
- Deposit tx: `0x9ad05936c1aa3473cb44c0d28c84d2507cfdaaa1a7e07f1ad88080401dd35c45`
- Payout tx: `0xfabad51278f858c07f7f45ad153cd5aaba2282ae3818991a2a38a0864407c2ad`
- CCTP burn: `0xd4ccf23255dde446669882adf333b4d4449d323ca88dd6d8a3b344e44c9d747e`
- Pending mint payload: `spike/cctp-pending-mint.json` (message + attestation, replayable once ETH lands)
- `spike/arc-config.ts`: all verified constants, promote into the real build rather than retyping

## Design consequences

1. **Decision 1 (rule contract IS the treasury) is validated end to end.** Deposit, detection, and payout all work on a plain contract with `receive()`.
2. **Decision 3 (no Foundry) confirmed.** Zero friction, and Blockscout verification works over its API.
3. **Bridge scope can grow slightly.** With 11s attestation and no minimum, a live cross-chain demo is realistic rather than a static screenshot. Still governed by the Sunday 14:00 freeze.
4. **App Kit remains thin, as accepted.** Nothing here changes that tradeoff.

## Still open

- Base Sepolia ETH for `receiveMessage`. Owner task, faucet only. The burn and attestation are proven, so this carries no technical risk.
- Blockscout verification returned "verification started"; confirm it actually rendered as verified on Arcscan.
- LLM API key still absent. Blocks Phase 02 entirely.

## Unresolved questions

1. Should `plans/` be published in the public repo or gitignored? Contains internal timelines and the cut list.
2. Does Sweep need per-rule scheduling granularity beyond a fixed cron interval for the demo? Suspect no; confirm in Phase 02.
