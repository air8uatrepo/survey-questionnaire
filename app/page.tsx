"use client";

import { FormEvent, useState } from "react";

const fields = [
  { name: "name", label: "姓名", autoComplete: "name" },
  { name: "phone", label: "电话", autoComplete: "tel", inputMode: "tel" },
  { name: "address", label: "地址", autoComplete: "street-address" },
  { name: "nickname", label: "昵称", autoComplete: "nickname" },
] as const;
type FieldName = (typeof fields)[number]["name"];
type FormValues = Record<FieldName, string>;
const emptyForm: FormValues = { name: "", phone: "", address: "", nickname: "" };

export default function Home() {
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportSecret, setExportSecret] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setIsSubmitting(true);
    try {
      const response = await fetch("/api/responses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "提交失败，请稍后再试。");
      setValues(emptyForm); setMessage("已提交，感谢您的填写！");
    } catch (error) { setMessage(error instanceof Error ? error.message : "提交失败，请稍后再试。"); }
    finally { setIsSubmitting(false); }
  }

  async function exportResponses() {
    setMessage(""); setIsExporting(true);
    try {
      const response = await fetch("/api/export", { headers: { "x-export-secret": exportSecret } });
      if (!response.ok) { const result = (await response.json()) as { error?: string }; throw new Error(result.error || "导出失败，请稍后再试。"); }
      const file = await response.blob(); const downloadUrl = URL.createObjectURL(file); const link = document.createElement("a");
      link.href = downloadUrl; link.download = "survey-responses.csv"; link.click(); URL.revokeObjectURL(downloadUrl); setMessage("导出已开始下载。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "导出失败，请稍后再试。"); }
    finally { setIsExporting(false); }
  }

  return <main><section className="card" aria-labelledby="title">
    <p className="eyebrow">简单问卷</p><h1 id="title">请填写您的信息</h1><p className="intro">所有问题均为必填项。</p>
    <form onSubmit={submit}>{fields.map((field) => <label key={field.name}>{field.label}<input autoComplete={field.autoComplete} inputMode={field.name === "phone" ? "tel" : undefined} name={field.name} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} required value={values[field.name]} /></label>)}<button disabled={isSubmitting} type="submit">{isSubmitting ? "提交中…" : "提交问卷"}</button></form>
    <details className="export"><summary>管理员导出</summary><label>导出密钥<input onChange={(event) => setExportSecret(event.target.value)} type="password" value={exportSecret} /></label><button disabled={isExporting || !exportSecret} onClick={exportResponses} type="button">{isExporting ? "导出中…" : "下载 CSV"}</button></details>
    {message && <p aria-live="polite" className="message">{message}</p>}
  </section></main>;
}
