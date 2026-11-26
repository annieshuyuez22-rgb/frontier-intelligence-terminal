export interface SystemStatusSnapshot {
  databaseConfigured: boolean;
  databaseReachable: boolean;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  stale: boolean;
  error?: string | null;
}

export type ThemePreference = "light" | "dark" | "system";

export interface EventUserState {
  bookmarked: boolean;
  read: boolean;
  hidden: boolean;
  privateNote: string;
}
