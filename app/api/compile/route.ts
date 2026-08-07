// POST /api/compile
// Wraps the AI interpreter. This is the only network path that reaches a model.
import { NextResponse } from "next/server";
import { compileSentence } from "../../../src/interpreter/compile-sentence-to-rule.js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sentence = body?.sentence;
    if (typeof sentence !== "string" || !sentence.trim()) {
      return NextResponse.json(
        { error: "sentence is required" },
        { status: 400 },
      );
    }

    const result = await compileSentence(sentence.trim());
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("[/api/compile]", e);
    return NextResponse.json(
      { error: e.message ?? "compile failed" },
      { status: 500 },
    );
  }
}
