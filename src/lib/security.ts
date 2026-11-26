import { createHash, timingSafeEqual } from "node:crypto";
import { promises as dns } from "node:dns";
import http, { type IncomingHttpHeaders, type RequestOptions } from "node:http";
import https from "node:https";
import { isIPv4, isIP } from "node:net";
import * as cheerio from "cheerio";

export const DEFAULT_MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
export const DEFAULT_FETCH_TIMEOUT_MS = 12_000;

export class SecurityError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "SecurityError";
  }
}

interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

export interface ValidatedPublicUrl {
  url: URL;
  addresses: ResolvedAddress[];
}

export interface SecureFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: string | Uint8Array;
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  signal?: AbortSignal;
}

export interface SecureResponse {
  status: number;
  ok: boolean;
  statusText: string;
  url: string;
  headers: Headers;
  bytes: Uint8Array;
  text: string;
}

function ipv4Number(address: string): number {
  return address.split(".").reduce((result, part) => ((result << 8) | Number(part)) >>> 0, 0);
}

function inIpv4Range(value: number, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (value & mask) === (ipv4Number(base) & mask);
}

function isDisallowedIpv4(address: string): boolean {
  const value = ipv4Number(address);
  return [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.88.99.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4],
  ].some(([base, bits]) => inIpv4Range(value, String(base), Number(bits)));
}

function parseIpv6(address: string): number[] | null {
  let value = address.toLowerCase().split("%")[0];
  if (!value || value.includes(".")) {
    const lastColon = value.lastIndexOf(":");
    const ipv4 = value.slice(lastColon + 1);
    if (!isIPv4(ipv4)) return null;
    const number = ipv4Number(ipv4);
    value = `${value.slice(0, lastColon)}:${((number >>> 16) & 0xffff).toString(16)}:${(number & 0xffff).toString(16)}`;
  }
  const halves = value.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  if (left.some((part) => !/^[0-9a-f]{1,4}$/.test(part)) || right.some((part) => !/^[0-9a-f]{1,4}$/.test(part))) return null;
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 0)) return null;
  const parts = [...left, ...Array.from({ length: missing }, () => "0"), ...right];
  return parts.map((part) => Number.parseInt(part, 16));
}

function ipv6InRange(parts: number[], base: string, bits: number): boolean {
  const prefix = parseIpv6(base);
  if (!prefix) return false;
  const completeGroups = Math.floor(bits / 16);
  for (let index = 0; index < completeGroups; index += 1) {
    if (parts[index] !== prefix[index]) return false;
  }
  const remaining = bits % 16;
  if (remaining === 0) return true;
  const mask = (0xffff << (16 - remaining)) & 0xffff;
  return (parts[completeGroups] & mask) === (prefix[completeGroups] & mask);
}

export function isDisallowedAddress(address: string): boolean {
  if (isIPv4(address)) return isDisallowedIpv4(address);
  if (isIP(address) !== 6) return true;
  const parts = parseIpv6(address);
  if (!parts) return true;

  if (parts.slice(0, 5).every((part) => part === 0) && parts[5] === 0xffff) {
    const mapped = `${(parts[6] >>> 8).toString()}.${(parts[6] & 255).toString()}.${(parts[7] >>> 8).toString()}.${(parts[7] & 255).toString()}`;
    return isDisallowedIpv4(mapped);
  }
  if (parts.slice(0, 6).every((part) => part === 0)) return true;
  return [
    ["fc00::", 7],
    ["fe80::", 10],
    ["ff00::", 8],
    ["64:ff9b::", 96],
    ["64:ff9b:1::", 48],
    ["100::", 64],
    ["2001:db8::", 32],
    ["2001:2::", 48],
    ["2001:10::", 28],
    ["2001::", 32],
    ["2002::", 16],
  ].some(([base, bits]) => ipv6InRange(parts, String(base), Number(bits)));
}

function validateHostname(hostname: string): string {
  const normalized = hostname.replace(/\.$/, "").toLowerCase();
  if (!normalized || normalized === "localhost" || normalized.endsWith(".localhost") || normalized.endsWith(".local") || normalized.endsWith(".internal")) {
    throw new SecurityError("目标主机不允许访问");
  }
  if (normalized === "metadata.google.internal" || normalized === "metadata.azure.internal") {
    throw new SecurityError("云元数据地址禁止访问");
  }
  return normalized;
}

export async function validatePublicUrl(input: string | URL): Promise<ValidatedPublicUrl> {
  const url = input instanceof URL ? new URL(input) : new URL(input);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SecurityError("仅允许 HTTP/HTTPS URL");
  }
  if (url.username || url.password) throw new SecurityError("URL 不允许包含凭据");
  const hostname = validateHostname(url.hostname.replace(/^\[|\]$/g, ""));
  if (!isIP(hostname)) url.hostname = hostname;

  if (isIP(hostname)) {
    if (isDisallowedAddress(hostname)) throw new SecurityError("目标 IP 属于禁止访问范围");
    return { url, addresses: [{ address: hostname, family: isIP(hostname) as 4 | 6 }] };
  }

  let addresses: ResolvedAddress[];
  try {
    const resolved = await dns.lookup(hostname, { all: true, verbatim: true });
    addresses = resolved.map(({ address, family }) => ({ address, family: family === 6 ? 6 : 4 }));
  } catch (error) {
    throw new SecurityError(`目标域名解析失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
  if (addresses.length === 0 || addresses.some(({ address }) => isDisallowedAddress(address))) {
    throw new SecurityError("目标域名解析到禁止访问的 IP");
  }
  return { url, addresses };
}

function responseHeaders(headers: IncomingHttpHeaders): Headers {
  const result = new Headers();
  for (const [name, raw] of Object.entries(headers)) {
    if (raw === undefined) continue;
    if (Array.isArray(raw)) {
      for (const value of raw) result.append(name, value);
    } else {
      result.set(name, raw);
    }
  }
  return result;
}

async function requestOnce(
  validated: ValidatedPublicUrl,
  options: SecureFetchOptions,
): Promise<SecureResponse> {
  const { url, addresses } = validated;
  const pinned = addresses[0];
  const body = options.body === undefined ? null : Buffer.from(options.body);
  const timeoutMs = Math.min(Math.max(options.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS, 1), 60_000);
  const maxBytes = Math.min(Math.max(options.maxBytes ?? DEFAULT_MAX_RESPONSE_BYTES, 1), 20 * 1024 * 1024);
  const headers: Record<string, string> = {
    accept: "application/json, application/xml, text/xml, text/html, text/plain;q=0.9, */*;q=0.1",
    "accept-encoding": "identity",
    "user-agent": "FrontierIntelligence/1.0 (+authenticated collection)",
    ...options.headers,
  };
  if (body) headers["content-length"] = String(body.byteLength);

  return new Promise<SecureResponse>((resolve, reject) => {
    const requestOptions: RequestOptions & { servername?: string } = {
      protocol: url.protocol,
      hostname: url.hostname.replace(/^\[|\]$/g, ""),
      port: url.port || undefined,
      path: `${url.pathname}${url.search}`,
      method: options.method ?? "GET",
      headers,
      servername: url.hostname.replace(/^\[|\]$/g, ""),
      lookup: (_hostname, lookupOptions, callback) => {
        if (lookupOptions.all) callback(null, [pinned]);
        else callback(null, pinned.address, pinned.family);
      },
    };
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.request(requestOptions, (response) => {
      const status = response.statusCode ?? 0;
      const length = Number(response.headers["content-length"] ?? 0);
      if (length > maxBytes) {
        response.resume();
        request.destroy();
        reject(new SecurityError(`响应超过 ${maxBytes} 字节上限`));
        return;
      }
      if (status >= 300 && status < 400) {
        response.resume();
        resolve({
          status,
          ok: false,
          statusText: response.statusMessage ?? "",
          url: url.toString(),
          headers: responseHeaders(response.headers),
          bytes: new Uint8Array(),
          text: "",
        });
        return;
      }

      const chunks: Buffer[] = [];
      let received = 0;
      response.on("data", (chunk: Buffer | string) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        received += buffer.byteLength;
        if (received > maxBytes) {
          response.destroy(new SecurityError(`响应超过 ${maxBytes} 字节上限`));
          return;
        }
        chunks.push(buffer);
      });
      response.on("end", () => {
        const bytes = Buffer.concat(chunks);
        resolve({
          status,
          ok: status >= 200 && status < 300,
          statusText: response.statusMessage ?? "",
          url: url.toString(),
          headers: responseHeaders(response.headers),
          bytes: new Uint8Array(bytes),
          text: bytes.toString("utf8"),
        });
      });
      response.on("error", reject);
    });

    const abort = () => request.destroy(new Error("请求已取消"));
    if (options.signal?.aborted) {
      request.destroy(new Error("请求已取消"));
    } else {
      options.signal?.addEventListener("abort", abort, { once: true });
    }
    request.setTimeout(timeoutMs, () => request.destroy(new Error(`请求超时（${timeoutMs}ms）`)));
    request.on("error", reject);
    request.on("close", () => options.signal?.removeEventListener("abort", abort));
    if (body) request.write(body);
    request.end();
  });
}

function redirectHeaders(headers: Record<string, string> | undefined, previous: URL, next: URL): Record<string, string> {
  if (previous.origin === next.origin) return headers ?? {};
  const safe = { ...headers };
  for (const name of Object.keys(safe)) {
    if (["authorization", "cookie", "proxy-authorization", "x-api-key", "api-key"].includes(name.toLowerCase())) delete safe[name];
  }
  return safe;
}

export async function secureFetch(input: string | URL, options: SecureFetchOptions = {}): Promise<SecureResponse> {
  let current = new URL(input);
  const maxRedirects = options.maxRedirects ?? 5;
  let headers = options.headers;

  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    const validated = await validatePublicUrl(current);
    const response = await requestOnce(validated, { ...options, headers });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    if (!location) throw new SecurityError("重定向缺少 Location");
    if (redirect === maxRedirects) throw new SecurityError("重定向次数超过上限");
    const next = new URL(location, current);
    if (next.protocol !== "http:" && next.protocol !== "https:") throw new SecurityError("重定向协议不允许");
    headers = redirectHeaders(headers, current, next);
    if (response.status === 303 || ((response.status === 301 || response.status === 302) && options.method === "POST")) {
      options = { ...options, method: "GET", body: undefined };
      const safeHeaders = { ...headers };
      for (const name of Object.keys(safeHeaders)) {
        if (name.toLowerCase() === "content-type" || name.toLowerCase() === "content-length") delete safeHeaders[name];
      }
      headers = safeHeaders;
    }
    current = next;
  }
  throw new SecurityError("重定向处理失败");
}

export function htmlToPlainText(html: string, maxChars = 200_000): string {
  const $ = cheerio.load(html);
  $("script, style, noscript, template, iframe, frame, object, embed, svg, canvas, form, nav").remove();
  $("p, article, section, div, li, br, h1, h2, h3, h4, tr").each((_index, element) => {
    $(element).append(" ");
  });
  return cleanPlainText($("body").text() || $.root().text(), maxChars);
}

export function cleanPlainText(input: string, maxChars = 6_000): string {
  return input
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxChars);
}

export function sha256(input: string | Uint8Array): string {
  return createHash("sha256").update(input).digest("hex");
}

export function safeEqual(left: string, right: string): boolean {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function expectedRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? request.headers.get("host") ?? url.host;
  return `${protocol}://${host}`;
}

export function isSameOriginRequest(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (origin === "null") return false;
  try {
    return new URL(origin).origin === new URL(expectedRequestOrigin(request)).origin;
  } catch {
    return false;
  }
}

export function assertSameOrigin(request: Request): void {
  if (!isSameOriginRequest(request)) throw new SecurityError("拒绝跨站请求");
}

export function requestClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return sha256(forwarded || request.headers.get("x-real-ip") || "unknown");
}
