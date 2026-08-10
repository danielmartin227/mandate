# Mandate - demo video script

Target 2:30. Five shots. Encode x Arc Programmable Money Hackathon, DeFi track.

Live app: https://mandate-olive.vercel.app
Repo: https://github.com/danielmartin227/mandate

Narration is pre-split into copy-ready blocks under 450 characters for CapCut text-to-speech. Character count is beside each block. Acronyms and numbers are respelled the way a speech engine says them correctly.

Every click below was walked on the deployed site before the line was written. Verify notes give the real numbers that will be on screen.

**Do not record a Confirm and Deploy click.** On the hosted build that button is deliberately disabled, with a sentence underneath explaining that deploying runs from the CLI. The onchain evidence in this video comes from rules deployed earlier, which is what the narration says.

Cold open is the refusal. Start inside the app, mid-action, with no title card and no logo.

---

## Shot 1 - Cold open: it refuses rather than guesses (0:00 - 0:22)

**Screen:** https://mandate-olive.vercel.app/app, the input. First frame of the video is already this screen.

**Clicks:**
1. Select all in the input and type: `move some money to savings when it feels right`
2. Click Compile. Hold on the yellow Refused block four seconds.

**Narration**

Block 1A (251 chars)
> That sentence just got refused. No address, no share, no trigger, so there was nothing to compile, and rather than guessing it says exactly what was missing. This is Mandate, and a treasury rule that cannot be stated precisely never reaches the chain.

**Verify:** a yellow bar labelled "Refused" appears with the reason "This sentence gives no savings address, no share or amount, and no definite trigger, so there is nothing I can compile." The wording is model generated and can vary slightly between runs; the refusal itself is deterministic behaviour, verified live on 2026-08-10.

---

## Shot 2 - Positioning (0:22 - 0:48)

**Screen:** https://mandate-olive.vercel.app, top of page.

**Clicks:**
1. Open the URL in a clean window, no bookmarks bar.
2. Hold on the headline three seconds, then scroll slowly to the numbered "How it works" steps.

**Narration**

Block 2A (271 chars)
> What Mandate does is compile a treasury rule written in plain English into a fixed contract on Arc, and the A I interpreter does this once, at setup, then leaves the loop permanently. Everything after it is deterministic: same rule, same input, same transfer, every time.

**Verify:** headline reads "Treasury Rules in Plain English". Subhead reads "AI compiles your intent once into a fixed onchain template, then leaves permanently. No model in the loop. No custody. No trust." Pills on screen: "Zero AI after compile", "3 fixed templates", "Deterministic execution".

---

## Shot 3 - The centre beat: sentence in, preview out (0:48 - 1:40)

**Screen:** https://mandate-olive.vercel.app/app

**Clicks:**
1. Click "Launch App" in the top pill, or go straight to `/app`.
2. Click the "Describe your treasury rule" input.
3. Type: `route 10% of every incoming payment to 0x99189Bf6c5400045C1B464CF59FCFAaB2271c0C1`
4. Click Compile. It takes roughly eight to twelve seconds. Keep rolling and cut the wait later.
5. Hold on the PREVIEW: SPLITRULE card four seconds.
6. Hold specifically on the small grey line to the right of the buttons: "This is the AI's last contact. After deploy, execution is deterministic." Three seconds, no motion. Zoom in if your editor allows.
7. Scroll down to the Active Rules panel and hold three seconds.

**Narration**

Block 3A (267 chars)
> So here is the rule I actually want. Route ten percent of every incoming payment to this savings address. It compiles into one of exactly three fixed templates, Split, Sweep or Bridge, and hands back a readback to check first. Ten percent there. Ninety percent stays.

Block 3B (269 chars)
> Now read the line under the confirm button, because the product marks the moment the model stops being involved, and nothing past it takes a prompt. The rules underneath went through this same screen earlier. They are live contracts on Arc holding real testnet U S D C.

**Verify:** the card header reads "PREVIEW: SPLITRULE". The readback prose is generated per run and its wording varies, so do not caption it word for word; the numbers do not vary. Fields shown: `savingsAddress: 0x99189Bf6...2271c0C1` and `savingsBps: 1000`. Active Rules lists exactly four: SplitRule `0x56c0e4aa...20c3cfab`, BridgeRule `0x11016575...97f9aec3`, SplitRule `0x005861b9...b5dcb915` (which carries its source sentence in italics, "route 5% of every incoming payment to 0x99189Bf6c5400045C1B464CF59FCFAaB2271c0C1"), SweepRule `0xa10269b7...a3abd751`. Confirm and Deploy is greyed out with a sentence beneath it. That is expected. Do not click it.

---

## Shot 4 - Onchain evidence (1:40 - 2:16)

**Screen:** Arcscan, then the Recent Executions panel, then the README CCTP table.

**Clicks:**
1. In Active Rules, click the green address `0x005861b9...b5dcb915`. Arcscan opens.
2. Hold on "Contract name: SplitRule" and the green tick on the Contract tab, three seconds.
3. Back to the app, scroll to Recent Executions, hold three seconds.
4. Open the README on GitHub, scroll to the CCTP round trip table, click the burn link, then the mint link.

**Narration**

Block 4A (276 chars)
> That rule on Arcscan: source verified, named Split Rule, with an execute anyone can call, which is why our backend is never in the money path. The feed below it is not a mock up. A payment landed and the rule fired. Zero point seven U S D C in. Zero point zero three five out.

Block 4B (273 chars)
> In the build: three verified templates on Arc, the interpreter, a keeper reading Arc's system emitter logs, and one completed C C T P version two transfer the contract initiated itself. Not in the build: Circle App Kits, mainnet funds, any simulated step in the money path.

**Verify:** Arcscan page for `0x005861b9bc42957178aa2e2e47adf63eb5dcb915` shows Contract name SplitRule, a green tick on the Contract tab, Balance 2.565 USDC, Transactions 5. Recent Executions shows two rows: `11:13:44 AM SplitRule split 0.7 USDC, routed 0.035 to savings` tagged payment, and `11:04:04 AM SweepRule swept 1.5 USDC above the floor` tagged manual, each with a "tx" link. Burn `0x6706f936...a69af779` on Arcscan, method execute, status ok, token transfer into TokenMinterV2 tagged Circle CCTP. Mint `0x2e1a4bd7...738e93ed` on Base Sepolia, five hundred thousand units of six-decimal USDC to `0x5A5383...EC61E4`. All confirmed by direct chain and explorer queries on 2026-08-10.

---

## Shot 5 - Close on the evidence (2:16 - 2:30)

**Screen:** static frame. Project name, one line of positioning, the live URL in large type, the repo URL beneath. No motion.

**Clicks:** none. Hold at least twelve seconds.

**Narration**

Block 5A (240 chars)
> Three templates, live and source verified on Arc. One rule enforced by a real incoming payment. Zero point five U S D C burned on Arc and minted on Base Sepolia over C C T P, both hashes public. Mandate. Everything is at the link on screen.

**Verify:** frame shows `https://mandate-olive.vercel.app` and `github.com/danielmartin227/mandate`, both loading in a fresh browser.

---

## Rubric words spoken aloud

Arc, U S D C, C C T P, Base Sepolia, deterministic, source verified, testnet. Circle App Kits is named once, in the in-the-build list, as not used.
