"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import type { ActionItem, EventRecord, VerificationStatus } from "@/lib/domain";
import { editorialStatusLabelsI18n, verificationLabelsI18n } from "@/lib/domain";
import { errorMessage, readApiJson } from "./api-client";
import { useLanguage } from "./language-provider";

export function EventEditor({ event }: { event: EventRecord }) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [actions, setActions] = useState<ActionItem[]>(event.actions);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  function updateAction(id: string, patch: Partial<ActionItem>) {
    setActions((current) => current.map((action) => action.id === id ? { ...action, ...patch } : action));
  }

  async function save(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage("");
    const form = new FormData(formEvent.currentTarget);
    const body = {
      title: String(form.get("title") ?? ""),
      summary: String(form.get("summary") ?? ""),
      summaryEn: String(form.get("summaryEn") ?? ""),
      eventDate: String(form.get("eventDate") ?? ""),
      whyItMatters: String(form.get("whyItMatters") ?? ""),
      evidenceBoundary: String(form.get("evidenceBoundary") ?? ""),
      addedThisRound: String(form.get("addedThisRound") ?? ""),
      verificationStatus: String(form.get("verificationStatus") ?? "insufficient") as VerificationStatus,
      editorialStatus: String(form.get("editorialStatus") ?? "pending"),
      changeSummary: String(form.get("changeSummary") ?? ""),
      majorCorrection: form.get("majorCorrection") === "1",
      actions: actions.map((action) => ({ ...action, title: action.title.trim(), materials: action.materials.trim(), verification: action.verification.trim(), expectedOutput: action.expectedOutput.trim() })),
    };
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(event.id)}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await readApiJson(response);
      setMessage(t("人工编辑已保存，前后版本与更正原因均已保留。", "Manual edit saved. Previous and new versions, along with the correction reason, were preserved."));
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="detail-section event-editor" aria-labelledby="event-editor-title">
      <h2 id="event-editor-title">{t("人工编辑与发布", "Manual editing & publishing")}</h2>
      <p>{t("人工修正独立进入版本历史。新增数字必须仍能映射到来源；至少两个独立来源组才能选择“已交叉核验”。", "Manual corrections are versioned independently. New figures must still map to sources; cross-verified status requires at least two independent source groups.")}</p>
      <form onSubmit={(event) => void save(event)}>
        <div className="form-grid">
          <label className="field field-full"><span>{t("事实优先标题", "Fact-first title")}</span><input className="input" name="title" defaultValue={event.title} required maxLength={300} /></label>
          <label className="field field-full"><span>{t("中文摘要（发布至少 150 字）", "Chinese summary (minimum 150 characters to publish)")}</span><textarea className="textarea" name="summary" defaultValue={event.summary} required minLength={1} maxLength={4000} rows={7} /></label>
          <label className="field field-full"><span>English summary</span><textarea className="textarea" name="summaryEn" defaultValue={event.summaryEn ?? ""} maxLength={4000} rows={5} lang="en" /></label>
          <label className="field"><span>{t("事件日期", "Event date")}</span><input className="input" type="date" name="eventDate" defaultValue={event.eventDate.slice(0, 10)} required /></label>
          <label className="field"><span>{t("核验状态", "Verification status")}</span><select className="select" name="verificationStatus" defaultValue={event.verificationStatus}>{Object.entries(verificationLabelsI18n).map(([value, label]) => <option value={value} key={value}>{label[language]}</option>)}</select></label>
          <label className="field"><span>{t("编辑状态", "Editorial status")}</span><select className="select" name="editorialStatus" defaultValue={event.editorialStatus}><option value="pending">{editorialStatusLabelsI18n.pending[language]}</option><option value="published">{editorialStatusLabelsI18n.published[language]}</option><option value="hidden">{editorialStatusLabelsI18n.hidden[language]}</option></select></label>
          <label className="field field-full"><span>{t("为什么值得关注（分析区）", "Why it matters (analysis)")}</span><textarea className="textarea" name="whyItMatters" defaultValue={event.whyItMatters} required maxLength={2000} /></label>
          <label className="field field-full"><span>{t("证据边界与未知项", "Evidence limits and unknowns")}</span><textarea className="textarea" name="evidenceBoundary" defaultValue={event.evidenceBoundary} required maxLength={2000} /></label>
          <label className="field field-full"><span>{t("本轮新增或修正", "Added or corrected in this round")}</span><textarea className="textarea" name="addedThisRound" defaultValue={event.addedThisRound} required maxLength={1000} /></label>
          <label className="field field-full"><span>{t("本次人工修改说明（进入版本记录）", "Manual change note (recorded in version history)")}</span><input className="input" name="changeSummary" required maxLength={1000} placeholder={t("例如：核对原始公告后修正本轮金额与交割阶段", "Example: corrected the round amount and closing stage against the original announcement")} /></label>
          <label className="checkbox-label field-full"><input type="checkbox" name="majorCorrection" value="1" />{t("标记为重大更正；修改事件日期会自动标记", "Mark as a major correction; changing the event date marks it automatically")}</label>
        </div>

        <div className="editor-actions">
          <div className="result-toolbar"><h3>{t("建议行动（最多 3 条）", "Suggested actions (up to 3)")}</h3><button className="button button-quiet button-small" type="button" disabled={actions.length >= 3} onClick={() => setActions((current) => [...current, { id: `act-new-${crypto.randomUUID()}`, title: "", materials: "", verification: "", priority: "medium", expectedOutput: "" }])}><Plus aria-hidden="true" size={14} />{t("添加行动", "Add action")}</button></div>
          {actions.length === 0 ? <p className="form-message">{t("暂无行动建议；没有执行路径时不自动补写。", "No suggested actions. Nothing is generated when there is no executable path.")}</p> : actions.map((action, index) => (
            <fieldset className="editor-action" key={action.id}>
              <legend>{t("行动", "Action")} {index + 1}</legend>
              <button className="icon-button editor-action-delete" type="button" aria-label={t(`删除行动 ${index + 1}`, `Delete action ${index + 1}`)} onClick={() => setActions((current) => current.filter((item) => item.id !== action.id))}><Trash2 aria-hidden="true" size={15} /></button>
              <label className="field"><span>{t("具体行动", "Action")}</span><input className="input" value={action.title} onChange={(event) => updateAction(action.id, { title: event.target.value })} required maxLength={300} /></label>
              <label className="field"><span>{t("优先级", "Priority")}</span><select className="select" value={action.priority} onChange={(event) => updateAction(action.id, { priority: event.target.value as ActionItem["priority"] })}><option value="high">{t("高", "High")}</option><option value="medium">{t("中", "Medium")}</option><option value="low">{t("低", "Low")}</option></select></label>
              <label className="field"><span>{t("所需材料", "Required materials")}</span><textarea className="textarea" value={action.materials} onChange={(event) => updateAction(action.id, { materials: event.target.value })} required maxLength={2000} /></label>
              <label className="field"><span>{t("建议验证方法", "Suggested verification")}</span><textarea className="textarea" value={action.verification} onChange={(event) => updateAction(action.id, { verification: event.target.value })} required maxLength={2000} /></label>
              <label className="field"><span>{t("预期产物", "Expected output")}</span><textarea className="textarea" value={action.expectedOutput} onChange={(event) => updateAction(action.id, { expectedOutput: event.target.value })} required maxLength={1000} /></label>
            </fieldset>
          ))}
        </div>
        <div className="form-actions"><button className="button button-primary" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" aria-hidden="true" size={15} /> : <Save aria-hidden="true" size={15} />}{t("保存人工版本", "Save manual version")}</button><span className="form-message" role="status">{message}</span></div>
      </form>
    </section>
  );
}
