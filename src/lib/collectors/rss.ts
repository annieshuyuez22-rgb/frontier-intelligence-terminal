import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import { htmlToPlainText } from "../security";
import { collectorFetch, requireOk } from "./http";
import type { Collector, CollectorContext, CollectorResult } from "./types";
import { asArray, asRecord, configuredSourceType, createDocument, nextPublishedCursor, textValue, validDate } from "./utils";

const configSchema = z.object({
  url: z.url(),
  maxItems: z.number().int().min(1).max(100).default(25),
  excerptChars: z.number().int().min(200).max(6_000).default(2_500),
}).passthrough();

function linkValue(value: unknown): string {
  if (typeof value === "string") return value;
  for (const item of asArray(value)) {
    if (typeof item === "string" && item.trim()) return item;
    const record = asRecord(item);
    if (!record) continue;
    const rel = textValue(record["@_rel"]) || "alternate";
    if (rel === "alternate") return textValue(record["@_href"]) || textValue(record["@_url"]);
  }
  return "";
}

export class RssCollector implements Collector {
  readonly adapter = "rss";

  async collect(context: CollectorContext): Promise<CollectorResult> {
    const config = configSchema.parse(context.source.config);
    const headers: Record<string, string> = { accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9" };
    if (typeof context.cursor.etag === "string") headers["if-none-match"] = context.cursor.etag;
    if (typeof context.cursor.lastModified === "string") headers["if-modified-since"] = context.cursor.lastModified;
    const response = await collectorFetch(config.url, {
      headers,
      signal: context.signal,
      cacheTtlMs: 5 * 60_000,
      minIntervalMs: 1_000,
    });
    if (response.status === 304) {
      return { status: "success", documents: [], cursor: { ...context.cursor, lastCollectedAt: new Date().toISOString() }, message: "内容未变化" };
    }
    requireOk(response, "RSS/Atom");
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      removeNSPrefix: true,
      textNodeName: "#text",
      trimValues: true,
      processEntities: false,
      htmlEntities: true,
      jPath: true,
      isArray: (name) => ["item", "entry", "link"].includes(name),
    });
    const parsed: unknown = parser.parse(response.text);
    const root = asRecord(parsed);
    const rss = asRecord(root?.rss);
    const channel = asRecord(rss?.channel);
    const feed = asRecord(root?.feed);
    const rdf = asRecord(root?.RDF) ?? asRecord(root?.rdf);
    const items = asArray(channel?.item ?? rdf?.item ?? feed?.entry).slice(0, config.maxItems);
    const fetchedAt = (context.now ?? new Date()).toISOString();
    const documents = items.flatMap((item) => {
      const record = asRecord(item);
      if (!record) return [];
      const url = linkValue(record.link) || textValue(record.guid) || textValue(record.id);
      if (!url) return [];
      try {
        const title = textValue(record.title);
        const summaryHtml = textValue(record.description) || textValue(record.summary);
        const contentHtml = textValue(record.encoded) || textValue(record.content);
        const content = htmlToPlainText(contentHtml, 200_000);
        const summary = htmlToPlainText(summaryHtml, 200_000);
        const fullText = content.length >= 500 && content.length > summary.length;
        const author = textValue(asRecord(record.author)?.name ?? record.author) || textValue(record.creator);
        return [createDocument({
          url: new URL(url, response.url).toString(),
          title,
          excerpt: (fullText ? content : summary || content).slice(0, config.excerptChars),
          publishedAt: validDate(record.pubDate ?? record.published ?? record.updated ?? record.date),
          author: author || null,
          channel: context.source.channel,
          sourceType: configuredSourceType(context.source, "media"),
          accessStatus: fullText ? "full_text" : "feed_summary",
          isFullText: fullText,
          fetchedAt,
          metadata: { adapter: "rss", syndicated: true },
        })];
      } catch {
        return [];
      }
    });
    return {
      status: "success",
      documents,
      cursor: {
        ...nextPublishedCursor(documents, context.cursor),
        etag: response.headers.get("etag") ?? context.cursor.etag ?? null,
        lastModified: response.headers.get("last-modified") ?? context.cursor.lastModified ?? null,
      },
    };
  }
}
