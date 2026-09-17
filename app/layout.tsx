import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = { title: "信息问卷", description: "填写基本信息" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
