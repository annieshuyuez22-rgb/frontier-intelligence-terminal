import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import type { UILanguage } from "@/lib/domain";
import { getCurrentUser } from "@/lib/auth";
import { getDataMode, getPreferences } from "@/lib/view-data";

async function readLanguage(): Promise<UILanguage> {
  const store = await cookies();
  const cookieLanguage = store.get("fi_language")?.value;
  if (cookieLanguage === "en" || cookieLanguage === "zh") return cookieLanguage;
  const mode = await getDataMode();
  if (mode === "live") {
    try {
      const user = await getCurrentUser();
      if (user) return (await getPreferences(user.id, "live")).language;
    } catch {
      return "zh";
    }
  }
  return "zh";
}

export const getLanguage = cache(readLanguage);
