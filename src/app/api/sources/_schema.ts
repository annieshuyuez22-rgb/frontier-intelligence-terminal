import { z } from "zod";
import { validatePublicUrl } from "@/lib/security";

export const sourceInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  channel: z.enum(["rss", "x", "linkedin", "search", "manual", "paper", "blog"]).optional(),
  adapter: z.enum(["rss", "atom", "manual", "web", "tavily", "search", "x", "linkedin"]),
  enabled: z.boolean().default(true),
  config: z.object({
    url: z.url().max(4_000).optional(),
    query: z.string().trim().min(1).max(1_000).optional(),
    organizationId: z.string().regex(/^\d+$/).max(30).optional(),
    maxItems: z.number().int().min(1).max(100).optional(),
    maxResults: z.number().int().min(1).max(100).optional(),
    days: z.number().int().min(1).max(30).optional(),
    topic: z.enum(["general", "news", "finance"]).optional(),
    includeDomains: z.array(z.string().max(253)).max(50).optional(),
    excludeDomains: z.array(z.string().max(253)).max(50).optional(),
    excerptChars: z.number().int().min(200).max(6_000).optional(),
    selector: z.string().max(200).optional(),
    title: z.string().max(500).optional(),
    sourceType: z.enum(["official", "third_party_review", "media", "preprint", "social", "rumor"]).optional(),
    currencyHint: z.enum(["USD", "EUR", "GBP", "CNY", "JPY", "CHF", "CAD", "AUD", "HKD", "SGD", "INR", "KRW"]).optional(),
  }).strict(),
}).strict().superRefine((value, context) => {
  if (["rss", "atom", "manual", "web"].includes(value.adapter) && !value.config.url) {
    context.addIssue({ code: "custom", path: ["config", "url"], message: "此适配器需要 URL" });
  }
  if (["tavily", "search", "x"].includes(value.adapter) && !value.config.query) {
    context.addIssue({ code: "custom", path: ["config", "query"], message: "此适配器需要查询语句" });
  }
  if (value.adapter === "linkedin" && !value.config.organizationId) {
    context.addIssue({ code: "custom", path: ["config", "organizationId"], message: "LinkedIn 需要组织 ID" });
  }
});

export type SourceInput = z.infer<typeof sourceInputSchema>;

export function defaultChannel(adapter: SourceInput["adapter"]): NonNullable<SourceInput["channel"]> {
  if (adapter === "rss" || adapter === "atom") return "rss";
  if (adapter === "tavily" || adapter === "search") return "search";
  if (adapter === "manual" || adapter === "web") return "manual";
  return adapter;
}

export async function validateSourceInput(input: SourceInput): Promise<void> {
  if (input.config.url) await validatePublicUrl(input.config.url);
}
