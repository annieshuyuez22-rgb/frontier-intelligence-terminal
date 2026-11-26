import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { Badge, EmptyState, InlineNotice, PageHeader, Section, StatCard } from "@/components/ui";
import { getLanguage } from "@/components/language-server";
import { translate } from "@/components/language";
import { getDataMode, listEvents } from "@/lib/view-data";
import type { EventRecord } from "@/lib/domain";

export const instant = false;
export const metadata: Metadata = { title: "数字营销" };

const lenses = [
  { name: "AI 营销与广告技术", nameEn: "AI marketing & ad tech", terms: ["AI 营销", "广告", "AdTech", "创意", "生成"], description: "生成产量不是品牌效果，需保留人工审查、投放成本与实验组。", descriptionEn: "Generation volume is not brand impact; retain human review, media costs, and control groups." },
  { name: "搜索营销 / SEO / GEO", nameEn: "Search marketing / SEO / GEO", terms: ["搜索", "SEO", "GEO", "分发", "推荐"], description: "可见度变化必须区分平台机制、样本查询与真实转化。", descriptionEn: "Separate platform mechanics, sampled queries, and actual conversion when reading visibility changes." },
  { name: "社交与创作者经济", nameEn: "Social & creator economy", terms: ["社交", "创作者", "达人", "短视频", "社区"], description: "区分内容声量、创作者合作和可追踪业务贡献。", descriptionEn: "Distinguish content volume, creator partnerships, and traceable business contribution." },
  { name: "自动化与 CRM", nameEn: "Automation & CRM", terms: ["CRM", "自动化", "工作流", "Agent", "智能体", "线索"], description: "区分演示工作流与持续生产环境中的可控执行和线索质量。", descriptionEn: "Separate demo workflows from controlled execution and lead quality in production." },
  { name: "归因与增长测量", nameEn: "Attribution & growth measurement", terms: ["数据", "归因", "测量", "ROAS", "CAC", "LTV", "转化率", "复购"], description: "核对归因窗口、对照组、样本、复购贡献与独立业务数据。", descriptionEn: "Check attribution windows, controls, samples, repeat-purchase contribution, and independent business data." },
  { name: "平台政策与隐私", nameEn: "Platform policy & privacy", terms: ["平台政策", "隐私", "Cookie", "consent", "政策变化"], description: "关注授权、平台规则、归因缺口与跨区域合规。", descriptionEn: "Track consent, platform rules, attribution gaps, and cross-region compliance." },
];

function matches(event: EventRecord, terms: string[]): boolean {
  const text = [event.title, event.summary, ...event.topics].join(" ").toLowerCase();
  return terms.some((term) => text.includes(term.toLowerCase()));
}

export default async function MarketingPage() {
  const [mode, language] = await Promise.all([getDataMode(), getLanguage()]);
  const allEvents = await listEvents(undefined, mode);
  const t = (zh: string, en: string) => translate(language, zh, en);
  const events = allEvents.filter((event) => event.category === "marketing" || lenses.some((lens) => matches(event, lens.terms)));
  const experiments = events.flatMap((event) => event.actions.map((action) => ({ event, action })));
  const costMetrics = events.flatMap((event) => event.metrics.filter((metric) => /cost|成本|费用|cpm|cpc|cpa|roi|roas/i.test(`${metric.label} ${metric.unit ?? ""}`)).map((metric) => ({ event, metric })));
  const channelRows = [...new Set(events.flatMap((event) => event.sources.map((source) => source.channel)))].map((channel) => ({
    channel,
    events: events.filter((event) => event.sources.some((source) => source.channel === channel)).length,
    independent: new Set(events.flatMap((event) => event.sources.filter((source) => source.channel === channel).map((source) => source.originGroup))).size,
  }));

  return (
    <div className="page-shell">
      <PageHeader eyebrow={t("MARKETING / 增长与测量", "MARKETING / GROWTH & MEASUREMENT")} title={t("数字营销，从信号到实验", "Digital marketing, from signal to experiment")} description={t("追踪 AI 搜索、内容生产、第一方数据与营销智能体。平台声明、案例结果与独立测量分开，避免把渠道声量直接写成增长。", "Track AI search, content production, first-party data, and marketing agents. Platform claims, case results, and independent measurement stay separate; channel volume is not growth.")} meta={<><span>{events.length} {t("条营销信号", "marketing signals")}</span><span>{experiments.length} {t("条可执行动作", "actionable experiments")}</span></>} />
      <InlineNotice tone="warning"><strong>{t("测量警示：", "Measurement warning: ")}</strong>{t("曝光、讨论量和采集量不等于收入或转化。案例中的提升必须同时核对基线、样本、时间窗、归因方法与成本。", "Impressions, discussion, and collection volume are not revenue or conversion. Validate baselines, samples, windows, attribution, and costs for every claimed uplift.")}</InlineNotice>
      <div className="stats-grid">
        <StatCard label={t("营销事件", "Marketing events")} value={events.length} note={t("当前类别与主题匹配样本", "Current category and topic-matched sample")} />
        <StatCard label={t("成本 / 效果指标", "Cost / performance metrics")} value={costMetrics.length} note={t("未披露成本时不推算 ROI", "No ROI inference when costs are undisclosed")} />
        <StatCard label={t("建议实验", "Suggested experiments")} value={experiments.length} note={t("需先完成来源与口径复核", "Sources and measurement definitions require review")} />
        <StatCard label={t("覆盖渠道", "Channels covered")} value={channelRows.length} note={t("覆盖不等于独立验证", "Coverage is not independent verification")} tone="warning" />
      </div>
      <Section title={t("四个观察切面", "Observation lenses")} description={t("每个切面都可能缺少商业结果证据；未知不会用零或高分替代。", "Any lens may lack business-outcome evidence; unknown is never replaced with zero or a high score.")}>
        <div className="topic-overview">{lenses.map((lens) => <article className="topic-tile" key={lens.name}><Badge>{events.filter((event) => matches(event, lens.terms)).length}</Badge><h3>{t(lens.name, lens.nameEn)}</h3><p>{t(lens.description, lens.descriptionEn)}</p></article>)}</div>
      </Section>
      <Section title={t("渠道证据构成", "Channel evidence composition")} description={t("同一内容被多个渠道转载仍可能只有一个独立来源。", "Republishing across channels may still represent only one independent source.")}>
        {channelRows.length === 0 ? <EmptyState title={t("渠道数据不足", "Insufficient channel data")} description={t("当前营销样本没有可用渠道信息。", "No channel information is available for the current marketing sample.")} /> : <div className="table-scroll"><table className="data-table"><thead><tr><th scope="col">{t("渠道", "Channel")}</th><th scope="col">{t("关联事件", "Related events")}</th><th scope="col">{t("独立来源组", "Independent source groups")}</th><th scope="col">{t("解释边界", "Interpretation limits")}</th></tr></thead><tbody>{channelRows.map((row) => <tr key={row.channel}><td>{row.channel}</td><td>{row.events}</td><td>{row.independent}</td><td>{t("渠道内样本；不可外推整体市场", "Channel sample only; do not extrapolate to the whole market")}</td></tr>)}</tbody></table></div>}
      </Section>
      <Section title={t("本周实验队列", "This week’s experiment queue")} description={t("先复核，再投入；每条建议保留材料、验证步骤和预期输出。", "Review before investing; every suggestion retains materials, verification steps, and expected output.")}>
        {experiments.length === 0 ? <EmptyState title={t("没有可执行实验建议", "No executable experiment suggestions")} description={t("当前证据不足以提出实验，不自动生成增长建议。", "Evidence is insufficient for experiments; growth recommendations are not generated automatically.")} /> : <div className="action-stack">{experiments.slice(0, 8).map(({ event, action }) => <article className="action-item" key={`${event.id}-${action.id}`}><h3>{action.title}</h3><p><Link className="text-link" href={`/events/${encodeURIComponent(event.slug || event.id)}`}>{language === "en" && event.titleEn ? event.titleEn : event.title}</Link></p><dl><div><dt>{t("材料", "Materials")}</dt><dd>{action.materials}</dd></div><div><dt>{t("验证", "Verification")}</dt><dd>{action.verification}</dd></div><div><dt>{t("产出", "Output")}</dt><dd>{action.expectedOutput}</dd></div></dl></article>)}</div>}
      </Section>
      <Section title={t("营销事件流", "Marketing event stream")} description={t("事实、平台主张与 AI 分析请在事件详情中分别阅读。", "Read facts, platform claims, and AI analysis separately in event details.")}>
        {events.length === 0 ? <EmptyState title={t("暂无营销事件", "No marketing events")} description={t("当前渠道没有可发布的营销情报。", "No publishable marketing intelligence is available from current sources.")} /> : <div className="event-grid">{events.map((event) => <EventCard key={event.id} event={event} mode={mode} />)}</div>}
      </Section>
    </div>
  );
}
