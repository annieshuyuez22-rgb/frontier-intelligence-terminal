import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { safeNextPath } from "@/components/format";
import { getLanguage } from "@/components/language-server";
import { translate } from "@/components/language";

export const instant = false;
export const metadata: Metadata = { title: "登录" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const [params, language] = await Promise.all([searchParams, getLanguage()]);
  const nextPath = safeNextPath(params.next);
  const t = (zh: string, en: string) => translate(language, zh, en);
  return (
    <div className="auth-page">
      <section className="auth-editorial">
        <div><p className="eyebrow">FRONTIER INTELLIGENCE</p><h1>{t("让每一条判断，都能回到证据。", "Every judgment should lead back to evidence.")}</h1><p>{t("全球前沿科技与资本情报，以独立来源、证据边界和明确的不确定性支持研究决策。", "Global frontier technology and capital intelligence, built on independent sources, explicit evidence limits, and clearly stated uncertainty.")}</p></div>
        <div className="auth-editorial-foot">PRIVATE RESEARCH · ACCESS CONTROLLED</div>
      </section>
      <section className="auth-form-wrap"><AuthForm kind="login" nextPath={nextPath} /></section>
    </div>
  );
}
