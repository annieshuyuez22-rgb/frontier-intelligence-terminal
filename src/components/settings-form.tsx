"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { DEFAULT_NARRATIVE_DEFINITIONS, type DataMode, type PreferenceRecord } from "@/lib/domain";
import { errorMessage, readApiJson } from "./api-client";
import { useLanguage } from "./language-provider";
import { useTheme } from "./theme-provider";
import type { ThemePreference } from "./types";
import { InlineNotice } from "./ui";

function listValue(value: FormDataEntryValue | null): string[] {
  return [...new Set(String(value ?? "").split(/[\n,，]/).map((item) => item.trim()).filter(Boolean))];
}

export function SettingsForm({ initial, mode }: { initial: PreferenceRecord; mode: DataMode }) {
  const { preference, setTheme } = useTheme();
  const { setLanguage, t } = useLanguage();
  const [emailEnabled, setEmailEnabled] = useState(initial.emailEnabled);
  const [webhookEnabled, setWebhookEnabled] = useState(initial.webhookEnabled);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const narrativeKeys = [...new Set([...Object.keys(DEFAULT_NARRATIVE_DEFINITIONS), ...Object.keys(initial.narrativeDefinitions)])];

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const narrativeDefinitions = Object.fromEntries(narrativeKeys.map((key) => [key, String(form.get(`narrative.${key}`) ?? "")]).filter((entry) => entry[1].trim().length > 0));
    const payload: PreferenceRecord = {
      timezone: String(form.get("timezone") ?? initial.timezone),
      updateTime: String(form.get("updateTime") ?? initial.updateTime),
      language: String(form.get("language")) === "en" ? "en" : "zh",
      watchedTopics: listValue(form.get("watchedTopics")),
      watchedCompanies: listValue(form.get("watchedCompanies")),
      competitors: listValue(form.get("competitors")),
      businessGoals: String(form.get("businessGoals") ?? ""),
      narrativeDefinitions,
      emailEnabled,
      emailTarget: String(form.get("emailTarget") ?? ""),
      webhookEnabled,
      webhookTarget: String(form.get("webhookTarget") ?? ""),
      dailyBudgetUsd: String(form.get("dailyBudgetUsd") ?? "0"),
      refreshBudgetUsd: String(form.get("refreshBudgetUsd") ?? "0"),
    };
    if (mode === "demo") {
      setMessage(t("演示偏好已在当前页面完成校验，但未写入数据库；主题选择会单独保存在此浏览器。未发送邮件或 Webhook。", "Demo preferences were validated locally but not written to a database. Theme is stored in this browser. No email or webhook was sent."));
      setLanguage(payload.language);
      setPending(false);
      return;
    }
    try {
      const response = await fetch("/api/preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      await readApiJson<{ preference: PreferenceRecord }>(response);
      setMessage(t("研究偏好、投递开关与预算已保存。主题偏好在切换时已保存于当前浏览器。", "Preferences, delivery switches, and budgets saved. Theme is stored in this browser."));
      setLanguage(payload.language);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void save(event)}>
      <section className="settings-section" id="general">
        <h2>{t("01 · 时间、语言与外观", "01 · Time, language & appearance")}</h2>
        <p>{t("日报时间使用 IANA 时区。主题默认跟随系统，用户选择会持久化到当前浏览器。", "Briefs use an IANA timezone. Theme follows the system by default and persists in this browser.")}</p>
        <div className="form-grid">
          <label className="field"><span>{t("时区", "Timezone")}</span><input className="input" name="timezone" defaultValue={initial.timezone} list="timezone-options" required /><datalist id="timezone-options"><option value="Asia/Shanghai" /><option value="UTC" /><option value="America/New_York" /><option value="America/Los_Angeles" /><option value="Europe/London" /><option value="Asia/Singapore" /></datalist></label>
          <label className="field"><span>{t("每日更新时间", "Daily update time")}</span><input className="input" type="time" name="updateTime" defaultValue={initial.updateTime} required /></label>
          <label className="field"><span>{t("研究语言", "Research language")}</span><select className="select" name="language" defaultValue={initial.language}><option value="zh">中文</option><option value="en">English</option></select></label>
          <label className="field"><span>{t("终端主题", "Terminal theme")}</span><select className="select" value={preference} onChange={(event) => setTheme(event.target.value as ThemePreference)}><option value="system">{t("跟随系统", "System")}</option><option value="light">{t("浅色", "Light")}</option><option value="dark">{t("深色", "Dark")}</option></select><small>{t("立即生效并保存到 localStorage；同时尊重系统 reduced-motion。", "Applies immediately and persists in localStorage; reduced-motion is respected.")}</small></label>
        </div>
      </section>

      <section className="settings-section" id="watchlist">
        <h2>{t("02 · 公司、竞品与业务目标", "02 · Companies, competitors & goals")}</h2>
        <p>{t("列表可用逗号或换行分隔。目标用于优先级排序，不应被当作来源事实。", "Separate lists with commas or new lines. Goals guide priority and are not source facts.")}</p>
        <div className="form-grid">
          <label className="field"><span>{t("关注主题", "Watched topics")}</span><textarea className="textarea" name="watchedTopics" defaultValue={initial.watchedTopics.join("\n")} placeholder="RSI&#10;AI for Science&#10;Robotics" /></label>
          <label className="field"><span>{t("关注公司 / 机构", "Watched companies / organizations")}</span><textarea className="textarea" name="watchedCompanies" defaultValue={initial.watchedCompanies.join("\n")} placeholder={t("每行一个公司或机构", "One company or organization per line")} /></label>
          <label className="field"><span>{t("竞品", "Competitors")}</span><textarea className="textarea" name="competitors" defaultValue={initial.competitors.join("\n")} placeholder={t("每行一个竞品", "One competitor per line")} /></label>
          <label className="field"><span>{t("业务目标", "Business goals")}</span><textarea className="textarea" name="businessGoals" defaultValue={initial.businessGoals} maxLength={10000} placeholder={t("例如：评估 AI 搜索对获客成本的影响，优先需要可复现实验。", "Example: assess AI search’s effect on acquisition cost, prioritizing reproducible experiments.")} /></label>
        </div>
      </section>

      <section className="settings-section" id="definitions">
        <h2>{t("03 · 新叙事研究定义", "03 · Narrative research definitions")}</h2>
        <p>{t("定义用于分类和证据审查，不是热度评分。RSI 在此始终指 Recursive Self-Improvement，除非你明确修改研究口径。", "Definitions guide classification and evidence review, not popularity scores. RSI means Recursive Self-Improvement unless you explicitly change the research definition.")}</p>
        <div className="form-grid">{narrativeKeys.map((key) => <label className="field" key={key}><span>{key}{key === "RSI" ? " · Recursive Self-Improvement" : ""}</span><textarea className="textarea" name={`narrative.${key}`} defaultValue={initial.narrativeDefinitions[key] ?? DEFAULT_NARRATIVE_DEFINITIONS[key] ?? ""} maxLength={5000} /></label>)}</div>
      </section>

      <section className="settings-section" id="delivery">
        <h2>{t("04 · 邮件与 Webhook 投递", "04 · Email & webhook delivery")}</h2>
        <p>{t("两个渠道相互独立，默认均关闭。保存开关不会测试投递，也不会在演示模式发送任何内容。", "Channels are independent and off by default. Saving does not test delivery; demo mode never sends anything.")}</p>
        {!initial.emailEnabled && !initial.webhookEnabled ? <InlineNotice>{t("当前初始配置中邮件和 Webhook 均关闭。启用前请确认接收方与内容边界。", "Email and webhook are initially off. Confirm recipients and content boundaries before enabling them.")}</InlineNotice> : null}
        <div className="delivery-grid">
          <div className="delivery-card"><h3>{t("邮件投递", "Email delivery")}</h3><label className="switch-label"><input type="checkbox" checked={emailEnabled} onChange={(event) => setEmailEnabled(event.target.checked)} />{emailEnabled ? t("已启用邮件（保存后生效）", "Email enabled (applies after save)") : t("邮件关闭", "Email off")}</label><label className="field"><span>{t("接收邮箱", "Recipient email")}</span><input className="input" type="email" name="emailTarget" defaultValue={initial.emailTarget} required={emailEnabled} autoComplete="email" placeholder="research@company.com" /></label></div>
          <div className="delivery-card"><h3>{t("Webhook 投递", "Webhook delivery")}</h3><label className="switch-label"><input type="checkbox" checked={webhookEnabled} onChange={(event) => setWebhookEnabled(event.target.checked)} />{webhookEnabled ? t("已启用 Webhook（保存后生效）", "Webhook enabled (applies after save)") : t("Webhook 关闭", "Webhook off")}</label><label className="field"><span>{t("公开 HTTPS 目标 URL", "Public HTTPS destination URL")}</span><input className="input" type="url" name="webhookTarget" defaultValue={initial.webhookTarget} required={webhookEnabled} placeholder="https://example.com/hooks/intelligence" /></label></div>
        </div>
      </section>

      <section className="settings-section" id="budget">
        <h2>{t("05 · 预算约束", "05 · Budget limits")}</h2>
        <p>{t("预算为上限而非预计必定消费。后台任务仍需遵守权限、防重与渠道配置。", "Budgets are ceilings, not expected charges. Jobs still enforce permissions, deduplication, and source configuration.")}</p>
        <div className="form-grid">
          <label className="field"><span>{t("每日预算（USD）", "Daily budget (USD)")}</span><input className="input" type="number" name="dailyBudgetUsd" defaultValue={initial.dailyBudgetUsd} min="0" max="1000000" step="0.01" required /></label>
          <label className="field"><span>{t("单次刷新预算（USD）", "Budget per refresh (USD)")}</span><input className="input" type="number" name="refreshBudgetUsd" defaultValue={initial.refreshBudgetUsd} min="0" max="1000000" step="0.01" required /></label>
        </div>
        <div className="form-actions"><button className="button button-primary" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" aria-hidden="true" size={15} /> : <Save aria-hidden="true" size={15} />}{t("保存全部研究偏好", "Save all research preferences")}</button><span className="form-message" role="status">{message}</span></div>
      </section>
    </form>
  );
}
