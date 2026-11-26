import { createHash, randomBytes } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { requireDb } from "../src/db";
import { claims, dailyBriefs, deliveries, events, eventVersions, preferences, refreshJobs, sourceDocuments, sources, users } from "../src/db/schema";
import { deliverBriefForUser } from "../src/lib/delivery";
import { createDueScheduledJobs } from "../src/lib/job-engine";

const baseUrl = (process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const db = requireDb();
const checks: string[] = [];
const createdJobIds: string[] = [];
const createdSourceIds: string[] = [];
const pausedSourceIds: string[] = [];
let createdUserId: string | null = null;
let sessionCookie = "";
let modeCookie = "";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function record(value: unknown): Record<string, unknown> {
  assert(typeof value === "object" && value !== null && !Array.isArray(value), "API 响应不是对象");
  return value as Record<string, unknown>;
}

function pass(message: string) {
  checks.push(message);
  console.log(`PASS ${message}`);
}

async function api(path: string, options: { method?: string; body?: unknown; auth?: boolean; origin?: string; mode?: "demo" | "live" } = {}) {
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.set("Origin", options.origin ?? baseUrl);
  if (options.auth !== false && sessionCookie) headers.set("Cookie", sessionCookie);
  const mode = options.mode ?? modeCookie;
  if (mode) headers.set("Cookie", `${sessionCookie}; fi_mode=${mode}`);
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? (options.body === undefined ? "GET" : "POST"),
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  return { response, body };
}

function jobFrom(value: unknown): { id: string; status: string } {
  const job = record(record(value).job);
  assert(typeof job.id === "string" && typeof job.status === "string", "任务响应缺少 id/status");
  return { id: job.id, status: job.status };
}

async function waitForJob(id: string): Promise<Record<string, unknown>> {
  const deadline = Date.now() + 240_000;
  while (Date.now() < deadline) {
    const { response, body } = await api("/api/jobs");
    assert(response.ok, `读取任务失败：${response.status}`);
    const jobs = record(body).jobs;
    assert(Array.isArray(jobs), "任务列表格式无效");
    const job = jobs.map(record).find((item) => item.id === id);
    if (job && ["completed", "partial", "failed"].includes(String(job.status))) return job;
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error(`任务 ${id} 超时未完成`);
}

async function cleanup(existingEventIds: Set<string>) {
  if (createdJobIds.length) await db.delete(dailyBriefs).where(inArray(dailyBriefs.jobId, createdJobIds));
  if (createdJobIds.length) await db.delete(refreshJobs).where(inArray(refreshJobs.id, createdJobIds));
  if (createdSourceIds.length) {
    const currentEvents = await db.select({ id: events.id }).from(events);
    const newIds = currentEvents.map((event) => event.id).filter((id) => !existingEventIds.has(id));
    if (newIds.length) await db.delete(events).where(inArray(events.id, newIds));
    await db.delete(sources).where(inArray(sources.id, createdSourceIds));
  }
  if (pausedSourceIds.length) await db.update(sources).set({ enabled: true }).where(inArray(sources.id, pausedSourceIds));
  if (createdUserId) await db.delete(users).where(eq(users.id, createdUserId));
}

async function main() {
  const existingEventIds = new Set((await db.select({ id: events.id }).from(events)).map((event) => event.id));

  try {
  const unauthorized = await api("/api/refresh", { method: "POST", body: {}, auth: false });
  assert(unauthorized.response.status === 401, `未授权刷新应返回 401，实际 ${unauthorized.response.status}`);
  const privatePreferences = await api("/api/preferences", { auth: false });
  assert(privatePreferences.response.status === 401, "未授权访客读取了私有配置");
  pass("未授权访客不能刷新或读取私有配置");

  const password = randomBytes(24).toString("base64url");
  const setup = await api("/api/auth/setup", {
    method: "POST",
    body: { email: `smoke-${Date.now()}@example.invalid`, name: "临时验收管理员", password },
  });
  assert(setup.response.status === 201, `管理员初始化失败：${JSON.stringify(setup.body)}`);
  createdUserId = String(record(setup.body).user ? record(record(setup.body).user).id : "");
  const setCookie = setup.response.headers.get("set-cookie") ?? "";
  sessionCookie = setCookie.split(";")[0] ?? "";
  assert(sessionCookie.startsWith("fi_session="), "初始化未建立服务端会话");
  modeCookie = "live";
  pass("首管理员与服务端会话建立");

  const defaultNames = ["NASA Breaking News", "Google DeepMind Blog", "arXiv cs.AI", "NYT Technology"];
  const enabledDefaults = await db.select({ id: sources.id }).from(sources).where(inArray(sources.name, defaultNames));
  pausedSourceIds.push(...enabledDefaults.map((source) => source.id));
  if (pausedSourceIds.length) await db.update(sources).set({ enabled: false }).where(inArray(sources.id, pausedSourceIds));

  const rss = await api("/api/sources", {
    method: "POST",
    body: {
      name: "[smoke] The Verge RSS",
      channel: "rss",
      adapter: "rss",
      enabled: true,
      config: {
        url: "https://www.theverge.com/rss/index.xml",
        sourceType: "media",
        maxItems: 3,
      },
    },
  });
  assert(rss.response.status === 201, `RSS 来源创建失败：${JSON.stringify(rss.body)}`);
  const rssId = String(record(record(rss.body).source).id);
  createdSourceIds.push(rssId);

  const [first, second] = await Promise.all([
    api("/api/refresh", { method: "POST", body: {} }),
    api("/api/refresh", { method: "POST", body: {} }),
  ]);
  assert(first.response.status === 202 && second.response.status === 202, "手动刷新未进入真实队列");
  const firstJob = jobFrom(first.body);
  const secondJob = jobFrom(second.body);
  assert(firstJob.id === secondJob.id, "并发点击创建了重复任务");
  createdJobIds.push(firstJob.id);
  const completed = await waitForJob(firstJob.id);
  assert(completed.status !== "failed", `真实采集失败：${JSON.stringify(completed.errorSummary)}`);
  const documents = await db.select({ id: sourceDocuments.id }).from(sourceDocuments).where(eq(sourceDocuments.sourceId, rssId));
  assert(documents.length > 0, `任务完成但没有真实 RSS 文档：${JSON.stringify(completed)}`);
  const liveEventsAfterSuccess = await db.select({ id: events.id }).from(events).where(eq(events.mode, "live"));
  assert(liveEventsAfterSuccess.length > 0, "真实文档没有形成保守事件候选");
  pass(`手动刷新执行真实后台采集（${documents.length} 篇文档，${liveEventsAfterSuccess.length} 个事件）`);
  pass("多次点击合并且不并发创建重复任务");

  const demoRefresh = await api("/api/refresh", { method: "POST", body: {}, mode: "demo" });
  assert(demoRefresh.response.status === 409, "演示模式触发了真实采集");
  pass("演示模式不触发真实采集");

  const crossSite = await api("/api/refresh", { method: "POST", body: {}, origin: "https://evil.example" });
  assert(crossSite.response.status === 403, "跨站刷新未被拒绝");
  pass("跨站 Mutation 被拒绝");

  const eventId = liveEventsAfterSuccess[0]?.id;
  assert(eventId, "缺少导出测试事件");
  await db.update(events).set({ editorialStatus: "published" }).where(eq(events.id, eventId));
  const privateMarker = `PRIVATE-SMOKE-${randomBytes(8).toString("hex")}`;
  const state = await api(`/api/events/${eventId}/state`, { method: "POST", body: { bookmarked: true, read: true, privateNote: privateMarker } });
  assert(state.response.ok, `私密状态保存失败：${JSON.stringify(state.body)}`);
  const exported = await api(`/api/events/${eventId}/export`);
  assert(exported.response.ok && typeof exported.body === "string", "公开事件 Markdown 导出失败");
  assert(!exported.body.includes(privateMarker), "私密备注泄露到 Markdown 导出");
  await db.update(events).set({ editorialStatus: "pending" }).where(eq(events.id, eventId));
  pass("收藏/已读/私密备注可用，导出不含私密备注");

  const currentEvent = (await db.select().from(events).where(eq(events.id, eventId)).limit(1))[0];
  assert(currentEvent, "人工编辑测试事件不存在");
  const editBody = {
    title: currentEvent.title,
    summary: "人工核验摘要：本条基于真实 RSS 来源整理，保留原始事件日期、发布日期与证据边界。当前仅有一个独立来源组，不能提升为交叉核验；新增内容仅用于验证人工编辑、版本保存与重大更正进入日报的完整路径，不将来源主张扩展为未经证实的结论。所有人工修正均保留审计记录，并在后续日报中明确提示重大更正，便于读者复核变化前后的证据链与判断口径。",
    summaryEn: "Editorially reviewed summary based on a real RSS document. A single independent source group is retained and no unsupported confirmation is made.",
    eventDate: currentEvent.eventDate.slice(0, 10),
    whyItMatters: "验证人工研究编辑可以把保守机器候选转为来源边界明确的简报记录。",
    evidenceBoundary: "仅一个真实 RSS 来源组；未获得第二独立来源，未读取超出已保存摘录的材料。",
    addedThisRound: "新增人工编辑版本与一条具体复核行动，原始来源版本保留。",
    verificationStatus: "single_source",
    editorialStatus: "published",
    changeSummary: "人工核对来源边界并补充可执行复核步骤",
    majorCorrection: true,
    actions: [{ title: "核对原始报道与同源转载", materials: "真实 RSS 摘录、原始 URL 与抓取时间", verification: "打开原始链接，区分独立报道与同源转载，并记录任何口径冲突", priority: "high", expectedOutput: "一份来源独立性复核记录" }],
  };
  const invalidPromotion = await api(`/api/events/${eventId}/edit`, { method: "POST", body: { ...editBody, verificationStatus: "cross_verified" } });
  assert(invalidPromotion.response.status === 400, "单来源被手动提升为交叉核验");
  const edited = await api(`/api/events/${eventId}/edit`, { method: "POST", body: editBody });
  assert(edited.response.ok, `人工编辑保存失败：${JSON.stringify(edited.body)}`);
  const versions = await db.select({ id: eventVersions.id }).from(eventVersions).where(eq(eventVersions.eventId, eventId));
  const corrections = await db.select({ id: claims.id, kind: claims.kind }).from(claims).where(eq(claims.eventId, eventId));
  assert(versions.length >= 2 && corrections.some((claim) => claim.kind === "correction"), "人工编辑未保留版本或更正 claim");
  pass("人工编辑保留版本，单来源不能凭空升级为交叉核验");

  const broken = await api("/api/sources", {
    method: "POST",
    body: {
      name: "[smoke] Broken RSS",
      channel: "rss",
      adapter: "rss",
      enabled: true,
      config: { url: "https://example.com/feed-not-found.xml", sourceType: "media", maxItems: 2 },
    },
  });
  assert(broken.response.status === 201, "失败来源创建失败");
  createdSourceIds.push(String(record(record(broken.body).source).id));
  const retry = await api(`/api/jobs/${firstJob.id}/retry`, { method: "POST", body: {} });
  assert(retry.response.status === 202, `任务重试失败：${JSON.stringify(retry.body)}`);
  const retryJob = jobFrom(retry.body);
  createdJobIds.push(retryJob.id);
  const partial = await waitForJob(retryJob.id);
  assert(partial.status === "partial", `单源失败应产生部分失败，实际 ${String(partial.status)}`);
  const retained = await db.select({ id: events.id }).from(events).where(eq(events.mode, "live"));
  assert(retained.length >= liveEventsAfterSuccess.length, "部分渠道失败覆盖了已验证内容");
  pass("部分渠道失败仍保留已有内容并标记部分失败");

  const briefRows = await db.select().from(dailyBriefs).where(eq(dailyBriefs.jobId, retryJob.id)).limit(1);
  const brief = briefRows[0];
  assert(brief && createdUserId, "缺少投递幂等测试日报");
  assert(brief.majorCorrections.some((correction) => correction.includes("人工编辑")), "重大人工更正未进入日报");
  pass("重大人工更正进入下一份日报");
  await db.update(preferences).set({ emailEnabled: true, emailTarget: "smoke@example.invalid" }).where(eq(preferences.userId, createdUserId));
  const targetHash = createHash("sha256").update("smoke@example.invalid").digest("hex");
  const deliveryKey = createHash("sha256").update(`${brief.id}|email|${targetHash}`).digest("hex");
  await db.insert(deliveries).values({ briefId: brief.id, channel: "email", targetHash, idempotencyKey: deliveryKey, status: "sent", sentAt: new Date() });
  const [deliveryOnce, deliveryTwice] = await Promise.all([
    deliverBriefForUser(brief.id, createdUserId),
    deliverBriefForUser(brief.id, createdUserId),
  ]);
  assert(deliveryOnce[0]?.status === "sent" && deliveryTwice[0]?.status === "sent", "自动任务重跑重复推送");
  const deliveryRows = await db.select({ id: deliveries.id }).from(deliveries).where(eq(deliveries.idempotencyKey, deliveryKey));
  assert(deliveryRows.length === 1, "投递幂等键重复");
  pass("自动任务重跑使用独立投递幂等键，不重复推送");

  await db.update(preferences).set({ updateTime: "00:00", timezone: "UTC" }).where(eq(preferences.userId, createdUserId));
  const scheduleNow = new Date();
  const scheduledOnce = await createDueScheduledJobs(scheduleNow);
  const scheduledTwice = await createDueScheduledJobs(scheduleNow);
  assert(scheduledOnce.length === 1 && scheduledTwice.length === 0, "自动调度槽位重复创建或抖动后无法补跑");
  if (scheduledOnce[0]) createdJobIds.push(scheduledOnce[0].job.id);
  pass("自动调度支持到期补跑且槽位幂等");

  const demoRows = await db.select({ id: events.id }).from(events).where(eq(events.mode, "demo"));
  assert(demoRows.length === 0, "演示记录混入真实数据库");
  pass("演示数据未混入真实日报或数据库");

  console.log(`\n${checks.length} 项真实端到端检查通过。`);
  } finally {
    await cleanup(existingEventIds);
    console.log("临时管理员、任务、来源与新增测试事件已按 ID 清理。");
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : "真实端到端验收失败");
  process.exitCode = 1;
});
