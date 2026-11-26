import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDb } from "@/db";
import { sources } from "@/db/schema";
import { canonicalizeUrl } from "@/lib/funding";
import { createRefreshJob, jobResultForRoute } from "@/lib/job-engine";
import { validatePublicUrl } from "@/lib/security";
import { ApiError, enforceRateLimit, readJson, requireLiveMode, requireMutation, runApi } from "../../_lib/http";
import { scheduleRefreshExecution } from "../../_lib/jobs";

const manualSchema = z.object({
  url: z.url().max(4_000),
  title: z.string().trim().max(500).optional(),
  sourceType: z.enum(["third_party_review", "media", "preprint"]).default("media"),
  excerptChars: z.number().int().min(200).max(6_000).default(4_000),
}).strict();

function manualSourceId(url: string): string {
  const hex = createHash("sha256").update(`manual:${url}`).digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = ((Number.parseInt(hex[16] ?? "0", 16) & 3) | 8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

export async function POST(request: Request): Promise<Response> {
  return runApi(async () => {
    const user = await requireMutation(request);
    await requireLiveMode();
    enforceRateLimit(request, "manual-collect", 10, 15 * 60 * 1000, user.id);
    const input = await readJson(request, manualSchema, 8 * 1024);
    const url = canonicalizeUrl(input.url);
    await validatePublicUrl(url);
    const id = manualSourceId(url);
    const db = requireDb();
    await db.insert(sources).values({
      id,
      name: `手动网页：${new URL(url).hostname}`,
      channel: "manual",
      adapter: "manual",
      config: {
        url,
        title: input.title,
        sourceType: input.sourceType,
        excerptChars: input.excerptChars,
      },
      enabled: true,
    }).onConflictDoNothing();
    const source = await db.query.sources.findFirst({ where: (table, { eq }) => eq(table.id, id) });
    if (!source) throw new ApiError(500, "手动来源创建失败");
    if (!source.enabled) throw new ApiError(409, "该手动来源已停用");
    const result = await createRefreshJob({ userId: user.id, trigger: "manual", onlySourceId: id });
    scheduleRefreshExecution(result.job.id);
    return NextResponse.json({ ...jobResultForRoute(result), source: { id: source.id, url, adapter: source.adapter } }, { status: 202 });
  });
}
