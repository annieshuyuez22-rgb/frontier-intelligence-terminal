export type CollectionStatus = "success" | "unconfigured";

export interface CollectorSource {
  id: string;
  name: string;
  channel: string;
  adapter: string;
  config: Record<string, unknown>;
}

export interface CollectedDocument {
  canonicalUrl: string;
  contentHash: string;
  title: string;
  author: string | null;
  publishedAt: string | null;
  fetchedAt: string;
  channel: string;
  sourceType: string;
  accessStatus: string;
  excerpt: string;
  originGroup: string;
  isFullText: boolean;
  metadata: Record<string, unknown>;
}

export interface CollectorContext {
  source: CollectorSource;
  cursor: Record<string, unknown>;
  signal?: AbortSignal;
  now?: Date;
}

export interface CollectorResult {
  status: CollectionStatus;
  documents: CollectedDocument[];
  cursor: Record<string, unknown>;
  message?: string;
}

export interface Collector {
  readonly adapter: string;
  collect(context: CollectorContext): Promise<CollectorResult>;
}

export class CollectorError extends Error {
  constructor(message: string, readonly retryable = false) {
    super(message);
    this.name = "CollectorError";
  }
}
