import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, hashPassword, setDataMode, setSessionCookie, setupFirstAdmin } from "@/lib/auth";
import { assertSameOrigin, safeEqual } from "@/lib/security";
import { ApiError, enforceRateLimit, readJson, runApi } from "../../_lib/http";

const setupSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  name: z.string().trim().min(1).max(100),
  password: z.string().min(12).max(256),
  setupToken: z.string().max(256).optional(),
}).strict();

export async function POST(request: Request): Promise<Response> {
  return runApi(async () => {
    assertSameOrigin(request);
    enforceRateLimit(request, "setup", 5, 60 * 60 * 1000);
    const input = await readJson(request, setupSchema);
    const expectedSetupToken = process.env.SETUP_TOKEN;
    if (expectedSetupToken && (!input.setupToken || !safeEqual(input.setupToken, expectedSetupToken))) {
      throw new ApiError(403, "初始化码无效");
    }
    const passwordHash = await hashPassword(input.password);
    const user = await setupFirstAdmin({ email: input.email, name: input.name, passwordHash });
    const session = await createSession(user.id);
    await setSessionCookie(session.token);
    await setDataMode("live");
    return NextResponse.json({ user }, { status: 201 });
  });
}
