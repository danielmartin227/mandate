# Mandate

**Treasury rules in plain English, executed as deterministic onchain flows on Arc.**

Type a rule the way you would say it:

> "route 10% of every incoming payment to savings"
>
> "when idle balance exceeds 5,000 USDC, bridge the surplus to Base monthly"

An AI interpreter maps your sentence to one of three fixed, verified rule templates - **Split**, **Sweep**, and **Bridge** - and fills in the parameters. From that point the AI is out of the loop: execution is pure automation - watching incoming transfers, checking balances on schedule, and bridging via CCTP. Same rule, same input, same result, every time.

**AI touches money zero times.** It compiles one sentence into template parameters at setup, then the system is provably AI-free.

## How it works

1. **Compile (once, with AI):** your sentence goes through a constrained LLM call that returns either `{template, parameters}` or a refusal. Ambiguous sentences are refused, never guessed.
2. **Deploy:** parameters are written into a thin, Blockscout-verified Solidity template on Arc Testnet with a permissionless `execute()`.
3. **Run (forever, without AI):** a keeper watches incoming USDC via Arc's EIP-7708 system-emitter logs (one filter catches native and ERC-20 payments alike), checks balances on schedule, and calls `execute()`. Anyone can call it - the rule survives even if our backend dies.

## Rule templates

| Template | Trigger | Action |
|---|---|---|
| Split | incoming USDC payment | route N% to a savings address |
| Sweep | balance threshold on schedule | move surplus above a floor |
| Bridge | schedule + threshold | CCTP V2 burn on Arc, mint on Base |

## Stack

- **Arc Testnet** (chain 5042002) - USDC-native gas, sub-second finality
- **USDC** - the treasury asset (native + ERC-20 interfaces)
- **CCTP V2** - Arc (domain 26) to Base Sepolia (domain 6)
- **Circle App Kits** - `@circle-fin/app-kit`: Send and Bridge modules
- **Foundry** - template deployment and verification
- **Node + viem** - watcher/keeper
- TypeScript throughout

## Status

Hackathon build for the Encode x Arc Programmable Money Hackathon (DeFi track). Research and architecture validated; implementation in progress. See `presentation/` for the current deck and `context/latest.md` for the research log.
