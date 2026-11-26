"use client";

import { useState } from "react";
import { Bookmark, Check, Eye, EyeOff, LoaderCircle, StickyNote } from "lucide-react";
import type { DataMode } from "@/lib/domain";
import { errorMessage, readApiJson } from "./api-client";
import { useLanguage } from "./language-provider";
import type { EventUserState } from "./types";

interface StateResponse {
  state: {
    eventId: string;
    bookmarked: boolean;
    readAt: string | null;
    hidden: boolean;
    privateNote: string;
    updatedAt: string;
  };
}

const emptyState: EventUserState = { bookmarked: false, read: false, hidden: false, privateNote: "" };

export function EventStateControls({
  eventId,
  mode,
  initialState = emptyState,
  onStateChange,
}: {
  eventId: string;
  mode: DataMode;
  initialState?: EventUserState;
  onStateChange?: (state: EventUserState) => void;
}) {
  const { t } = useLanguage();
  const [state, setState] = useState<EventUserState>(initialState);
  const [note, setNote] = useState(initialState.privateNote);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  function applyState(next: EventUserState) {
    setState(next);
    setNote(next.privateNote);
    onStateChange?.(next);
  }

  async function save(patch: Partial<EventUserState>, label: string) {
    if (pending) return;
    setPending(label);
    setMessage("");
    const next = { ...state, ...patch };
    if (mode === "demo") {
      applyState(next);
      setMessage(t("已保存在本次演示页面状态中；未调用真实 API。私密备注不参与分享与导出。", "Saved in this demo page only; no real API was called. Private notes are never shared or exported."));
      setPending(null);
      return;
    }
    try {
      const body: { bookmarked?: boolean; read?: boolean; hidden?: boolean; privateNote?: string } = {};
      if (patch.bookmarked !== undefined) body.bookmarked = patch.bookmarked;
      if (patch.read !== undefined) body.read = patch.read;
      if (patch.hidden !== undefined) body.hidden = patch.hidden;
      if (patch.privateNote !== undefined) body.privateNote = patch.privateNote;
      const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await readApiJson<StateResponse>(response);
      applyState({
        bookmarked: data.state.bookmarked,
        read: data.state.readAt !== null,
        hidden: data.state.hidden,
        privateNote: data.state.privateNote,
      });
      setMessage(t("状态已保存。私密备注不参与分享与导出。", "Saved. Private notes are never shared or exported."));
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="state-controls">
      <div className="state-buttons" aria-label={t("个人事件状态", "Personal event state")}>
        <button className="button button-quiet button-small" type="button" aria-pressed={state.bookmarked} disabled={pending !== null} onClick={() => void save({ bookmarked: !state.bookmarked }, "bookmark")}>
          <Bookmark aria-hidden="true" size={14} fill={state.bookmarked ? "currentColor" : "none"} />{state.bookmarked ? t("已收藏", "Saved") : t("收藏", "Save")}
        </button>
        <button className="button button-quiet button-small" type="button" aria-pressed={state.read} disabled={pending !== null} onClick={() => void save({ read: !state.read }, "read")}>
          <Check aria-hidden="true" size={14} />{state.read ? t("已读", "Read") : t("标为已读", "Mark read")}
        </button>
        <button className="button button-quiet button-small" type="button" aria-pressed={state.hidden} disabled={pending !== null} onClick={() => void save({ hidden: !state.hidden }, "hidden")}>
          {state.hidden ? <Eye aria-hidden="true" size={14} /> : <EyeOff aria-hidden="true" size={14} />}{state.hidden ? t("取消隐藏", "Unhide") : t("隐藏", "Hide")}
        </button>
        {pending ? <LoaderCircle className="spin" aria-label={t("正在保存", "Saving")} size={14} /> : null}
      </div>
      <details className="private-note">
        <summary><StickyNote aria-hidden="true" size={12} /> {t("私密备注", "Private note")}{state.privateNote ? t("（已填写）", " (filled)") : ""}</summary>
        <label className="sr-only" htmlFor={`note-${eventId}`}>{t("仅自己可见的私密备注", "Private note visible only to you")}</label>
        <textarea id={`note-${eventId}`} className="textarea" value={note} maxLength={10000} onChange={(event) => setNote(event.target.value)} placeholder={t("记录个人判断、后续问题或内部上下文……", "Record your judgment, follow-up questions, or internal context…")} />
        <button className="button button-secondary button-small" type="button" disabled={pending !== null} onClick={() => void save({ privateNote: note }, "note")}>{t("保存私密备注", "Save private note")}</button>
        <p className="privacy-caption">{t("仅个人可见；不会包含在分享链接、公开摘要或 Markdown 导出中。", "Visible only to you; excluded from shared links, public summaries, and Markdown exports.")}</p>
      </details>
      {message ? <span className="state-message" role="status">{message}</span> : null}
    </div>
  );
}
