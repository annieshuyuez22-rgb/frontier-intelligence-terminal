import { canonicalizeUrl } from "../funding";
import { cleanPlainText, htmlToPlainText, sha256 } from "../security";
import type { CollectedDocument, CollectorSource } from "./types";

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
}

export function textValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join("\n");
  const record = asRecord(value);
  if (!record) return "";
  return textValue(record["#text"] ?? record.text ?? record.value ?? record["__text"] ?? "");
}

export function validDate(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const milliseconds = typeof value === "number" && value < 100_000_000_000 ? value * 1000 : value;
  const date = new Date(milliseconds);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function configuredSourceType(source: CollectorSource, fallback: string): string {
  const configured = source.config.sourceType;
  return configured === "official" || configured === "third_party_review" || configured === "media" || configured === "preprint" || configured === "social" || configured === "rumor"
    ? configured
    : fallback;
}

export function documentOriginGroup(title: string, publishedAt?: string | null): string {
  const normalizedTitle = title.normalize("NFKC").toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g, " ").trim();
  const date = publishedAt?.slice(0, 10) ?? "unknown-date";
  return `title:${sha256(`${normalizedTitle}|${date}`).slice(0, 32)}`;
}

export function createDocument(input: {
  url: string;
  title: string;
  excerpt: string;
  publishedAt?: string | null;
  author?: string | null;
  channel: string;
  sourceType: string;
  accessStatus: string;
  isFullText: boolean;
  fetchedAt: string;
  metadata?: Record<string, unknown>;
}): CollectedDocument {
  const canonicalUrl = canonicalizeUrl(input.url);
  const title = cleanPlainText(htmlToPlainText(input.title, 5_000), 500) || canonicalUrl;
  const excerpt = cleanPlainText(htmlToPlainText(input.excerpt, 100_000), 6_000);
  const publishedAt = input.publishedAt ?? null;
  return {
    canonicalUrl,
    contentHash: sha256(JSON.stringify([canonicalUrl, title, publishedAt, excerpt, input.isFullText])),
    title,
    author: input.author ? cleanPlainText(input.author, 300) : null,
    publishedAt,
    fetchedAt: input.fetchedAt,
    channel: input.channel,
    sourceType: input.sourceType,
    accessStatus: input.accessStatus,
    excerpt,
    originGroup: documentOriginGroup(title, publishedAt),
    isFullText: input.isFullText,
    metadata: input.metadata ?? {},
  };
}

export function nextPublishedCursor(documents: CollectedDocument[], previous: Record<string, unknown>): Record<string, unknown> {
  const dates = documents.map((document) => document.publishedAt).filter((value): value is string => Boolean(value)).sort();
  return {
    ...previous,
    lastPublishedAt: dates.at(-1) ?? previous.lastPublishedAt ?? null,
    lastCollectedAt: new Date().toISOString(),
  };
}
