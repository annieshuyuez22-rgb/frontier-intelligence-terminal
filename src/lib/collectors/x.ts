import { z } from "zod";
import { collectorFetch, requireOk } from "./http";
import type { Collector, CollectorContext, CollectorResult } from "./types";
import { asArray, asRecord, createDocument, nextPublishedCursor, textValue, validDate } from "./utils";

const configSchema = z.object({
  query: z.string().trim().min(1).max(512),
  maxResults: z.number().int().min(10).max(100).default(25),
}).passthrough();

export class XCollector implements Collector {
  readonly adapter = "x";

  async collect(context: CollectorContext): Promise<CollectorResult> {
    const bearer = process.env.X_BEARER_TOKEN;
    if (!bearer) {
      return { status: "unconfigured", documents: [], cursor: context.cursor, message: "X_BEARER_TOKEN 未配置" };
    }
    const config = configSchema.parse(context.source.config);
    const endpoint = new URL(process.env.X_API_BASE_URL || "https://api.x.com/2/tweets/search/recent");
    endpoint.searchParams.set("query", config.query);
    endpoint.searchParams.set("max_results", String(config.maxResults));
    endpoint.searchParams.set("tweet.fields", "created_at,author_id,lang,public_metrics,conversation_id");
    endpoint.searchParams.set("expansions", "author_id");
    endpoint.searchParams.set("user.fields", "name,username");
    if (typeof context.cursor.nextToken === "string") endpoint.searchParams.set("next_token", context.cursor.nextToken);
    const response = requireOk(await collectorFetch(endpoint, {
      headers: { authorization: `Bearer ${bearer}` },
      signal: context.signal,
      cache: false,
      minIntervalMs: 2_000,
    }), "X recent search");
    const payload = asRecord(JSON.parse(response.text));
    const includes = asRecord(payload?.includes);
    const users = new Map<string, Record<string, unknown>>();
    for (const value of asArray(includes?.users)) {
      const user = asRecord(value);
      if (user && typeof user.id === "string") users.set(user.id, user);
    }
    const fetchedAt = (context.now ?? new Date()).toISOString();
    const documents = asArray(payload?.data).flatMap((value) => {
      const tweet = asRecord(value);
      const id = textValue(tweet?.id);
      if (!tweet || !id) return [];
      const user = users.get(textValue(tweet.author_id));
      const username = textValue(user?.username);
      const author = textValue(user?.name) || username || textValue(tweet.author_id) || null;
      const text = textValue(tweet.text);
      return [createDocument({
        url: username ? `https://x.com/${encodeURIComponent(username)}/status/${encodeURIComponent(id)}` : `https://x.com/i/status/${encodeURIComponent(id)}`,
        title: author ? `${author} 在 X 发布` : `X post ${id}`,
        excerpt: text,
        publishedAt: validDate(tweet.created_at),
        author,
        channel: "x",
        sourceType: "social",
        accessStatus: "official_api_post",
        isFullText: true,
        fetchedAt,
        metadata: {
          adapter: "x",
          id,
          conversationId: textValue(tweet.conversation_id) || null,
          language: textValue(tweet.lang) || null,
          publicMetrics: tweet.public_metrics ?? null,
        },
      })];
    });
    const meta = asRecord(payload?.meta);
    return {
      status: "success",
      documents,
      cursor: { ...nextPublishedCursor(documents, context.cursor), nextToken: textValue(meta?.next_token) || null },
    };
  }
}
