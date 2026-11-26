import { writeFile } from "node:fs/promises";
import { DEMO_BRIEF, DEMO_DATA_NOTICE, DEMO_EVENTS } from "../src/lib/demo-data";
import { categoryLabels, fundingStageLabels, fundingTypeLabels, infoTypeLabels, qualificationLabels, verificationLabels } from "../src/lib/domain";

const lines: string[] = [
  "# 全球前沿科技与资本情报｜日报示例",
  "",
  `> **${DEMO_DATA_NOTICE}。** 本文所有主体、数字、评测、引文与链接均为界面和规则验收而虚构；不代表真实新闻、真实融资或真实采集，不进入真实统计或推送。`,
  "",
  `- 日期：${DEMO_BRIEF.date}`,
  `- 时区：${DEMO_BRIEF.timezone}`,
  `- 覆盖：${DEMO_BRIEF.coverage.windowStart} 至 ${DEMO_BRIEF.coverage.windowEnd}`,
  `- 样本：${DEMO_BRIEF.coverage.sampleSize} 条虚构事件`,
  `- 渠道：${DEMO_BRIEF.coverage.channels.join("；")}`,
  `- 统计边界：${DEMO_BRIEF.coverage.caveats}`,
  `- 新增 ${DEMO_BRIEF.stats.newEvents}｜重大更新 ${DEMO_BRIEF.stats.majorUpdates}｜严格融资 ${DEMO_BRIEF.stats.qualifiedFunding}｜待核验 ${DEMO_BRIEF.stats.pendingVerification}`,
  "",
  DEMO_BRIEF.introduction,
  "",
  "## 今日最值得行动",
  "",
];

for (const [index, action] of DEMO_BRIEF.actions.entries()) {
  lines.push(`${index + 1}. **${action.title}**（${action.priority}）`, `   - 材料：${action.materials}`, `   - 验证：${action.verification}`, `   - 预期产物：${action.expectedOutput}`);
}

for (const event of DEMO_BRIEF.eventIds.map((id) => DEMO_EVENTS.find((event) => event.id === id)).filter((event) => event !== undefined)) {
  lines.push(
    "",
    "---",
    "",
    `## ${event.title}`,
    "",
    `- 分类：${categoryLabels[event.category].zh}`,
    `- 信息性质：${infoTypeLabels[event.infoType]}`,
    `- 核验状态：${verificationLabels[event.verificationStatus]}`,
    `- 事件日期：${event.eventDate}；发布：${event.publishedAt}；首次发现：${event.firstSeenAt}；最近更新：${event.updatedAt}`,
    `- 标签：${[...event.topics, ...event.companies, ...event.people, ...event.regions].join("、")}`,
    "",
    "### 事实摘要",
    "",
    event.summary,
    "",
    "### English summary",
    "",
    event.summaryEn ?? "未知",
    "",
    "### 关键数字",
    "",
  );
  for (const metric of event.metrics) {
    const source = event.sources.find((item) => item.id === metric.citationId);
    lines.push(`- **${metric.label}：${metric.value}${metric.unit ? ` ${metric.unit}` : ""}${metric.currency ? `（${metric.currency}）` : ""}**${source ? ` [来源](${source.url})` : "（来源未知）"}`);
    if (metric.period) lines.push(`  - 周期：${metric.period}`);
    if (metric.sample) lines.push(`  - 样本：${metric.sample}`);
    if (metric.methodology) lines.push(`  - 口径与限制：${metric.methodology}`);
  }
  if (event.funding) {
    lines.push(`- 融资类型：${fundingTypeLabels[event.funding.type]}；阶段：${fundingStageLabels[event.funding.stage]}；资格：${qualificationLabels[event.funding.qualification]}`);
    lines.push(`- 原币：${event.funding.amountOriginal ?? "未知"} ${event.funding.currency}；USD：${event.funding.amountUsd ?? "未知"}；FX：${event.funding.fxRate ?? "未知"}（${event.funding.fxSource ?? "来源未知"}，${event.funding.fxDate ?? "日期未知"}）；拆分未知：${event.funding.splitUnknown ? "是" : "否"}`);
  }
  lines.push("", "### 为什么值得关注", "", event.whyItMatters, "", "### 证据边界与未知项", "", event.evidenceBoundary, "", "### 本轮新增", "", event.addedThisRound, "", "### 事实、分析与 AI 推断", "");
  for (const claim of event.claims) {
    const kind = { fact: "事实", analysis: "分析", ai_inference: "AI 推断", correction: "更正" }[claim.kind];
    const links = claim.citationIds.map((id) => event.sources.find((source) => source.id === id)).filter((source) => source !== undefined).map((source) => `[${source.title}](${source.url})`).join("；");
    lines.push(`- **${kind}**：${claim.text}${links ? ` 来源：${links}` : "（推断不伪装成来源事实）"}`);
  }
  lines.push("", "### 建议你", "");
  for (const [index, action] of event.actions.entries()) {
    lines.push(`${index + 1}. **${action.title}**（${action.priority}）`, `   - 材料：${action.materials}`, `   - 验证：${action.verification}`, `   - 预期产物：${action.expectedOutput}`);
  }
  lines.push("", "### 来源清单", "");
  for (const source of event.sources) lines.push(`- [${source.title}](${source.url})｜${source.channel}｜${source.accessStatus}｜${source.excerpt}`);
  lines.push("", "### 优先级（编辑排序，不是事实概率或收益预测）", "");
  for (const [name, dimension] of Object.entries({ 主题相关性: event.score.relevance, 证据质量: event.score.evidence, 产业影响: event.score.impact, 新颖性: event.score.novelty, 可行动性: event.score.actionability })) {
    lines.push(`- ${name}：${dimension.value ?? "未知"}｜${dimension.reason}`);
  }
  if (event.versions?.length) {
    lines.push("", "### 更新历史", "");
    for (const version of event.versions) lines.push(`- v${version.version}｜${version.createdAt}｜${version.changeSummary}${version.majorCorrection ? "｜**重大更正**" : ""}`);
  }
}

async function main() {
  await writeFile(new URL("../docs/demo-brief.md", import.meta.url), `${lines.join("\n")}\n`, "utf8");
  console.log("已生成 docs/demo-brief.md（明确标注演示数据）。");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "演示日报导出失败");
  process.exitCode = 1;
});
