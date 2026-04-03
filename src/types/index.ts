export type PlatformId =
  | "twitter" | "instagram" | "tiktok"
  | "linkedin" | "reddit" | "facebook" | "youtube";

export interface Platform {
  id: PlatformId; name: string; domains: string[]; color: string; accent: string;
}

export const PLATFORMS: Platform[] = [
  { id: "twitter", name: "Twitter / X", domains: ["twitter.com", "x.com"], color: "#1DA1F2", accent: "#0d8bd9" },
  { id: "instagram", name: "Instagram", domains: ["instagram.com"], color: "#E1306C", accent: "#c62a60" },
  { id: "tiktok", name: "TikTok", domains: ["tiktok.com"], color: "#FF0050", accent: "#cc0040" },
  { id: "linkedin", name: "LinkedIn", domains: ["linkedin.com"], color: "#0A66C2", accent: "#0855a0" },
  { id: "reddit", name: "Reddit", domains: ["reddit.com"], color: "#FF4500", accent: "#cc3700" },
  { id: "facebook", name: "Facebook", domains: ["facebook.com"], color: "#1877F2", accent: "#1260cc" },
  { id: "youtube", name: "YouTube", domains: ["youtube.com"], color: "#FF0000", accent: "#cc0000" },
];

export type DailyLog = Record<string, number>;
export type WeeklyData = Record<string, DailyLog>;

export interface PlatformSettings { dailyLimitMinutes: number; enabled: boolean; }
export interface FocusModeState { active: boolean; endsAt: number | null; durationMinutes: number; }
export interface StreakData { current: number; best: number; lastCheckedDate: string; }

export interface StorageSchema {
  weeklyData: WeeklyData;
  settings: Record<PlatformId, PlatformSettings>;
  focusMode: FocusModeState;
  streak: StreakData;
  notifiedToday: Record<PlatformId, boolean>;
}

export type ExtensionMessage =
  | { type: "TICK"; platformId: PlatformId; seconds: number }
  | { type: "GET_STATE" }
  | { type: "STATE_RESPONSE"; data: StorageSchema }
  | { type: "FOCUS_MODE_TOGGLE"; durationMinutes: number }
  | { type: "RESET_TODAY" };

export function todayKey(): string { return new Date().toISOString().slice(0, 10); }
export function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60), h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}
export function formatMinutes(m: number): string {
  if (m === 0) return "∞";
  return m < 60 ? `${m}m` : m % 60 === 0 ? `${m / 60}h` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export const DEFAULT_SETTINGS = Object.fromEntries(
  PLATFORMS.map(p => [p.id, { dailyLimitMinutes: 30, enabled: true }])
) as Record<PlatformId, PlatformSettings>;

export const DEFAULT_STORAGE: StorageSchema = {
  weeklyData: {}, settings: DEFAULT_SETTINGS,
  focusMode: { active: false, endsAt: null, durationMinutes: 25 },
  streak: { current: 0, best: 0, lastCheckedDate: "" },
  notifiedToday: {} as Record<PlatformId, boolean>,
};