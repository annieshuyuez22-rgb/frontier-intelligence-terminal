import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDb } from "@/db";
import { sources } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { collectorIsConfigured } from "@/lib/collectors";
import { ApiError, readJson, requireMutation, runApi } from "../_lib/http";
import { defaultChannel, sourceInputSchema, validateSourceInput } from "./_schema";

function publicSource(source: typeof sources.$inferSelect): Record<string, unknown> {
  return {
    id: source.id,
    name: source.name,
    channel: source.channel,
    adapter: source.adapter,
    config: source.config,
    enabled: source.enabled,
    configured: collectorIsConfigured(source.adapter, source.config),
    lastAttemptAt: source.lastAttemptAt?.toISOString() ?? null,
    lastSuccessAt: source.lastSuccessAt?.toISOString() ?? null,
    lastError: source.lastError,
    consecutiveFailures: source.consecutiveFailures,
  };
}

export async function GET(): Promise<Response> {
  return runApi(async () => {
    await requireAdmin();
    const rows = await requireDb().select().from(sources).orderBy(desc(sources.createdAt)).limit(200);
    return NextResponse.json({ sources: rows.map(publicSource) });
  });
}

export async function POST(request: Request): Promise<Response> {
  return runApi(async () => {
    await requireMutation(request, true);
    const input = await readJson(request, sourceInputSchema);
    await validateSourceInput(input);
    const inserted = await requireDb().insert(sources).values({
      name: input.name,
      channel: input.channel ?? defaultChannel(input.adapter),
      adapter: input.adapter,
      config: input.config,
      enabled: input.enabled,
    }).returning();
    if (!inserted[0]) throw new Error("来源创建失败");
    return NextResponse.json({ source: publicSource(inserted[0]) }, { status: 201 });
  });
}

const sourceStateSchema = z.object({ sourceId: z.string().uuid(), enabled: z.boolean() }).strict();

export async function PATCH(request: Request): Promise<Response> {
  return runApi(async () => {
    await requireMutation(request, true);
    const input = await readJson(request, sourceStateSchema);
    const updated = await requireDb().update(sources).set({ enabled: input.enabled, updatedAt: new Date() }).where(eq(sources.id, input.sourceId)).returning();
    if (!updated[0]) throw new ApiError(404, "来源不存在");
    return NextResponse.json({ source: publicSource(updated[0]) });
  });
}
