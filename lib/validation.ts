import { z } from "zod";

export const responseSchema = z.object({
  name: z.string().trim().min(1, "请填写姓名").max(100, "姓名不能超过 100 个字符"),
  phone: z.string().trim().min(6, "请填写有效的电话").max(30, "电话不能超过 30 个字符"),
  address: z.string().trim().min(1, "请填写地址").max(300, "地址不能超过 300 个字符"),
  nickname: z.string().trim().min(1, "请填写昵称").max(100, "昵称不能超过 100 个字符"),
});

export type SurveyResponse = z.infer<typeof responseSchema>;
