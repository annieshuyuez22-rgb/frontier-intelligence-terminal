import Link from "next/link";
import { getLanguage } from "@/components/language-server";
import { translate } from "@/components/language";

export const instant = false;

export default async function Home() {
  const language = await getLanguage();
  const t = (zh: string, en: string) => translate(language, zh, en);
  return (
    <div className="page-shell centered-state">
      <meta httpEquiv="refresh" content="0;url=/brief" />
      <div className="fatal-state">
        <p className="eyebrow">FRONTIER INTELLIGENCE</p>
        <h1>{t("正在进入今日简报", "Opening today’s brief")}</h1>
        <p>{t("如果没有自动跳转，请使用下方链接。", "If you are not redirected automatically, use the link below.")}</p>
        <Link className="button button-primary" href="/brief">{t("打开今日简报", "Open today’s brief")}</Link>
      </div>
    </div>
  );
}
