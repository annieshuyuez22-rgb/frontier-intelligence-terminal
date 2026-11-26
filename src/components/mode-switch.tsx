"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import type { DataMode } from "@/lib/domain";
import { errorMessage, readApiJson } from "./api-client";
import { useLanguage } from "./language-provider";

export function ModeSwitch({ mode }: { mode: DataMode }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [pending, setPending] = useState<DataMode | null>(null);
  const [message, setMessage] = useState("");

  async function switchMode(nextMode: DataMode) {
    if (nextMode === mode || pending) return;
    setPending(nextMode);
    setMessage("");
    try {
      const response = await fetch("/api/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: nextMode }),
      });
      await readApiJson<{ mode: DataMode }>(response);
      setMessage(nextMode === "demo" ? t("已切换到演示数据", "Switched to demo data") : t("已切换到实时数据", "Switched to live data"));
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mode-control">
      <div className="segmented-control" aria-label={t("数据模式", "Data mode")}>
        {(["live", "demo"] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={mode === item}
            disabled={pending !== null}
            onClick={() => void switchMode(item)}
          >
            {pending === item ? <LoaderCircle className="spin" aria-hidden="true" size={13} /> : null}
            {item === "live" ? t("实时", "Live") : t("演示", "Demo")}
          </button>
        ))}
      </div>
      {message ? <span className="mode-message" role="status">{message}</span> : null}
    </div>
  );
}
