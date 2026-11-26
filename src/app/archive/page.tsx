import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader, EmptyState, Badge } from "@/components/ui";
import { getLanguage } from "@/components/language-server";
import { translate } from "@/components/language";
import { getDataMode, listBriefs } from "@/lib/view-data";

export const instant = false;
export const metadata: Metadata = { title: "历史日报" };

export default async function ArchivePage() {
  const [mode, language] = await Promise.all([getDataMode(), getLanguage()]);
  const briefs = await listBriefs(mode);
  const t = (zh: string, en: string) => translate(language, zh, en);
  return (
    <div className="page-shell">
      <PageHeader eyebrow={t("ARCHIVE / 历史研究", "ARCHIVE / RESEARCH HISTORY")} title={t("历史日报与更正记录", "Brief archive & corrections")} description={t("按日报时区归档。每一期保留当时的统计窗口、样本覆盖与重大更正，避免用后续信息改写历史判断。", "Briefs are archived in their original timezone, preserving the statistical window, sample coverage, and major corrections of that edition.")} meta={<span>{t("共", "Total")} {briefs.length} {t("期", "editions")} · {mode === "demo" ? t("演示归档", "Demo archive") : t("实时归档", "Live archive")}</span>} />
      {briefs.length === 0 ? <EmptyState title={t("暂无历史日报", "No archived briefs")} description={t("尚未形成可归档的日报。请先完成一次成功的采集与简报生成。", "No brief has been archived yet. Complete a successful collection and brief generation first.")} action={<Link className="button button-secondary" href="/brief">{t("返回今日简报", "Back to today’s brief")}</Link>} /> : (
        <div className="archive-list">
          {briefs.map((brief) => (
            <article className="archive-item" key={brief.id}>
              <time className="archive-date" dateTime={brief.date}>{brief.date}<br /><small>{brief.timezone}</small></time>
              <div>
                <h2><Link href={`/archive/${brief.date}`}>{brief.title}</Link></h2>
                <p>{brief.introduction}</p>
                {brief.majorCorrections.length > 0 ? <Badge tone="danger">{t("含", "Includes")} {brief.majorCorrections.length} {t("条重大更正", "major corrections")}</Badge> : null}
              </div>
              <div className="archive-stats">
                <span>{brief.eventIds.length} {t("条事件", "events")}</span>
                <span>{brief.stats.pendingVerification} {t("条待核验", "pending verification")}</span>
                <Link className="text-link" href={`/archive/${brief.date}`} aria-label={t(`查看 ${brief.date} 日报`, `View brief for ${brief.date}`)}><ArrowUpRight aria-hidden="true" size={16} /></Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
