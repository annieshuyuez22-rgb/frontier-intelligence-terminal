import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDb } from "@/db";
import { users } from "@/db/schema";
import { AuthError, createSession, hashPassword, loginRateKey, resetRateLimit, setSessionCookie, verifyPassword } from "@/lib/auth";
import { assertSameOrigin, requestClientKey } from "@/lib/security";
import { consumeRateLimit } from "@/lib/auth";
import { readJson, runApi } from "../../_lib/http";

const loginSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(256),
}).strict();

export async function POST(request: Request): Promise<Response> {
  return runApi(async () => {
    assertSameOrigin(request);
    const input = await readJson(request, loginSchema);
    const key = loginRateKey(requestClientKey(request), input.email);
    const rate = consumeRateLimit(key, 5, 15 * 60 * 1000);
    if (!rate.allowed) throw new AuthError("登录尝试过多，请稍后重试", 429);
    const user = await requireDb().query.users.findFirst({ where: eq(users.email, input.email) });
    if (!user) {
      await hashPassword(input.password);
      throw new AuthError("邮箱或密码错误", 401);
    }
    if (!await verifyPassword(input.password, user.passwordHash)) throw new AuthError("邮箱或密码错误", 401);
    resetRateLimit(key);
    const session = await createSession(user.id);
    await setSessionCookie(session.token);
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  });
}
