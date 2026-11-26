"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Link2, LoaderCircle } from "lucide-react";
import type { DataMode, RefreshJobRecord } from "@/lib/domain";
import { errorMessage, readApiJson } from "./api-client";
import { useLanguage } from "./language-provider";

export function ManualLinkCollector({ mode }: { mode: DataMode }) {
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (mode === "demo") {
      setMessage(t("演示模式不触发真实链接采集，未创建任务，也未访问该 URL。", "Demo mode does not collect links, create jobs, or access the URL."));
      return;
    }
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/collect/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: String(form.get("url") ?? ""), title: String(form.get("urlTitle") ?? "") || undefined, sourceType: String(form.get("sourceType") ?? "media"), excerptChars: 4000 }),
      });
      const data = await readApiJson<{ job: RefreshJobRecord; existing: boolean }>(response);
      setMessage(data.existing ? t(`已接入现有任务 ${data.job.id}，未重复采集。`, `Joined existing job ${data.job.id}; no duplicate collection.`) : t(`链接采集任务 ${data.job.id} 已排队；这不代表已完成。`, `Link collection job ${data.job.id} queued; this does not mean it has completed.`));
      formElement.reset();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)}>
      <div className="form-grid">
        <label className="field field-full"><span>{t("公开网页 URL", "Public webpage URL")}</span><input className="input" type="url" name="url" required maxLength={4000} placeholder="https://example.com/research/article" /><small>{t("仅提交可公开访问的网页；后台会校验 URL，内部网络地址不可用于采集。", "Submit publicly accessible pages only. URLs are validated; internal network addresses cannot be collected.")}</small></label>
        <label className="field"><span>{t("来源标题（可选）", "Source title (optional)")}</span><input className="input" name="urlTitle" maxLength={500} placeholder={t("用于人工识别，不覆盖原文事实", "For identification only; does not overwrite source facts")} /></label>
        <label className="field"><span>{t("来源性质", "Source type")}</span><select className="select" name="sourceType" defaultValue="media"><option value="media">{t("媒体报道", "Media report")}</option><option value="third_party_review">{t("第三方评测", "Third-party review")}</option><option value="preprint">{t("研究预印本", "Research preprint")}</option></select></label>
      </div>
      <div className="form-actions"><button className="button button-primary" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" aria-hidden="true" size={15} /> : <Link2 aria-hidden="true" size={15} />}{t("提交链接采集", "Collect link")}</button><Link className="button button-quiet" href="/jobs">{t("查看任务", "View jobs")}</Link></div>
      {message ? <p className="form-message" role="status">{message}</p> : null}
    </form>
  );
}
