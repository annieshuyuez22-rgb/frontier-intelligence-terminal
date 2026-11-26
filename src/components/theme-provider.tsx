"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import type { ThemePreference } from "./types";
import { useLanguage } from "./language-provider";

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("frontier-theme");
    const initial: ThemePreference = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (next: ThemePreference) => {
      const resolved = next === "system" ? systemTheme() : next;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
      return resolved;
    };
    const resolved = apply(initial);
    const frame = window.requestAnimationFrame(() => {
      setPreference(initial);
      setResolvedTheme(resolved);
    });
    const onChange = () => {
      const current = window.localStorage.getItem("frontier-theme");
      if (current !== "light" && current !== "dark") setResolvedTheme(apply("system"));
    };
    media.addEventListener("change", onChange);
    return () => {
      window.cancelAnimationFrame(frame);
      media.removeEventListener("change", onChange);
    };
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    const resolved = next === "system" ? systemTheme() : next;
    window.localStorage.setItem("frontier-theme", next);
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    setPreference(next);
    setResolvedTheme(resolved);
  }, []);

  const value = useMemo(() => ({ preference, resolvedTheme, setTheme }), [preference, resolvedTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme 必须在 ThemeProvider 内使用");
  return context;
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  const label = next === "dark" ? t("切换到深色模式", "Switch to dark mode") : t("切换到浅色模式", "Switch to light mode");
  return (
    <button className="icon-button" type="button" onClick={() => setTheme(next)} aria-label={label} title={label}>
      {resolvedTheme === "dark" ? <Sun aria-hidden="true" size={17} /> : <Moon aria-hidden="true" size={17} />}
    </button>
  );
}

export function ThemeIcon({ preference }: { preference: ThemePreference }) {
  if (preference === "light") return <Sun aria-hidden="true" size={16} />;
  if (preference === "dark") return <Moon aria-hidden="true" size={16} />;
  return <Monitor aria-hidden="true" size={16} />;
}
