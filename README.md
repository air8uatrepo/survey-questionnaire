# 问卷调查应用

一个无需登录的四题问卷：姓名、电话、地址和昵称。访客仅能提交；导出接口需要管理员导出密钥，避免公开个人信息。

## 配置

1. 复制 `.env.example` 为 `.env.local`，填写 Supabase 项目地址、`service_role` 密钥与至少 16 位的 `EXPORT_SECRET`。
2. 通过 Supabase MCP 的 `execute_sql` 执行 `supabase/001_create_survey_responses.sql`。
3. 运行 `npm install`，再运行 `npm run dev`。

## 导出

展开页面的“管理员导出”，输入 `EXPORT_SECRET` 即可下载 UTF-8 CSV。也可向 `GET /api/export` 发送 `x-export-secret` 请求头。

## 部署

在 Vercel 的 Production 与 Preview 环境中设置 `SUPABASE_URL`、`SUPABASE_SECRET_KEY` 与 `EXPORT_SECRET`。这些均是服务器变量，不要使用 `NEXT_PUBLIC_` 前缀。
