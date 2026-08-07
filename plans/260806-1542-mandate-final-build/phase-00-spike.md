# Phase 00: Spike

**Priority:** blocking everything. **Status:** COMPLETE 2026-08-06 16:15, all 5 tests passed in ~35 min of a 3h box.
**Results:** [spike report](../reports/spike-260806-1542-arc-cctp-emitter.md)

## Context

- Research truth: `context/latest.md` (section 6 = the open questions this phase kills)
- Plan: [plan.md](plan.md)

## Purpose

Four of five open technical unknowns sit on the critical path and none has been tested.
Settle all of them tonight so no day is wasted on a dead path.

## Tests

| # | Test | Settles | Fallback |
|---|---|---|---|
| S1 | Fund wallet from faucet, connect via viem, read balance both interfaces | baseline | hard stop, escalate to owner |
| S2 | Deploy trivial contract to Arc, verify on Arcscan | Foundry vs solc-js | solc-js + viem + Blockscout standard-json API |
| S3 | Native-send USDC to that contract | does it revert without `receive()`; does precompile `balanceOf` see natively-received funds | redesign deposit path tonight |
| S4 | viem `watchEvent` on emitter `0xffff...fffe`, filter `to=addr`, over WSS | `eth_subscribe` on public WSS | `getLogs` HTTP polling, ~20 min swap |
| S5 | EOA `depositForBurn` to domain 6, poll iris sandbox, `receiveMessage` on Base Sepolia | CCTP V2 max-fee minimum from Arc | **cut Bridge at 22:00** |

## Verified constants (do not re-derive)

- Arc Testnet chain ID `5042002`, RPC `https://rpc.testnet.arc.network`, WSS `wss://rpc.testnet.arc.network`
- Explorer `https://testnet.arcscan.app` (Blockscout)
- USDC ERC-20 precompile `0x3600000000000000000000000000000000000000` (6 decimals)
- System emitter `0xfffffffffffffffffffffffffffffffffffffffe` (18 decimals, every movement)
- Transfer topic0 `0xddf252ad...`
- CCTP domains: Arc 26, Base Sepolia 6
- TokenMessengerV2 `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA`
- MessageTransmitterV2 `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275`
- Attestation API `https://iris-api-sandbox.circle.com/v2/messages`
- Arc quirks: zero-address transfers revert, value-to-precompile reverts, PREVRANDAO = 0

## Steps

1. Scaffold `spike/` as a plain Node + TypeScript + viem workspace. Throwaway, not the product.
2. Generate demo keypair, write to `.env`, confirm `.env` is gitignored.
3. Owner funds the address from faucet.circle.com.
4. Run S1 through S5 in order. Record every result in the spike report.
5. At 22:00, make the Bridge in/out call and record it in `plan.md`.

## Todo

- [x] Scaffold spike workspace
- [x] Generate + gitignore demo key
- [x] S1 connectivity and balances
- [x] S2 deploy + verify
- [x] S3 native send into contract
- [x] S4 emitter watch over WSS
- [x] S5 CCTP round trip
- [x] Write `plans/reports/spike-260806-arc-cctp-emitter.md`
- [x] 22:00 Bridge in/out decision recorded

## Success criteria

Every row in the test table has a recorded PASS, FAIL, or FALLBACK-ADOPTED result, and the toolchain question is closed.

## Risks

- Faucet or RPC down: no workaround, escalate immediately
- CCTP attestation slow: poll up to 20 min before declaring FAIL
- Windows path or shell friction in Foundry install: do not debug past the 15-min box

## Security

- Demo key only. Never reuse a real key. `.env` gitignored and verified before the first commit of this phase.

## Next

Phase 01 unblocked by S1-S4. Phase 03 unblocked by S5.
