import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseRequest } from "@/lib/supabase";

type StoredResponse = { name: string; phone: string; address: string; nickname: string; created_at: string };
function isAuthorized(request: Request) {
  const supplied = request.headers.get("x-export-secret") ?? ""; const expected = process.env.EXPORT_SECRET ?? "";
  const suppliedBuffer = Buffer.from(supplied); const expectedBuffer = Buffer.from(expected);
  return expected.length >= 16 && suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
}
function csvCell(value: string) { const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value; return `"${safeValue.replaceAll('"', '""')}"`; }
export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "导出密钥无效" }, { status: 401 });
  try {
    const response = await supabaseRequest("survey_responses?select=name,phone,address,nickname,created_at&order=created_at.desc");
    const rows = (await response.json()) as StoredResponse[];
    const body = [["姓名", "电话", "地址", "昵称", "提交时间"].map(csvCell).join(","), ...rows.map((row) => [row.name, row.phone, row.address, row.nickname, row.created_at].map(csvCell).join(","))].join("\r\n");
    return new NextResponse(`\uFEFF${body}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="survey-responses.csv"' } });
  } catch (error) { console.error("Could not export survey responses", error); return NextResponse.json({ error: "导出失败，请稍后再试。" }, { status: 500 }); }
}
