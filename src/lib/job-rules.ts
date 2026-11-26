import Decimal from "decimal.js";
import type { FundingType } from "./domain";

export interface FundingEventIdentityInput {
  company: string;
  round: string;
  amountOriginal: Decimal.Value;
  currency: string;
  type: FundingType;
}

function normalizedCompany(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[·•]/g, " ")
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeFundingRound(value: string): string {
  const round = value.normalize("NFKC").toLowerCase().trim();
  if (!round) return "";
  if (/pre[-\s]*seed\b/.test(round)) return "pre-seed";
  if (/\bseed\b|种子轮/.test(round)) return "seed";
  if (/\bangel\b|天使轮/.test(round)) return "angel";
  const preSeries = round.match(/pre[-\s]*(?:series\s*)?([a-z])(\+)?/i);
  if (preSeries?.[1]) return `pre-series-${preSeries[1]}${preSeries[2] ?? ""}`;
  const series = round.match(/series[\s-]*([a-z])(\+)?/i);
  if (series?.[1]) return `series-${series[1]}${series[2] ?? ""}`;
  const letterRound = round.match(/(?:^|\s)([a-z])(\+)?\s*(?:round\b|轮(?:融资)?)/i);
  if (letterRound?.[1]) return `series-${letterRound[1]}${letterRound[2] ?? ""}`;
  return "";
}

export function extractFundingRound(text: string): string {
  const value = text.normalize("NFKC");
  const patterns = [
    /pre[-\s]*seed(?:\s+round)?/i,
    /pre[-\s]*series[\s-]*[a-z](?:\+)?/i,
    /series[\s-]*[a-z](?:\+)?/i,
    /(?:^|\s)[a-z](?:\+)?\s*round\b/i,
    /(?:^|\s)[a-z](?:\+)?\s*轮(?:融资)?/i,
    /seed(?:\s+round)?|种子轮/i,
    /angel(?:\s+round)?|天使轮/i,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern)?.[0];
    if (match) return normalizeFundingRound(match);
  }
  return "";
}

export function buildFundingEventDedupeKey(input: FundingEventIdentityInput): string | null {
  const company = normalizedCompany(input.company);
  const round = normalizeFundingRound(input.round);
  const currency = input.currency.trim().toUpperCase();
  if (!company || !round || !input.amountOriginal || !/^[A-Z]{3}$/.test(currency) || input.type === "unknown") return null;
  const amount = new Decimal(input.amountOriginal);
  if (!amount.isFinite() || amount.lte(0)) return null;
  return [
    "funding-v2",
    company,
    round,
    amount.toSignificantDigits(24).toFixed(),
    currency,
    input.type,
  ].join("|");
}

export function earlierOfficialEventDate(
  currentEventDate: string,
  candidateDate: string | null,
  infoType: string,
): string | null {
  if (infoType !== "official" || !candidateDate) return null;
  const current = new Date(currentEventDate);
  const candidate = new Date(candidateDate);
  if (Number.isNaN(current.getTime()) || Number.isNaN(candidate.getTime()) || candidate >= current) return null;
  return candidate.toISOString();
}

interface ZonedDateParts {
  year: number;
  month: number;
  day: number;
}

function partsAt(date: Date, timeZone: string): ZonedDateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.get("year")),
    month: Number(values.get("month")),
    day: Number(values.get("day")),
  };
}

function localDayNumber(date: Date, timeZone: string): number {
  const parts = partsAt(date, timeZone);
  return Date.UTC(parts.year, parts.month - 1, parts.day) / 86_400_000;
}

function firstInstantOfLocalDay(dayNumber: number, timeZone: string): Date {
  const nominal = dayNumber * 86_400_000;
  let lower = nominal - 36 * 60 * 60 * 1000;
  let upper = nominal + 36 * 60 * 60 * 1000;
  if (localDayNumber(new Date(lower), timeZone) >= dayNumber || localDayNumber(new Date(upper), timeZone) < dayNumber) {
    throw new Error("无法计算时区日界");
  }
  while (upper - lower > 1) {
    const middle = lower + Math.floor((upper - lower) / 2);
    if (localDayNumber(new Date(middle), timeZone) < dayNumber) lower = middle;
    else upper = middle;
  }
  return new Date(upper);
}

export interface ZonedDayBounds {
  dateKey: string;
  start: Date;
  end: Date;
}

export function getZonedDayBounds(now: Date, timeZone: string): ZonedDayBounds {
  if (Number.isNaN(now.getTime())) throw new Error("无效日期");
  const parts = partsAt(now, timeZone);
  const dayNumber = Date.UTC(parts.year, parts.month - 1, parts.day) / 86_400_000;
  return {
    dateKey: `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`,
    start: firstInstantOfLocalDay(dayNumber, timeZone),
    end: firstInstantOfLocalDay(dayNumber + 1, timeZone),
  };
}

export function outstandingBudgetReservations(
  jobs: ReadonlyArray<{ costLimitUsd: Decimal.Value; spentUsd: Decimal.Value }>,
): Decimal {
  return jobs.reduce(
    (total, job) => total.plus(Decimal.max(new Decimal(job.costLimitUsd).minus(job.spentUsd), 0)),
    new Decimal(0),
  );
}

export function capJobCostLimit(input: {
  requestedCostLimitUsd: Decimal.Value;
  dailyBudgetUsd: Decimal.Value;
  spentTodayUsd: Decimal.Value;
  reservedUsd?: Decimal.Value;
}): string {
  const remaining = Decimal.max(
    new Decimal(input.dailyBudgetUsd)
      .minus(input.spentTodayUsd)
      .minus(input.reservedUsd ?? 0),
    0,
  );
  return Decimal.min(new Decimal(input.requestedCostLimitUsd), remaining).toFixed(4);
}
