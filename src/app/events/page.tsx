import type { Metadata } from "next";
import Link from "next/link";
import Decimal from "decimal.js";
import { Grid2X2, List, RotateCcw, Search } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { singleParam, isOneOf, queryWith } from "@/components/query";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { getLanguage } from "@/components/language-server";
import { translate } from "@/components/language";
import { CATEGORIES, FUNDING_TYPES, VERIFICATION_STATUSES, categoryLabels, fundingTypeLabelsI18n, verificationLabelsI18n } from "@/lib/domain";
import { getDataMode, listEvents } from "@/lib/view-data";

export const instant = false;
export const metadata: Metadata = { title: "全量事件流" };

function decimalParam(value: string | undefined): Decimal | null {
  if (!value) return null;
  try {
    const parsed = new Decimal(value);
    return parsed.isFinite() && parsed.gte(0) ? parsed : null;
  } catch {
    return null;
  }
}

export default async function EventsPage({ searchParams }: PageProps<"/events">) {
  const params = await searchParams;
  const query = singleParam(params.query);
  const categoryValue = singleParam(params.category);
  const verificationValue = singleParam(params.verificationStatus);
  const fundingValue = singleParam(params.fundingType);
  const sortValue = singleParam(params.sort);
  const sort: "freshness" | "impact" | "evidence" = sortValue === "impact" || sortValue === "evidence" ? sortValue : "freshness";
  const view = singleParam(params.view) === "list" ? "list" : "grid";
  const filters = {
    category: isOneOf(categoryValue, CATEGORIES) ? categoryValue : undefined,
    query: query || undefined,
    verificationStatus: isOneOf(verificationValue, VERIFICATION_STATUSES) ? verificationValue : undefined,
    fundingType: isOneOf(fundingValue, FUNDING_TYPES) ? fundingValue : undefined,
    topic: singleParam(params.topic) || undefined,
    company: singleParam(params.company) || undefined,
    region: singleParam(params.region) || undefined,
    channel: singleParam(params.channel) || undefined,
    from: singleParam(params.from) || undefined,
    to: singleParam(params.to) || undefined,
    sort,
    includeIneligible: singleParam(params.includeIneligible) === "1",
    minAmountUsd: singleParam(params.minAmountUsd) || undefined,
    maxAmountUsd: singleParam(params.maxAmountUsd) || undefined,
  };
  const [mode, language] = await Promise.all([getDataMode(), getLanguage()]);
  const [events, facetEvents] = await Promise.all([listEvents(filters, mode), listEvents(undefined, mode)]);
  const minimum = decimalParam(filters.minAmountUsd);
  const maximum = decimalParam(filters.maxAmountUsd);
  const amountFiltered = events.filter((event) => {
    if (!minimum && !maximum) return true;
    if (!event.funding?.amountUsd) return false;
    const amount = new Decimal(event.funding.amountUsd);
    return (!minimum || amount.gte(minimum)) && (!maximum || amount.lte(maximum));
  });
  const sortedEvents = [...amountFiltered].sort((a, b) => {
    if (sort === "impact") return (b.score.impact.value ?? -1) - (a.score.impact.value ?? -1);
    if (sort === "evidence") return (b.score.evidence.value ?? -1) - (a.score.evidence.value ?? -1);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  const topics = [...new Set(facetEvents.flatMap((event) => event.topics))].sort();
  const companies = [...new Set(facetEvents.flatMap((event) => event.companies))].sort();
  const channels = [...new Set(facetEvents.flatMap((event) => event.sources.map((source) => source.channel)))].sort();
  const t = (zh: string, en: string) => translate(language, zh, en);

  return (
    <div className="page-shell">
      <PageHeader eyebrow={t("EVENT STREAM / 证据流", "EVENT STREAM / EVIDENCE")} title={t("全量事件流", "Full event stream")} description={t("从全文、公司、主题与证据状态进入原始记录。所有筛选条件保留在 URL 中，便于复核与分享；个人状态不会进入链接。", "Search original records by text, company, topic, and evidence status. Filters stay in the URL for review and sharing; personal state is never included.")} meta={<><span>{t("当前结果", "Results")} {sortedEvents.length}</span><span>{t("语料库", "Corpus")} {facetEvents.length}</span><Badge tone="info">{t("GET 可分享筛选", "Shareable GET filters")}</Badge></>} />

      <form className="filter-panel" action="/events" method="get">
        <input type="hidden" name="view" value={view} />
        <div className="filter-grid">
          <label className="field field-wide"><span>{t("全文检索", "Full-text search")}</span><input className="input" type="search" name="query" defaultValue={query} placeholder={t("标题、摘要、公司或来源文本", "Title, summary, company, or source text")} /></label>
          <label className="field"><span>{t("事件日期从", "Event date from")}</span><input className="input" type="date" name="from" defaultValue={filters.from} /></label>
          <label className="field"><span>{t("事件日期至", "Event date to")}</span><input className="input" type="date" name="to" defaultValue={filters.to} /></label>
          <label className="field"><span>{t("主题", "Topic")}</span><input className="input" name="topic" list="topic-options" defaultValue={filters.topic} placeholder={t("如 RSI、机器人", "e.g. RSI, robotics")} /><datalist id="topic-options">{topics.map((topic) => <option key={topic} value={topic} />)}</datalist></label>
          <label className="field"><span>{t("公司 / 机构", "Company / organization")}</span><input className="input" name="company" list="company-options" defaultValue={filters.company} placeholder={t("输入公司", "Enter a company")} /><datalist id="company-options">{companies.map((company) => <option key={company} value={company} />)}</datalist></label>
          <label className="field"><span>{t("地区", "Region")}</span><input className="input" name="region" defaultValue={filters.region} placeholder={t("如 中国、美国、欧洲", "e.g. China, US, Europe")} /></label>
          <label className="field"><span>{t("来源渠道", "Source channel")}</span><select className="select" name="channel" defaultValue={filters.channel ?? ""}><option value="">{t("全部渠道", "All channels")}</option>{channels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}</select></label>
          <label className="field"><span>{t("事件类别", "Category")}</span><select className="select" name="category" defaultValue={filters.category ?? ""}><option value="">{t("全部类别", "All categories")}</option>{CATEGORIES.map((item) => <option key={item} value={item}>{categoryLabels[item][language]}</option>)}</select></label>
          <label className="field"><span>{t("核验状态", "Verification status")}</span><select className="select" name="verificationStatus" defaultValue={filters.verificationStatus ?? ""}><option value="">{t("全部状态", "All statuses")}</option>{VERIFICATION_STATUSES.map((item) => <option key={item} value={item}>{verificationLabelsI18n[item][language]}</option>)}</select></label>
          <label className="field"><span>{t("融资类型", "Funding type")}</span><select className="select" name="fundingType" defaultValue={filters.fundingType ?? ""}><option value="">{t("全部融资类型", "All funding types")}</option>{FUNDING_TYPES.map((item) => <option key={item} value={item}>{fundingTypeLabelsI18n[item][language]}</option>)}</select></label>
          <label className="field"><span>{t("排序", "Sort by")}</span><select className="select" name="sort" defaultValue={sort}><option value="freshness">{t("新鲜度优先", "Freshest first")}</option><option value="impact">{t("影响优先", "Impact first")}</option><option value="evidence">{t("证据优先", "Evidence first")}</option></select></label>
          <label className="field"><span>{t("最低融资额（USD）", "Minimum funding (USD)")}</span><input className="input" type="number" name="minAmountUsd" min="0" step="any" defaultValue={filters.minAmountUsd} placeholder="e.g. 1000000000" /></label>
          <label className="field"><span>{t("最高融资额（USD）", "Maximum funding (USD)")}</span><input className="input" type="number" name="maxAmountUsd" min="0" step="any" defaultValue={filters.maxAmountUsd} placeholder={t("不填则不限", "Leave blank for no limit")} /></label>
          <label className="checkbox-label field-full"><input type="checkbox" name="includeIneligible" value="1" defaultChecked={filters.includeIneligible} />{t("包含不符合主筛选或金额未知的事件", "Include events outside the primary screen or with unknown amounts")}</label>
        </div>
        <div className="filter-footer">
          <span className="form-message">{t("金额为美元归一化值；估值不是融资额，未披露金额不会进入金额区间结果。", "Amounts are normalized to USD. Valuation is not funding; undisclosed amounts are excluded from amount ranges.")}</span>
          <div className="button-row"><Link className="button button-quiet" href="/events"><RotateCcw aria-hidden="true" size={14} />{t("清空筛选", "Clear filters")}</Link><button className="button button-primary" type="submit"><Search aria-hidden="true" size={15} />{t("应用筛选", "Apply filters")}</button></div>
        </div>
      </form>

      <div className="result-toolbar">
        <span aria-live="polite">{t("筛选结果", "Results")} <strong className="numeric">{sortedEvents.length}</strong> · {sort === "freshness" ? t("按新鲜度排序", "Sorted by freshness") : sort === "impact" ? t("按影响排序", "Sorted by impact") : t("按证据排序", "Sorted by evidence")}</span>
        <div className="result-toolbar-group" aria-label={t("结果布局", "Result layout")}>
          <Link className={view === "grid" ? "button button-secondary button-small" : "button button-quiet button-small"} aria-pressed={view === "grid"} href={`/events${queryWith(params, { view: "grid" })}`}><Grid2X2 aria-hidden="true" size={14} />{t("卡片", "Cards")}</Link>
          <Link className={view === "list" ? "button button-secondary button-small" : "button button-quiet button-small"} aria-pressed={view === "list"} href={`/events${queryWith(params, { view: "list" })}`}><List aria-hidden="true" size={14} />{t("列表", "List")}</Link>
        </div>
      </div>

      {sortedEvents.length === 0 ? <EmptyState title={t("没有符合当前条件的事件", "No events match these filters")} description={t("尝试放宽日期、金额或核验条件。空结果不会用低相关事件补齐。", "Try widening the date, amount, or verification filters. Empty results are never padded with less relevant events.")} action={<Link className="button button-secondary" href="/events">{t("查看全部事件", "View all events")}</Link>} /> : (
        <div className={view === "grid" ? "event-grid" : "event-list"}>{sortedEvents.map((event) => <EventCard key={event.id} event={event} mode={mode} layout={view} />)}</div>
      )}
    </div>
  );
}
