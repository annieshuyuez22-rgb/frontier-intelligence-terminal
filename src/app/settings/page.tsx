import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, WandSparkles } from "lucide-react";
import { ChannelManager } from "@/components/channel-manager";
import { ManualLinkCollector } from "@/components/manual-link-collector";
import { SettingsForm } from "@/components/settings-form";
import { InlineNotice, PageHeader } from "@/components/ui";
import { getLanguage } from "@/components/language-server";
import { translate } from "@/components/language";
import { getCurrentUser } from "@/lib/auth";
import { getDataMode, getPreferences, getSourceHealth } from "@/lib/view-data";

export const instant = false;
export const metadata: Metadata = { title: "偏好与渠道" };

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const [params, mode, language] = await Promise.all([searchParams, getDataMode(), getLanguage()]);
  const user = mode === "live" ? await getCurrentUser() : null;
  if (mode === "live" && !user) redirect("/login?next=/settings");
  const [preferences, sources] = await Promise.all([getPreferences(user?.id, mode), getSourceHealth(mode)]);
  const wizard = params.wizard === "1";
  const t = (zh: string, en: string) => translate(language, zh, en);

  return (
    <div className="page-shell">
      <PageHeader eyebrow={t("SETTINGS / 研究边界", "SETTINGS / RESEARCH BOUNDARIES")} title={t("偏好、来源与投递", "Preferences, sources & delivery")} description={t("把研究目标、渠道连接和外部动作分开配置。保存偏好不等于来源测试成功，连接成功也不等于每次采集完整。", "Configure research goals, source connections, and external actions separately. Saving preferences does not prove source connectivity, and a successful connection does not guarantee complete collection.")} actions={<Link className="button button-secondary" href="/setup"><WandSparkles aria-hidden="true" size={15} />{t("首次配置向导", "Initial setup wizard")}</Link>} meta={<><span>{mode === "demo" ? t("演示配置 · 不写入后台", "Demo settings · Not written to backend") : `${user?.name ?? t("当前用户", "Current user")} · ${user?.role ?? t("未知角色", "Unknown role")}`}</span><span>{t("邮件与 Webhook 独立控制", "Email and webhook controlled independently")}</span></>} />
      {wizard ? <InlineNotice><strong>{t("配置向导：", "Setup wizard: ")}</strong>{t("按 01 时间与语言 → 02 关注目标 → 03 叙事定义 → 04 投递 → 05 预算 → 06 来源与手动采集依次完成。任何一步都可以稍后返回，未配置不会被显示为成功。", "Complete 01 time & language → 02 watchlists → 03 narrative definitions → 04 delivery → 05 budgets → 06 sources & manual collection. You can return later; unconfigured items are never shown as successful.")}</InlineNotice> : null}
      <div className="settings-layout">
        <nav className="settings-nav" aria-label={t("设置目录", "Settings sections")}><a href="#general">{t("01 时间与外观", "01 Time & appearance")}</a><a href="#watchlist">{t("02 关注与目标", "02 Watchlists & goals")}</a><a href="#definitions">{t("03 叙事定义", "03 Narrative definitions")}</a><a href="#delivery">{t("04 投递", "04 Delivery")}</a><a href="#budget">{t("05 预算", "05 Budgets")}</a><a href="#sources">{t("06 来源与采集", "06 Sources & collection")}</a></nav>
        <div className="settings-sections">
          <SettingsForm initial={preferences} mode={mode} />
          <section className="settings-section" id="sources"><h2>{t("06A · 来源连接与测试", "06A · Source connections & tests")}</h2><p>{t("RSS 使用 Feed URL；X 使用查询语句；LinkedIn 使用数字组织 ID；搜索使用查询配置。保存和测试是两个独立动作。", "RSS uses a feed URL; X uses a query; LinkedIn uses a numeric organization ID; search uses a query. Saving and testing are separate actions.")}</p><ChannelManager initialSources={sources} mode={mode} canManage={mode === "demo" || user?.role === "admin"} /></section>
          <section className="settings-section" id="manual"><h2>{t("06B · 手动链接采集", "06B · Manual link collection")}</h2><p>{t("提交单个公开链接，后台创建真实采集任务。任务排队不代表内容已经通过核验或进入简报。", "Submit a public link to create a real collection job. A queued job does not mean the content is verified or included in a brief.")}</p><ManualLinkCollector mode={mode} /></section>
          <section className="settings-section"><h2>{t("配置完成检查", "Setup completion check")}</h2><p>{t("逐项确认，不用“已保存”替代“已验证”。", "Review each item; saved is not the same as verified.")}</p><div className="coverage-block"><dl><div><dt>{t("研究偏好", "Research preferences")}</dt><dd>{t("在上方 01–05 中保存；演示模式仅保留当前页面状态。", "Save sections 01–05 above. Demo mode retains state only in this page.")}</dd></div><div><dt>{t("渠道连接", "Source connections")}</dt><dd>{t("对每个已配置来源执行测试，并在任务页检查后续真实采集结果。", "Test every configured source and inspect real collection outcomes on the jobs page.")}</dd></div><div><dt>{t("首次简报", "First brief")}</dt><dd><Link className="text-link" href="/brief">{t("返回今日简报并手动更新", "Return to today’s brief and refresh")}<ArrowRight aria-hidden="true" size={13} /></Link></dd></div></dl></div></section>
        </div>
      </div>
    </div>
  );
}
