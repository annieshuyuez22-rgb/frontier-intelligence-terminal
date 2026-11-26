import { and, asc, eq } from "drizzle-orm";
import { requireDb } from "@/db";
import { citations, claims, events, fundingRounds, sourceDocuments } from "@/db/schema";
import { ApiError, runApi, uuidSchema } from "../../../_lib/http";

function markdownText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r\n?/g, "\n").trim();
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  request.headers.get("user-agent");
  return runApi(async () => {
    const eventId = uuidSchema.parse((await context.params).id);
    const db = requireDb();
    const eventRows = await db.select().from(events).where(and(
      eq(events.id, eventId),
      eq(events.mode, "live"),
      eq(events.editorialStatus, "published"),
    )).limit(1);
    const event = eventRows[0];
    if (!event) throw new ApiError(404, "公开事件不存在");
    const [fundingRows, claimRows, sourceRows] = await Promise.all([
      db.select().from(fundingRounds).where(eq(fundingRounds.eventId, eventId)).limit(1),
      db.select().from(claims).where(eq(claims.eventId, eventId)).orderBy(asc(claims.position)),
      db.select({
        title: sourceDocuments.title,
        url: sourceDocuments.canonicalUrl,
        originGroup: sourceDocuments.originGroup,
        accessStatus: sourceDocuments.accessStatus,
        publishedAt: sourceDocuments.publishedAt,
        isFullText: sourceDocuments.isFullText,
      }).from(citations).innerJoin(claims, eq(claims.id, citations.claimId)).innerJoin(sourceDocuments, eq(sourceDocuments.id, citations.sourceDocumentId)).where(eq(claims.eventId, eventId)),
    ]);
    const uniqueSources = [...new Map(sourceRows.map((source) => [source.url, source])).values()];
    const lines = [
      `# ${markdownText(event.title)}`,
      "",
      `- 事件日期：${event.eventDate}`,
      `- 核验状态：${event.verificationStatus}`,
      `- 信息类型：${event.infoType}`,
      `- 证据边界：${markdownText(event.evidenceBoundary)}`,
      "",
      "## 摘要",
      markdownText(event.summary),
      "",
      "## 影响分析",
      markdownText(event.whyItMatters),
    ];
    const funding = fundingRows[0];
    if (funding) {
      lines.push("", "## 融资归一化");
      lines.push(`- 原币金额：${funding.amountOriginal ?? "未披露"} ${funding.currency}`);
      lines.push(`- 美元金额：${funding.amountUsd ?? "unknown"}`);
      lines.push(`- 类型 / 阶段 / 资格：${funding.type} / ${funding.stage} / ${funding.qualification}`);
      lines.push(`- FX：${funding.fxRate ?? "unknown"}｜${funding.fxSource ?? "unknown"}｜${funding.fxDate ?? "unknown"}`);
    }
    const facts = claimRows.filter((claim) => claim.kind === "fact");
    const inferences = claimRows.filter((claim) => claim.kind === "ai_inference");
    if (facts.length > 0) lines.push("", "## 来源事实摘录", ...facts.map((claim) => `- ${markdownText(claim.text)}`));
    if (inferences.length > 0) lines.push("", "## AI 推断（未核验，非来源事实）", ...inferences.map((claim) => `- ${markdownText(claim.text)}`));
    if (uniqueSources.length > 0) {
      lines.push("", "## 公开来源");
      for (const source of uniqueSources) {
        lines.push(`- [${markdownText(source.title)}](${source.url}) — ${source.originGroup}；${source.isFullText ? "全文" : "摘要"}；${source.accessStatus}`);
      }
    }
    lines.push("", `导出生成时间：${new Date().toISOString()}`, "");
    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="event-${event.id}.md"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
