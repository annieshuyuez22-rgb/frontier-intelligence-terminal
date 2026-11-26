import { createHash } from "node:crypto";
import Decimal from "decimal.js";
import type {
  FundingQualification,
  FundingStage,
  FundingType,
} from "./domain";

export const ONE_BILLION_USD = new Decimal("1000000000");

const CURRENCY_ALIASES: Record<string, string> = {
  usd: "USD",
  "us$": "USD",
  "u.s.$": "USD",
  dollar: "USD",
  dollars: "USD",
  美元: "USD",
  美金: "USD",
  $: "USD",
  eur: "EUR",
  "€": "EUR",
  euro: "EUR",
  euros: "EUR",
  欧元: "EUR",
  gbp: "GBP",
  "£": "GBP",
  英镑: "GBP",
  cny: "CNY",
  rmb: "CNY",
  "cn¥": "CNY",
  "rmb¥": "CNY",
  人民币: "CNY",
  元: "CNY",
  jpy: "JPY",
  "jp¥": "JPY",
  日元: "JPY",
  日圆: "JPY",
  円: "JPY",
  "¥": "JPY",
  "￥": "JPY",
  chf: "CHF",
  瑞郎: "CHF",
  cad: "CAD",
  "c$": "CAD",
  加元: "CAD",
  aud: "AUD",
  "a$": "AUD",
  澳元: "AUD",
  hkd: "HKD",
  "hk$": "HKD",
  港元: "HKD",
  sgd: "SGD",
  "s$": "SGD",
  新加坡元: "SGD",
  inr: "INR",
  "₹": "INR",
  印度卢比: "INR",
  krw: "KRW",
  "₩": "KRW",
  韩元: "KRW",
};

const CURRENCY_PATTERN = [
  "USD", "EUR", "GBP", "CNY", "RMB", "JPY", "CHF", "CAD", "AUD", "HKD", "SGD", "INR", "KRW",
  "US\\$", "U\\.S\\.\\$", "CN¥", "RMB¥", "JP¥", "HK\\$", "C\\$", "A\\$", "S\\$",
  "[$€£¥￥₹₩]", "美元", "美金", "欧元", "英镑", "人民币", "日元", "日圆", "円", "瑞郎", "加元", "澳元", "港元", "新加坡元", "印度卢比", "韩元", "元",
].join("|");

const SCALE_PATTERN = "trillion|billion|million|thousand|bn|b|m|k|万亿|億|亿|万";
const AMOUNT_RE = new RegExp(
  `(?:(?<prefix>${CURRENCY_PATTERN})\\s*)?(?<number>\\d+(?:\\.\\d+)?)\\s*(?<scale>${SCALE_PATTERN})?\\s*(?<suffix>${CURRENCY_PATTERN})?`,
  "giu",
);

const SCALES: Record<string, string> = {
  thousand: "1e3",
  k: "1e3",
  million: "1e6",
  m: "1e6",
  billion: "1e9",
  b: "1e9",
  trillion: "1e12",
  万: "1e4",
  亿: "1e8",
  億: "1e8",
  万亿: "1e12",
};

export interface FxRate {
  rate: Decimal.Value;
  date: string;
  source: string;
  reliable?: boolean;
}

export interface ParsedAmount {
  amount: Decimal;
  currency: string;
  scale: Decimal;
  raw: string;
  index: number;
  approximate: boolean;
  capped: boolean;
  lowerBound: boolean;
}

export interface FundingAnalysis {
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
  reasonCodes: string[];
  reason: string;
}

export interface AnalyzeFundingOptions {
  currencyHint?: string;
  fx?: FxRate | null;
  fxByCurrency?: Record<string, FxRate | null>;
}

export interface FundingFingerprintInput {
  company: string;
  eventDate: string;
  amountOriginal?: Decimal.Value | null;
  currency?: string | null;
  round?: string | null;
  type?: FundingType | null;
  stage?: FundingStage | null;
}

export function normalizeCurrency(value: string | null | undefined): string | null {
  if (!value) return null;
  const key = value.normalize("NFKC").trim().toLowerCase();
  return CURRENCY_ALIASES[key] ?? (/^[a-z]{3}$/i.test(key) ? key.toUpperCase() : null);
}

function decimalString(value: Decimal): string {
  return value.toSignificantDigits(24).toFixed();
}

function cleanAmountText(text: string): string {
  return text.normalize("NFKC").replace(/(?<=\d)[,，](?=\d{3}(?:\D|$))/g, "");
}

export function parseFundingAmounts(
  input: string,
  currencyHint?: string,
): ParsedAmount[] {
  const text = cleanAmountText(input);
  const hint = normalizeCurrency(currencyHint);
  const amounts: ParsedAmount[] = [];

  for (const match of text.matchAll(AMOUNT_RE)) {
    const groups = match.groups;
    if (!groups?.number || match.index === undefined) continue;
    const before = text.slice(Math.max(0, match.index - 16), match.index).toLowerCase();
    let currency = normalizeCurrency(groups.prefix) ?? normalizeCurrency(groups.suffix) ?? hint;
    const ambiguousYen = groups.prefix === "¥" || groups.prefix === "￥" || groups.suffix === "¥" || groups.suffix === "￥";
    if (ambiguousYen && (hint || groups.suffix === "元" || ((groups.scale === "亿" || groups.scale === "万") && groups.suffix !== "日元" && groups.suffix !== "日圆" && groups.suffix !== "円"))) {
      currency = hint ?? "CNY";
    }
    if (!currency) continue;

    const scale = new Decimal(SCALES[(groups.scale ?? "").toLowerCase()] ?? "1");
    const amount = new Decimal(groups.number).times(scale);
    if (!amount.isFinite() || amount.isNegative()) continue;
    const raw = match[0];
    const approximate = /(?:approximately|approx\.?|around|about|roughly|nearly|约|大约|近)\s*$/.test(before);
    const capped = /(?:up to|as much as|maximum of|at most|最高|至多|不超过|最多)\s*$/.test(before);
    const lowerBound = /(?:more than|over|exceeding|in excess of|超过|超|逾)\s*$/.test(before);
    amounts.push({
      amount,
      currency,
      scale,
      raw,
      index: match.index,
      approximate,
      capped,
      lowerBound,
    });
  }
  return amounts;
}

export function parseFundingAmount(input: string, currencyHint?: string): ParsedAmount | null {
  return parseFundingAmounts(input, currencyHint)[0] ?? null;
}

export function convertAmountToUsd(
  amount: Decimal.Value,
  currency: string,
  fx?: FxRate | null,
): { amountUsd: Decimal; fx: FxRate | null } | null {
  const normalized = normalizeCurrency(currency);
  if (!normalized) return null;
  const value = new Decimal(amount);
  if (!value.isFinite() || value.isNegative()) return null;
  if (normalized === "USD") {
    return {
      amountUsd: value,
      fx: { rate: "1", date: "", source: "identity", reliable: true },
    };
  }
  if (!fx || fx.reliable === false || !fx.source || !isValidDateOnly(fx.date)) return null;
  const rate = new Decimal(fx.rate);
  if (!rate.isFinite() || rate.lte(0)) return null;
  return { amountUsd: value.times(rate), fx };
}

export function sumSameCurrency(
  values: ReadonlyArray<{ amount: Decimal.Value; currency: string }>,
): { amount: string; currency: string } | null {
  if (values.length === 0) return null;
  const currency = normalizeCurrency(values[0].currency);
  if (!currency) return null;
  let total = new Decimal(0);
  for (const value of values) {
    if (normalizeCurrency(value.currency) !== currency) return null;
    const amount = new Decimal(value.amount);
    if (!amount.isFinite() || amount.isNegative()) return null;
    total = total.plus(amount);
  }
  return { amount: decimalString(total), currency };
}

export function classifyFundingStage(text: string): FundingStage {
  const value = text.normalize("NFKC").toLowerCase();
  if (/reportedly|sources say|allegedly|rumou?r|传闻|据传|知情人士/.test(value)) return "rumor";
  if (/in talks|negotiat|letter of intent|memorandum of understanding|non-binding|plans? to (?:raise|secure)|intends? to (?:raise|secure)|拟融资|计划融资|洽谈|谈判|意向书|谅解备忘录/.test(value)) return "talks";
  if (/closed|closing|completed|completion|交割|完成融资|已到账/.test(value)) return "closed";
  if (/signed|signs|signing|签约|签署/.test(value)) return "signed";
  return "announced";
}

export function classifyFundingType(text: string): FundingType {
  return classifyTypeWithReasons(text.normalize("NFKC").toLowerCase()).type;
}

interface TypeClassification {
  type: FundingType;
  exclusion: "valuation" | "cumulative" | "order" | "capex" | "intent" | null;
  codes: string[];
}

function classifyTypeWithReasons(value: string): TypeClassification {
  const hasEquity = /equity|series\s+[a-z]|seed round|venture round|funding round|financing round|股权|融资轮|[a-z]轮融资|领投|跟投/.test(value);
  const hasDebt = /debt|bond|notes?|loan|borrow|债|贷款|票据|债券/.test(value);
  const hasCredit = /credit facilit|line of credit|revolving credit|revolver|授信|信用额度/.test(value);
  const hasSubsidy = /subsidy|subsidies|grant|tax credit|政府补贴|补贴|补助|拨款/.test(value);
  const hasFund = /\bnew fund\b|\bfund clos|\bfund size\b|raises? .*?\bfund\b|fundraising for .*?\bfund\b|基金募资|基金规模|基金完成|有限合伙人|\blp\b/.test(value);
  const hasAcquisition = /acquisition|acquire[sd]?|merger|takeover|并购|收购|合并/.test(value);
  const hasIntent = /letter of intent|memorandum of understanding|non-binding|plans? to raise|intends? to raise|拟融资|计划融资|融资意向|投资意向/.test(value);

  if (/purchase order|order (?:worth|valued|for)|orders? (?:worth|for)|订单|采购合同|合同金额/.test(value)) {
    return { type: "unknown", exclusion: "order", codes: ["excluded.order"] };
  }
  if (/capital expenditure|capital spending|\bcapex\b|资本开支|资本支出|建厂投资|项目投资/.test(value)) {
    return { type: "unknown", exclusion: "capex", codes: ["excluded.capex"] };
  }
  if (hasFund) return { type: "fund", exclusion: null, codes: ["type.fund"] };
  if (hasAcquisition) return { type: "acquisition", exclusion: null, codes: ["type.acquisition"] };
  if (hasCredit) return { type: "credit", exclusion: null, codes: ["type.credit"] };
  if (hasSubsidy) return { type: "subsidy", exclusion: null, codes: ["type.subsidy"] };
  if (hasEquity && hasDebt) {
    return {
      type: "mixed",
      exclusion: hasIntent ? "intent" : null,
      codes: hasIntent ? ["type.mixed", "excluded.intent"] : ["type.mixed"],
    };
  }
  if (hasDebt) return { type: "debt", exclusion: null, codes: ["type.debt"] };
  const type = hasEquity || /rais(?:e|es|ed|ing)|financ|投资|融资/.test(value) ? "equity" : "unknown";
  return {
    type,
    exclusion: hasIntent ? "intent" : null,
    codes: hasIntent ? [`type.${type}`, "excluded.intent"] : [`type.${type}`],
  };
}

function isRangeNear(text: string, amount: ParsedAmount): boolean {
  const around = text.slice(Math.max(0, amount.index - 20), amount.index + amount.raw.length + 30).toLowerCase();
  return /\b(?:between|range[sd]? from)\b|\d\s*(?:–|—|~|至)\s*(?:[$€£¥￥]|usd|cny|rmb)?\s*\d/i.test(around);
}

type AmountRole = "funding" | "valuation" | "cumulative" | "other";

function selectAmount(text: string, amounts: ParsedAmount[]): { amount: ParsedAmount | null; codes: string[] } {
  if (amounts.length === 0) return { amount: null, codes: ["amount.undisclosed"] };
  let best: ParsedAmount | null = null;
  let bestRole: AmountRole = "other";
  let bestScore = -Infinity;
  const codes: string[] = [];

  for (const candidate of amounts) {
    const end = candidate.index + candidate.raw.length;
    const before = text.slice(Math.max(0, candidate.index - 48), candidate.index).toLowerCase();
    const after = text.slice(end, end + 48).toLowerCase();
    const around = text.slice(Math.max(0, candidate.index - 70), end + 70).toLowerCase();
    const fundingPrefix = /(?:raised?|raises|raising|secured?|secures|securing|closed|closes|announced|announces|funding|financing|series\s+[a-z]|round|融资|募资|领投|跟投|完成|获得)(?:\s+(?:of|a|an|the|new|equity|debt|this|本轮|新增|实际|股权|债务|金额|为|达|约)|\s)*(?:of\s*)?$/i.test(before);
    const fundingSuffix = /^\s*(?:(?:in|from|as|under)\s+)?(?:(?:a|an|the)\s+)?(?:series\s+[a-z]|equity|debt|funding|financing|round|股权|债务|融资|募资)/i.test(after);
    const valuationRole = /(?:valuation|valued\s+at|pre-money|post-money|估值)(?:\s+(?:of|at|to|为|达|约)|\s)*$/i.test(before)
      || /^\s*(?:valuation|pre-money|post-money|估值)/i.test(after);
    const cumulativeRole = /(?:total\s+(?:raised|funding)|cumulative|累计融资|融资总额|历史融资)(?:\s+(?:of|to|为|达|约)|\s)*$/i.test(before)
      || /^\s*(?:total\s+(?:raised|funding)|to\s+date|cumulative|累计融资|融资总额|历史融资)/i.test(after);
    let role: AmountRole = "other";
    let score = 0;
    if (fundingPrefix || fundingSuffix) {
      role = "funding";
      score += 24;
    }
    if (valuationRole) {
      role = "valuation";
      score -= 32;
    }
    if (cumulativeRole) {
      role = "cumulative";
      score -= 34;
    }
    if (/raised|raises|funding|financing|series\s+[a-z]|round|融资|领投|跟投/.test(around)) score += 3;
    if (/valuation|valued at|pre-money|post-money|估值/.test(around)) score -= 3;
    if (/total raised|total funding|to date|cumulative|累计融资|融资总额|历史融资/.test(around)) score -= 6;
    if (/purchase order|orders?|capex|capital expenditure|订单|资本开支/.test(around)) score -= 10;
    if (candidate.capped || isRangeNear(text, candidate)) {
      score -= 2;
      codes.push("amount.uncertain");
    }
    if (score > bestScore) {
      best = candidate;
      bestRole = role;
      bestScore = score;
    }
  }

  if (best) {
    const around = text.slice(Math.max(0, best.index - 80), best.index + best.raw.length + 80).toLowerCase();
    if (bestRole === "valuation" || (/valuation|valued at|pre-money|post-money|估值/.test(around) && bestRole !== "funding" && !/raised|funding round|financing round|series\s+[a-z]|轮融资/.test(around))) {
      codes.push("excluded.valuation");
    }
    if (bestRole === "cumulative" || (/total raised|total funding|to date|cumulative|累计融资|融资总额|历史融资/.test(around) && bestRole !== "funding")) {
      codes.push("excluded.cumulative");
    }
  }
  return { amount: best, codes };
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function qualifyFunding(input: {
  amountUsd: Decimal.Value | null;
  type: FundingType;
  stage?: FundingStage;
  disclosed?: boolean;
  fxMissing?: boolean;
  uncertain?: boolean;
  lowerBound?: boolean;
  excluded?: boolean;
}): FundingQualification {
  if (input.excluded || !(input.type === "equity" || input.type === "mixed")) return "ineligible";
  if (input.stage === "rumor" || input.stage === "talks") return "unknown";
  if (input.fxMissing || input.uncertain || input.disclosed === false || input.amountUsd === null) return "unknown";
  const amount = new Decimal(input.amountUsd);
  if (!amount.isFinite()) return "unknown";
  if (amount.gt(ONE_BILLION_USD)) return "strict";
  if (amount.eq(ONE_BILLION_USD) || (input.lowerBound && amount.gte(ONE_BILLION_USD))) {
    return input.lowerBound && amount.gte(ONE_BILLION_USD) ? "strict" : "borderline";
  }
  return "ineligible";
}

const REASON_MESSAGES: Record<string, string> = {
  "amount.undisclosed": "未识别到可靠的本轮融资金额。",
  "amount.uncertain": "金额为区间、约数或上限，不能按确定金额入选。",
  "amount.normalized": "金额已按原币和数量级归一化。",
  "fx.identity": "原币为美元，无需汇率换算。",
  "fx.converted": "已使用带日期和来源的汇率换算为美元。",
  "fx.missing": "非美元金额缺少可靠汇率，美元金额与门槛资格保持未知。",
  "excluded.valuation": "数字属于估值而非本轮股权融资。",
  "excluded.cumulative": "数字属于累计或历史融资而非本轮融资。",
  "excluded.order": "订单或采购合同不能作为本轮股权融资。",
  "excluded.capex": "资本开支或项目投资不能作为本轮股权融资。",
  "excluded.intent": "融资意向或计划不等同于已宣布的本轮融资。",
  "threshold.strict": "本轮股权或混合融资按可靠换算严格超过 10 亿美元。",
  "threshold.borderline": "本轮股权或混合融资按可靠换算恰好为 10 亿美元。",
  "threshold.ineligible": "事件类型或金额不符合严格大额融资筛选。",
  "stage.unconfirmed": "传闻或洽谈阶段暂不参与严格门槛认定。",
  "split.unknown": "混合融资未明确披露股权与债务各自金额或比例，无法拆分。",
  "split.disclosed": "混合融资已明确披露股权与债务各自金额或比例。",
};

function buildReason(codes: string[], qualification: FundingQualification): string {
  const messages = codes.map((code) => REASON_MESSAGES[code]).filter((message): message is string => Boolean(message));
  if (qualification === "strict") messages.push(REASON_MESSAGES["threshold.strict"]);
  if (qualification === "borderline") messages.push(REASON_MESSAGES["threshold.borderline"]);
  if (qualification === "ineligible") messages.push(REASON_MESSAGES["threshold.ineligible"]);
  return [...new Set(messages)].join(" ");
}

export function hasExplicitFundingSplit(input: string, currencyHint?: string): boolean {
  const text = input.normalize("NFKC");
  let equityPercent = false;
  let debtPercent = false;
  for (const sentence of text.split(/[.。\n;；]+/)) {
    if (/(?:equity|股权)[^%]{0,40}\d+(?:\.\d+)?\s*%|\d+(?:\.\d+)?\s*%\s*(?:equity|股权)/i.test(sentence)) equityPercent = true;
    if (/(?:debt|债务)[^%]{0,40}\d+(?:\.\d+)?\s*%|\d+(?:\.\d+)?\s*%\s*(?:debt|债务)/i.test(sentence)) debtPercent = true;
    if (/(?:equity|股权)[^.;]{0,30}\d+(?:\.\d+)?\s*[:/]\s*\d+(?:\.\d+)?[^.;]{0,30}(?:debt|债务)/i.test(sentence)
      || /(?:debt|债务)[^.;]{0,30}\d+(?:\.\d+)?\s*[:/]\s*\d+(?:\.\d+)?[^.;]{0,30}(?:equity|股权)/i.test(sentence)) return true;
  }
  if (equityPercent && debtPercent) return true;

  const amounts = parseFundingAmounts(text, currencyHint);
  if (amounts.length < 2) return false;
  let hasEquityAmount = false;
  let hasDebtAmount = false;
  for (const amount of amounts) {
    const before = text.slice(Math.max(0, amount.index - 60), amount.index);
    const after = text.slice(amount.index + amount.raw.length, amount.index + amount.raw.length + 40);
    const labelDistance = (pattern: RegExp): number => {
      const beforeMatches = [...before.matchAll(pattern)];
      const beforeMatch = beforeMatches.at(-1);
      const beforeDistance = beforeMatch?.index === undefined ? Infinity : before.length - beforeMatch.index - beforeMatch[0].length;
      const afterMatch = pattern.exec(after);
      const afterDistance = afterMatch?.index ?? Infinity;
      return Math.min(beforeDistance, afterDistance);
    };
    const equityDistance = labelDistance(/equity|股权/gi);
    const debtDistance = labelDistance(/debt|债务/gi);
    if (equityDistance < debtDistance && equityDistance <= 60) hasEquityAmount = true;
    if (debtDistance < equityDistance && debtDistance <= 60) hasDebtAmount = true;
  }
  return hasEquityAmount && hasDebtAmount;
}

export function analyzeFunding(input: string, options: AnalyzeFundingOptions = {}): FundingAnalysis {
  const text = input.normalize("NFKC");
  const lower = text.toLowerCase();
  const typeInfo = classifyTypeWithReasons(lower);
  const stage = classifyFundingStage(text);
  const selection = selectAmount(text, parseFundingAmounts(text, options.currencyHint));
  const selected = selection.amount;
  const codes = [...typeInfo.codes, ...selection.codes];
  const currency = selected?.currency ?? normalizeCurrency(options.currencyHint) ?? "USD";
  const fx = options.fxByCurrency?.[currency] ?? options.fx;
  const conversion = selected ? convertAmountToUsd(selected.amount, currency, fx) : null;

  let amountUsd: Decimal | null = null;
  let normalizedFx: FxRate | null = null;
  if (selected) {
    if (currency === "USD") {
      amountUsd = selected.amount;
      normalizedFx = { rate: "1", date: "", source: "identity", reliable: true };
      codes.push("fx.identity");
    } else if (conversion) {
      amountUsd = conversion.amountUsd;
      normalizedFx = conversion.fx;
      codes.push("fx.converted");
    } else {
      codes.push("fx.missing");
    }
  }

  const splitDisclosed = typeInfo.type === "mixed" && hasExplicitFundingSplit(text, options.currencyHint);
  const splitUnknown = typeInfo.type === "mixed" && !splitDisclosed;
  if (splitUnknown) codes.push("split.unknown");
  if (splitDisclosed) codes.push("split.disclosed");
  if (selected) codes.push("amount.normalized");
  if (stage === "rumor" || stage === "talks") codes.push("stage.unconfirmed");

  const excluded = codes.some((code) => code.startsWith("excluded."));
  const qualification = qualifyFunding({
    amountUsd,
    type: typeInfo.type,
    stage,
    disclosed: Boolean(selected),
    fxMissing: Boolean(selected && currency !== "USD" && !conversion),
    uncertain: Boolean(selected?.capped || selected?.approximate || (selected && isRangeNear(text, selected))),
    lowerBound: selected?.lowerBound,
    excluded,
  });
  const uniqueCodes = [...new Set(codes)];

  return {
    amountOriginal: selected ? decimalString(selected.amount) : null,
    currency,
    amountUsd: amountUsd ? decimalString(amountUsd) : null,
    fxRate: normalizedFx ? new Decimal(normalizedFx.rate).toFixed() : null,
    fxSource: normalizedFx?.source ?? null,
    fxDate: normalizedFx?.date || null,
    type: typeInfo.type,
    stage,
    qualification,
    splitUnknown,
    disclosed: Boolean(selected),
    reasonCodes: uniqueCodes,
    reason: buildReason(uniqueCodes, qualification),
  };
}

export const normalizeFunding = analyzeFunding;

function normalizeFingerprintPart(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[·•]/g, " ")
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function buildFundingDedupeKey(input: FundingFingerprintInput): string {
  const date = input.eventDate.slice(0, 10);
  const amount = input.amountOriginal === null || input.amountOriginal === undefined
    ? "unknown"
    : decimalString(new Decimal(input.amountOriginal));
  return [
    normalizeFingerprintPart(input.company),
    date,
    amount,
    normalizeCurrency(input.currency) ?? "UNKNOWN",
    normalizeFingerprintPart(input.round ?? ""),
    input.type ?? "unknown",
    input.stage ?? "announced",
  ].join("|");
}

export function fundingDedupeFingerprint(input: FundingFingerprintInput): string {
  return createHash("sha256").update(buildFundingDedupeKey(input)).digest("hex");
}

export const dedupeFingerprint = fundingDedupeFingerprint;

const TRACKING_PARAMS = new Set([
  "fbclid", "gclid", "dclid", "mc_cid", "mc_eid", "igshid", "ref", "ref_src", "spm", "scm",
]);

export function canonicalizeUrl(input: string): string {
  const url = new URL(input.trim());
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("仅支持 HTTP(S) URL");
  if (url.username || url.password) throw new Error("URL 不允许包含凭据");
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) url.port = "";
  const params = [...url.searchParams.entries()]
    .filter(([key]) => !/^utm_/i.test(key) && !TRACKING_PARAMS.has(key.toLowerCase()))
    .sort(([aKey, aValue], [bKey, bValue]) => aKey.localeCompare(bKey) || aValue.localeCompare(bValue));
  url.search = "";
  for (const [key, value] of params) url.searchParams.append(key, value);
  url.pathname = url.pathname.replace(/\/{2,}/g, "/");
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

export function canonicalUrlHash(input: string): string {
  return createHash("sha256").update(canonicalizeUrl(input)).digest("hex");
}

export function originGroupFromUrl(input: string): string {
  const url = new URL(canonicalizeUrl(input));
  return url.hostname.replace(/^www\./i, "");
}
