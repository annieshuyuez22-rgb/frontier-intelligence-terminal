import type { Metadata } from "next";
import Link from "next/link";
import Decimal from "decimal.js";
import { singleParam, isOneOf } from "@/components/query";
import { formatDate, formatUsd, verificationTone } from "@/components/format";
import { Badge, EmptyState, InlineNotice, PageHeader, StatCard } from "@/components/ui";
import { getLanguage } from "@/components/language-server";
import { translate } from "@/components/language";
import { FUNDING_TYPES, fundingStageLabelsI18n, fundingTypeLabelsI18n, qualificationLabelsI18n, verificationLabelsI18n, type EventRecord, type FundingType, type UILanguage } from "@/lib/domain";
import { getDataMode, listEvents } from "@/lib/view-data";

export const instant = false;
export const metadata: Metadata = { title: "大额融资" };

const billion = new Decimal("1000000000");

function amountOf(event: EventRecord): Decimal | null {
  const value = event.funding?.amountUsd;
  if (!value) return null;
  const amount = new Decimal(value);
  return amount.isFinite() ? amount : null;
}

function isCoreType(type: FundingType): boolean {
  return type === "equity" || type === "mixed";
}

function FundingTable({ events, title, description, language }: { events: EventRecord[]; title: string; description: string; language: UILanguage }) {
  const t = (zh: string, en: string) => translate(language, zh, en);
  return (
    <section className="section" aria-labelledby={`funding-${title}`}>
      <div className="section-heading"><div><h2 id={`funding-${title}`}>{title}</h2><p>{description}</p></div><Badge>{events.length}</Badge></div>
      {events.length === 0 ? <EmptyState title={t("此分组暂无记录", "No records in this group")} description={t("没有符合该口径的事件；不以估值、传闻金额或其他融资类型补位。", "No events meet this definition. Valuations, rumored amounts, and other funding types are never used as substitutes.")} /> : (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th scope="col">{t("公司 / 事件", "Company / event")}</th><th scope="col">{t("美元融资额", "Funding (USD)")}</th><th scope="col">{t("原币披露", "Original currency")}</th><th scope="col">{t("类型 / 阶段", "Type / stage")}</th><th scope="col">{t("资格与核验", "Qualification & verification")}</th><th scope="col">{t("事件日期", "Event date")}</th><th scope="col">{t("FX 口径", "FX basis")}</th></tr></thead>
            <tbody>{events.map((event) => {
              const funding = event.funding;
              if (!funding) return null;
              const title = language === "en" && event.titleEn ? event.titleEn : event.title;
              return (
                <tr key={event.id}>
                  <td className="funding-table-company">{event.companies.join(language === "en" ? ", " : "、") || t("公司未标注", "Company not tagged")}<Link className="text-link" href={`/events/${encodeURIComponent(event.slug || event.id)}`}>{title}</Link>{language === "en" && !event.titleEn ? <Badge tone="warning">English summary not provided</Badge> : null}</td>
                  <td className="amount">{formatUsd(funding.amountUsd, true, language)}</td>
                  <td>{funding.amountOriginal ? `${funding.amountOriginal} ${funding.currency}` : t("未披露", "Undisclosed")}{funding.splitUnknown ? <><br /><Badge tone="warning">{t("拆分未知", "Split unknown")}</Badge></> : null}</td>
                  <td>{fundingTypeLabelsI18n[funding.type][language]}<br /><span className="form-message">{fundingStageLabelsI18n[funding.stage][language]}</span></td>
                  <td><Badge tone={funding.qualification === "strict" ? "success" : funding.qualification === "ineligible" ? "danger" : "warning"}>{qualificationLabelsI18n[funding.qualification][language]}</Badge><br /><Badge tone={verificationTone[event.verificationStatus]}>{verificationLabelsI18n[event.verificationStatus][language]}</Badge></td>
                  <td>{formatDate(event.eventDate, undefined, language)}</td>
                  <td>{funding.fxRate ?? t("未知", "Unknown")}<br /><span className="form-message">{funding.fxSource ?? t("换算来源未知", "FX source unknown")} · {funding.fxDate ?? t("日期未知", "Date unknown")}</span></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function FundingPage({ searchParams }: PageProps<"/funding">) {
  const params = await searchParams;
  const typeValue = singleParam(params.fundingType);
  const includeIneligible = singleParam(params.includeIneligible) === "1";
  const [mode, language] = await Promise.all([getDataMode(), getLanguage()]);
  const events = await listEvents({
    category: "funding",
    includeIneligible: true,
    fundingType: isOneOf(typeValue, FUNDING_TYPES) ? typeValue : undefined,
  }, mode);
  const t = (zh: string, en: string) => translate(language, zh, en);
  const withFunding = events.filter((event) => event.funding !== null && event.funding !== undefined);
  const strict = withFunding.filter((event) => {
    const funding = event.funding;
    const amount = amountOf(event);
    return funding && isCoreType(funding.type) && funding.qualification === "strict" && funding.disclosed && amount?.gt(billion);
  });
  const borderline = withFunding.filter((event) => {
    const amount = amountOf(event);
    return event.funding && isCoreType(event.funding.type) && amount?.eq(billion) && !strict.includes(event);
  });
  const otherTypes = withFunding.filter((event) => event.funding && !isCoreType(event.funding.type));
  const strictIds = new Set([...strict, ...borderline, ...otherTypes].map((event) => event.id));
  const ineligible = withFunding.filter((event) => !strictIds.has(event.id));
  const total = strict.reduce((sum, event) => sum.plus(amountOf(event) ?? 0), new Decimal(0));
  const pending = withFunding.filter((event) => event.verificationStatus !== "cross_verified").length;

  return (
    <div className="page-shell">
      <PageHeader eyebrow="CAPITAL / STRICT SCREEN" title={t("严格超过 $1B 的融资", "Funding strictly over $1B")} description={t("主列表仅保留股权与混合融资中已披露、美元归一化后严格大于 10 亿美元的记录。恰好 10 亿美元与其他融资工具独立呈现。", "The primary list includes disclosed equity and mixed financing strictly above USD 1 billion after normalization. Exactly USD 1 billion and other instruments are shown separately.")} meta={<><span>{t("口径：", "Rule: ")}amountUsd &gt; 1,000,000,000</span><span>{t("主类型：equity + mixed", "Primary types: equity + mixed")}</span></>} />
      <InlineNotice><strong>{t("估值不等于融资。", "Valuation is not funding.")}</strong>{t("本页不将投前 / 投后估值、市值或意向额度当作融资。拆分未知的混合融资总额不能当作全部股权，但可按“混合融资”进入主列表，并在原币披露处显著标注“拆分未知”。签约、宣布与交割阶段分别标注。", "Pre/post-money valuations, market capitalization, and indicative facilities are not treated as funding. A mixed package with an unknown split is not entirely equity, but may enter the primary list as mixed financing with a prominent “split unknown” label. Signed, announced, and closed stages remain distinct.")}</InlineNotice>
      <div className="stats-grid">
        <StatCard label={t("严格合格", "Strictly qualified")} value={strict.length} note={t("股权 + 混合，严格 > $1B", "Equity + mixed, strictly > $1B")} tone="success" />
        <StatCard label={t("主列表披露总额", "Disclosed primary total")} value={formatUsd(total.toString(), true, language)} note={t("仅当前筛选样本，不是市场总量", "Current filtered sample only, not the market total")} />
        <StatCard label={t("恰好 $1B", "Exactly $1B")} value={borderline.length} note={t("独立临界组，不进入主列表", "Separate borderline group; excluded from primary list")} />
        <StatCard label={t("尚未交叉核验", "Not cross-verified")} value={pending} note={t("所有融资分组中的待核验记录", "Pending verification across all funding groups")} tone="warning" />
      </div>
      <form className="filter-panel" method="get" action="/funding">
        <div className="filter-footer">
          <div className="result-toolbar-group">
            <label className="field"><span>{t("融资工具", "Funding instrument")}</span><select className="select" name="fundingType" defaultValue={typeValue}><option value="">{t("全部类型", "All types")}</option>{FUNDING_TYPES.map((type) => <option value={type} key={type}>{fundingTypeLabelsI18n[type][language]}</option>)}</select></label>
            <label className="checkbox-label"><input type="checkbox" name="includeIneligible" value="1" defaultChecked={includeIneligible} />{t("展开不符合项与未知金额", "Show ineligible records and unknown amounts")}</label>
          </div>
          <div className="button-row"><Link className="button button-quiet" href="/funding">{t("重置", "Reset")}</Link><button className="button button-primary" type="submit">{t("应用口径", "Apply criteria")}</button></div>
        </div>
      </form>
      <FundingTable events={strict} title={t("主筛选", "Primary screen")} description={t("严格大于 $1B，且仅股权 / 混合融资；仍须阅读单条来源和融资阶段。", "Strictly over $1B, equity or mixed only; review each source and funding stage.")} language={language} />
      <FundingTable events={borderline} title={t("临界关注：恰好 $1B", "Borderline: exactly $1B")} description={t("金额恰好等于阈值，不属于“严格超过”，独立保留以便监测后续修订。", "Exactly at the threshold, not strictly above it; tracked separately for later revisions.")} language={language} />
      <FundingTable events={otherTypes} title={t("其他资本工具", "Other capital instruments")} description={t("债务、授信、补贴、并购、基金与未知类型独立标注，不并入股权主榜。", "Debt, credit, subsidies, acquisitions, funds, and unknown types are labeled separately from the equity list.")} language={language} />
      {includeIneligible ? <FundingTable events={ineligible} title={t("不符合项与未知金额", "Ineligible & unknown amounts")} description={t("低于阈值、拆分未知、未披露或资格不明的记录，仅供审计筛选口径。", "Below-threshold, unknown-split, undisclosed, or unqualified records for screening audit only.")} language={language} /> : <InlineNotice tone="warning">{t("不符合项与未知金额默认收起。勾选上方“展开不符合项与未知金额”可审计被排除记录。", "Ineligible and unknown amounts are collapsed by default. Enable the option above to audit excluded records.")}</InlineNotice>}
    </div>
  );
}
