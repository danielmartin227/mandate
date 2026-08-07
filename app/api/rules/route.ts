// GET /api/rules
// Returns the active deployed rules from the JSON store. No model, no chain call.
// Retired rules (superseded template versions) are history and stay out of the UI.
import { NextResponse } from "next/server";
import { loadActiveRules } from "../../../src/rules/rule-store.js";

export async function GET() {
  try {
    const rules = loadActiveRules();
    // Strip the full ABI from the response; the frontend does not need it and
    // it bloats the payload significantly.
    const slim = rules.map(({ abi: _abi, ...rest }) => rest);
    return NextResponse.json(slim);
  } catch (e: any) {
    console.error("[/api/rules]", e);
    return NextResponse.json([], { status: 200 });
  }
}
