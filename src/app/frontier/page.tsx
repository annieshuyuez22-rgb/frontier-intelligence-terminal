import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { Badge, EmptyState, PageHeader, Section, StatCard } from "@/components/ui";
import { getLanguage } from "@/components/language-server";
import { translate } from "@/components/language";
import { getDataMode, listEvents } from "@/lib/view-data";
import type { EventRecord } from "@/lib/domain";

export const instant = false;
export const metadata: Metadata = { title: "前沿行业" };

const frontiers = [
  { name: "模型与先进计算", nameEn: "Models & advanced computing", terms: ["模型", "推理", "算力", "芯片", "半导体", "先进封装", "LLM"], description: "半导体、模型能力、推理成本与可复现评测", descriptionEn: "Semiconductors, model capability, inference cost, and reproducible evaluation" },
  { name: "机器人与具身智能", nameEn: "Robotics & embodied AI", terms: ["机器人", "具身", "自动驾驶", "机械", "机器人基础模型"], description: "真实环境任务、基础模型、硬件可靠性与部署成本", descriptionEn: "Real-world tasks, foundation models, hardware reliability, and deployment cost" },
  { name: "商业航天与空间设施", nameEn: "Commercial space & infrastructure", terms: ["商业航天", "空间", "卫星", "火箭", "发射", "空间站"], description: "发射与在轨验证、客户、单位成本和基础设施", descriptionEn: "Launch and on-orbit validation, customers, unit costs, and infrastructure" },
  { name: "先进制造", nameEn: "Advanced manufacturing", terms: ["先进制造", "制造", "工业", "产线", "增材", "3D 打印"], description: "真实产线、生产效率、良率与部署回报", descriptionEn: "Real production lines, efficiency, yield, and deployment returns" },
  { name: "量子科技", nameEn: "Quantum technology", terms: ["量子", "量子计算", "量子通信", "量子传感"], description: "物理量子比特、纠错、实验协议与独立复核", descriptionEn: "Physical qubits, error correction, protocols, and independent review" },
  { name: "聚变与新能源", nameEn: "Fusion & new energy", terms: ["聚变", "核聚变", "能源", "电池", "氢能", "储能"], description: "能量增益、工程验证、资本强度与规模化约束", descriptionEn: "Energy gain, engineering validation, capital intensity, and scale constraints" },
  { name: "合成生物与脑机接口", nameEn: "Synthetic biology & BCI", terms: ["合成生物", "药物", "蛋白", "基因", "临床", "生物", "脑机", "神经"], description: "实验里程碑、临床阶段、植入安全与转化边界", descriptionEn: "Experimental milestones, clinical stages, implant safety, and translation limits" },
  { name: "先进材料", nameEn: "Advanced materials", terms: ["先进材料", "材料发现", "超导", "合金", "催化剂", "纳米材料"], description: "候选材料、合成验证、性能复测与量产约束", descriptionEn: "Candidate materials, synthesis validation, repeat testing, and production constraints" },
  { name: "海洋科技", nameEn: "Ocean technology", terms: ["海洋", "深海", "水下", "海底", "无人潜航"], description: "深海部署、传感、可靠性与真实任务数据", descriptionEn: "Deep-sea deployment, sensing, reliability, and real mission data" },
  { name: "重大科研基础设施", nameEn: "Major research infrastructure", terms: ["大科学装置", "科研基础设施", "望远镜", "加速器", "同步辐射", "光源"], description: "装置建设、开放共享、科研产出与运行指标", descriptionEn: "Facility construction, open access, research output, and operating metrics" },
];

function matches(event: EventRecord, terms: string[]): boolean {
  const text = [event.title, event.summary, ...event.topics, ...event.companies].join(" ").toLowerCase();
  return terms.some((term) => text.includes(term.toLowerCase()));
}

export default async function FrontierPage() {
  const [mode, language] = await Promise.all([getDataMode(), getLanguage()]);
  const events = await listEvents(undefined, mode);
  const t = (zh: string, en: string) => translate(language, zh, en);
  const frontierEvents = events.filter((event) => event.category === "frontier" || frontiers.some((item) => matches(event, item.terms)));
  const research = frontierEvents.filter((event) => ["preprint", "official", "third_party_review"].includes(event.infoType));
  const metrics = frontierEvents.flatMap((event) => event.metrics.map((metric) => ({ event, metric })));
  const crossVerified = frontierEvents.filter((event) => event.verificationStatus === "cross_verified").length;
  const withProtocol = metrics.filter((item) => item.metric.methodology || item.metric.sample).length;

  return (
    <div className="page-shell">
      <PageHeader eyebrow={t("FRONTIER / 技术证据", "FRONTIER / TECHNICAL EVIDENCE")} title={t("前沿行业，不止于发布口号", "Frontier industries, beyond launch claims")} description={t("把模型、机器人、生命科学与硬科技拆成可验证的技术里程碑：协议、样本、成本与局限先于宏大叙事。", "We break models, robotics, life sciences, and hard technology into verifiable milestones: protocols, samples, costs, and limitations before grand narratives.")} meta={<><span>{frontierEvents.length} {t("条前沿记录", "frontier records")}</span><span>{research.length} {t("条研究 / 官方 / 评测来源", "research / official / review sources")}</span></>} />
      <div className="stats-grid">
        <StatCard label={t("前沿事件", "Frontier events")} value={frontierEvents.length} note={t("当前类别与主题匹配样本", "Current category and topic-matched sample")} />
        <StatCard label={t("已交叉核验", "Cross-verified")} value={crossVerified} note={t("不代表研究结论已被独立复现", "Does not imply independent replication")} tone="success" />
        <StatCard label={t("关键指标", "Key metrics")} value={metrics.length} note={t("指标原值保留，不强行统一单位", "Original values retained without forced unit conversion")} />
        <StatCard label={t("含样本或方法", "With sample or method")} value={withProtocol} note={t("其余指标的协议信息可能未知", "Protocol details may be unknown for other metrics")} tone="warning" />
      </div>
      <Section title={t("研究版图", "Research landscape")} description={t("主题由事件标题、摘要与标签匹配；一个事件可能跨多个前沿方向。", "Topics are matched from titles, summaries, and tags; an event may span multiple frontier areas.")}>
        <div className="topic-overview">{frontiers.map((item) => {
          const count = frontierEvents.filter((event) => matches(event, item.terms)).length;
          return <article className="topic-tile" key={item.name}><Badge>{count}</Badge><h3>{t(item.name, item.nameEn)}</h3><p>{t(item.description, item.descriptionEn)}</p></article>;
        })}</div>
      </Section>
      <Section title={t("实验协议与关键指标", "Experimental protocols & key metrics")} description={t("样本、方法、成本与引用优先；未提供的方法信息明确写为未知。", "Samples, methods, costs, and citations come first; missing methodology is explicitly marked unknown.")}>
        {metrics.length === 0 ? <EmptyState title={t("暂无可比较的技术指标", "No comparable technical metrics")} description={t("当前前沿事件没有结构化指标，不能用发布摘要替代实验结果。", "No structured metrics are available; launch summaries cannot substitute for experimental results.")} /> : (
          <div className="table-scroll"><table className="data-table metric-table"><thead><tr><th scope="col">{t("指标 / 数值", "Metric / value")}</th><th scope="col">{t("协议与方法", "Protocol & method")}</th><th scope="col">{t("样本", "Sample")}</th><th scope="col">{t("周期", "Period")}</th><th scope="col">{t("来源事件与局限", "Source event & limitations")}</th></tr></thead><tbody>{metrics.slice(0, 30).map(({ event, metric }) => <tr key={`${event.id}-${metric.id}`}><td>{metric.label}<br /><strong className="metric-value">{metric.value} {metric.unit}</strong></td><td>{metric.methodology ?? t("未知", "Unknown")}</td><td>{metric.sample ?? t("未知", "Unknown")}</td><td>{metric.period ?? t("未知", "Unknown")}</td><td><Link className="text-link" href={`/events/${encodeURIComponent(event.slug || event.id)}`}>{language === "en" && event.titleEn ? event.titleEn : event.title}</Link><br /><span className="form-message">{event.evidenceBoundary}</span></td></tr>)}</tbody></table></div>
        )}
      </Section>
      <Section title={t("前沿事件与证据边界", "Frontier events & evidence limits")} description={t("评分不是技术成熟度；请进入详情查看 claim→source 映射。", "Scores are not technology readiness ratings; open details to inspect claim→source mappings.")}>
        {frontierEvents.length === 0 ? <EmptyState title={t("暂无前沿事件", "No frontier events")} description={t("当前渠道尚未提供可发布的前沿研究记录。", "Current sources have not produced publishable frontier research records.")} /> : <div className="event-grid">{frontierEvents.map((event) => <EventCard key={event.id} event={event} mode={mode} />)}</div>}
      </Section>
    </div>
  );
}
