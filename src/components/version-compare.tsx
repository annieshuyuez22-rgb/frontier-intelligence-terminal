"use client";

import { useState } from "react";
import type { EventVersionRecord } from "@/lib/domain";
import { formatDateTime } from "./format";
import { useLanguage } from "./language-provider";
import { Badge, EmptyState } from "./ui";

function flatten(value: unknown, path = "", output: Record<string, string> = {}, depth = 0): Record<string, string> {
  if (depth > 8) {
    output[path || "root"] = "[嵌套层级过深]";
    return output;
  }
  if (value === null || value === undefined || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    output[path || "root"] = value === null || value === undefined ? "—" : String(value);
    return output;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) output[path || "root"] = "[]";
    value.slice(0, 100).forEach((item, index) => flatten(item, `${path}[${index}]`, output, depth + 1));
    if (value.length > 100) output[`${path}[…]`] = `另有 ${value.length - 100} 项未展开`;
    return output;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) output[path || "root"] = "{}";
    for (const [key, item] of entries) flatten(item, path ? `${path}.${key}` : key, output, depth + 1);
    return output;
  }
  output[path || "root"] = String(value);
  return output;
}

function versionDate(version: EventVersionRecord): string {
  const date = new Date(version.createdAt);
  return Number.isNaN(date.getTime()) ? String(version.createdAt) : formatDateTime(date.toISOString());
}

export function VersionCompare({ versions }: { versions: EventVersionRecord[] }) {
  const { t } = useLanguage();
  const ordered = [...versions].sort((a, b) => b.version - a.version);
  const [newId, setNewId] = useState(ordered[0]?.id ?? "");
  const [oldId, setOldId] = useState(ordered[1]?.id ?? ordered[0]?.id ?? "");
  const oldVersion = ordered.find((version) => version.id === oldId);
  const newVersion = ordered.find((version) => version.id === newId);
  const oldValues = oldVersion ? flatten(oldVersion.snapshot) : {};
  const newValues = newVersion ? flatten(newVersion.snapshot) : {};
  const keys = [...new Set([...Object.keys(oldValues), ...Object.keys(newValues)])].sort();
  const missing = t("（不存在）", "(missing)");
  const differences = oldVersion && newVersion
    ? keys.filter((key) => oldValues[key] !== newValues[key]).map((key) => ({ key, before: oldValues[key] ?? missing, after: newValues[key] ?? missing }))
    : [];

  if (ordered.length < 2) return <EmptyState title={t("暂无可比较的版本", "No versions to compare")} description={t("至少需要两个历史版本。当前记录不会因缺少历史快照而虚构变更差异。", "At least two historical versions are required. Differences are never invented when snapshots are unavailable.")} />;

  return (
    <div>
      <div className="version-controls">
        <label className="field"><span>{t("旧版本", "Old version")}</span><select className="select" value={oldId} onChange={(event) => setOldId(event.target.value)}>{ordered.map((version) => <option key={version.id} value={version.id}>v{version.version} · {versionDate(version)}</option>)}</select></label>
        <label className="field"><span>{t("新版本", "New version")}</span><select className="select" value={newId} onChange={(event) => setNewId(event.target.value)}>{ordered.map((version) => <option key={version.id} value={version.id}>v{version.version} · {versionDate(version)}</option>)}</select></label>
      </div>
      {newVersion ? <div className="version-summary"><Badge tone={newVersion.majorCorrection ? "danger" : "info"}>v{newVersion.version}{newVersion.majorCorrection ? t(" · 重大更正", " · Major correction") : ""}</Badge><p>{newVersion.changeSummary || t("未提供变更摘要", "No change summary provided")}</p></div> : null}
      {oldId === newId ? <p className="form-message">{t("请选择两个不同版本进行比较。", "Select two different versions to compare.")}</p> : differences.length === 0 ? <EmptyState title={t("快照字段没有差异", "No snapshot field differences")} description={t("两个版本的变更摘要可能不同，但当前可比较的结构化快照一致。", "Change summaries may differ, but the comparable structured snapshots are identical.")} /> : (
        <div className="diff-list" aria-label={t(`共 ${differences.length} 项字段差异`, `${differences.length} field differences`)}>
          {differences.slice(0, 100).map((difference) => <div className="diff-row" key={difference.key}><code>{difference.key}</code><div className="diff-old"><span className="sr-only">{t("旧值：", "Old value: ")}</span>{difference.before}</div><div className="diff-new"><span className="sr-only">{t("新值：", "New value: ")}</span>{difference.after}</div></div>)}
          {differences.length > 100 ? <p className="form-message">{t(`另有 ${differences.length - 100} 项差异未展开。`, `${differences.length - 100} more differences are collapsed.`)}</p> : null}
        </div>
      )}
    </div>
  );
}
