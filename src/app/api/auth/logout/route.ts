import { NextResponse } from "next/server";
import { logoutCurrentSession } from "@/lib/auth";
import { requireMutation, runApi } from "../../_lib/http";

export async function POST(request: Request): Promise<Response> {
  return runApi(async () => {
    await requireMutation(request);
    await logoutCurrentSession();
    return NextResponse.json({ ok: true });
  });
}
