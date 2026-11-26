import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { hasDatabase, requireDb } from "@/db";
import { events, preferences, sessions, sources, users } from "@/db/schema";
import { DEFAULT_SOURCES } from "./default-sources";
import type { DataMode } from "./domain";
import { safeEqual } from "./security";

export const SESSION_COOKIE = "fi_session";
export const MODE_COOKIE = "fi_mode";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export class AuthError extends Error {
  constructor(message: string, readonly status: 400 | 401 | 403 | 409 | 429 = 401) {
    super(message);
    this.name = "AuthError";
  }
}

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
      maxmem: 64 * 1024 * 1024,
    }, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  if (Buffer.byteLength(password, "utf8") > 256) throw new AuthError("密码过长", 400);
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt);
  return ["scrypt", SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString("base64"), derived.toString("base64")].join("$");
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  if (Buffer.byteLength(password, "utf8") > 256) return false;
  const [algorithm, n, r, p, saltValue, hashValue, ...extra] = encoded.split("$");
  if (algorithm !== "scrypt" || Number(n) !== SCRYPT_N || Number(r) !== SCRYPT_R || Number(p) !== SCRYPT_P || extra.length > 0) return false;
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltValue, "base64");
    expected = Buffer.from(hashValue, "base64");
  } catch {
    return false;
  }
  if (salt.length !== 16 || expected.length !== KEY_LENGTH) return false;
  const actual = await scryptAsync(password, salt);
  return timingSafeEqual(actual, expected);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const db = requireDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await db.insert(sessions).values({ tokenHash: hashToken(token), userId, expiresAt });
  return { token, expiresAt };
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!hasDatabase()) return null;
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 128) return null;
  const db = requireDb();
  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0] ?? null;
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("请先登录", 401);
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new AuthError("需要管理员权限", 403);
  return user;
}

export async function logoutCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token && token.length <= 128) {
    await requireDb().delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }
  await clearSessionCookie();
}

export async function getDataMode(): Promise<DataMode> {
  if (!hasDatabase()) return "demo";
  const store = await cookies();
  const configured = store.get(MODE_COOKIE)?.value;
  if (configured === "demo" || configured === "live") return configured;
  const existing = await requireDb().select({ id: events.id }).from(events).where(eq(events.mode, "live")).limit(1);
  return existing.length ? "live" : "demo";
}

export async function setDataMode(mode: DataMode): Promise<void> {
  const store = await cookies();
  store.set(MODE_COOKIE, mode, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
}

export async function setupFirstAdmin(input: { email: string; name: string; passwordHash: string }): Promise<CurrentUser> {
  const db = requireDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('frontier-intelligence:first-admin'))`);
    const countRows = await tx.select({ count: sql<number>`count(*)::int` }).from(users);
    if ((countRows[0]?.count ?? 0) > 0) throw new AuthError("首个管理员已创建，请登录", 403);
    const inserted = await tx.insert(users).values({
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash: input.passwordHash,
      role: "admin",
    }).returning({ id: users.id, email: users.email, name: users.name, role: users.role });
    const user = inserted[0];
    if (!user) throw new Error("管理员创建失败");
    await tx.insert(preferences).values({ userId: user.id });
    const existingSources = await tx.select({ id: sources.id }).from(sources).limit(1);
    if (!existingSources.length) await tx.insert(sources).values(DEFAULT_SOURCES.map((source) => ({ ...source, config: { ...source.config } })));
    return user;
  });
}

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

export function consumeRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = rateBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    if (rateBuckets.size > 10_000) {
      for (const [bucketKey, bucket] of rateBuckets) {
        if (bucket.resetAt <= now) rateBuckets.delete(bucketKey);
      }
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (existing.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimit(key: string): void {
  rateBuckets.delete(key);
}

export function loginRateKey(clientKey: string, email: string): string {
  return `login:${clientKey}:${email.toLowerCase()}`;
}

export function verifyCronSecret(provided: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  return Boolean(expected && provided && safeEqual(provided, expected));
}
