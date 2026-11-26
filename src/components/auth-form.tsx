"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogIn, UserPlus } from "lucide-react";
import { errorMessage, readApiJson } from "./api-client";
import { useLanguage } from "./language-provider";

export function AuthForm({ kind, nextPath }: { kind: "login" | "setup"; nextPath: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(kind === "setup" ? "/api/auth/setup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          ...(kind === "setup" ? { name: String(form.get("name") ?? ""), setupToken: String(form.get("setupToken") ?? "") || undefined } : {}),
        }),
      });
      await readApiJson<{ user: { id: string; email: string; name: string; role: string } }>(response);
      setMessage(kind === "setup" ? t("首管理员已创建，正在进入配置……", "First administrator created; opening settings…") : t("登录成功，正在返回研究终端……", "Signed in; returning to the research terminal…"));
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error));
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={(event) => void submit(event)}>
      <p className="eyebrow">{kind === "setup" ? t("FIRST ADMIN / 首次配置", "FIRST ADMIN / SETUP") : t("SECURE ACCESS / 账户", "SECURE ACCESS / ACCOUNT")}</p>
      <h2>{kind === "setup" ? t("创建首位管理员", "Create the first administrator") : t("登录研究终端", "Sign in to the research terminal")}</h2>
      <p>{kind === "setup" ? t("仅第一位管理员可通过此页创建。账户建立后，再逐项连接渠道与设置投递。", "Only the first administrator can be created here. Next, connect sources and configure delivery.") : t("私有收藏、备注、渠道配置与任务操作需要有效会话。", "Private bookmarks, notes, source configuration, and job actions require a valid session.")}</p>
      {kind === "setup" ? <label className="field"><span>{t("姓名", "Name")}</span><input className="input" name="name" autoComplete="name" required maxLength={100} placeholder={t("研究管理员", "Research administrator")} /></label> : null}
      <label className="field"><span>{t("邮箱", "Email")}</span><input className="input" type="email" name="email" autoComplete="email" required maxLength={320} placeholder="name@company.com" /></label>
      <label className="field"><span>{t("密码", "Password")}</span><input className="input" type="password" name="password" autoComplete={kind === "setup" ? "new-password" : "current-password"} required minLength={kind === "setup" ? 12 : 1} maxLength={256} />{kind === "setup" ? <small>{t("至少 12 位。请勿与其他服务共用密码。", "At least 12 characters. Do not reuse a password from another service.")}</small> : null}</label>
      {kind === "setup" ? <label className="field"><span>{t("初始化码（部署配置时必填）", "Setup token (required when configured)")}</span><input className="input" type="password" name="setupToken" autoComplete="off" maxLength={256} placeholder={t("本地部署可留空", "May be blank for local setup")} /><small>{t("仅当部署方已配置初始化码时填写；本地留空即可。", "Required only when configured by the deployer; local setups may leave this blank.")}</small></label> : null}
      {message ? <div className="inline-notice notice-warning" role="status">{message}</div> : null}
      <button className="button button-primary" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" aria-hidden="true" size={16} /> : kind === "setup" ? <UserPlus aria-hidden="true" size={16} /> : <LogIn aria-hidden="true" size={16} />}{pending ? t("正在提交", "Submitting") : kind === "setup" ? t("创建管理员并继续", "Create administrator & continue") : t("安全登录", "Sign in securely")}</button>
      <div className="auth-links">
        <Link href={kind === "setup" ? "/login" : "/setup"}>{kind === "setup" ? t("已有账户？登录", "Already have an account? Sign in") : t("尚未初始化？创建首管理员", "Not initialized? Create the first administrator")}</Link>
        <Link href="/brief">{t("先浏览公开简报", "Browse the public brief")}</Link>
      </div>
    </form>
  );
}
