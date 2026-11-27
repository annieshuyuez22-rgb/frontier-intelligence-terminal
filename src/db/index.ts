import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let database: PostgresJsDatabase<typeof schema> | null | undefined;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

export function getDb() {
  if (database !== undefined) return database;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    database = null;
    return database;
  }
  const client = postgres(url, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : "require",
  });
  database = drizzle(client, { schema });
  return database;
}

export function requireDb() {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL 未配置");
  return db;
}

function retryableReadError(error: unknown): boolean {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message : "";
  return /^(?:ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|40001|40P01|53P01|57P01|08[0-9A-Z]{4})$/i.test(code)
    || /timeout|timed out|connection (?:reset|closed|terminated)|connection terminated unexpectedly|socket hang up/i.test(message);
}

export async function withDbRetry<T>(label: string, operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !retryableReadError(error)) throw error;
      const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "timeout/connection";
      console.warn(`[db-retry] ${label} attempt ${attempt + 1}/${attempts}: ${code}`);
      await new Promise((resolve) => setTimeout(resolve, 150 * 2 ** (attempt - 1)));
    }
  }
  throw lastError;
}
