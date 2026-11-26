import * as cheerio from "cheerio";
import { z } from "zod";
import { htmlToPlainText } from "../security";
import { collectorFetch, requireOk } from "./http";
import type { Collector, CollectorContext, CollectorResult } from "./types";
import { configuredSourceType, createDocument } from "./utils";

const configSchema = z.object({
  url: z.url(),
  title: z.string().max(500).optional(),
  selector: z.string().max(200).optional(),
  excerptChars: z.number().int().min(200).max(6_000).default(4_000),
}).passthrough();

export class ManualCollector implements Collector {
  readonly adapter = "manual";

  async collect(context: CollectorContext): Promise<CollectorResult> {
    const config = configSchema.parse(context.source.config);
    const response = requireOk(await collectorFetch(config.url, {
      headers: { accept: "text/html, text/plain;q=0.9" },
      signal: context.signal,
      minIntervalMs: 1_000,
      maxBytes: 4 * 1024 * 1024,
      cacheTtlMs: 60_000,
    }), "手动网页");
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !/text\/html|text\/plain|application\/xhtml\+xml/i.test(contentType)) {
      throw new Error(`不支持的网页内容类型: ${contentType.split(";", 1)[0]}`);
    }
    const $ = cheerio.load(response.text);
    const title = config.title || $("meta[property='og:title']").attr("content") || $("title").first().text() || response.url;
    let text: string;
    if (contentType.startsWith("text/plain")) {
      text = response.text;
    } else {
      if (config.selector) {
        $("script, style, noscript, template, iframe, object, embed, svg, form").remove();
        text = $(config.selector).first().text();
      } else {
        text = htmlToPlainText(response.text);
      }
    }
    const published = $("meta[property='article:published_time']").attr("content") || $("time[datetime]").first().attr("datetime");
    const parsedDate = published ? new Date(published) : null;
    const document = createDocument({
      url: response.url,
      title,
      excerpt: text.slice(0, config.excerptChars),
      publishedAt: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null,
      author: $("meta[name='author']").attr("content") || null,
      channel: "manual",
      sourceType: configuredSourceType(context.source, "media"),
      accessStatus: "fetched_text",
      isFullText: true,
      fetchedAt: (context.now ?? new Date()).toISOString(),
      metadata: { adapter: "manual", contentType: contentType.split(";", 1)[0] },
    });
    return {
      status: "success",
      documents: [document],
      cursor: { ...context.cursor, lastCollectedAt: document.fetchedAt, contentHash: document.contentHash },
    };
  }
}
