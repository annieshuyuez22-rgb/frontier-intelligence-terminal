import { cleanPlainText, secureFetch, sha256, type SecureFetchOptions, type SecureResponse } from "../security";
import { CollectorError } from "./types";

const rateQueues = new Map<string, Promise<void>>();
const lastRequests = new Map<string, number>();
const responseCache = new Map<string, { expiresAt: number; response: SecureResponse }>();

export interface CollectorFetchOptions extends SecureFetchOptions {
  retries?: number;
  minIntervalMs?: number;
  cacheTtlMs?: number;
  cache?: boolean;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("请求已取消"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new Error("请求已取消"));
    }, { once: true });
  });
}

async function waitForRateLimit(key: string, minIntervalMs: number): Promise<void> {
  const previous = rateQueues.get(key) ?? Promise.resolve();
  const current = previous.then(async () => {
    const elapsed = Date.now() - (lastRequests.get(key) ?? 0);
    if (elapsed < minIntervalMs) await sleep(minIntervalMs - elapsed);
    lastRequests.set(key, Date.now());
  });
  rateQueues.set(key, current);
  try {
    await current;
  } finally {
    if (rateQueues.get(key) === current) rateQueues.delete(key);
  }
}

function retryAfterMs(response: SecureResponse): number | null {
  const value = response.headers.get("retry-after");
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.min(Math.max(seconds * 1000, 0), 15_000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.min(Math.max(date - Date.now(), 0), 15_000);
}

export async function collectorFetch(input: string | URL, options: CollectorFetchOptions = {}): Promise<SecureResponse> {
  const method = options.method ?? "GET";
  const authenticated = Object.keys(options.headers ?? {}).some((key) => ["authorization", "x-api-key", "api-key"].includes(key.toLowerCase()));
  const useCache = options.cache ?? (method === "GET" && !authenticated);
  const cacheKey = sha256(`${method}|${new URL(input).toString()}|${JSON.stringify(options.headers ?? {})}`);
  if (useCache) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.response;
    if (cached) responseCache.delete(cacheKey);
  }

  const retries = Math.min(options.retries ?? 2, 4);
  const rateKey = new URL(input).hostname;
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await waitForRateLimit(rateKey, options.minIntervalMs ?? 500);
      const response = await secureFetch(input, options);
      if ((response.status === 429 || response.status >= 500) && attempt < retries) {
        const delay = retryAfterMs(response) ?? Math.min(500 * 2 ** attempt + Math.floor(Math.random() * 200), 8_000);
        await sleep(delay, options.signal);
        continue;
      }
      if (useCache && response.ok) {
        responseCache.set(cacheKey, { response, expiresAt: Date.now() + (options.cacheTtlMs ?? 60_000) });
        if (responseCache.size > 200) {
          const oldest = responseCache.keys().next().value;
          if (oldest) responseCache.delete(oldest);
        }
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (options.signal?.aborted || attempt >= retries) break;
      await sleep(Math.min(500 * 2 ** attempt + Math.floor(Math.random() * 200), 8_000), options.signal);
    }
  }
  throw new CollectorError(lastError?.message ?? "采集请求失败", true);
}

export function requireOk(response: SecureResponse, provider: string): SecureResponse {
  if (!response.ok) {
    const retryable = response.status === 429 || response.status >= 500;
    throw new CollectorError(`${provider} 返回 HTTP ${response.status}`, retryable);
  }
  return response;
}

export function documentExcerpt(input: string, maxChars = 6_000): string {
  return cleanPlainText(input, maxChars);
}
