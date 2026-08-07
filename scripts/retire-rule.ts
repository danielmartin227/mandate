// Mark a deployed rule as superseded.
//
// Usage: tsx scripts/retire-rule.ts <ruleAddress>
//
// Retiring does NOT touch the chain: the contract stays deployed and anyone can
// still call its permissionless execute(). It only tells the keeper and the UI to
// ignore it, which matters when an older version of a template has a different
// ruleState() shape and would decode into silent nonsense.
import { findRule, retireRule } from "../src/rules/rule-store.js";

const address = process.argv[2];
if (!address?.startsWith("0x")) {
  throw new Error("usage: retire-rule.ts <ruleAddress>");
}

const rule = findRule(address);
if (!rule) throw new Error(`no rule stored at ${address}`);

if (rule.retired) {
  console.log(`${rule.template} ${rule.address} was already retired`);
} else {
  retireRule(address);
  console.log(`retired ${rule.template} ${rule.address}`);
  console.log("the contract remains onchain and enforceable by anyone");
}
