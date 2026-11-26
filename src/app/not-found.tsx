import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { getLanguage } from "@/components/language-server";
import { translate } from "@/components/language";

export default async function NotFound() {
  const language = await getLanguage();
  const t = (zh: string, en: string) => translate(language, zh, en);
  return (
    <div className="page-shell centered-state">
      <div className="fatal-state">
        <SearchX aria-hidden="true" size={28} />
        <p className="eyebrow">404 / NOT FOUND</p>
        <h1>{t("没有找到这份研究记录", "This research record was not found")}</h1>
        <p>{t("链接可能已更正、事件尚未发布，或日期不在当前归档中。私人备注与隐藏状态不会通过公开深链接恢复。", "The link may have changed, the event may be unpublished, or the date may be outside the archive. Private notes and hidden state are never restored through public deep links.")}</p>
        <Link className="button button-primary" href="/events"><ArrowLeft aria-hidden="true" size={16} />{t("返回全量事件流", "Back to event stream")}</Link>
      </div>
    </div>
  );
}
