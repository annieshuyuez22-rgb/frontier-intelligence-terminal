import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  ActionItem,
  DataMode,
  Metric,
  PriorityScore,
} from "@/lib/domain";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  ...timestamps,
});

export const sessions = pgTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const preferences = pgTable("preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  timezone: text("timezone").notNull().default("Asia/Shanghai"),
  updateTime: text("update_time").notNull().default("08:00"),
  language: text("language").notNull().default("zh"),
  watchedTopics: jsonb("watched_topics").$type<string[]>().notNull().default([]),
  watchedCompanies: jsonb("watched_companies").$type<string[]>().notNull().default([]),
  competitors: jsonb("competitors").$type<string[]>().notNull().default([]),
  businessGoals: text("business_goals").notNull().default(""),
  narrativeDefinitions: jsonb("narrative_definitions").$type<Record<string, string>>().notNull().default({}),
  emailEnabled: boolean("email_enabled").notNull().default(false),
  emailTarget: text("email_target").notNull().default(""),
  webhookEnabled: boolean("webhook_enabled").notNull().default(false),
  webhookTarget: text("webhook_target").notNull().default(""),
  dailyBudgetUsd: numeric("daily_budget_usd", { precision: 10, scale: 2 }).notNull().default("10"),
  refreshBudgetUsd: numeric("refresh_budget_usd", { precision: 10, scale: 2 }).notNull().default("2"),
  ...timestamps,
});

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  channel: text("channel").notNull(),
  adapter: text("adapter").notNull(),
  config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
  enabled: boolean("enabled").notNull().default(true),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  lastError: text("last_error"),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  ...timestamps,
});

export const sourceDocuments = pgTable("source_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id").notNull().references(() => sources.id, { onDelete: "cascade" }),
  canonicalUrl: text("canonical_url").notNull(),
  urlHash: text("url_hash").notNull().unique(),
  contentHash: text("content_hash").notNull(),
  title: text("title").notNull(),
  author: text("author"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  channel: text("channel").notNull(),
  sourceType: text("source_type").notNull(),
  accessStatus: text("access_status").notNull(),
  excerpt: text("excerpt").notNull(),
  originGroup: text("origin_group").notNull(),
  isFullText: boolean("is_full_text").notNull().default(false),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("source_documents_published_idx").on(table.publishedAt),
  index("source_documents_origin_idx").on(table.originGroup),
]);

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  mode: text("mode").$type<DataMode>().notNull().default("live"),
  slug: text("slug").notNull(),
  dedupeKey: text("dedupe_key").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  summary: text("summary").notNull(),
  summaryEn: text("summary_en"),
  infoType: text("info_type").notNull(),
  verificationStatus: text("verification_status").notNull(),
  eventDate: timestamp("event_date", { withTimezone: true, mode: "string" }).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true, mode: "string" }).notNull(),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  whyItMatters: text("why_it_matters").notNull(),
  evidenceBoundary: text("evidence_boundary").notNull(),
  addedThisRound: text("added_this_round").notNull(),
  metrics: jsonb("metrics").$type<Metric[]>().notNull().default([]),
  actions: jsonb("actions").$type<ActionItem[]>().notNull().default([]),
  score: jsonb("score").$type<PriorityScore>().notNull(),
  topics: jsonb("topics").$type<string[]>().notNull().default([]),
  companies: jsonb("companies").$type<string[]>().notNull().default([]),
  people: jsonb("people").$type<string[]>().notNull().default([]),
  regions: jsonb("regions").$type<string[]>().notNull().default([]),
  editorialStatus: text("editorial_status").notNull().default("pending"),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  ...timestamps,
}, (table) => [
  uniqueIndex("events_mode_dedupe_unique").on(table.mode, table.dedupeKey),
  uniqueIndex("events_mode_slug_unique").on(table.mode, table.slug),
  index("events_mode_date_idx").on(table.mode, table.eventDate),
  index("events_category_idx").on(table.mode, table.category),
]);

export const claims = pgTable("claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  kind: text("kind").notNull().default("fact"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const citations = pgTable("citations", {
  id: uuid("id").primaryKey().defaultRandom(),
  claimId: uuid("claim_id").notNull().references(() => claims.id, { onDelete: "cascade" }),
  sourceDocumentId: uuid("source_document_id").notNull().references(() => sourceDocuments.id, { onDelete: "cascade" }),
  relationship: text("relationship").notNull().default("supports"),
  excerpt: text("excerpt").notNull(),
  locator: text("locator"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("citation_claim_document_unique").on(table.claimId, table.sourceDocumentId),
]);

export const fundingRounds = pgTable("funding_rounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().unique().references(() => events.id, { onDelete: "cascade" }),
  amountOriginal: numeric("amount_original", { precision: 24, scale: 6 }),
  currency: text("currency").notNull().default("USD"),
  amountUsd: numeric("amount_usd", { precision: 24, scale: 6 }),
  fxRate: numeric("fx_rate", { precision: 24, scale: 10 }),
  fxSource: text("fx_source"),
  fxDate: text("fx_date"),
  type: text("type").notNull().default("unknown"),
  stage: text("stage").notNull().default("announced"),
  qualification: text("qualification").notNull().default("unknown"),
  splitUnknown: boolean("split_unknown").notNull().default(false),
  disclosed: boolean("disclosed").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const entities = pgTable("entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(),
  name: text("name").notNull(),
  aliases: jsonb("aliases").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("entity_kind_name_unique").on(table.kind, table.name)]);

export const eventEntities = pgTable("event_entities", {
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  entityId: uuid("entity_id").notNull().references(() => entities.id, { onDelete: "cascade" }),
}, (table) => [uniqueIndex("event_entity_unique").on(table.eventId, table.entityId)]);

export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  definition: text("definition").notNull(),
  coreClaim: text("core_claim").notNull().default(""),
  phase: text("phase").notNull().default("concept"),
  evidenceSummary: text("evidence_summary").notNull().default(""),
  commercialization: text("commercialization").notNull().default(""),
  bottlenecks: text("bottlenecks").notNull().default(""),
  counterEvidence: text("counter_evidence").notNull().default(""),
  capitalSignals: text("capital_signals").notNull().default(""),
  discussionSignals: text("discussion_signals").notNull().default(""),
  technicalSignals: text("technical_signals").notNull().default(""),
  commercialSignals: text("commercial_signals").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const eventTopics = pgTable("event_topics", {
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
}, (table) => [uniqueIndex("event_topic_unique").on(table.eventId, table.topicId)]);

export const eventVersions = pgTable("event_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  changeSummary: text("change_summary").notNull(),
  majorCorrection: boolean("major_correction").notNull().default(false),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("event_version_unique").on(table.eventId, table.version)]);

export const dailyBriefs = pgTable("daily_briefs", {
  id: uuid("id").primaryKey().defaultRandom(),
  mode: text("mode").$type<DataMode>().notNull().default("live"),
  date: text("date").notNull(),
  timezone: text("timezone").notNull(),
  title: text("title").notNull(),
  introduction: text("introduction").notNull(),
  eventIds: jsonb("event_ids").$type<string[]>().notNull().default([]),
  actions: jsonb("actions").$type<ActionItem[]>().notNull().default([]),
  stats: jsonb("stats").$type<Record<string, number>>().notNull(),
  coverage: jsonb("coverage").$type<Record<string, unknown>>().notNull(),
  majorCorrections: jsonb("major_corrections").$type<string[]>().notNull().default([]),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  jobId: uuid("job_id"),
}, (table) => [uniqueIndex("daily_brief_mode_date_zone_unique").on(table.mode, table.date, table.timezone)]);

export const userEventStates = pgTable("user_event_states", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  bookmarked: boolean("bookmarked").notNull().default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  hidden: boolean("hidden").notNull().default(false),
  privateNote: text("private_note").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("user_event_state_unique").on(table.userId, table.eventId)]);

export const refreshJobs = pgTable("refresh_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  status: text("status").notNull().default("queued"),
  trigger: text("trigger").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  windowEnd: timestamp("window_end", { withTimezone: true }).notNull(),
  progress: integer("progress").notNull().default(0),
  currentStep: text("current_step").notNull().default("等待采集"),
  cursor: jsonb("cursor").$type<Record<string, unknown>>().notNull().default({}),
  errorSummary: jsonb("error_summary").$type<string[]>().notNull().default([]),
  estimatedCostUsd: numeric("estimated_cost_usd", { precision: 10, scale: 4 }).notNull().default("0"),
  costLimitUsd: numeric("cost_limit_usd", { precision: 10, scale: 4 }).notNull().default("2"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(4),
  leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
  heartbeatAt: timestamp("heartbeat_at", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
}, (table) => [index("refresh_jobs_status_created_idx").on(table.status, table.createdAt)]);

export const jobLogs = pgTable("job_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull().references(() => refreshJobs.id, { onDelete: "cascade" }),
  level: text("level").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const providerCalls = pgTable("provider_calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").references(() => refreshJobs.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  operation: text("operation").notNull(),
  units: integer("units").notNull().default(1),
  estimatedCostUsd: numeric("estimated_cost_usd", { precision: 10, scale: 6 }).notNull().default("0"),
  status: text("status").notNull(),
  durationMs: integer("duration_ms").notNull().default(0),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const deliveries = pgTable("deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  briefId: uuid("brief_id").notNull().references(() => dailyBriefs.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),
  targetHash: text("target_hash").notNull(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  status: text("status").notNull().default("queued"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  preference: one(preferences, { fields: [users.id], references: [preferences.userId] }),
  states: many(userEventStates),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  claims: many(claims),
  funding: one(fundingRounds, { fields: [events.id], references: [fundingRounds.eventId] }),
  versions: many(eventVersions),
}));

export const claimsRelations = relations(claims, ({ one, many }) => ({
  event: one(events, { fields: [claims.eventId], references: [events.id] }),
  citations: many(citations),
}));

export const citationsRelations = relations(citations, ({ one }) => ({
  claim: one(claims, { fields: [citations.claimId], references: [claims.id] }),
  document: one(sourceDocuments, { fields: [citations.sourceDocumentId], references: [sourceDocuments.id] }),
}));
