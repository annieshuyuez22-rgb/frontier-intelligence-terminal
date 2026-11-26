import Link from "next/link";
import { DEFAULT_NARRATIVE_DEFINITIONS, type EventRecord, type UILanguage } from "@/lib/domain";
import { formatUsd } from "./format";
import { eventDisplayTitle, translate } from "./language";
import { Badge, EmptyState } from "./ui";

interface NarrativeFramework {
  name: string;
  fullName: string;
  aliases: string[];
  thesis: string;
  thesisEn: string;
  bottleneck: string;
  bottleneckEn: string;
  definitionEn: string;
}

const frameworks: NarrativeFramework[] = [
  {
    name: "RSI",
    fullName: "Recursive Self-Improvement · 递归式自我改进",
    aliases: ["RSI", "Recursive Self-Improvement", "递归式自我改进", "自我改进"],
    thesis: "核心主张：系统不仅完成任务，还能生成、评估并部署改进自身的修改，且后续改进能力可持续提升。一般自动化、 Agent 工作流或金融技术指标 RSI 均不在此定义内。",
    thesisEn: "Core thesis: the system not only completes tasks, but generates, evaluates, and deploys self-modifications that improve its subsequent capacity to improve. General automation, agent workflows, and the financial RSI indicator are outside this definition.",
    bottleneck: "关键瓶颈：改进是否可重复、能否跨代累积、评估是否独立于被改进系统，以及安全边界是否仍然有效。",
    bottleneckEn: "Key bottlenecks: repeatability, accumulation across generations, independent evaluation, and whether safety boundaries still hold.",
    definitionEn: "Recursive Self-Improvement: a system can generate, evaluate, and deploy modifications that improve its future ability to improve. This is distinct from general automation and the Relative Strength Index.",
  },
  {
    name: "AI for Drug",
    fullName: "AI-driven Drug Discovery & Development · AI 药物研发",
    aliases: ["AI for Drug", "AI 药物", "药物研发", "分子设计", "临床"],
    thesis: "核心主张：机器学习可改善靶点识别、分子设计、临床前或临床研发决策；最终仍需实验和临床里程碑验证，而非仅凭生成分子或回顾性指标。",
    thesisEn: "Core thesis: machine learning can improve target identification, molecular design, and preclinical or clinical decisions, but experimental and clinical milestones—not generated molecules or retrospective metrics alone—must validate it.",
    bottleneck: "关键瓶颈：前瞻性实验、临床转化、数据偏倚、失败样本不可见，以及研发周期与成本是否真正缩短。",
    bottleneckEn: "Key bottlenecks: prospective experiments, clinical translation, data bias, invisible failures, and whether development time and cost actually decline.",
    definitionEn: "AI for Drug applies machine learning to targets, molecular design, preclinical work, or clinical development decisions, validated through experimental and clinical milestones.",
  },
  {
    name: "AI for Science",
    fullName: "AI for Science · 科学智能",
    aliases: ["AI for Science", "科学智能", "材料发现", "蛋白质", "数学推理"],
    thesis: "核心主张：AI 可参与可检验的科学假设、实验、模拟与发现流程。模型基准提升与独立科学发现是两类不同证据。",
    thesisEn: "Core thesis: AI can participate in testable hypotheses, experiments, simulation, and discovery. Better model benchmarks and independent scientific discoveries are different kinds of evidence.",
    bottleneck: "关键瓶颈：可复现性、外部验证、实验闭环、数据泄漏，以及发现是否能在新条件下成立。",
    bottleneckEn: "Key bottlenecks: reproducibility, external validation, experimental feedback loops, data leakage, and whether findings hold under new conditions.",
    definitionEn: "AI for Science applies AI to testable scientific hypotheses, experiments, simulations, and discovery workflows.",
  },
  {
    name: "Personal Agent",
    fullName: "Personal Agent · 个人智能体",
    aliases: ["Personal Agent", "个人智能体", "个人代理", "个人助理"],
    thesis: "核心主张：软件在用户授权边界内持续理解个人上下文，并跨工具完成任务。单次聊天、无持久上下文的插件调用不自动等于个人智能体。",
    thesisEn: "Core thesis: software continuously understands personal context within user-authorized boundaries and completes tasks across tools. A single chat or context-free plugin call is not automatically a personal agent.",
    bottleneck: "关键瓶颈：权限最小化、长期记忆可控性、跨工具可靠性、错误恢复、隐私与用户可撤销授权。",
    bottleneckEn: "Key bottlenecks: least privilege, control over long-term memory, cross-tool reliability, error recovery, privacy, and revocable authorization.",
    definitionEn: "A Personal Agent is software that continuously understands personal context within user-authorized boundaries and completes tasks across tools.",
  },
];

function matches(event: EventRecord, framework: NarrativeFramework): boolean {
  const text = [event.title, event.titleEn ?? "", event.summary, ...event.topics].join(" ").toLowerCase();
  return framework.aliases.some((alias) => text.includes(alias.toLowerCase()));
}

function signal(value: { count: number; note: string } | null, language: UILanguage) {
  return value ? { label: translate(language, `${value.count} 条证据`, `${value.count} evidence records`), note: value.note } : { label: translate(language, "未知", "Unknown"), note: translate(language, "当前样本不足，不按零或低热度处理", "Insufficient sample; not treated as zero or low momentum") };
}

export function NarrativeView({ events, definitions = DEFAULT_NARRATIVE_DEFINITIONS, language }: { events: EventRecord[]; definitions?: Record<string, string>; language: UILanguage }) {
  const t = (zh: string, en: string) => translate(language, zh, en);
  return (
    <div className="narrative-list">
      {frameworks.map((framework) => {
        const relevant = events.filter((event) => matches(event, framework));
        const fundingEvents = relevant.filter((event) => event.funding?.disclosed && event.funding.amountUsd);
        const fundingTotal = fundingEvents.reduce((sum, event) => sum + Number(event.funding?.amountUsd ?? 0), 0);
        const discussion = relevant.filter((event) => event.infoType === "social" || event.infoType === "media");
        const technical = relevant.filter((event) => ["preprint", "official", "third_party_review"].includes(event.infoType));
        const commercial = relevant.filter((event) => /营收|收入|客户|订单|商业|部署|付费|revenue|customer|commercial/i.test(`${event.title} ${event.summary} ${event.whyItMatters}`));
        const conflicts = relevant.filter((event) => event.verificationStatus === "conflicting" || event.verificationStatus === "insufficient");
        const stage = relevant.length === 0 ? t("未知 / 数据不足", "Unknown / insufficient data") : technical.length > 0 && commercial.length > 0 ? t("商业试点（样本推断，待复核）", "Commercial pilots (sample inference, unverified)") : technical.length > 0 ? t("早期验证（样本）", "Early validation (sample)") : t("概念（讨论样本）", "Concept (discussion sample)");
        const companies = [...new Set(relevant.flatMap((event) => event.companies))];
        const people = [...new Set(relevant.flatMap((event) => event.people))];
        const fundingSignal = fundingEvents.length > 0 && Number.isFinite(fundingTotal) ? signal({ count: fundingEvents.length, note: t(`样本披露合计 ${formatUsd(String(fundingTotal))}；不是该赛道总融资`, `Disclosed sample total ${formatUsd(String(fundingTotal), true, language)}; not total funding for this field`) }, language) : signal(null, language);
        const discussionSignal = signal(discussion.length > 0 ? { count: discussion.length, note: t("媒体与社交记录；转载不增加独立来源", "Media and social records; reposts do not add independent sources") } : null, language);
        const technicalSignal = signal(technical.length > 0 ? { count: technical.length, note: t("预印本、官方或第三方评测；尚未等同独立复现", "Preprints, official documents, or third-party reviews; not independent replication") } : null, language);
        const commercialSignal = signal(commercial.length > 0 ? { count: commercial.length, note: t("文本提及商业部署或客户；需回源核对收入口径", "Text mentions deployment or customers; verify revenue definitions at source") } : null, language);
        const configuredDefinition = definitions[framework.name] ?? DEFAULT_NARRATIVE_DEFINITIONS[framework.name];
        const definition = language === "en" && configuredDefinition === DEFAULT_NARRATIVE_DEFINITIONS[framework.name] ? framework.definitionEn : configuredDefinition;

        return (
          <article className="narrative-card" key={framework.name} id={encodeURIComponent(framework.name)}>
            <div className="narrative-header">
              <div>
                <Badge tone="info">{relevant.length} {t("条当前证据", "current evidence records")}</Badge>
                <h2>{framework.name}</h2>
                <p className="narrative-full-name">{framework.fullName}</p>
                <p><strong>{t("定义：", "Definition: ")}</strong>{definition}</p>
                <p>{t(framework.thesis, framework.thesisEn)}</p>
              </div>
              <div className="narrative-stage">
                <h3>{t("样本阶段", "Sample stage")}</h3>
                <Badge tone={relevant.length > 0 ? "warning" : "neutral"}>{stage}</Badge>
                <p>{t(framework.bottleneck, framework.bottleneckEn)}</p>
                <p className="privacy-caption">{t("阶段只描述当前样本中的证据构成，不是产业成熟度评级。", "Stage describes only the evidence mix in this sample, not industry maturity.")}</p>
              </div>
            </div>
            <div className="signal-grid" aria-label={t(`${framework.name} 四类独立信号`, `${framework.name} independent signal groups`)}>
              <div className="signal-card"><span>{t("CAPITAL / 资金", "CAPITAL / FUNDING")}</span><strong>{fundingSignal.label}</strong><p>{fundingSignal.note}</p></div>
              <div className="signal-card"><span>{t("DISCUSSION / 讨论", "DISCUSSION / VOLUME")}</span><strong>{discussionSignal.label}</strong><p>{discussionSignal.note}</p></div>
              <div className="signal-card"><span>{t("TECHNOLOGY / 技术", "TECHNOLOGY / EVIDENCE")}</span><strong>{technicalSignal.label}</strong><p>{technicalSignal.note}</p></div>
              <div className="signal-card"><span>{t("BUSINESS / 商业", "BUSINESS / COMMERCIAL")}</span><strong>{commercialSignal.label}</strong><p>{commercialSignal.note}</p></div>
            </div>
            <section className="coverage-block" aria-label={t(`${framework.name} 代表主体与商业化`, `${framework.name} organizations and commercialization`)}>
              <h3>{t("代表主体与资金 / 商业化进展", "Organizations & funding / commercialization")}</h3>
              <dl className="detail-list">
                <div><dt>{t("代表公司", "Representative companies")}</dt><dd>{companies.length ? companies.join(language === "en" ? ", " : "、") : t("未知：当前事件未结构化标注", "Unknown: not structured in current events")}</dd></div>
                <div><dt>{t("科研团队 / 人物", "Research teams / people")}</dt><dd>{people.length ? people.join(language === "en" ? ", " : "、") : t("未知：当前事件未结构化标注", "Unknown: not structured in current events")}</dd></div>
                <div><dt>{t("投资方", "Investors")}</dt><dd>{t("未知：未从事件人物自动推断投资方身份", "Unknown: investor identities are not inferred from event people")}</dd></div>
                <div><dt>{t("商业化", "Commercialization")}</dt><dd>{commercialSignal.label}; {commercialSignal.note}</dd></div>
              </dl>
            </section>
            <div className="narrative-evidence">
              <div>
                <h3>{t("新证据", "New evidence")}</h3>
                {relevant.length === 0 ? <p className="form-message">{t("未知：当前没有匹配事件。", "Unknown: no matching events.")}</p> : <ul className="evidence-list">{relevant.slice(0, 5).map((event) => <li key={event.id}><Link href={`/events/${encodeURIComponent(event.slug || event.id)}`}>{eventDisplayTitle(event, language).text}</Link><br /><span>{event.addedThisRound || event.summary}</span></li>)}</ul>}
              </div>
              <div>
                <h3>{t("反证 / 冲突", "Counterevidence / conflicts")}</h3>
                {conflicts.length === 0 ? <p className="form-message">{t("当前样本未提供明确冲突记录，不等于反证不存在。", "No explicit conflicts in the current sample; this does not prove counterevidence is absent.")}</p> : <ul className="evidence-list">{conflicts.slice(0, 5).map((event) => <li key={event.id}><Link href={`/events/${encodeURIComponent(event.slug || event.id)}`}>{eventDisplayTitle(event, language).text}</Link><br /><span>{event.evidenceBoundary}</span></li>)}</ul>}
              </div>
              <div>
                <h3>{t("过热信号与检验边界", "Overheating signals & test limits")}</h3>
                {relevant.length === 0 ? <p className="form-message">{t("数据不足，无法判断过热。", "Insufficient data to assess overheating.")}</p> : <ul className="evidence-list">{relevant.slice(0, 4).map((event) => <li key={event.id}>{event.evidenceBoundary || t("未给出边界，需回到原始来源", "No boundary provided; return to the original source")}</li>)}</ul>}
                <p className="privacy-caption">{t("只有讨论信号而缺乏技术或商业证据时，不应升级为强结论。", "Discussion without technical or commercial evidence should not be upgraded to a strong conclusion.")}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function NarrativeEmpty({ show, language = "zh" }: { show: boolean; language?: UILanguage }) {
  return show ? <EmptyState title={translate(language, "新叙事证据尚未覆盖", "Narrative evidence not covered")} description={translate(language, "四个方向均显示未知；可通过设置中的 RSS、搜索与手动链接补充来源。", "All four areas are unknown. Add sources through RSS, search, and manual links in settings.")} /> : null;
}
