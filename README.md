# Mandate

**Treasury rules in plain English, executed as deterministic onchain flows on Arc.**

Type a rule the way you would say it:

> "route 10% of every incoming payment to savings"
>
> "when idle balance exceeds 5,000 USDC, bridge the surplus to Base monthly"

An AI interpreter maps your sentence to one of three fixed, verified rule templates - **Split**, **Sweep**, and **Bridge** - and fills in the parameters. From that point the AI is out of the loop: execution is pure automation - watching incoming transfers, checking balances on schedule, and bridging via CCTP. Same rule, same input, same result, every time.

**AI touches money zero times.** It compiles one sentence into template parameters at setup, then the system is provably AI-free.

**Live demo:** https://mandate-olive.vercel.app

Compile a sentence there and it runs the real interpreter; the rules list and execution feed are the real onchain history below. Deploying a new rule from the hosted app is disabled, because the rule store is a JSON file and the serverless filesystem is read only. To deploy from a sentence, clone and run locally.

## How it works

1. **Compile (once, with AI):** your sentence goes through a constrained LLM call that returns either `{template, parameters}` or a refusal. Ambiguous sentences are refused, never guessed.
2. **Deploy:** parameters are written into a thin, Blockscout-verified Solidity template on Arc Testnet with a permissionless `execute()`.
3. **Run (forever, without AI):** a keeper watches incoming USDC via Arc's EIP-7708 system-emitter logs (one filter catches native and ERC-20 payments alike), checks balances on schedule, and calls `execute()`. Anyone can call it - the rule survives even if our backend dies.

## Rule templates

| Template | Trigger | Action |
|---|---|---|
| Split | incoming USDC payment | route N% to a savings address |
| Sweep | balance above a floor | move the surplus to an address on Arc |
| Bridge | schedule + threshold | CCTP V2 burn on Arc, mint on Base |

## Stack

- **Arc Testnet** (chain 5042002) - USDC-native gas, sub-second finality
- **USDC** - the treasury asset (native + ERC-20 interfaces)
- **CCTP V2** - Arc (domain 26) to Base Sepolia (domain 6), called by the contract itself
- **solc-js + viem** - template compilation, deployment, and Blockscout verification
- **Next.js** - compile, preview, confirm, and the live execution feed
- **Node + viem** - watcher/keeper
- TypeScript throughout

## Deployed on Arc Testnet

Every template is live and source-verified on Arcscan.

| Template | Address |
|---|---|
| Split | [`0x005861b9bc42957178aa2e2e47adf63eb5dcb915`](https://testnet.arcscan.app/address/0x005861b9bc42957178aa2e2e47adf63eb5dcb915) |
| Sweep | [`0xa10269b7df3fa969381f9bfd251634a8a3abd751`](https://testnet.arcscan.app/address/0xa10269b7df3fa969381f9bfd251634a8a3abd751) |
| Bridge | [`0x11016575c46b62a656c6e5dd261430ad97f9aec3`](https://testnet.arcscan.app/address/0x11016575c46b62a656c6e5dd261430ad97f9aec3) |

The Split rule above was deployed from the sentence "route 5% of every incoming payment to 0x99189Bf6c5400045C1B464CF59FCFAaB2271c0C1", compiled by the interpreter and confirmed by a human before it went onchain.

## Running it

Needs `ANTHROPIC_API_KEY` and a funded Arc Testnet key in `.env`. Fund from [faucet.circle.com](https://faucet.circle.com).

```bash
npm install
npm run dev          # the app on localhost:3000
npm run watch        # the keeper, in a second terminal
```

Without the app:

```bash
npx tsx scripts/test-interpreter.ts                    # refusal and compile battery
npx tsx scripts/deploy-rule.ts SweepRule <address> 500 # deploy a template directly
npx tsx scripts/show-rule-state.ts                     # read every rule's onchain state
npx tsx scripts/execute-rule-manually.ts <address>     # enforce a rule with no keeper running
```

## Status

Hackathon build for the Encode x Arc Programmable Money Hackathon (DeFi track).

Shipped and proven onchain: all three templates deployed and verified, sentence-to-live-rule through the interpreter, a keeper that catches native and ERC-20 payments through one emitter filter, and a complete CCTP transfer that the contract initiates itself.

**Full CCTP round trip, Arc to Base Sepolia:**

| Step | Transaction |
|---|---|
| Burn on Arc (called by `BridgeRule`, no backend in the money path) | [`0x6706f936...a69af779`](https://testnet.arcscan.app/tx/0x6706f9367ecddade510f9718a73eef4066528e8cd50d230000a16b60a69af779) |
| Mint on Base Sepolia | [`0x2e1a4bd7...738e93ed`](https://sepolia.basescan.org/tx/0x2e1a4bd764e3ce059cc805013c8df3409c6d376ad80b9dedae5e5cac738e93ed) |

**A rule enforced by a real incoming payment, not a button:**

| Step | Transaction |
|---|---|
| Split executed after a payment landed: 0.7 USDC in, 0.035 USDC routed to savings | [`0x15203d9a...97e708a8`](https://testnet.arcscan.app/tx/0x15203d9a5559beb6666c4d1c87d67f1c2576b394c579d8393e28f84797e708a8) |

0.5 USDC left Arc and arrived on Base Sepolia. The destination mint is a separate step by CCTP's design, and `destinationCaller` is zero, so anyone can submit it: the funds were never waiting on our backend.

See `presentation/` for the deck and `context/latest.md` for the research log.
