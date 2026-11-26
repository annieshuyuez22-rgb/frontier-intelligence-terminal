import { z } from "zod";
import { collectorFetch, requireOk } from "./http";
import type { Collector, CollectorContext, CollectorResult } from "./types";
import { asArray, asRecord, createDocument, nextPublishedCursor, textValue, validDate } from "./utils";

const configSchema = z.object({
  organizationId: z.string().trim().regex(/^\d+$/).max(30),
  maxResults: z.number().int().min(1).max(100).default(25),
}).passthrough();

export class LinkedInCollector implements Collector {
  readonly adapter = "linkedin";

  async collect(context: CollectorContext): Promise<CollectorResult> {
    const token = process.env.LINKEDIN_ACCESS_TOKEN;
    if (!token) {
      return { status: "unconfigured", documents: [], cursor: context.cursor, message: "LINKEDIN_ACCESS_TOKEN 未配置" };
    }
    if (!context.source.config.organizationId) {
      return { status: "unconfigured", documents: [], cursor: context.cursor, message: "LinkedIn organizationId 未配置" };
    }
    const config = configSchema.parse(context.source.config);
    const version = process.env.LINKEDIN_API_VERSION || "202601";
    const endpoint = new URL(process.env.LINKEDIN_API_BASE_URL || "https://api.linkedin.com/rest/posts");
    endpoint.searchParams.set("q", "author");
    endpoint.searchParams.set("author", `urn:li:organization:${config.organizationId}`);
    endpoint.searchParams.set("count", String(config.maxResults));
    endpoint.searchParams.set("start", String(typeof context.cursor.start === "number" ? context.cursor.start : 0));
    const response = requireOk(await collectorFetch(endpoint, {
      headers: {
        authorization: `Bearer ${token}`,
        "LinkedIn-Version": version,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      signal: context.signal,
      cache: false,
      minIntervalMs: 2_000,
    }), "LinkedIn organization posts");
    const payload = asRecord(JSON.parse(response.text));
    const fetchedAt = (context.now ?? new Date()).toISOString();
    const documents = asArray(payload?.elements).flatMap((value) => {
      const post = asRecord(value);
      const id = textValue(post?.id);
      if (!post || !id) return [];
      const commentary = textValue(post.commentary) || textValue(asRecord(post.content)?.title);
      const organization = textValue(asRecord(post.author)?.organization) || config.organizationId;
      return [createDocument({
        url: `https://www.linkedin.com/feed/update/${encodeURIComponent(id)}`,
        title: `LinkedIn 组织 ${organization} 发布`,
        excerpt: commentary,
        publishedAt: validDate(post.publishedAt ?? post.createdAt),
        author: organization,
        channel: "linkedin",
        sourceType: "official",
        accessStatus: "official_api_post",
        isFullText: Boolean(commentary),
        fetchedAt,
        metadata: { adapter: "linkedin", id, lifecycleState: textValue(post.lifecycleState) || null, apiVersion: version },
      })];
    });
    const paging = asRecord(payload?.paging);
    const start = typeof paging?.start === "number" ? paging.start : 0;
    const count = typeof paging?.count === "number" ? paging.count : config.maxResults;
    const total = typeof paging?.total === "number" ? paging.total : 0;
    return {
      status: "success",
      documents,
      cursor: {
        ...nextPublishedCursor(documents, context.cursor),
        start: total > start + count ? start + count : 0,
        apiVersion: version,
      },
    };
  }
}
