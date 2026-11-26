import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDb } from "@/db";
import { claims, citations, events, eventVersions, sourceDocuments } from "@/db/schema";
import { VERIFICATION_STATUSES } from "@/lib/domain";
import { ApiError, readJson, requireMutation, runApi, uuidSchema } from "../../../_lib/http";

const editSchema = z.object({
  title: z.string().trim().min(1).max(300),
  summary: z.string().trim().min(1).max(4_000),
  summaryEn: z.string().trim().max(4_000).optional().default(""),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  whyItMatters: z.string().trim().min(1).max(2_000),
  evidenceBoundary: z.string().trim().min(1).max(2_000),
  addedThisRound: z.string().trim().min(1).max(1_000),
  verificationStatus: z.enum(VERIFICATION_STATUSES),
  editorialStatus: z.enum(["published", "pending", "hidden"]),
  changeSummary: z.string().trim().min(1).max(1_000),
  majorCorrection: z.boolean().default(false),
  actions: z.array(z.object({
    id: z.string().max(200).optional(),
    title: z.string().trim().min(1).max(300),
    materials: z.string().trim().min(1).max(2_000),
    verification: z.string().trim().min(1).max(2_000),
    priority: z.enum(["high", "medium", "low"]),
    expectedOutput: z.string().trim().min(1).max(1_000),
  }).strict()).max(3),
}).strict().superRefine((input, context) => {
  if (input.editorialStatus === "published" && input.summary.length < 150) {
    context.addIssue({ code: "custom", path: ["summary"], message: "发布前摘要至少 150 字；重大事件可超过 300 字" });
  }
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return runApi(async () => {
    const user = await requireMutation(request, true);
    const eventId = uuidSchema.parse((await context.params).id);
    const input = await readJson(request, editSchema, 64 * 1024);
    const db = requireDb();
    const independent = await db.select({ count: sql<number>`count(distinct ${sourceDocuments.originGroup})::int` })
      .from(citations)
      .innerJoin(claims, eq(citations.claimId, claims.id))
      .innerJoin(sourceDocuments, eq(citations.sourceDocumentId, sourceDocuments.id))
      .where(eq(claims.eventId, eventId));
    if (input.verificationStatus === "cross_verified" && (independent[0]?.count ?? 0) < 2) {
      throw new ApiError(400, "至少两个独立来源组才能标为已交叉核验");
    }
    const updated = await db.transaction(async (tx) => {
      const lockedRows = await tx.select().from(events).where(and(eq(events.id, eventId), eq(events.mode, "live"))).for("update").limit(1);
      const existing = lockedRows[0];
      if (!existing) throw new ApiError(404, "真实事件不存在");
      const dateChanged = existing.eventDate.slice(0, 10) !== input.eventDate;
      const nextEventDate = `${input.eventDate}T00:00:00.000Z`;
      const updatedRows = await tx.update(events).set({
        title: input.title,
        summary: input.summary,
        summaryEn: input.summaryEn || null,
        eventDate: nextEventDate,
        whyItMatters: input.whyItMatters,
        evidenceBoundary: input.evidenceBoundary,
        addedThisRound: input.addedThisRound,
        verificationStatus: input.verificationStatus,
        editorialStatus: input.editorialStatus,
        actions: input.actions.map((action) => ({ ...action, id: action.id ?? `act-${randomUUID()}` })),
        lastUpdatedAt: new Date().toISOString(),
        updatedAt: new Date(),
      }).where(eq(events.id, eventId)).returning();
      const event = updatedRows[0];
      if (!event) throw new Error("人工编辑保存失败");
      await tx.insert(claims).values({
        eventId,
        text: `人工修正（${user.name}）：${input.changeSummary}`,
        kind: "correction",
        position: 1_000,
      });
      const versions = await tx.select({ version: sql<number>`coalesce(max(${eventVersions.version}), 0)::int` }).from(eventVersions).where(eq(eventVersions.eventId, eventId));
      await tx.insert(eventVersions).values({
        eventId,
        version: (versions[0]?.version ?? 0) + 1,
        snapshot: { event, editor: { id: user.id, name: user.name, changeSummary: input.changeSummary } },
        changeSummary: `人工编辑：${input.changeSummary}`,
        majorCorrection: input.majorCorrection || dateChanged,
        authorId: user.id,
      });
      return event;
    });
    return NextResponse.json({ event: updated });
  });
}
