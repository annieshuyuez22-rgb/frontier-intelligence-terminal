import { NextResponse } from "next/server";
import { z } from "zod";
import { setDataMode } from "@/lib/auth";
import { readJson, requireMutation, runApi } from "../_lib/http";

const modeSchema = z.object({ mode: z.enum(["demo", "live"]) }).strict();

export async function POST(request: Request): Promise<Response> {
  return runApi(async () => {
    await requireMutation(request);
    const input = await readJson(request, modeSchema, 4 * 1024);
    await setDataMode(input.mode);
    return NextResponse.json({ mode: input.mode });
  });
}
