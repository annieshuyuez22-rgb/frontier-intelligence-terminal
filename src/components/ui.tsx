import Link from "next/link";
import type { ReactNode } from "react";
import { AlertCircle, ArrowRight, Database, Inbox, Info } from "lucide-react";
import type { DataMode, UILanguage } from "@/lib/domain";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function DemoNotice({ compact = false, language = "zh" }: { compact?: boolean; language?: UILanguage }) {
  return (
    <div className={compact ? "demo-notice demo-notice-compact" : "demo-notice"} role="note">
      <Database aria-hidden="true" size={16} />
      <span><strong>{language === "en" ? "Demo data" : "演示数据"}</strong>{compact ? (language === "en" ? " · Not live facts" : " · 非实时事实") : (language === "en" ? " · Preview content only; not live facts. Demo actions never trigger collection, charges, or external delivery." : " · 当前内容仅用于产品预览，不代表实时事实；演示操作不会触发采集、收费或外部发送。")}</span>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div className="page-heading-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
        {meta ? <div className="page-meta">{meta}</div> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function Section({
  title,
  description,
  action,
  children,
  id,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="section" id={id} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="section-heading">
        <div>
          <h2 id={id ? `${id}-title` : undefined}>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div className="section-action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function StatCard({ label, value, note, tone = "default" }: { label: string; value: ReactNode; note: string; tone?: string }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <p>{label}</p>
      <strong className="stat-value">{value}</strong>
      <span>{note}</span>
    </article>
  );
}

export function EmptyState({ title = "暂无记录", description, action }: { title?: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state" role="status">
      <Inbox aria-hidden="true" size={24} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title = "数据暂时不可用", description, action }: { title?: string; description: string; action?: ReactNode }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle aria-hidden="true" size={24} />
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
        {action ? <div className="state-action">{action}</div> : null}
      </div>
    </div>
  );
}

export function InlineNotice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warning" | "danger" }) {
  return (
    <div className={`inline-notice notice-${tone}`} role={tone === "danger" ? "alert" : "note"}>
      {tone === "info" ? <Info aria-hidden="true" size={17} /> : <AlertCircle aria-hidden="true" size={17} />}
      <div>{children}</div>
    </div>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link className="text-link" href={href}>{children}<ArrowRight aria-hidden="true" size={14} /></Link>;
}

export function LoadingSkeleton({ rows = 5, language = "zh" }: { rows?: number; language?: UILanguage }) {
  return (
    <div className="page-shell" aria-busy="true" aria-label={language === "en" ? "Loading intelligence" : "正在加载情报"}>
      <div className="skeleton skeleton-heading" />
      <div className="skeleton skeleton-copy" />
      <div className="stats-grid">
        {Array.from({ length: 4 }, (_, index) => <div className="skeleton skeleton-stat" key={index} />)}
      </div>
      <div className="skeleton-list">
        {Array.from({ length: rows }, (_, index) => <div className="skeleton skeleton-row" key={index} />)}
      </div>
      <span className="sr-only">{language === "en" ? "Loading, please wait" : "正在加载，请稍候"}</span>
    </div>
  );
}

export function DataModeLabel({ mode }: { mode: DataMode }) {
  return mode === "demo" ? <Badge tone="warning">演示数据</Badge> : <Badge tone="success">实时数据</Badge>;
}
