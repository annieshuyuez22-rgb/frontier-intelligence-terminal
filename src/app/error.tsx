"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="page-shell centered-state">
      <div className="fatal-state" role="alert">
        <AlertTriangle aria-hidden="true" size={28} />
        <p className="eyebrow">{t("SYSTEM / 异常", "SYSTEM / ERROR")}</p>
        <h1>{t("这部分情报暂时无法载入", "This intelligence could not be loaded")}</h1>
        <p>{t("请重试。若问题持续，请前往任务页检查数据库与采集渠道；未成功的更新不会被标记为成功。", "Retry. If the problem persists, inspect the database and collection channels on the jobs page; unsuccessful updates are never marked successful.")}</p>
        {error.digest ? <code>{t("错误编号：", "Error ID: ")}{error.digest}</code> : null}
        <div className="button-row">
          <button className="button button-primary" type="button" onClick={() => retry()}><RotateCcw aria-hidden="true" size={16} />{t("重新载入", "Reload")}</button>
          <Link className="button button-secondary" href="/jobs">{t("查看运行状态", "View system status")}</Link>
        </div>
      </div>
    </div>
  );
}
