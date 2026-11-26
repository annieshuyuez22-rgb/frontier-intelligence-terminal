import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, hasDatabase } from "@/db";
import { collectorIsConfigured } from "@/lib/collectors";
import { runApi } from "../_lib/http";

export async function GET(request: Request): Promise<Response> {
  request.headers.get("user-agent");
  return runApi(async () => {
    let database: "ok" | "unconfigured" | "error" = hasDatabase() ? "ok" : "unconfigured";
    if (hasDatabase()) {
      try {
        await getDb()?.execute(sql`select 1`);
      } catch {
        database = "error";
      }
    }
    const status = database === "error" ? "degraded" : "ok";
    return NextResponse.json({
      status,
      time: new Date().toISOString(),
      checks: {
        database,
        providers: {
          tavily: collectorIsConfigured("tavily") ? "configured" : "unconfigured",
          x: collectorIsConfigured("x") ? "configured" : "unconfigured",
          linkedin: collectorIsConfigured("linkedin") ? "configured" : "unconfigured",
          llm: process.env.LLM_API_KEY && process.env.LLM_MODEL && process.env.LLM_BASE_URL ? "configured" : "unconfigured",
          resend: process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL ? "configured" : "unconfigured",
        },
      },
    }, { status: database === "error" ? 503 : 200 });
  });
}
