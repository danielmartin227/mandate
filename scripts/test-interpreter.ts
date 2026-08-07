// Exercise the interpreter against sentences it SHOULD refuse and sentences it
// should compile. The refusal cases come first deliberately: a compiler that
// only ever says yes is the failure mode this product exists to avoid.
//
// Usage: tsx scripts/test-interpreter.ts ["custom sentence"]
import { compileSentence } from "../src/interpreter/compile-sentence-to-rule.js";

const DEMO_ADDR = "0x99189Bf6c5400045C1B464CF59FCFAaB2271c0C1";

/// `template` matters for the cases where two templates could plausibly match:
/// compiling a sweep as a bridge is a wrong rule onchain, not a near miss.
type Case = {
  sentence: string;
  expect: "compiled" | "refusal";
  why: string;
  template?: string;
};

const CASES: Case[] = [
  // Must refuse
  { sentence: "route 10% of every deposit to savings", expect: "refusal", why: "no address given" },
  { sentence: "move some of the treasury to reserves now and then", expect: "refusal", why: "vague share and schedule" },
  { sentence: `bridge to Base when the price of ETH looks good, send to ${DEMO_ADDR}`, expect: "refusal", why: "needs an external price signal" },
  { sentence: `split incoming payments between ${DEMO_ADDR} and my other two wallets`, expect: "refusal", why: "multiple recipients unsupported" },
  { sentence: "do the usual treasury thing", expect: "refusal", why: "meaningless" },
  { sentence: `every Friday move anything over 500 USDC to ${DEMO_ADDR} here on Arc`, expect: "refusal", why: "same-chain sweep has no schedule" },
  { sentence: `sweep half of anything above 500 USDC to ${DEMO_ADDR}`, expect: "refusal", why: "partial sweep unsupported" },
  // Must compile
  { sentence: `route 10% of every incoming payment to ${DEMO_ADDR}`, expect: "compiled", why: "clean Split" },
  { sentence: `send a quarter of each payment we receive to ${DEMO_ADDR}`, expect: "compiled", why: "Split, share in words" },
  { sentence: `keep 1000 USDC on Arc and bridge anything above that to ${DEMO_ADDR} on Base, monthly`, expect: "compiled", why: "clean Bridge" },
  { sentence: `every week, move the surplus over 250 USDC across to ${DEMO_ADDR} on Base`, expect: "compiled", why: "Bridge, weekly", template: "BridgeRule" },
  { sentence: `keep 500 USDC in the treasury and send anything above that to ${DEMO_ADDR}`, expect: "compiled", why: "clean Sweep", template: "SweepRule" },
  { sentence: `whenever we hold more than 2000 USDC, move the excess to ${DEMO_ADDR}`, expect: "compiled", why: "Sweep, excess phrasing", template: "SweepRule" },
];

const custom = process.argv[2];
const cases: Case[] = custom
  ? [{ sentence: custom, expect: "compiled", why: "ad hoc" }]
  : CASES;

let pass = 0;
let fail = 0;

for (const c of cases) {
  const result = await compileSentence(c.sentence);
  const ok =
    result.kind === c.expect &&
    (!c.template || (result.kind === "compiled" && result.template === c.template));
  if (custom) {
    // Ad hoc mode: just show what happened, no pass/fail.
  } else if (ok) {
    pass++;
  } else {
    fail++;
  }

  const verdict = custom ? "" : ok ? "PASS " : "FAIL ";
  console.log(`\n${verdict}"${c.sentence}"`);
  if (!custom) console.log(`  expected ${c.template ?? c.expect} (${c.why})`);

  if (result.kind === "refusal") {
    console.log(`  REFUSED: ${result.reason}`);
  } else {
    console.log(`  COMPILED to ${result.template}`);
    console.log(`  readback: ${result.readback}`);
    console.log(`  deploy:   ${result.deployArgs.join(" ")}`);
  }
}

if (!custom) {
  console.log(`\n${pass}/${pass + fail} as expected`);
  if (fail > 0) process.exit(1);
}
