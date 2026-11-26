import { NextResponse } from "next/server";
import { z, type ZodType } from "zod";
import { AuthError, consumeRateLimit, getDataMode, requireAdmin, requireUser, type CurrentUser } from "@/lib/auth";
import { assertSameOrigin, requestClientKey, SecurityError } from "@/lib/security";

export class ApiError extends Error {
  constructor(readonly status: number, message: string, readonly retryAfterSeconds = 0) {
    super(message);
    this.name = "ApiError";
  }
}

export async function runApi(action: () => Promise<Response>): Promise<Response> {
  try {
    const response = await action();
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  } catch (error) {
    let status = 500;
    let message = "服务器处理失败";
    let retryAfterSeconds = 0;
    if (error instanceof ApiError || error instanceof AuthError) {
      status = error.status;
      message = error.message;
      if (error instanceof ApiError) retryAfterSeconds = error.retryAfterSeconds;
    } else if (error instanceof SecurityError) {
      status = error.message === "拒绝跨站请求" ? 403 : 400;
      message = error.message;
    } else if (error instanceof z.ZodError) {
      status = 400;
      message = error.issues[0] ? `${error.issues[0].path.join(".")}: ${error.issues[0].message}` : "请求参数无效";
    } else {
      console.error("API 请求失败", error instanceof Error ? error.message : "未知错误");
    }
    const headers: Record<string, string> = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
    if (retryAfterSeconds > 0) headers["Retry-After"] = String(retryAfterSeconds);
    return NextResponse.json({ error: message }, { status, headers });
  }
}

export async function readJson<T>(request: Request, schema: ZodType<T>, maxBytes = 64 * 1024): Promise<T> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) throw new ApiError(413, "请求体过大");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new ApiError(413, "请求体过大");
  if (!text) throw new ApiError(400, "请求体不能为空");
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new ApiError(400, "JSON 格式无效");
  }
  return schema.parse(payload);
}

export async function requireMutation(request: Request, admin = false): Promise<CurrentUser> {
  assertSameOrigin(request);
  return admin ? requireAdmin() : requireUser();
}

export async function requireLiveMode(): Promise<void> {
  if (await getDataMode() === "demo") throw new ApiError(409, "demo 模式不会执行真实采集或收费任务，请切换到 live");
}

export function enforceRateLimit(request: Request, scope: string, limit: number, windowMs: number, identity = "anonymous"): void {
  const result = consumeRateLimit(`${scope}:${identity}:${requestClientKey(request)}`, limit, windowMs);
  if (!result.allowed) throw new ApiError(429, "请求过于频繁，请稍后重试", result.retryAfterSeconds);
}

export const uuidSchema = z.string().uuid();

export function queryLimit(request: Request, fallback = 30): number {
  const raw = new URL(request.url).searchParams.get("limit");
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 100) throw new ApiError(400, "limit 必须为 1-100 的整数");
  return value;
}
