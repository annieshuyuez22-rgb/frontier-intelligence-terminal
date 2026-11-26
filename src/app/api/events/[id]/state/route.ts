import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDb } from "@/db";
import { userEventStates } from "@/db/schema";
import { ApiError, readJson, requireMutation, runApi, uuidSchema } from "../../../_lib/http";

const stateSchema = z.object({
  bookmarked: z.boolean().optional(),
  read: z.boolean().optional(),
  hidden: z.boolean().optional(),
  privateNote: z.string().max(10_000).optional(),
}).strict().refine((value) => Object.values(value).some((field) => field !== undefined), "至少提供一个状态字段");

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return runApi(async () => {
    const user = await requireMutation(request);
    const eventId = uuidSchema.parse((await context.params).id);
    const input = await readJson(request, stateSchema, 16 * 1024);
    const db = requireDb();
    const event = await db.query.events.findFirst({ where: (table, { eq }) => eq(table.id, eventId) });
    if (!event) throw new ApiError(404, "事件不存在");
    const previous = await db.query.userEventStates.findFirst({ where: (table, { and, eq }) => and(eq(table.userId, user.id), eq(table.eventId, eventId)) });
    const values = {
      bookmarked: input.bookmarked ?? previous?.bookmarked ?? false,
      readAt: input.read === undefined ? previous?.readAt ?? null : input.read ? new Date() : null,
      hidden: input.hidden ?? previous?.hidden ?? false,
      privateNote: input.privateNote ?? previous?.privateNote ?? "",
      updatedAt: new Date(),
    };
    const saved = await db.insert(userEventStates).values({ userId: user.id, eventId, ...values }).onConflictDoUpdate({
      target: [userEventStates.userId, userEventStates.eventId],
      set: values,
    }).returning();
    if (!saved[0]) throw new ApiError(500, "事件状态保存失败");
    return NextResponse.json({
      state: {
        eventId,
        bookmarked: saved[0].bookmarked,
        readAt: saved[0].readAt?.toISOString() ?? null,
        hidden: saved[0].hidden,
        privateNote: saved[0].privateNote,
        updatedAt: saved[0].updatedAt.toISOString(),
      },
    });
  });
}
