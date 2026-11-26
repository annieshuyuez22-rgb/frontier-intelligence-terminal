"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Languages, LoaderCircle } from "lucide-react";
import type { UILanguage } from "@/lib/domain";

interface LanguageContextValue {
  language: UILanguage;
  setLanguage: (language: UILanguage) => void;
  t: (zh: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ initialLanguage, children }: { initialLanguage: UILanguage; children: ReactNode }) {
  const router = useRouter();
  const [language, setLanguageState] = useState<UILanguage>(initialLanguage);
  const [pending, startTransition] = useTransition();

  const setLanguage = useCallback((next: UILanguage) => {
    setLanguageState(next);
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `fi_language=${next}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    startTransition(() => router.refresh());
  }, [router]);

  const t = useCallback((zh: string, en: string) => language === "en" ? en : zh, [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}<span className="sr-only" role="status">{pending ? "Refreshing language" : ""}</span></LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className="segmented-control language-toggle" aria-label={t("界面语言", "Interface language")}>
      <Languages aria-hidden="true" size={13} />
      {(["zh", "en"] as const).map((item) => (
        <button key={item} type="button" aria-pressed={language === item} onClick={() => setLanguage(item)} aria-label={item === "zh" ? t("切换为中文", "Switch to Chinese") : t("切换为英文", "Switch to English")}>
          {item === "zh" ? "中" : "EN"}
        </button>
      ))}
    </div>
  );
}

export function LanguagePendingIcon({ pending }: { pending: boolean }) {
  return pending ? <LoaderCircle className="spin" aria-hidden="true" size={13} /> : null;
}
