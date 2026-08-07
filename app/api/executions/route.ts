// GET /api/executions
// Returns the execution log. The watcher appends to this file; the UI polls it.
import { NextResponse } from "next/server";
import { loadExecutions } from "../../../src/rules/execution-store.js";

export async function GET() {
  try {
    const executions = loadExecutions();
    // Most recent first.
    return NextResponse.json(executions.reverse());
  } catch (e: any) {
    console.error("[/api/executions]", e);
    return NextResponse.json([], { status: 200 });
  }
}
