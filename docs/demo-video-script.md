# Mandate - demo video script

Target 2:30. Five shots. Encode x Arc Programmable Money Hackathon, DeFi track.

Live app: https://mandate-olive.vercel.app
Repo: https://github.com/danielmartin227/mandate

Narration is pre-split into copy-ready blocks under 450 characters for CapCut text-to-speech. Character count is beside each block. Acronyms and numbers are respelled the way a speech engine says them correctly.

Every click below was walked on the deployed site before the line was written. Verify notes give the real numbers that will be on screen.

**Do not record a Confirm and Deploy click.** On the hosted build that button is deliberately disabled, with a sentence underneath explaining that deploying runs from the CLI. The onchain evidence in this video comes from rules deployed earlier, which is what the narration says.

---

## Shot 1 - The difference (0:00 - 0:22)

**Screen:** https://mandate-olive.vercel.app, top of page.

**Clicks:**
1. Open the URL in a clean window, no bookmarks bar.
2. Hold on the headline three seconds, then scroll slowly to the numbered "How it works" steps.

**Narration**

Block 1A (282 chars)
> Mandate is treasury autopilot on Arc. Here is the difference. An A I interpreter reads your treasury rule once, in plain English, then leaves the loop permanently. Execution is deterministic. Same rule, same input, same result. No agent sits in the money path deciding what to send.

**Verify:** headline reads "Treasury Rules in Plain English". Subhead reads "AI compiles your intent once into a fixed onchain template, then leaves permanently. No model in the loop. No custody. No trust." Pills on screen: "Zero AI after compile", "3 fixed templates", "Deterministic execution".

---

## Shot 2 - The centre beat: sentence in, preview out (0:22 - 1:14)

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

Block 2A (292 chars)
> I type one sentence. Route ten percent of every incoming payment to this savings address. It compiles into one of exactly three fixed templates, Split, Sweep, or Bridge, and reads the rule back before anything can go onchain. Ten percent to that address, ninety percent stays in the treasury.

Block 2B (291 chars)
> And look at the line under the confirm button. The product tells you exactly where the model stops being involved. Past that point there is no prompt and no inference. Below are rules that already went through this screen earlier. They are live contracts on Arc holding real testnet U S D C.

**Verify:** the card header reads "PREVIEW: SPLITRULE". The readback prose is generated per run and its wording varies, so do not caption it word for word; the numbers do not vary. Fields shown: `savingsAddress: 0x99189Bf6...2271c0C1` and `savingsBps: 1000`. Active Rules lists exactly four: SplitRule `0x56c0e4aa...20c3cfab`, BridgeRule `0x11016575...97f9aec3`, SplitRule `0x005861b9...b5dcb915` (which carries its source sentence in italics, "route 5% of every incoming payment to 0x99189Bf6c5400045C1B464CF59FCFAaB2271c0C1"), SweepRule `0xa10269b7...a3abd751`. Confirm and Deploy is greyed out with a sentence beneath it. That is expected. Do not click it.

---

## Shot 3 - It refuses rather than guesses (1:14 - 1:36)

**Screen:** same page, the input.

**Clicks:**
1. Select all in the input and type: `move some money to savings when it feels right`
2. Click Compile. Hold on the yellow Refused block four seconds.

**Narration**

Block 3A (222 chars)
> Now watch it refuse. Move some money to savings when it feels right. No address, no share, no trigger. It refuses instead of guessing, and says what is missing. A rule that cannot be stated exactly never reaches the chain.

**Verify:** a yellow bar labelled "Refused" appears with the reason "This sentence gives no savings address, no share or amount, and no definite trigger, so there is nothing I can compile." The wording is model generated and can vary slightly between runs; the refusal itself is deterministic behaviour, verified live on 2026-08-10.

---

## Shot 4 - Onchain evidence (1:36 - 2:14)

**Screen:** Arcscan, then the Recent Executions panel, then the README CCTP table.

**Clicks:**
1. In Active Rules, click the green address `0x005861b9...b5dcb915`. Arcscan opens.
2. Hold on "Contract name: SplitRule" and the green tick on the Contract tab, three seconds.
3. Back to the app, scroll to Recent Executions, hold three seconds.
4. Open the README on GitHub, scroll to the CCTP round trip table, click the burn link, then the mint link.

**Narration**

Block 4A (288 chars)
> Here is that rule on Arcscan. Source verified, named Split Rule. Execute is permissionless, so our backend is never in the money path. And the execution feed is not a mock up. A real incoming payment triggered a run: zero point seven U S D C in, zero point zero three five out to savings.

Block 4B (278 chars)
> Cross chain uses C C T P version two, and the contract calls the burn itself. Zero point five U S D C burned on Arc, minted on Base Sepolia, both linked in the read me. To be straight about scope: no Circle App Kits, nothing simulated in the money path, all Arc testnet U S D C.

**Verify:** Arcscan page for `0x005861b9bc42957178aa2e2e47adf63eb5dcb915` shows Contract name SplitRule, a green tick on the Contract tab, Balance 2.565 USDC, Transactions 5. Recent Executions shows two rows: `11:13:44 AM SplitRule split 0.7 USDC, routed 0.035 to savings` tagged payment, and `11:04:04 AM SweepRule swept 1.5 USDC above the floor` tagged manual, each with a "tx" link. Burn `0x6706f936...a69af779` on Arcscan, method execute, status ok, token transfer into TokenMinterV2 tagged Circle CCTP. Mint `0x2e1a4bd7...738e93ed` on Base Sepolia, five hundred thousand units of six-decimal USDC to `0x5A5383...EC61E4`. All confirmed by direct chain and explorer queries on 2026-08-10.

---

## Shot 5 - Hold the URL (2:14 - 2:30)

**Screen:** static frame. Project name, one line of positioning, the live URL in large type, the repo URL beneath. No motion.

**Clicks:** none. Hold at least twelve seconds.

**Narration**

Block 5A (163 chars)
> Mandate. Treasury rules in plain English, executed deterministically on Arc, in U S D C. The live app and the repository are on screen now. Thank you for watching.

**Verify:** frame shows `https://mandate-olive.vercel.app` and `github.com/danielmartin227/mandate`, both loading in a fresh browser.

---

## Rubric words spoken aloud

Arc, U S D C, C C T P, Base Sepolia, deterministic, source verified, permissionless. Circle App Kits is named once, in the honesty beat, as not used.
