"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, PlugZap, Plus } from "lucide-react";
import type { DataMode, SourceHealthRecord } from "@/lib/domain";
import { errorMessage, readApiJson } from "./api-client";
import { formatDateTime } from "./format";
import { useLanguage } from "./language-provider";
import { Badge } from "./ui";

interface SourceInput {
  name: string;
  channel: SourceHealthRecord["channel"];
  adapter: "rss" | "atom" | "manual" | "web" | "tavily" | "search" | "x" | "linkedin";
  enabled: boolean;
  config: Record<string, string | number | string[] | undefined>;
}

interface SourceResponse {
  source: {
    id: string;
    name: string;
    channel: SourceHealthRecord["channel"];
    configured: boolean;
    enabled: boolean;
    lastAttemptAt: string | null;
    lastSuccessAt: string | null;
    lastError: string | null;
  };
}

const channelLabels: Record<SourceHealthRecord["channel"], { zh: string; en: string }> = { rss: { zh: "RSS / Atom", en: "RSS / Atom" }, x: { zh: "X", en: "X" }, linkedin: { zh: "LinkedIn", en: "LinkedIn" }, search: { zh: "搜索", en: "Search" }, manual: { zh: "手动网页", en: "Manual web" }, paper: { zh: "论文", en: "Papers" }, blog: { zh: "博客", en: "Blogs" } };

export function ChannelManager({ initialSources, mode, canManage }: { initialSources: SourceHealthRecord[]; mode: DataMode; canManage: boolean }) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [sources, setSources] = useState(initialSources);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function testSource(source: SourceHealthRecord) {
    if (mode === "demo") {
      setMessage(t(`演示模式未发起 ${source.name} 的真实连接测试。`, `Demo mode did not run a real connection test for ${source.name}.`));
      return;
    }
    if (!canManage || pending) return;
    setPending(`test-${source.id}`);
    setMessage("");
    try {
      const response = await fetch("/api/sources/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceId: source.id, maxDocuments: 3 }) });
      const data = await readApiJson<{ status: string; message: string | null; documents: unknown[] }>(response);
      setMessage(t(`${source.name} 测试返回：${data.status}；${data.message ?? `取得 ${data.documents.length} 份样本文档`}。测试不等于持续采集已成功。`, `${source.name} test returned ${data.status}: ${data.message ?? `${data.documents.length} sample documents retrieved`}. A test does not prove ongoing collection is healthy.`));
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(null);
    }
  }

  async function addSource(input: SourceInput) {
    if (mode === "demo") {
      const local: SourceHealthRecord = { id: `demo-local-${Date.now()}`, name: input.name, channel: input.channel, enabled: true, configured: true, status: "idle", itemCount: 0, lastError: null, lastSuccessAt: null, lastAttemptAt: null };
      setSources((current) => [local, ...current]);
      setMessage(t(`${input.name} 已加入本次演示页面；未保存配置，也未发起连接。`, `${input.name} was added to this demo page only; nothing was saved or connected.`));
      return;
    }
    if (!canManage || pending) return;
    setPending(`add-${input.channel}`);
    setMessage("");
    try {
      const response = await fetch("/api/sources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const data = await readApiJson<SourceResponse>(response);
      setSources((current) => [{ ...data.source, status: data.source.lastError ? "error" : "idle" }, ...current]);
      setMessage(t(`${input.name} 已保存。请继续执行连接测试，保存配置不代表连接成功。`, `${input.name} was saved. Run a connection test next; saving does not prove connectivity.`));
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(null);
    }
  }

  async function toggleSource(source: SourceHealthRecord) {
    if (!canManage || pending) return;
    if (mode === "demo") {
      setSources((current) => current.map((item) => item.id === source.id ? { ...item, enabled: !item.enabled } : item));
      setMessage(t(`${source.name} 已在演示页面${source.enabled ? "停用" : "启用"}；未修改真实来源。`, `${source.name} was ${source.enabled ? "disabled" : "enabled"} in this demo only; no real source changed.`));
      return;
    }
    setPending(`toggle-${source.id}`);
    setMessage("");
    try {
      const response = await fetch("/api/sources", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceId: source.id, enabled: !source.enabled }) });
      const data = await readApiJson<SourceResponse>(response);
      setSources((current) => current.map((item) => item.id === source.id ? { ...item, enabled: data.source.enabled } : item));
      setMessage(t(`${source.name} 已${data.source.enabled ? "启用" : "停用"}；历史文档与最后成功时间保留。`, `${source.name} was ${data.source.enabled ? "enabled" : "disabled"}; historical documents and last success time were preserved.`));
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(null);
    }
  }

  function ConnectionForm({ kind }: { kind: "rss" | "x" | "linkedin" | "search" }) {
    const labels = { rss: t("添加 RSS / Atom URL", "Add RSS / Atom URL"), x: t("连接 X 查询", "Connect an X query"), linkedin: t("连接 LinkedIn 组织", "Connect a LinkedIn organization"), search: t("添加搜索查询", "Add a search query") };
    return (
      <form className="channel-add" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const name = String(form.get(`${kind}-name`) ?? "").trim();
        const value = String(form.get(`${kind}-value`) ?? "").trim();
        if (!name || !value) {
          setMessage(t("请填写来源名称与连接字段。", "Enter a source name and connection field."));
          return;
        }
        if (kind === "rss") void addSource({ name, channel: "rss", adapter: "rss", enabled: true, config: { url: value, maxItems: 25, sourceType: String(form.get("rss-source-type") ?? "media") } });
        if (kind === "x") void addSource({ name, channel: "x", adapter: "x", enabled: true, config: { query: value, maxResults: 10 } });
        if (kind === "linkedin") void addSource({ name, channel: "linkedin", adapter: "linkedin", enabled: true, config: { organizationId: value, maxResults: 10 } });
        if (kind === "search") void addSource({ name, channel: "search", adapter: "tavily", enabled: true, config: { query: value, maxResults: 10, topic: "general" } });
      }}>
        <h3>{labels[kind]}</h3>
        <div className="inline-form">
          <label className="field"><span>{t("显示名称", "Display name")}</span><input className="input" name={`${kind}-name`} required maxLength={200} placeholder={kind === "rss" ? t("实验室官方博客", "Official lab blog") : t(`我的 ${channelLabels[kind].zh} 来源`, `My ${channelLabels[kind].en} source`)} /></label>
          <label className="field"><span>{kind === "rss" ? "Feed URL" : kind === "linkedin" ? t("数字组织 ID", "Numeric organization ID") : t("查询语句", "Query")}</span><input className="input" type={kind === "rss" ? "url" : "text"} name={`${kind}-value`} required pattern={kind === "linkedin" ? "[0-9]+" : undefined} maxLength={kind === "rss" ? 4000 : 1000} placeholder={kind === "rss" ? "https://example.com/feed.xml" : kind === "x" ? "from:example AI" : kind === "linkedin" ? "12345678" : "AI drug discovery clinical milestone"} /></label>
          {kind === "rss" ? <label className="field"><span>{t("来源性质（只描述出处）", "Source type (provenance only)")}</span><select className="select" name="rss-source-type" defaultValue="media"><option value="media">{t("媒体报道", "Media report")}</option><option value="official">{t("官方披露", "Official disclosure")}</option><option value="preprint">{t("研究预印本", "Research preprint")}</option><option value="third_party_review">{t("第三方评测", "Third-party review")}</option></select></label> : null}
          <button className="button button-secondary" type="submit" disabled={!canManage || pending !== null}><Plus aria-hidden="true" size={14} />{t("保存连接", "Save connection")}</button>
        </div>
      </form>
    );
  }

  return (
    <div>
      {!canManage ? <p className="inline-notice notice-warning">{t("当前账户不是管理员。可以查看来源健康状态，但新增与测试连接需要管理员权限。", "This account is not an administrator. You can view source health, but adding and testing connections requires an administrator.")}</p> : null}
      <div className="channel-list">
        {sources.length === 0 ? <p className="form-message">{t("尚未配置任何来源。请从下方 RSS、X、LinkedIn 或搜索入口开始。", "No sources configured. Start with RSS, X, LinkedIn, or search below.")}</p> : sources.map((source) => (
          <article className="channel-card" key={source.id}>
            <div><h3>{source.name} <Badge>{channelLabels[source.channel][language]}</Badge></h3><p>{source.lastError || `${t("最近成功", "Last success")}: ${formatDateTime(source.lastSuccessAt, undefined, language)} · ${t("样本", "Samples")} ${source.itemCount ?? t("未知", "unknown")}`}</p></div>
            <div className="channel-card-actions">
              <Badge tone={source.status === "error" ? "danger" : !source.configured ? "warning" : source.status === "success" ? "success" : "neutral"}>{!source.enabled ? t("已停用", "Disabled") : !source.configured ? t("未配置", "Not configured") : source.status === "error" ? t("连接异常", "Connection error") : source.status === "success" ? t("测试 / 采集成功", "Test / collection succeeded") : t("待测试", "Awaiting test")}</Badge>
              <button className="button button-quiet button-small" type="button" disabled={!canManage || pending !== null || source.id.startsWith("builtin-")} onClick={() => void toggleSource(source)}>{source.enabled ? t("停用", "Disable") : t("启用", "Enable")}</button>
              <button className="button button-secondary button-small" type="button" disabled={!canManage || pending !== null || (mode === "live" && (!source.configured || !source.enabled))} onClick={() => void testSource(source)}>{pending === `test-${source.id}` ? <LoaderCircle className="spin" aria-hidden="true" size={13} /> : <PlugZap aria-hidden="true" size={13} />}{t("测试连接", "Test connection")}</button>
            </div>
          </article>
        ))}
      </div>
      {(["rss", "x", "linkedin", "search"] as const).map((kind) => <ConnectionForm kind={kind} key={kind} />)}
      {message ? <p className="form-message" role="status">{message}</p> : null}
    </div>
  );
}
