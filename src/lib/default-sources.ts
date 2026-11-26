export const DEFAULT_SOURCES = [
  {
    name: "NASA Breaking News",
    channel: "rss",
    adapter: "rss",
    enabled: true,
    config: { url: "https://www.nasa.gov/rss/dyn/breaking_news.rss", sourceType: "official", maxItems: 20 },
  },
  {
    name: "Google DeepMind Blog",
    channel: "blog",
    adapter: "rss",
    enabled: true,
    config: { url: "https://deepmind.google/blog/rss.xml", sourceType: "official", maxItems: 20 },
  },
  {
    name: "arXiv cs.AI",
    channel: "paper",
    adapter: "rss",
    enabled: true,
    config: { url: "https://export.arxiv.org/rss/cs.AI", sourceType: "preprint", maxItems: 20 },
  },
  {
    name: "NYT Technology",
    channel: "rss",
    adapter: "rss",
    enabled: true,
    config: { url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml", sourceType: "media", maxItems: 20 },
  },
] as const;
