import type { Metadata } from "next";
import { NarrativeView } from "@/components/narrative-view";
import { InlineNotice, PageHeader } from "@/components/ui";
import { getLanguage } from "@/components/language-server";
import { translate } from "@/components/language";
import { getCurrentUser } from "@/lib/auth";
import { getDataMode, getPreferences, listEvents } from "@/lib/view-data";

export const instant = false;
export const metadata: Metadata = { title: "新叙事" };

export default async function NarrativesPage() {
  const [mode, language] = await Promise.all([getDataMode(), getLanguage()]);
  const user = mode === "live" ? await getCurrentUser() : null;
  const [events, preferences] = await Promise.all([listEvents(undefined, mode), getPreferences(user?.id, mode)]);
  const t = (zh: string, en: string) => translate(language, zh, en);
  return (
    <div className="page-shell">
      <PageHeader eyebrow={t("NARRATIVES / 定义先于热度", "NARRATIVES / DEFINITIONS BEFORE POPULARITY")} title={t("新叙事，四种信号分开看", "New narratives, four signals kept separate")} description={t("跟踪 Recursive Self-Improvement、AI for Drug、AI for Science 与 Personal Agent。定义、核心主张、新证据、瓶颈与反证并列；不将讨论声量当作技术或商业验证。", "Track Recursive Self-Improvement, AI for Drug, AI for Science, and Personal Agent. Definitions, theses, new evidence, bottlenecks, and counterevidence appear together; discussion volume is not technical or commercial validation.")} meta={<><span>{t("研究定义可在设置中调整", "Research definitions are editable in settings")}</span><span>{events.length} {t("条全量候选证据", "candidate evidence records")}</span></>} />
      <InlineNotice><strong>{t("阅读方法：", "How to read this: ")}</strong>{t("“未知”表示当前样本不足，不是零，也不是负面判断。这里的 RSI 全称是 Recursive Self-Improvement（递归式自我改进），不是金融技术分析中的相对强弱指标。", "“Unknown” means insufficient sample, not zero or a negative judgment. RSI here means Recursive Self-Improvement, not the Relative Strength Index used in financial analysis.")}</InlineNotice>
      <NarrativeView events={events} definitions={preferences.narrativeDefinitions} language={language} />
    </div>
  );
}
