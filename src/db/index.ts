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
