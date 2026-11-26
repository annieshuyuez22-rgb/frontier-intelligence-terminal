import Decimal from "decimal.js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDb } from "@/db";
import { preferences } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { validatePublicUrl } from "@/lib/security";
import { ApiError, readJson, requireMutation, runApi } from "../_lib/http";

function timezoneValid(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

const budgetSchema = z.union([z.string(), z.number()]).transform(String).refine((value) => {
  const decimal = new Decimal(value);
  return decimal.isFinite() && decimal.gte(0) && decimal.lte(1_000_000);
}, "预算必须在 0-1000000 之间");

const preferenceSchema = z.object({
  timezone: z.string().max(100).refine(timezoneValid, "IANA 时区无效").default("Asia/Shanghai"),
  updateTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).default("08:00"),
  language: z.enum(["zh", "en"]).default("zh"),
  watchedTopics: z.array(z.string().trim().min(1).max(200)).max(100).default([]),
  watchedCompanies: z.array(z.string().trim().min(1).max(200)).max(100).default([]),
  competitors: z.array(z.string().trim().min(1).max(200)).max(100).default([]),
  businessGoals: z.string().max(10_000).default(""),
  narrativeDefinitions: z.record(z.string().min(1).max(100), z.string().max(5_000)).default({}),
  emailEnabled: z.boolean().default(false),
  emailTarget: z.string().trim().max(320).default(""),
  webhookEnabled: z.boolean().default(false),
  webhookTarget: z.string().trim().max(2_000).default(""),
  dailyBudgetUsd: budgetSchema.default("10"),
  refreshBudgetUsd: budgetSchema.default("2"),
}).strict().superRefine((value, context) => {
  if (Object.keys(value.narrativeDefinitions).length > 100) context.addIssue({ code: "custom", message: "叙事定义最多 100 条", path: ["narrativeDefinitions"] });
  if (value.emailEnabled && !z.email().safeParse(value.emailTarget).success) context.addIssue({ code: "custom", message: "启用邮件时必须提供有效邮箱", path: ["emailTarget"] });
  if (value.emailTarget && !z.email().safeParse(value.emailTarget).success) context.addIssue({ code: "custom", message: "邮箱格式无效", path: ["emailTarget"] });
  if (value.webhookEnabled && !value.webhookTarget) context.addIssue({ code: "custom", message: "启用 webhook 时必须提供目标 URL", path: ["webhookTarget"] });
});

function publicPreference(preference: typeof preferences.$inferSelect): Record<string, unknown> {
  return {
    timezone: preference.timezone,
    updateTime: preference.updateTime,
    language: preference.language,
    watchedTopics: preference.watchedTopics,
    watchedCompanies: preference.watchedCompanies,
    competitors: preference.competitors,
    businessGoals: preference.businessGoals,
    narrativeDefinitions: preference.narrativeDefinitions,
    emailEnabled: preference.emailEnabled,
    emailTarget: preference.emailTarget,
    webhookEnabled: preference.webhookEnabled,
    webhookTarget: preference.webhookTarget,
    dailyBudgetUsd: preference.dailyBudgetUsd,
    refreshBudgetUsd: preference.refreshBudgetUsd,
    updatedAt: preference.updatedAt.toISOString(),
  };
}

export async function GET(): Promise<Response> {
  return runApi(async () => {
    const user = await requireUser();
    const preference = await requireDb().query.preferences.findFirst({ where: (table, { eq }) => eq(table.userId, user.id) });
    if (!preference) throw new ApiError(404, "偏好尚未初始化");
    return NextResponse.json({ preference: publicPreference(preference) });
  });
}

export async function POST(request: Request): Promise<Response> {
  return runApi(async () => {
    const user = await requireMutation(request);
    const input = await readJson(request, preferenceSchema);
    if (input.webhookTarget) await validatePublicUrl(input.webhookTarget);
    const values = {
      timezone: input.timezone,
      updateTime: input.updateTime,
      language: input.language,
      watchedTopics: [...new Set(input.watchedTopics)],
      watchedCompanies: [...new Set(input.watchedCompanies)],
      competitors: [...new Set(input.competitors)],
      businessGoals: input.businessGoals,
      narrativeDefinitions: input.narrativeDefinitions,
      emailEnabled: input.emailEnabled,
      emailTarget: input.emailTarget.toLowerCase(),
      webhookEnabled: input.webhookEnabled,
      webhookTarget: input.webhookTarget,
      dailyBudgetUsd: new Decimal(input.dailyBudgetUsd).toFixed(2),
      refreshBudgetUsd: new Decimal(input.refreshBudgetUsd).toFixed(2),
      updatedAt: new Date(),
    };
    const inserted = await requireDb().insert(preferences).values({ userId: user.id, ...values }).onConflictDoUpdate({
      target: preferences.userId,
      set: values,
    }).returning();
    if (!inserted[0]) throw new ApiError(500, "偏好保存失败");
    return NextResponse.json({ preference: publicPreference(inserted[0]) });
  });
}
