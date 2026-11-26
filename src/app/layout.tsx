import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { LanguageProvider } from "@/components/language-provider";
import { getLanguage } from "@/components/language-server";
import { ThemeProvider } from "@/components/theme-provider";
import type { SystemStatusSnapshot } from "@/components/types";
import { LoadingSkeleton } from "@/components/ui";
import { getDataMode, getSystemStatus } from "@/lib/view-data";
import "./globals.css";

export const instant = false;

export const metadata: Metadata = {
  title: {
    default: "Frontier Intelligence · 全球前沿科技与资本情报",
    template: "%s · Frontier Intelligence",
  },
  description: "以独立来源、证据边界与可执行研究连接全球前沿科技、资本与产业信号。",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#111a19" },
  ],
};

async function RuntimeShell({ children }: { children: ReactNode }) {
  const mode = await getDataMode();
  let status: SystemStatusSnapshot;
  try {
    status = await getSystemStatus(mode);
  } catch (error) {
    status = {
      databaseConfigured: false,
      databaseReachable: false,
      lastSuccessAt: null,
      lastAttemptAt: null,
      stale: true,
      error: error instanceof Error ? error.message : "Status check failed",
    };
  }
  return <AppShell mode={mode} status={status}>{children}</AppShell>;
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const language = await getLanguage();
  return (
    <html lang={language === "en" ? "en" : "zh-CN"} suppressHydrationWarning>
      <body>
        <LanguageProvider key={language} initialLanguage={language}>
          <ThemeProvider>
            <Suspense fallback={<div className="initial-loading"><LoadingSkeleton rows={4} language={language} /></div>}>
              <RuntimeShell>{children}</RuntimeShell>
            </Suspense>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
