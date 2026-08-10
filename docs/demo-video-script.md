# Mandate - demo video script

Target 2:30. Five shots. Encode x Arc Programmable Money Hackathon, DeFi track.

Narration is pre-split into copy-ready blocks under 450 characters for CapCut text-to-speech. Character count is beside each block. Acronyms and numbers are respelled the way a speech engine says them correctly.

Live app: https://mandate-olive.vercel.app

Everything described below was run before the line was written. Verify notes give the real numbers that will be on screen.

---

## Shot 1 - The difference (0:00 - 0:24)

**Screen:** the landing page at `https://mandate-olive.vercel.app`, top of page, headline visible. Slow scroll to the three-template table, then stop.

**Clicks:**
1. Open `https://mandate-olive.vercel.app` in a clean browser window, no bookmarks bar.
2. Scroll down slowly to the rule template table. Stop there.

**Narration**

Block 1A (294 chars)
> Mandate is treasury autopilot on Arc. Here is the difference. An A I interpreter reads your treasury rule once, in plain English, then leaves the loop permanently. Execution is deterministic. Same rule, same input, same result, every time. No agent sits in the money path deciding what to send.

**Verify:** headline on screen reads "Treasury rules in plain English, executed as deterministic onchain flows on Arc." Table lists exactly three templates: Split, Sweep, Bridge.

---

## Shot 2 - Compile a sentence, and watch it refuse (0:24 - 1:12)

**Screen:** `https://mandate-olive.vercel.app/app`, the compile box.

**Clicks:**
1. Click the sentence input.
2. Type: `route 10% of every incoming payment to 0x99189Bf6c5400045C1B464CF59FCFAaB2271c0C1`
3. Click Compile. Wait for the readback panel. Hold on it three seconds.
4. Select all in the input, type: `move some money to savings when it feels right`
5. Click Compile. Hold on the refusal three seconds.

**Narration**

Block 2A (306 chars)
> I type one sentence. Route ten percent of every incoming payment to this savings address. The interpreter compiles it into one of exactly three fixed templates, Split, Sweep, or Bridge, and reads the rule back before anything goes onchain. Ten percent to that address, ninety percent stays in the treasury.

Block 2B (222 chars)
> Now watch it refuse. Move some money to savings when it feels right. No address, no share, no trigger. It refuses instead of guessing, and says what is missing. A rule that cannot be stated exactly never reaches the chain.

**Verify:** compile returns template `SplitRule`, readback "On every incoming USDC payment, 10% (1000 basis points) will be routed to 0x99189Bf6c5400045C1B464CF59FCFAaB2271c0C1 and the remaining 90% will stay in the treasury." Refusal reason begins "This sentence gives no savings address, no share or amount, and no definite trigger". Both were run live against the API on 2026-08-10.

---

## Shot 3 - It is really onchain (1:12 - 1:50)

**Screen:** the deployed rules list, then a browser tab on Arcscan.

**Clicks:**
1. Scroll to the Deployed rules list. Four rules are listed.
2. Click the Split rule address `0x005861b9...5dcb915` to open Arcscan.
3. On Arcscan, point at the green verified contract badge and the contract name.
4. Switch back to the app, scroll to the Execution feed.

**Narration**

Block 3A (335 chars)
> The parameters are written into a Solidity template deployed on Arc. Here it is on Arcscan. Source verified, named Split Rule. Execute is permissionless, so our backend is never in the money path. And the execution feed is not a mock up. A real payment arrived, zero point seven U S D C, and zero point zero three five went to savings.

**Verify:** Arcscan shows contract name `SplitRule`, verified true, at `0x005861b9bc42957178aa2e2e47adf63eb5dcb915`. Execution feed shows two entries: SplitRule "split 0.7 USDC, routed 0.035 to savings" trigger payment, and SweepRule "swept 1.5 USDC above the floor". The payment run is transaction `0x15203d9a...97e708a8`, status ok, method execute.

---

## Shot 4 - Cross chain, and what is honest (1:50 - 2:18)

**Screen:** README section "Full CCTP round trip", then the Arcscan burn transaction, then the Basescan mint transaction.

**Clicks:**
1. Open the GitHub README, scroll to the CCTP round trip table.
2. Click the burn link. Let the Arcscan page load, showing the token transfer row.
3. Back, click the mint link. Let Basescan load and show the 0.5 USDC transfer.

**Narration**

Block 4A (233 chars)
> Cross chain uses C C T P version two, and the contract calls it itself. Zero point five U S D C burned on Arc, minted on Base Sepolia. Here is the burn, here is the mint. Both links are in the read me, so you can check them yourself.

Block 4B (254 chars)
> To be straight about scope. Real: three templates deployed and source verified on Arc, the interpreter, the keeper, and that completed C C T P transfer. Not used: Circle App Kits. Nothing in the money path is simulated. All funds are Arc testnet U S D C.

**Verify:** burn transaction `0x6706f936...a69af779` on Arcscan, from `0x5A5383...EC61E4`, to contract `BridgeRule` `0x11016575...97f9Aec3`, method execute, status ok, token transfer to `TokenMinterV2` tagged Circle CCTP. Mint transaction `0x2e1a4bd7...738e93ed` on Base Sepolia, mint of 500000 units of USDC `0x036CbD53...F3dCF7e` (six decimals, so zero point five) to `0x5A5383...EC61E4`. Both confirmed by direct chain and explorer queries on 2026-08-10.

---

## Shot 5 - Hold the URL (2:18 - 2:32)

**Screen:** static frame. Project name, one line of positioning, the live URL in large type, and the repo URL beneath it. Hold with no motion.

**Clicks:** none. Hold the frame at least twelve seconds.

**Narration**

Block 5A (147 chars)
> Mandate. Treasury rules in plain English, executed deterministically on Arc, in U S D C. The live app and every contract address are on screen now.

**Verify:** URL on the frame must be the same `https://mandate-olive.vercel.app` used in Shot 1, and it must load in a fresh browser. Repo is `github.com/danielmartin227/mandate`.

---

## Rubric words spoken aloud

Arc, U S D C, C C T P, Base Sepolia, deterministic, source verified, permissionless. Circle App Kits is named only in the honesty beat, as not used.
