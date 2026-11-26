export const DATA_MODES = ["live", "demo"] as const;
export type DataMode = (typeof DATA_MODES)[number];

export const CATEGORIES = ["funding", "frontier", "narrative", "marketing"] as const;
export type Category = (typeof CATEGORIES)[number];

export const INFO_TYPES = [
  "official",
  "third_party_review",
  "media",
  "preprint",
  "social",
  "rumor",
] as const;
export type InfoType = (typeof INFO_TYPES)[number];

export const VERIFICATION_STATUSES = [
  "cross_verified",
  "single_source",
  "conflicting",
  "insufficient",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const FUNDING_TYPES = [
  "equity",
  "mixed",
  "debt",
  "credit",
  "subsidy",
  "acquisition",
  "fund",
  "unknown",
] as const;
export type FundingType = (typeof FUNDING_TYPES)[number];

export const FUNDING_STAGES = ["rumor", "talks", "signed", "announced", "closed"] as const;
export type FundingStage = (typeof FUNDING_STAGES)[number];

export const FUNDING_QUALIFICATIONS = ["strict", "borderline", "ineligible", "unknown"] as const;
export type FundingQualification = (typeof FUNDING_QUALIFICATIONS)[number];

export const JOB_STATUSES = [
  "queued",
  "collecting",
  "verifying",
  "generating",
  "completed",
  "partial",
  "failed",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export interface Metric {
  id: string;
  label: string;
  value: string;
  unit?: string;
  currency?: string;
  period?: string;
  sample?: string;
  methodology?: string;
  citationId?: string;
}

export interface ScoreDimension {
  value: number | null;
  reason: string;
}

export interface PriorityScore {
  total: number | null;
  relevance: ScoreDimension;
  evidence: ScoreDimension;
  impact: ScoreDimension;
  novelty: ScoreDimension;
  actionability: ScoreDimension;
}

export interface ActionItem {
  id: string;
  title: string;
  materials: string;
  verification: string;
  priority: "high" | "medium" | "low";
  expectedOutput: string;
}

export interface ClaimRecord {
  id: string;
  text: string;
  kind: "fact" | "analysis" | "ai_inference" | "correction";
  citationIds: string[];
}

export interface SourceRecord {
  id: string;
  url: string;
  title: string;
  author?: string | null;
  publishedAt?: string | null;
  fetchedAt: string;
  channel: string;
  sourceType: string;
  accessStatus: string;
  excerpt: string;
  originGroup: string;
}

export interface FundingRecord {
  amountOriginal: string | null;
  currency: string;
  amountUsd: string | null;
  fxRate: string | null;
  fxSource: string | null;
  fxDate: string | null;
  type: FundingType;
  stage: FundingStage;
  qualification: FundingQualification;
  splitUnknown: boolean;
  disclosed: boolean;
}

export interface EventVersionRecord {
  id: string;
  version: number;
  changeSummary: string;
  createdAt: number | string;
  snapshot: unknown;
  majorCorrection: boolean;
}

export interface EventRecord {
  id: string;
  slug: string;
  mode: DataMode;
  category: Category;
  title: string;
  titleEn?: string | null;
  summary: string;
  summaryEn?: string | null;
  infoType: InfoType;
  verificationStatus: VerificationStatus;
  eventDate: string;
  publishedAt: string;
  firstSeenAt: string;
  updatedAt: string;
  whyItMatters: string;
  evidenceBoundary: string;
  addedThisRound: string;
  metrics: Metric[];
  actions: ActionItem[];
  score: PriorityScore;
  topics: string[];
  companies: string[];
  people: string[];
  regions: string[];
  sources: SourceRecord[];
  claims: ClaimRecord[];
  funding?: FundingRecord | null;
  versions?: EventVersionRecord[];
  relatedIds?: string[];
  viewerState?: {
    bookmarked: boolean;
    readAt: string | null;
    hidden: boolean;
    privateNote?: string;
  };
  editorialStatus: "published" | "pending" | "hidden";
}

export interface DailyBriefRecord {
  id: string;
  date: string;
  timezone: string;
  mode: DataMode;
  title: string;
  introduction: string;
  eventIds: string[];
  actions: ActionItem[];
  stats: {
    newEvents: number;
    majorUpdates: number;
    qualifiedFunding: number;
    pendingVerification: number;
  };
  coverage: {
    windowStart: string;
    windowEnd: string;
    sampleSize: number;
    channels: string[];
    caveats: string;
  };
  majorCorrections: string[];
  generatedAt: string;
}

export interface SourceHealthRecord {
  id: string;
  name: string;
  channel: "rss" | "x" | "linkedin" | "search" | "manual" | "paper" | "blog";
  enabled: boolean;
  configured: boolean;
  status: "idle" | "success" | "error" | "unconfigured";
  lastAttemptAt?: string | null;
  lastSuccessAt?: string | null;
  lastError?: string | null;
  itemCount?: number;
}

export interface RefreshJobRecord {
  id: string;
  idempotencyKey: string;
  status: JobStatus;
  trigger: "manual" | "scheduled" | "retry" | "worker";
  windowStart: string;
  windowEnd: string;
  progress: number;
  currentStep: string;
  errorSummary?: string | null;
  estimatedCostUsd: string;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface PreferenceRecord {
  timezone: string;
  updateTime: string;
  language: "zh" | "en";
  watchedTopics: string[];
  watchedCompanies: string[];
  competitors: string[];
  businessGoals: string;
  narrativeDefinitions: Record<string, string>;
  emailEnabled: boolean;
  emailTarget: string;
  webhookEnabled: boolean;
  webhookTarget: string;
  dailyBudgetUsd: string;
  refreshBudgetUsd: string;
}

export const categoryLabels: Record<Category, { zh: string; en: string }> = {
  funding: { zh: "大额融资", en: "Funding" },
  frontier: { zh: "前沿行业", en: "Frontier" },
  narrative: { zh: "新叙事", en: "Narratives" },
  marketing: { zh: "数字营销", en: "Marketing" },
};

export const infoTypeLabels: Record<InfoType, string> = {
  official: "官方披露",
  third_party_review: "第三方评测",
  media: "媒体报道",
  preprint: "研究预印本",
  social: "社交观点",
  rumor: "未核实传闻",
};

export const verificationLabels: Record<VerificationStatus, string> = {
  cross_verified: "已交叉核验",
  single_source: "单一来源",
  conflicting: "存在冲突",
  insufficient: "证据不足",
};

export const fundingTypeLabels: Record<FundingType, string> = {
  equity: "股权融资",
  mixed: "混合融资",
  debt: "债务融资",
  credit: "授信额度",
  subsidy: "政府补贴",
  acquisition: "并购",
  fund: "基金募资",
  unknown: "类型未知",
};

export const fundingStageLabels: Record<FundingStage, string> = {
  rumor: "传闻",
  talks: "洽谈",
  signed: "签约",
  announced: "已宣布",
  closed: "完成交割",
};

export const qualificationLabels: Record<FundingQualification, string> = {
  strict: "严格超过 $1B",
  borderline: "临界关注（恰好 $1B）",
  ineligible: "不符合主筛选",
  unknown: "金额或换算未知",
};

export const DEFAULT_NARRATIVE_DEFINITIONS: Record<string, string> = {
  RSI: "Recursive Self-Improvement / 递归式自我改进：系统能够生成、评估并部署使后续改进能力持续提升的修改；不等同于一般自动化或金融技术指标。",
  "AI for Drug": "AI 药物研发：将机器学习用于靶点、分子设计、临床前或临床研发决策，并以实验和临床里程碑验证。",
  "AI for Science": "AI for Science：将 AI 用于可检验的科学假设、实验、模拟与发现流程。",
  "Personal Agent": "Personal Agent / 个人智能体：在用户授权边界内，持续理解个人上下文并跨工具完成任务的软件系统。",
};

export function emptyScore(reason = "数据不足，暂不评分"): PriorityScore {
  const dimension = { value: null, reason };
  return {
    total: null,
    relevance: { ...dimension },
    evidence: { ...dimension },
    impact: { ...dimension },
    novelty: { ...dimension },
    actionability: { ...dimension },
  };
}

export type UILanguage = PreferenceRecord["language"];
export type UILabel = Record<UILanguage, string>;

export const infoTypeLabelsI18n: Record<InfoType, UILabel> = {
  official: { zh: "官方披露", en: "Official disclosure" },
  third_party_review: { zh: "第三方评测", en: "Third-party review" },
  media: { zh: "媒体报道", en: "Media report" },
  preprint: { zh: "研究预印本", en: "Research preprint" },
  social: { zh: "社交观点", en: "Social commentary" },
  rumor: { zh: "未核实传闻", en: "Unverified rumor" },
};

export const verificationLabelsI18n: Record<VerificationStatus, UILabel> = {
  cross_verified: { zh: "已交叉核验", en: "Cross-verified" },
  single_source: { zh: "单一来源", en: "Single source" },
  conflicting: { zh: "存在冲突", en: "Conflicting evidence" },
  insufficient: { zh: "证据不足", en: "Insufficient evidence" },
};

export const fundingTypeLabelsI18n: Record<FundingType, UILabel> = {
  equity: { zh: "股权融资", en: "Equity" },
  mixed: { zh: "混合融资", en: "Mixed financing" },
  debt: { zh: "债务融资", en: "Debt" },
  credit: { zh: "授信额度", en: "Credit facility" },
  subsidy: { zh: "政府补贴", en: "Government subsidy" },
  acquisition: { zh: "并购", en: "Acquisition" },
  fund: { zh: "基金募资", en: "Fundraise" },
  unknown: { zh: "类型未知", en: "Unknown type" },
};

export const fundingStageLabelsI18n: Record<FundingStage, UILabel> = {
  rumor: { zh: "传闻", en: "Rumor" },
  talks: { zh: "洽谈", en: "In talks" },
  signed: { zh: "签约", en: "Signed" },
  announced: { zh: "已宣布", en: "Announced" },
  closed: { zh: "完成交割", en: "Closed" },
};

export const qualificationLabelsI18n: Record<FundingQualification, UILabel> = {
  strict: { zh: "严格超过 $1B", en: "Strictly over $1B" },
  borderline: { zh: "临界关注（恰好 $1B）", en: "Borderline (exactly $1B)" },
  ineligible: { zh: "不符合主筛选", en: "Outside primary screen" },
  unknown: { zh: "金额或换算未知", en: "Amount or conversion unknown" },
};

export const jobStatusLabelsI18n: Record<JobStatus, UILabel> = {
  queued: { zh: "排队中", en: "Queued" },
  collecting: { zh: "采集中", en: "Collecting" },
  verifying: { zh: "核验中", en: "Verifying" },
  generating: { zh: "生成中", en: "Generating" },
  completed: { zh: "已完成", en: "Completed" },
  partial: { zh: "部分失败", en: "Partial failure" },
  failed: { zh: "失败", en: "Failed" },
};

export const editorialStatusLabelsI18n: Record<EventRecord["editorialStatus"], UILabel> = {
  published: { zh: "已发布", en: "Published" },
  pending: { zh: "待编辑核验", en: "Pending editorial review" },
  hidden: { zh: "已隐藏", en: "Hidden" },
};
