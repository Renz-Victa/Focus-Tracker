import { useState, useEffect, useCallback } from "react";
import type { StorageSchema, PlatformId, PlatformSettings, FocusModeState } from "../types";
import { DEFAULT_STORAGE } from "../types";

async function readStorage(): Promise<StorageSchema> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, (raw) => {
      resolve({
        weeklyData: raw["weeklyData"] ?? DEFAULT_STORAGE.weeklyData,
        settings: raw["settings"] ?? DEFAULT_STORAGE.settings,
        focusMode: raw["focusMode"] ?? DEFAULT_STORAGE.focusMode,
        streak: raw["streak"] ?? DEFAULT_STORAGE.streak,
        notifiedToday: raw["notifiedToday"] ?? DEFAULT_STORAGE.notifiedToday,
      });
    });
  });
}

async function writeStorage(patch: Partial<StorageSchema>): Promise<void> {
  return new Promise((resolve) => { chrome.storage.sync.set(patch, resolve); });
}

export function useStorage() {
  const [data, setData] = useState<StorageSchema>(DEFAULT_STORAGE);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const fresh = await readStorage();
    setData(fresh); setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      setData((prev) => {
        const updated = { ...prev };
        for (const key of Object.keys(changes) as (keyof StorageSchema)[]) {
          (updated as Record<string, unknown>)[key] = changes[key].newValue;
        }
        return updated;
      });
    };
    chrome.storage.sync.onChanged.addListener(listener);
    return () => chrome.storage.sync.onChanged.removeListener(listener);
  }, [refresh]);

  const updateSettings = useCallback(async (platformId: PlatformId, patch: Partial<PlatformSettings>) => {
    const updated = { ...data.settings, [platformId]: { ...data.settings[platformId], ...patch } };
    await writeStorage({ settings: updated });
    setData(prev => ({ ...prev, settings: updated }));
  }, [data.settings]);

  const toggleFocusMode = useCallback(async (durationMinutes: number) => {
    const next: FocusModeState = data.focusMode.active
      ? { active: false, endsAt: null, durationMinutes }
      : { active: true, endsAt: Date.now() + durationMinutes * 60 * 1000, durationMinutes };
    await writeStorage({ focusMode: next });
    setData(prev => ({ ...prev, focusMode: next }));
    chrome.runtime.sendMessage({ type: "FOCUS_MODE_TOGGLE", durationMinutes });
  }, [data.focusMode]);

  const resetToday = useCallback(async () => {
    chrome.runtime.sendMessage({ type: "RESET_TODAY" });
    await refresh();
  }, [refresh]);

  return { data, loading, refresh, updateSettings, toggleFocusMode, resetToday };
}