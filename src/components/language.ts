import type { UILanguage } from "@/lib/domain";

export function translate(language: UILanguage, zh: string, en: string): string {
  return language === "en" ? en : zh;
}

export function eventDisplayTitle(event: { title: string; titleEn?: string | null }, language: UILanguage): { text: string; fallback: boolean } {
  if (language === "en") {
    if (event.titleEn?.trim()) return { text: event.titleEn, fallback: false };
    return { text: event.title, fallback: true };
  }
  return { text: event.title, fallback: false };
}

export function eventDisplaySummary(event: { summary: string; summaryEn?: string | null }, language: UILanguage): { text: string; fallback: boolean } {
  if (language === "en") {
    if (event.summaryEn?.trim()) return { text: event.summaryEn, fallback: false };
    return { text: event.summary, fallback: true };
  }
  return { text: event.summary, fallback: false };
}
