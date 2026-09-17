import { NextResponse } from "next/server";
import { supabaseRequest } from "@/lib/supabase";
import { responseSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const payload = responseSchema.safeParse(await request.json());
    if (!payload.success) return NextResponse.json({ error: payload.error.issues[0]?.message ?? "输入无效" }, { status: 400 });
    await supabaseRequest("survey_responses", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(payload.data) });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) { console.error("Could not save survey response", error); return NextResponse.json({ error: "提交失败，请稍后再试。" }, { status: 500 }); }
}
