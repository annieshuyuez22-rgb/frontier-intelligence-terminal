import { LinkedInCollector } from "./linkedin";
import { ManualCollector } from "./manual";
import { RssCollector } from "./rss";
import { TavilyCollector } from "./tavily";
import type { Collector } from "./types";
import { XCollector } from "./x";

export * from "./types";
export * from "./utils";
export { collectorFetch, requireOk } from "./http";

const collectors: Record<string, () => Collector> = {
  rss: () => new RssCollector(),
  atom: () => new RssCollector(),
  manual: () => new ManualCollector(),
  web: () => new ManualCollector(),
  tavily: () => new TavilyCollector(),
  search: () => new TavilyCollector(),
  x: () => new XCollector(),
  linkedin: () => new LinkedInCollector(),
};

export function getCollector(adapter: string): Collector {
  const factory = collectors[adapter.toLowerCase()];
  if (!factory) throw new Error(`不支持的采集适配器: ${adapter}`);
  return factory();
}

export function collectorIsConfigured(adapter: string, config: Record<string, unknown> = {}): boolean {
  switch (adapter.toLowerCase()) {
    case "tavily":
    case "search":
      return Boolean(process.env.TAVILY_API_KEY);
    case "x":
      return Boolean(process.env.X_BEARER_TOKEN);
    case "linkedin":
      return Boolean(process.env.LINKEDIN_ACCESS_TOKEN && config.organizationId);
    case "rss":
    case "atom":
    case "manual":
    case "web":
      return typeof config.url === "string" && config.url.length > 0;
    default:
      return false;
  }
}
