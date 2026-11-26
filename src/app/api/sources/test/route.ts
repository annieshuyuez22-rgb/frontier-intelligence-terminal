import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDb } from "@/db";
import { sources } from "@/db/schema";
import { getCollector } from "@/lib/collectors";
import { ApiError, enforceRateLimit, readJson, requireLiveMode, requireMutation, runApi } from "../../_lib/http";
import { defaultChannel, sourceInputSchema, validateSourceInput, type SourceInput } from "../_schema";

const testSchema = z.object({
  sourceId: z.string().uuid().optional(),
  source: sourceInputSchema.optional(),
  maxDocuments: z.number().int().min(1).max(10).default(3),
}).strict().refine((value) => Boolean(value.sourceId) !== Boolean(value.source), "sourceId 与 source 必须且只能提供一个");

export async function POST(request: Request): Promise<Response> {
  return runApi(async () => {
    const user = await requireMutation(request, true);
    await requireLiveMode();
    enforceRateLimit(request, "source-test", 10, 15 * 60 * 1000, user.id);
    const input = await readJson(request, testSchema);
    let source: SourceInput;
    if (input.sourceId) {
      const rows = await requireDb().select().from(sources).where(eq(sources.id, input.sourceId)).limit(1);
      if (!rows[0]) throw new ApiError(404, "来源不存在");
      source = sourceInputSchema.parse({
        name: rows[0].name,
        channel: rows[0].channel,
        adapter: rows[0].adapter,
        enabled: rows[0].enabled,
        config: rows[0].config,
      });
    } else if (input.source) {
      source = input.source;
    } else {
      throw new ApiError(400, "缺少测试来源");
    }
    await validateSourceInput(source);
    const config = { ...source.config };
    if (["rss", "atom", "manual", "web"].includes(source.adapter)) config.maxItems = Math.min(config.maxItems ?? 25, input.maxDocuments);
    if (["tavily", "search", "linkedin"].includes(source.adapter)) config.maxResults = Math.min(config.maxResults ?? 10, input.maxDocuments);
    if (source.adapter === "x") config.maxResults = Math.max(10, Math.min(config.maxResults ?? 25, input.maxDocuments));
    const result = await getCollector(source.adapter).collect({
      source: {
        id: input.sourceId ?? "test",
        name: source.name,
        channel: source.channel ?? defaultChannel(source.adapter),
        adapter: source.adapter,
        config,
      },
      cursor: {},
    });
    return NextResponse.json({
      status: result.status,
      message: result.message ?? null,
      documents: result.documents.slice(0, input.maxDocuments),
    });
  });
}
