import { and, desc, eq, inArray, lt, or, sql } from "drizzle-orm";
import { requireDb } from "@/db";
import { dailyBriefs, deliveries, events, preferences, refreshJobs } from "@/db/schema";
import { isPreferenceDue } from "./job-engine";
import { canonicalizeUrl } from "./funding";
import { cleanPlainText, secureFetch, sha256 } from "./security";

export interface DeliveryResult {
  briefId: string;
  channel: "email" | "webhook";
  targetHash: string;
  idempotencyKey: string;
  status: "sent" | "failed" | "already_sending" | "disabled";
  error?: string;
}

function localDate(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

async function briefPayload(briefId: string): Promise<Record<string, unknown>> {
  const db = requireDb();
  const briefRows = await db.select().from(dailyBriefs).where(eq(dailyBriefs.id, briefId)).limit(1);
  const brief = briefRows[0];
  if (!brief) throw new Error("简报不存在");
  const briefEvents = brief.eventIds.length > 0
    ? await db.select({
      id: events.id,
      title: events.title,
      summary: events.summary,
      eventDate: events.eventDate,
      verificationStatus: events.verificationStatus,
      editorialStatus: events.editorialStatus,
      category: events.category,
    }).from(events).where(and(inArray(events.id, brief.eventIds), eq(events.mode, "live")))
    : [];
  const order = new Map(brief.eventIds.map((id, index) => [id, index]));
  briefEvents.sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));
  return {
    id: brief.id,
    date: brief.date,
    timezone: brief.timezone,
    mode: "live",
    title: brief.title,
    introduction: brief.introduction,
    stats: brief.stats,
    coverage: brief.coverage,
    generatedAt: brief.generatedAt.toISOString(),
    events: briefEvents,
  };
}

function briefText(payload: Record<string, unknown>): string {
  const eventRows = Array.isArray(payload.events) ? payload.events : [];
  const lines = [
    cleanPlainText(String(payload.title ?? "每日情报"), 300),
    cleanPlainText(String(payload.introduction ?? ""), 2_000),
    "",
  ];
  for (const value of eventRows) {
    if (typeof value !== "object" || value === null) continue;
    const event = value as Record<string, unknown>;
    lines.push(`## ${cleanPlainText(String(event.title ?? ""), 300)}`);
    lines.push(`日期：${String(event.eventDate ?? "未知")}｜核验：${String(event.verificationStatus ?? "unknown")}｜编辑：${String(event.editorialStatus ?? "pending")}`);
    lines.push(cleanPlainText(String(event.summary ?? ""), 4_000), "");
  }
  return lines.join("\n").slice(0, 50_000);
}

async function sendEmail(target: string, payload: Record<string, unknown>, idempotencyKey: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("RESEND_API_KEY 或 RESEND_FROM_EMAIL 未配置");
  const response = await secureFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [target],
      subject: cleanPlainText(String(payload.title ?? "每日情报"), 200),
      text: briefText(payload),
    }),
    timeoutMs: 15_000,
    maxBytes: 512 * 1024,
    maxRedirects: 2,
  });
  if (!response.ok) throw new Error(`Resend 返回 HTTP ${response.status}`);
}

async function sendWebhook(target: string, payload: Record<string, unknown>, idempotencyKey: string): Promise<void> {
  const response = await secureFetch(target, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ brief: payload }),
    timeoutMs: 15_000,
    maxBytes: 512 * 1024,
    maxRedirects: 3,
  });
  if (!response.ok) throw new Error(`Webhook 返回 HTTP ${response.status}`);
}

async function deliverChannel(input: {
  briefId: string;
  channel: "email" | "webhook";
  target: string;
}): Promise<DeliveryResult> {
  const db = requireDb();
  const normalizedTarget = input.channel === "email" ? input.target.trim().toLowerCase() : canonicalizeUrl(input.target);
  const targetHash = sha256(normalizedTarget);
  const idempotencyKey = sha256(`${input.briefId}|${input.channel}|${targetHash}`);
  await db.insert(deliveries).values({
    briefId: input.briefId,
    channel: input.channel,
    targetHash,
    idempotencyKey,
    status: "queued",
  }).onConflictDoNothing();
  const existingRows = await db.select().from(deliveries).where(eq(deliveries.idempotencyKey, idempotencyKey)).limit(1);
  const existing = existingRows[0];
  if (!existing) throw new Error("投递记录创建失败");
  const base = { briefId: input.briefId, channel: input.channel, targetHash, idempotencyKey };
  if (existing.status === "sent" || existing.status === "sending" && existing.createdAt > new Date(Date.now() - 15 * 60 * 1000)) {
    return { ...base, status: existing.status === "sent" ? "sent" : "already_sending" };
  }
  const claimed = await db.update(deliveries).set({
    status: "sending",
    attempts: existing.attempts + 1,
    lastError: null,
  }).where(and(
    eq(deliveries.id, existing.id),
    or(inArray(deliveries.status, ["queued", "failed"]), and(eq(deliveries.status, "sending"), lt(deliveries.createdAt, new Date(Date.now() - 15 * 60 * 1000)))),
  )).returning({ id: deliveries.id });
  if (!claimed[0]) return { ...base, status: "already_sending" };

  try {
    const payload = await briefPayload(input.briefId);
    if (input.channel === "email") await sendEmail(normalizedTarget, payload, idempotencyKey);
    else await sendWebhook(normalizedTarget, payload, idempotencyKey);
    await db.update(deliveries).set({ status: "sent", sentAt: new Date(), lastError: null }).where(eq(deliveries.id, existing.id));
    return { ...base, status: "sent" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "投递失败";
    await db.update(deliveries).set({ status: "failed", lastError: message.slice(0, 500) }).where(eq(deliveries.id, existing.id));
    return { ...base, status: "failed", error: message };
  }
}

export async function deliverBriefForUser(briefId: string, userId: string): Promise<DeliveryResult[]> {
  const db = requireDb();
  const preference = await db.query.preferences.findFirst({ where: eq(preferences.userId, userId) });
  if (!preference) return [];
  const briefRows = await db.select({ id: dailyBriefs.id, jobId: dailyBriefs.jobId }).from(dailyBriefs).where(eq(dailyBriefs.id, briefId)).limit(1);
  const brief = briefRows[0];
  if (!brief) throw new Error("简报不存在");
  if (brief.jobId) {
    const owners = await db.select({ createdBy: refreshJobs.createdBy }).from(refreshJobs).where(eq(refreshJobs.id, brief.jobId)).limit(1);
    if (owners[0]?.createdBy !== userId) throw new Error("无权投递其他用户的简报");
  }
  const results: DeliveryResult[] = [];
  if (preference.emailEnabled && preference.emailTarget) {
    results.push(await deliverChannel({ briefId, channel: "email", target: preference.emailTarget }));
  }
  if (preference.webhookEnabled && preference.webhookTarget) {
    results.push(await deliverChannel({ briefId, channel: "webhook", target: preference.webhookTarget }));
  }
  return results;
}

export async function deliverDueBriefs(now = new Date()): Promise<DeliveryResult[]> {
  const db = requireDb();
  const allPreferences = await db.select().from(preferences);
  const results: DeliveryResult[] = [];
  for (const preference of allPreferences) {
    if (!isPreferenceDue(preference.updateTime, preference.timezone, now)) continue;
    if (!preference.emailEnabled && !preference.webhookEnabled) continue;
    const date = localDate(now, preference.timezone);
    const briefs = await db.select({ id: dailyBriefs.id }).from(dailyBriefs)
      .innerJoin(refreshJobs, eq(refreshJobs.id, dailyBriefs.jobId))
      .where(and(
        eq(refreshJobs.createdBy, preference.userId),
        eq(dailyBriefs.mode, "live"),
        eq(dailyBriefs.date, date),
        eq(dailyBriefs.timezone, preference.timezone),
      )).orderBy(desc(dailyBriefs.generatedAt)).limit(1);
    if (briefs[0]) results.push(...await deliverBriefForUser(briefs[0].id, preference.userId));
  }
  return results;
}

export async function deliveryHealth(): Promise<{ pending: number; failed: number }> {
  const rows = await requireDb().select({ status: deliveries.status, count: sql<number>`count(*)::int` }).from(deliveries).where(inArray(deliveries.status, ["queued", "sending", "failed"])).groupBy(deliveries.status);
  return {
    pending: rows.filter((row) => row.status === "queued" || row.status === "sending").reduce((sum, row) => sum + row.count, 0),
    failed: rows.filter((row) => row.status === "failed").reduce((sum, row) => sum + row.count, 0),
  };
}
