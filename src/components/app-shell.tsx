"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  Archive,
  BookOpenText,
  CircleUserRound,
  Landmark,
  Megaphone,
  Menu,
  MessagesSquare,
  Newspaper,
  Radar,
  Settings,
  Telescope,
  X,
} from "lucide-react";
import type { DataMode } from "@/lib/domain";
import { formatDateTime } from "./format";
import { LanguageToggle, useLanguage } from "./language-provider";
import { ModeSwitch } from "./mode-switch";
import { ThemeToggle } from "./theme-provider";
import type { SystemStatusSnapshot } from "./types";
import { DemoNotice } from "./ui";

const navigation = [
  { href: "/brief", zh: "今日简报", en: "Today’s brief", icon: Newspaper },
  { href: "/events", zh: "全量事件流", en: "Event stream", icon: BookOpenText },
  { href: "/funding", zh: "大额融资", en: "Large funding", icon: Landmark },
  { href: "/frontier", zh: "前沿行业", en: "Frontier", icon: Telescope },
  { href: "/narratives", zh: "新叙事", en: "Narratives", icon: MessagesSquare },
  { href: "/marketing", zh: "数字营销", en: "Marketing", icon: Megaphone },
  { href: "/archive", zh: "历史日报", en: "Archive", icon: Archive },
];

const secondaryNavigation = [
  { href: "/jobs", zh: "采集与任务", en: "Collection & jobs", icon: Activity },
  { href: "/settings", zh: "偏好与渠道", en: "Preferences & sources", icon: Settings },
];

function StatusSummary({ status, mode }: { status: SystemStatusSnapshot; mode: DataMode }) {
  const { language, t } = useLanguage();
  if (mode === "demo") {
    return <span className="system-status status-warning"><span aria-hidden="true">◆</span>{t("演示快照", "Demo snapshot")} · {formatDateTime(status.lastSuccessAt, undefined, language)}</span>;
  }
  if (!status.databaseConfigured) {
    return <Link href="/setup" className="system-status status-warning"><span aria-hidden="true">△</span>{t("数据库未配置 · 前往设置", "Database not configured · Set up")}</Link>;
  }
  if (!status.databaseReachable || status.error) {
    return <span className="system-status status-danger"><span aria-hidden="true">!</span>{t("状态异常 · 最近成功", "Status error · Last success")} {formatDateTime(status.lastSuccessAt, undefined, language)}</span>;
  }
  return (
    <span className={`system-status ${status.stale ? "status-warning" : "status-success"}`} title={`${t("最近尝试", "Last attempt")}: ${formatDateTime(status.lastAttemptAt, undefined, language)}`}>
      <span aria-hidden="true">{status.stale ? "△" : "●"}</span>
      {status.stale ? t("数据可能过期", "Data may be stale") : t("最后成功", "Last success")} · {formatDateTime(status.lastSuccessAt, undefined, language)}
    </span>
  );
}

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const renderLink = (item: typeof navigation[number]) => {
    const active = pathname === item.href || (item.href !== "/brief" && pathname.startsWith(`${item.href}/`));
    const Icon = item.icon;
    return (
      <Link key={item.href} href={item.href} className={active ? "nav-link nav-link-active" : "nav-link"} aria-current={active ? "page" : undefined} onClick={onNavigate}>
        <Icon aria-hidden="true" size={17} strokeWidth={1.6} />
        <span>{t(item.zh, item.en)}</span>
        {active ? <span className="nav-active-mark" aria-hidden="true" /> : null}
      </Link>
    );
  };
  return (
    <>
      <nav className="primary-nav" aria-label={t("主要导航", "Primary navigation")}>
        <p className="nav-section-label">{t("Research / 研究", "Research / Intelligence")}</p>
        {navigation.map(renderLink)}
      </nav>
      <nav className="secondary-nav" aria-label={t("系统导航", "System navigation")}>
        <p className="nav-section-label">{t("Operations / 运行", "Operations / System")}</p>
        {secondaryNavigation.map(renderLink)}
      </nav>
    </>
  );
}

export function AppShell({ children, mode, status }: { children: ReactNode; mode: DataMode; status: SystemStatusSnapshot }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, t } = useLanguage();

  useEffect(() => {
    if (!mobileOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [mobileOpen]);

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">{t("跳到主要内容", "Skip to main content")}</a>
      <aside className="sidebar" aria-label={t("应用侧栏", "Application sidebar")}>
        <Link className="brand" href="/brief" aria-label={`Frontier Intelligence ${t("今日简报", "Today’s brief")}`}>
          <span className="brand-mark"><Radar aria-hidden="true" size={23} strokeWidth={1.5} /></span>
          <span><strong>FRONTIER</strong><small>{t("INTELLIGENCE / 前沿情报", "INTELLIGENCE / RESEARCH")}</small></span>
        </Link>
        <div className="sidebar-edition"><span>GLOBAL EDITION</span><span>VOL. 01</span></div>
        <NavigationLinks />
        <div className="sidebar-footer">
          <p>{t("独立来源 · 证据边界 · 可执行研究", "Independent sources · Evidence limits · Actionable research")}</p>
          <Link href="/login" className="account-link"><CircleUserRound aria-hidden="true" size={16} />{t("账户与登录", "Account & sign in")}</Link>
        </div>
      </aside>

      {mobileOpen ? <button className="nav-scrim" type="button" aria-label={t("关闭导航", "Close navigation")} onClick={() => setMobileOpen(false)} /> : null}
      <aside className={mobileOpen ? "mobile-sidebar mobile-sidebar-open" : "mobile-sidebar"} aria-label={t("移动导航", "Mobile navigation")} aria-hidden={!mobileOpen}>
        <div className="mobile-sidebar-heading">
          <span className="brand"><Radar aria-hidden="true" size={22} /><strong>FRONTIER</strong></span>
          <button type="button" className="icon-button" aria-label={t("关闭导航", "Close navigation")} onClick={() => setMobileOpen(false)}><X aria-hidden="true" size={20} /></button>
        </div>
        <NavigationLinks onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="main-column">
        {mode === "demo" ? <div className="global-demo-bar"><DemoNotice compact language={language} /></div> : null}
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu-button" type="button" aria-label={t("打开导航", "Open navigation")} aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu aria-hidden="true" size={20} /></button>
            <StatusSummary status={status} mode={mode} />
          </div>
          <div className="topbar-actions">
            <LanguageToggle />
            <ModeSwitch mode={mode} />
            <span className="topbar-divider" aria-hidden="true" />
            <ThemeToggle />
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>{children}</main>
        <footer className="app-footer">
          <span>FRONTIER INTELLIGENCE</span>
          <p>{t("采集增长不等于市场热度。所有判断均需回到原始来源与证据边界。", "Collection growth is not market momentum. Every judgment must return to primary sources and evidence limits.")}</p>
          <span>RESEARCH TERMINAL · 2026</span>
        </footer>
      </div>
    </div>
  );
}
