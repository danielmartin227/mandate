# Arc Treasury Rules (HKT-02) - Research Truth
**Idea:** Plain-English treasury rules compiled by an AI interpreter into one of three fixed templates (Split, Sweep, Bridge); after setup the AI is out of the loop and execution is deterministic automation on Arc with USDC, CCTP, and App Kits.
**Access date for all citations:** 2026-07-27 (publication dates given where stated). Canonical Arc docs host is now **docs.arc.io** (docs.arc.network 301-redirects there).

## 1. TL;DR - VERDICT

**BUILDABLE AS SPECIFIED, with ~2 weeks (not 1) to the final deadline.** Every infrastructure claim verified first-party: CCTP V2 on Arc Testnet (domain 26) with Base Sepolia (domain 6) as destination; App Kits (Send, Bridge) are real first-party TypeScript SDKs running on Arc Testnet; incoming-transfer watching works via Arc's EIP-7708 system emitter, which logs EVERY native USDC movement.

**Single biggest risk: novelty, not tech.** Circle ships a first-party Arc treasury dashboard (`circlefin/arc-fintech`, verified to have no rule engine, no NL, no scheduling) and a prior Arc hackathon produced ArcFlux (now VERIFIED, see section 4: conversational payments with GPT-4 parsing every command and a Guardian Agent in the execution loop; no contracts, no cross-chain). The delta to own: AI touches money zero times; it compiles one sentence into parameters for one of three verified templates, then the system is provably AI-free. Plus the Arc-only technical hook: one EIP-7708 log filter catches native AND ERC-20 incoming payments.

**Urgent when found (2026-07-27): Checkpoint 2 (required) closed 18:59 GMT+7 same day; owner submitted a placeholder on the portal.**

## 2. Platform basics (verified values)

| Property | Value | Source |
|---|---|---|
| Chain ID (Arc Testnet) | 5042002 | Circle `use-arc` skill (HKT-01 research, 2026-07-26) |
| RPC / WSS | https://rpc.testnet.arc.network / wss://rpc.testnet.arc.network (plus Blockdaemon, dRPC, QuickNode alternates) | docs.arc.io/arc/references/connect-to-arc.md |
| Explorer | https://testnet.arcscan.app (Blockscout; contract verification available) | docs.arc.io/arc/tutorials/deploy-on-arc.md |
| Faucet | https://faucet.circle.com, ~1 USDC/day; also EURC | HKT-01 research 2026-07-26 |
| USDC on Arc | One asset, two interfaces sharing one balance: native (18 decimals, pays gas, msg.value) and ERC-20 precompile `0x3600000000000000000000000000000000000000` (6 decimals) | arc.io blog pub. 2025-11-17; docs.arc.io/arc/references/evm-differences.md |
| USDC event logs | System emitter `0xfffffffffffffffffffffffffffffffffffffffe` emits standard Transfer (topic0 0xddf252ad...) in 18 decimals for EVERY movement; ERC-20 emitter `0x3600...0000` adds a 6-decimal log on transfer(); ERC-20 transfer() emits BOTH; docs: filter by emitter, never mix decimals | docs.arc.io/arc/references/usdc-system-events.md (re-verified by orchestrator 2026-07-27) |
| EURC (Arc Testnet) | 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a | docs.arc.io/arc/references/contract-addresses.md |
| Contract deploys | Foundry documented first-party; gas paid in USDC; zero-address transfers revert, value-to-precompile reverts, PREVRANDAO=0 | docs.arc.io/arc/tutorials/deploy-on-arc.md; evm-differences.md |

## 3. Core feasibility (make-or-break, all verified)

### CCTP from Arc Testnet
| Item | Value | Source |
|---|---|---|
| Version | V2 (Arc is V2-only) | developers.circle.com/cctp/concepts/supported-chains-and-domains.md (re-verified by orchestrator 2026-07-27) |
| Arc domain / Base domain | 26 / 6; "if a mainnet is listed, its official testnet is also supported" (so Arc Testnet -> Base Sepolia is a supported lane) | same |
| TokenMessengerV2 (EVM testnets) | 0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA | developers.circle.com/cctp/references/contract-addresses.md |
| MessageTransmitterV2 | 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275 | same |
| TokenMinterV2 | 0xb43db544E2c27092c107639Ad201b3dEfAbcF192 | same |
| Attestation API (testnet) | https://iris-api-sandbox.circle.com, /v2/messages, 40 req/s | developers.circle.com/cctp/quickstarts/transfer-usdc-ethereum-to-arc.md |
| Fast Transfer | N/A on Arc; standard attestation already fast there | supported-chains-and-domains.md |
| Caveats | Bridge amount must exceed CCTP V2 max-fee threshold (exact value unknown, day-1 spike); destination mint on Base Sepolia needs a little ETH (public faucets) | quickstart; App Kit bridge quickstart |

### App Kits (Send, Bridge)
Real, first-party, current. "App Kits is a suite of SDKs for composing multichain payment and liquidity flows" (docs.arc.io/app-kit.md). Programmatic TypeScript SDKs, NOT UI components. `@circle-fin/app-kit` v1.10.0 (npm, pub. 2026-07-15), depends on `@circle-fin/bridge-kit` 1.12.1; adapters: viem-v2, ethers-v6, solana-kit, circle-wallets; Node >= 20. Send: `kit.send({from:{adapter, chain:"Arc_Testnet"}, to, amount, token:"USDC"})`. Bridge: one `kit.bridge()` call does approve -> burn -> attestation -> mint with per-step tx hashes. Chain enums seen in docs: Arc_Testnet, Ethereum_Sepolia, Base_Sepolia, Arbitrum_Sepolia, Solana_Devnet. No Arc->Base_Sepolia quickstart exists (Eth Sepolia and Solana Devnet routes are demonstrated); route inferred from enums + CCTP domain rules; smoke-test day 1.

### Incoming-transfer watcher
Subscribe to Transfer logs from system emitter `0xffff...fffe` filtered on `to = <treasury address>`: catches every incoming payment (native or ERC-20), values in 18 decimals. viem `watchEvent` over WSS; HTTP polling via `getLogs` is a drop-in fallback (eth_subscribe not explicitly documented for the public WSS). Circle SCP event monitors + webhooks exist as a first-party alternative for ERC-20 events (docs.arc.io/arc/tutorials/monitor-contract-events.md) but system-emitter support there is unknown.

### Execution architecture (decided, one path)
Hybrid: three thin Solidity templates (Split / Sweep / Bridge) deployed with Foundry, parameters onchain, permissionless `execute()`; a Node keeper (viem wallet client + node-cron) watches logs / schedules and pokes. Pure onchain is impossible (ERC-20 transfers run no recipient code; no onchain scheduler exists; ERC-8183 is escrow, not automation). Pure backend would make "deterministic onchain flows" hollow. Hybrid claim that holds up: the rule is a verified contract on Arcscan; anyone can call execute(); AI and backend can both die and the rule is still enforceable.

### AI interpreter
One constrained LLM call (JSON schema output) mapping sentence -> {template, params} or refusal. Application logic; no blocker.

## 4. Similar existing projects (novelty threat)

| Project | Status | What it is | Delta we must own |
|---|---|---|---|
| circlefin/arc-fintech (FIRST-PARTY) | Verified (README fetched) | Multichain USDC treasury dashboard: DCW, Gateway, App Kit bridging, swap, EarnKit | Verified ABSENT: rule engine, scheduling, NL, split/sweep. Pitch: "arc-fintech gives you buttons; we give you standing rules" |
| ArcFlux (prior Arc hackathon, lablab) | **VERIFIED** by owner in browser 2026-07-27: https://github.com/Jkanishkha0305/ArcFlux/tree/arcflux (README) | Conversational payment app; GPT-4 parses every command; APScheduler backend executes; Circle Developer-Controlled Wallets (custodial); a Guardian Agent risk-scores EVERY transaction before execution; no custom contracts; explicitly no cross-chain | Four sharp deltas, see "Differentiation vs ArcFlux" below |
| Unnamed lablab winner | UNVERIFIED-secondary | "Institutional treasury, deterministic policy controls, AI-assisted + human-in-the-loop" | They keep AI in the loop; we remove it |
| circlefin/arc-escrow | UNVERIFIED-secondary | Escrow with AI-validated deliverables | Circle ships AI-in-the-flow; our AI-only-at-setup is a deliberate contrast |
| 0xSplits, Superfluid, Gelato, Chainlink Automation, Safe modules | Prior knowledge | Splitters/streaming/keepers on major EVMs | None found on Arc (not in docs.arc.io/arc/tools); their absence is why our keeper exists; cite 0xSplits as pattern pedigree |
| Tessl "Rule Maker Pattern" essay | UNVERIFIED-secondary | AI writes rules, deterministic engine executes (essay only) | Validation of the framing; we ship the instantiation |

### Differentiation vs ArcFlux (locked 2026-07-27; feeds spec.md section)

1. **AI in the loop forever vs compiled out.** ArcFlux: GPT-4 parses every command and a Guardian Agent risk-scores every transaction at execution time. Ours: AI runs exactly once, at setup, to compile the sentence into template parameters; execution is AI-free and reproducible.
2. **No contracts vs verified onchain templates.** ArcFlux holds funds in custodial Developer-Controlled Wallets moved by a Python backend; no custom contracts. Ours: three Blockscout-verified Solidity templates with parameters onchain and permissionless execute(); the rule survives the death of our backend.
3. **Push-payment automation vs reactive treasury policy.** ArcFlux schedules outgoing payments. Ours reacts to INCOMING funds and balance state via the EIP-7708 system-emitter watch (an Arc-only capability: one filter catches native and ERC-20 payments alike).
4. **No cross-chain vs CCTP Bridge template.** ArcFlux is explicitly single-chain. Our Bridge template moves surplus Arc -> Base Sepolia via CCTP V2 through App Kit's kit.bridge().

## 5. Unsupported / shaky assumptions in the idea, clause by clause

| Clause | Status | Severity |
|---|---|---|
| "watching incoming transfers" | Verified (system emitter) | resolved |
| "route 10% of every incoming payment" | Works, but split executes in the keeper's follow-up tx, not atomically in the payment tx; say "within seconds" | Low |
| "when idle balance exceeds 5,000 USDC" | Faucet ~1 USDC/day; demo thresholds must scale to ~0.5 USDC; request faucet daily from day 1 | Medium |
| "bridge the surplus to Base monthly" | CCTP lane verified; monthly = keeper cron (no onchain scheduler exists); disclose honestly | Low |
| "audited rule templates" | FALSE as worded; rename to "fixed, verified templates" (Blockscout-verified source) | Low but embarrassing if challenged |
| "AI out of the loop" | Sound and is the differentiator | resolved |
| "App Kits (Send, Bridge)" | Verified, SDK-only (judges may expect UI the kit does not provide; our own UI covers this) | Low |
| Decimals | 18d native vs 6d ERC-20, same balance; mixing miscomputes by 10^12; one interface per template, filter logs by emitter | High if unhandled, trivial once known |

## 6. Open questions

1. ~~OWNER TASK (blocks Gate 2): verify ArcFlux in a browser.~~ RESOLVED 2026-07-27: owner read the README at github.com/Jkanishkha0305/ArcFlux (branch arcflux); facts recorded in section 4; differentiation locked. Gate 2 unblocked.
2. Does skipping/placeholder CP2 affect final judging? Unstated; placeholder submitted 2026-07-27; can ask on Build on Circle Discord.
3. CCTP V2 max-fee threshold from Arc (minimum viable bridge amount): unknown; day-1 spike.
4. Does the public WSS honor eth_subscribe with address+topic filters? 10-minute day-1 test; HTTP polling fallback ready.
5. Do Circle SCP event monitors accept the system emitter 0xffff...fffe as monitorable? Nice-to-have name-drop only.
6. Does the Split contract need receive() handling for native-interface payers? Likely yes; cheap.

## 7. Rules, deadlines, judging (PRIMARY: Encode's live Supabase backend, the data source of the JS-rendered page, read 2026-07-27)

| Deadline | Gates | UTC | GMT+7 (owner) | Status |
|---|---|---|---|---|
| Checkpoint 1 (project + idea; not required) | registration checkpoint | 2026-07-20 11:59 | Mon 20 Jul 18:59 | PASSED |
| Checkpoint 2 (mid-submission; required; placeholders OK) | repo + presentation links | 2026-07-27 11:59 | Mon 27 Jul 18:59 | placeholder submitted |
| Registration / project creation closes | creating/joining projects | 2026-08-08 23:00 | Sun 9 Aug 06:00 | open |
| **FINAL SUBMISSION (Checkpoint 3)** | judged entry; platform locks; late = not judged | **2026-08-10 11:59** | **Mon 10 Aug 18:59** | ~2 weeks |
| Demo Day (event, not deadline) | - | Thu 20 Aug | - | - |

Build window: 4 weeks, 13 Jul - 9 Aug ("7 weeks" in earlier snippets = listing duration incl. judging/Demo Day; conflict resolved). Deadlines follow Anywhere on Earth (UTC-12). **Internal target: submit Sun 9 Aug (a day early).**

**Judging criteria (FAQ verbatim):** (1) Arc & USDC integration: working prototype deployed on Arc with meaningful use of USDC and Circle tools; (2) use of the right core products: App Kits for payment/liquidity flows and Agent Stack for agentic builds where relevant; (3) use case & impact: real problem, credible path to production; (4) execution, quality and presentation: a clear working demo beats unnecessary complexity.

**Submission:** functional MVP + 3-minute video (must state track and how core products were used) + a deck/presentation + repo link. Tracks: DeFi and Agentic Economy; same project may enter both if it genuinely fits. DeFi track core products: Arc, USDC, App Kits, Circle Wallets, Circle Contracts, CCTP, Gateway, StableFX. Prize: 8-week accelerator, up to 8 teams; "$10,000 prize pool" is UNCONFIRMED for this programme (likely the sibling Enterprise DeFi event). Solo OK; pre-existing code explicitly allowed.

## 8. Recommendation (one path, no hedging)

Build the hybrid on Arc Testnet, DeFi track (mention Agentic only if the interpreter story earns it):

| Layer | Choice |
|---|---|
| Contracts | 3 thin Foundry-deployed templates: SplitRule, SweepRule, BridgeRule; params onchain; permissionless execute(); Blockscout-verified |
| Watcher/keeper | Node + viem; system-emitter log filter (18d) for incoming; node-cron for schedules; HTTP polling fallback |
| Bridge | `@circle-fin/app-kit` kit.bridge() Arc_Testnet -> Base_Sepolia (CCTP V2); adapter-viem-v2 with a server-held key |
| Send | kit.send() on Arc_Testnet for split/sweep payouts (or direct viem; decide in spike) |
| Interpreter | One constrained LLM call -> {template, params} or refusal; refusal path is a demo scenario |
| UI | Dashboard: sentence in -> compiled rule card -> live event feed -> executions with Arcscan links |
| Day-1 spike | Prove Arc->Base Sepolia bridge + system-emitter watching before anything else |
| Funding | faucet.circle.com daily from day 1; Base Sepolia ETH from public faucet |

Effort split ~25% plumbing / 75% differentiator (interpreter UX + determinism story + demo polish). Cut order: Bridge template first, then UI polish; never cut: Split template + watcher + the refusal scenario.

## 9. Verification log

**Verified first-party 2026-07-27 (researchers; orchestrator re-verified the two starred):**
- *docs.arc.io/arc/references/usdc-system-events.md: EIP-7708 emitter, dual decimals, double-log, filter guidance
- *developers.circle.com/cctp/concepts/supported-chains-and-domains.md: Arc domain 26 V2, Base 6, testnet rule, Fast Transfer N/A
- developers.circle.com/cctp/references/contract-addresses.md; cctp quickstart transfer-usdc-ethereum-to-arc.md
- docs.arc.io: app-kit.md, app-kit/send.md, app-kit/bridge.md, bridge quickstart, contract-addresses.md, evm-differences.md, deploy-on-arc.md, connect-to-arc.md, monitor-contract-events.md, create-your-first-erc-8183-job.md
- registry.npmjs.org/@circle-fin/app-kit v1.10.0 pub. 2026-07-15
- github.com/circlefin/arc-fintech README (scope; absence of rules/NL/scheduling)
- Encode Supabase backend: programme 1515 (arc-hackathon), challenges 340-342, 22 FAQs (deadlines, criteria, tracks, team rules)
- Redirects: docs.arc.network -> docs.arc.io (301); developers.circle.com/bridge-kit.md -> docs.arc.io/app-kit/bridge (307)

**Removed as unverified or wrong:**
- "$10,000 prize pool" for this programme (not in programme data; prize is the accelerator)
- "7 weeks build time" (listing duration, not build window)
- Fear that native-token payments leave no logs (disproven by usdc-system-events.md)

**Newly verified 2026-07-27 (by owner, in browser):** ArcFlux, via github.com/Jkanishkha0305/ArcFlux/tree/arcflux README: conversational payments, GPT-4 per-command parsing, APScheduler execution, custodial DCW, Guardian Agent risk-scoring every transaction, no custom contracts, explicitly no cross-chain.

**Still UNVERIFIED (marked inline):** lablab winner details (bot-blocked); arc-escrow details; Arc->Base_Sepolia Bridge Kit route as an explicit first-party statement (inferred; day-1 spike); CCTP max-fee minimum from Arc; eth_subscribe on public WSS; SCP monitors on the system emitter; Tessl essay content.
