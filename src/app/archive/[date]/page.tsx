import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BriefView } from "@/components/brief-view";
import { PageHeader } from "@/components/ui";
import { getLanguage } from "@/components/language-server";
import { translate } from "@/components/language";
import { getBriefByDate, getDataMode, listEvents } from "@/lib/view-data";

export const instant = false;
export const metadata: Metadata = { title: "历史日报详情" };

export default async function ArchiveDatePage({ params }: PageProps<"/archive/[date]">) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const [mode, language] = await Promise.all([getDataMode(), getLanguage()]);
  const [brief, allEvents] = await Promise.all([getBriefByDate(date, mode), listEvents(undefined, mode)]);
  if (!brief) notFound();
  const t = (zh: string, en: string) => translate(language, zh, en);
  const events = brief.eventIds.map((id) => allEvents.find((event) => event.id === id || event.slug === id)).filter((event) => event !== undefined);
  return (
    <div className="page-shell">
      <Link className="text-link" href="/archive"><ArrowLeft aria-hidden="true" size={14} />{t("返回历史日报", "Back to archive")}</Link>
      <PageHeader eyebrow={`ARCHIVED EDITION / ${brief.timezone}`} title={brief.title} description={brief.introduction} meta={<><span>{t("日报日期：", "Brief date: ")}{brief.date}</span><span>{t("历史快照，不代表当前状态", "Historical snapshot; not current status")}</span></>} />
      <BriefView brief={brief} events={events} mode={mode} language={language} />
    </div>
  );
}
