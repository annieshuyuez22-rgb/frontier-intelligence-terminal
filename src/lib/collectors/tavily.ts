import { z } from "zod";
import { collectorFetch, requireOk } from "./http";
import type { Collector, CollectorContext, CollectorResult } from "./types";
import { asArray, asRecord, configuredSourceType, createDocument, nextPublishedCursor, textValue, validDate } from "./utils";

const configSchema = z.object({
  query: z.string().trim().min(1).max(1_000),
  maxResults: z.number().int().min(1).max(20).default(10),
  days: z.number().int().min(1).max(30).default(3),
  topic: z.enum(["general", "news", "finance"]).default("news"),
  includeDomains: z.array(z.string().max(253)).max(50).default([]),
  excludeDomains: z.array(z.string().max(253)).max(50).default([]),
}).passthrough();

export class TavilyCollector implements Collector {
  readonly adapter = "tavily";

  async collect(context: CollectorContext): Promise<CollectorResult> {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return { status: "unconfigured", documents: [], cursor: context.cursor, message: "TAVILY_API_KEY 未配置" };
    }
    const config = configSchema.parse(context.source.config);
    const response = requireOk(await collectorFetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        query: config.query,
        max_results: config.maxResults,
        days: config.days,
        topic: config.topic,
        include_domains: config.includeDomains,
        exclude_domains: config.excludeDomains,
        include_answer: false,
        include_raw_content: false,
        include_images: false,
      }),
      signal: context.signal,
      cache: false,
      minIntervalMs: 1_000,
      maxBytes: 2 * 1024 * 1024,
    }), "Tavily");
    const payload: unknown = JSON.parse(response.text);
    const root = asRecord(payload);
    const fetchedAt = (context.now ?? new Date()).toISOString();
    const documents = asArray(root?.results).flatMap((value) => {
      const result = asRecord(value);
      const url = textValue(result?.url);
      if (!result || !url) return [];
      try {
        return [createDocument({
          url,
          title: textValue(result.title) || url,
          excerpt: textValue(result.content),
          publishedAt: validDate(result.published_date ?? result.publishedDate),
          author: null,
          channel: "search",
          sourceType: configuredSourceType(context.source, "media"),
          accessStatus: "search_summary",
          isFullText: false,
          fetchedAt,
          metadata: {
            adapter: "tavily",
            score: typeof result.score === "number" ? result.score : null,
            summaryOnly: true,
          },
        })];
      } catch {
        return [];
      }
    });
    return { status: "success", documents, cursor: nextPublishedCursor(documents, context.cursor) };
  }
}
