import { fundingTypeLabelsI18n, type DailyBriefRecord, type EventRecord, type FundingType, type UILanguage } from "@/lib/domain";
import { formatUsd } from "./format";
import { translate } from "./language";
import { EmptyState } from "./ui";

interface TrendPoint {
  date: string;
  count: number;
}

interface FundingPoint {
  type: FundingType;
  amount: number;
  count: number;
}

function dateKey(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : date.toISOString().slice(0, 10);
}

function buildTrend(events: EventRecord[], brief: DailyBriefRecord): TrendPoint[] {
  const end = new Date(brief.coverage.windowEnd);
  const validEnd = Number.isNaN(end.getTime()) ? new Date(`${brief.date}T00:00:00Z`) : end;
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = dateKey(event.eventDate);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(validEnd);
    date.setUTCDate(validEnd.getUTCDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: counts.get(key) ?? 0 };
  });
}

function buildFunding(events: EventRecord[]): FundingPoint[] {
  const totals = new Map<string, FundingPoint>();
  for (const event of events) {
    const funding = event.funding;
    if (!funding?.amountUsd || !funding.disclosed) continue;
    const amount = Number(funding.amountUsd);
    if (!Number.isFinite(amount) || amount < 0) continue;
    const previous = totals.get(funding.type) ?? { type: funding.type, amount: 0, count: 0 };
    previous.amount += amount;
    previous.count += 1;
    totals.set(funding.type, previous);
  }
  return [...totals.values()].sort((a, b) => b.amount - a.amount);
}

export function IntelligenceCharts({ events, brief, language }: { events: EventRecord[]; brief: DailyBriefRecord; language: UILanguage }) {
  const t = (zh: string, en: string) => translate(language, zh, en);
  const trend = buildTrend(events, brief);
  const funding = buildFunding(events);
  const maxCount = Math.max(1, ...trend.map((point) => point.count));
  const linePoints = trend.map((point, index) => {
    const x = 46 + index * 72;
    const y = 160 - (point.count / maxCount) * 112;
    return { x, y, ...point };
  });
  const maxFunding = Math.max(1, ...funding.map((point) => point.amount));

  return (
    <div className="chart-grid">
      <article className="chart-panel">
        <h3>{t("近 7 日采集事件", "Events collected over 7 days")}</h3>
        <p>{t("按事件日期归集；反映当前样本的采集节奏，不代表市场热度。", "Grouped by event date; describes collection cadence in this sample, not market momentum.")}</p>
        {events.length === 0 ? <EmptyState title={t("趋势数据不足", "Insufficient trend data")} description={t("当前统计窗口没有可绘制的事件，图表不补零推断市场。", "No events can be plotted in this window; zero-filled market inferences are not generated.")} /> : (
          <>
            <svg className="chart-svg" viewBox="0 0 500 205" role="img" aria-labelledby="trend-chart-title trend-chart-desc">
              <title id="trend-chart-title">{t("近七日采集事件数量折线图", "Line chart of events collected over seven days")}</title>
              <desc id="trend-chart-desc">{t("每日采集量，完整数值见下方数据表。", "Daily collection counts; full values are available in the data table below.")}</desc>
              {[0, 1, 2, 3].map((line) => <line key={line} className="chart-grid-line" x1="42" x2="480" y1={48 + line * 37.3} y2={48 + line * 37.3} />)}
              <polyline className="chart-line" points={linePoints.map((point) => `${point.x},${point.y}`).join(" ")} />
              {linePoints.map((point) => (
                <g key={point.date}>
                  <circle className="chart-point" cx={point.x} cy={point.y} r="4"><title>{`${point.date}: ${point.count}`}</title></circle>
                  <text className="chart-axis-text" x={point.x} y="185" textAnchor="middle">{point.date.slice(5)}</text>
                  <text className="chart-axis-text" x={point.x} y={point.y - 10} textAnchor="middle">{point.count}</text>
                </g>
              ))}
            </svg>
            <details className="data-table-details"><summary>{t("查看趋势数据表", "View trend data table")}</summary><div className="table-scroll"><table className="data-table"><caption className="sr-only">{t("近七日事件采集量", "Events collected over seven days")}</caption><thead><tr><th scope="col">{t("日期", "Date")}</th><th scope="col">{t("事件数", "Events")}</th></tr></thead><tbody>{trend.map((point) => <tr key={point.date}><td>{point.date}</td><td>{point.count}</td></tr>)}</tbody></table></div></details>
          </>
        )}
      </article>

      <article className="chart-panel">
        <h3>{t("披露资金流向", "Disclosed capital flows")}</h3>
        <p>{t("仅汇总当前样本中有美元金额的记录；估值、未披露金额不计入。", "Only records with disclosed USD amounts in this sample; valuations and undisclosed amounts are excluded.")}</p>
        {funding.length === 0 ? <EmptyState title={t("资金数据不足", "Insufficient funding data")} description={t("没有可比的已披露美元融资金额，显示未知而非零。", "No comparable disclosed USD funding amounts; shown as unknown rather than zero.")} /> : (
          <>
            <svg className="chart-svg" viewBox="0 0 430 210" role="img" aria-labelledby="funding-chart-title funding-chart-desc">
              <title id="funding-chart-title">{t("按融资类型划分的披露金额", "Disclosed amounts by funding type")}</title>
              <desc id="funding-chart-desc">{t("金额以美元归一化，完整数值见下方数据表。", "Amounts normalized to USD; full values are available below.")}</desc>
              {funding.map((point, index) => {
                const width = (point.amount / maxFunding) * 225;
                return (
                  <g key={point.type}>
                    <text className="chart-axis-text" x="0" y={34 + index * 42}>{fundingTypeLabelsI18n[point.type][language]}</text>
                    <rect className={index % 2 === 0 ? "chart-bar" : "chart-bar chart-bar-secondary"} x="78" y={20 + index * 42} width={width} height="18" />
                    <text className="chart-axis-text" x="420" y={34 + index * 42} textAnchor="end">{formatUsd(String(point.amount), true, language)}</text>
                  </g>
                );
              })}
            </svg>
            <details className="data-table-details"><summary>{t("查看资金数据表", "View funding data table")}</summary><div className="table-scroll"><table className="data-table"><caption className="sr-only">{t("按融资类型汇总金额", "Amounts by funding type")}</caption><thead><tr><th scope="col">{t("类型", "Type")}</th><th scope="col">{t("事件数", "Events")}</th><th scope="col">{t("披露美元金额", "Disclosed USD")}</th></tr></thead><tbody>{funding.map((point) => <tr key={point.type}><td>{fundingTypeLabelsI18n[point.type][language]}</td><td>{point.count}</td><td>{formatUsd(String(point.amount), false, language)}</td></tr>)}</tbody></table></div></details>
          </>
        )}
      </article>
    </div>
  );
}
