import type { ExtensionMessage, StorageSchema, PlatformId, WeeklyData } from "../types";
import { PLATFORMS, DEFAULT_STORAGE, todayKey } from "../types";

let activeTabId: number | null = null;
let activePlatformId: PlatformId | null = null;
let tickInterval: ReturnType<typeof setInterval> | null = null;

async function getStorage(): Promise<StorageSchema> {
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

async function patchStorage(patch: Partial<StorageSchema>): Promise<void> {
  return new Promise((resolve) => chrome.storage.sync.set(patch, resolve));
}

function detectPlatform(url: string): PlatformId | null {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    for (const p of PLATFORMS) {
      if (p.domains.some(d => hostname === d || hostname.endsWith(`.${d}`))) return p.id;
    }
  } catch { /* invalid url */ }
  return null;
}

function stopTicking() {
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
  activePlatformId = null;
}

async function startTicking(platformId: PlatformId) {
  stopTicking();
  activePlatformId = platformId;
  tickInterval = setInterval(async () => {
    const storage = await getStorage();
    const today = todayKey();
    if (storage.focusMode.active && storage.focusMode.endsAt && Date.now() >= storage.focusMode.endsAt) {
      await patchStorage({ focusMode: { active: false, endsAt: null, durationMinutes: storage.focusMode.durationMinutes } });
      await updateBlockingRules(false);
      return;
    }
    const weeklyData: WeeklyData = { ...storage.weeklyData };
    if (!weeklyData[today]) weeklyData[today] = {};
    const secs = (weeklyData[today][platformId] ?? 0) + 1;
    weeklyData[today][platformId] = secs;
    await patchStorage({ weeklyData });
    const settings = storage.settings[platformId];
    if (settings?.dailyLimitMinutes > 0) {
      const limit = settings.dailyLimitMinutes * 60;
      const notified = storage.notifiedToday ?? {};
      if (secs >= limit && !notified[platformId]) {
        notified[platformId] = true;
        await patchStorage({ notifiedToday: notified });
        const p = PLATFORMS.find(x => x.id === platformId);
        if (p) chrome.notifications.create(`limit-${platformId}`, {
          type: "basic", iconUrl: "../icons/icon128.png",
          title: `Time limit reached — ${p.name}`,
          message: `You've spent ${settings.dailyLimitMinutes} minutes on ${p.name} today.`,
          priority: 1,
        });
      }
    }
  }, 1000);
}

async function updateBlockingRules(active: boolean) {
  if (active) await chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: ["block_rules"] });
  else await chrome.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: ["block_rules"] });
}

async function handleTabChange(tabId: number | null, url?: string) {
  const storage = await getStorage();
  if (storage.focusMode.active || !url || !tabId) { stopTicking(); return; }
  const platform = detectPlatform(url);
  if (platform && storage.settings[platform]?.enabled) {
    if (platform !== activePlatformId || tabId !== activeTabId) {
      activeTabId = tabId;
      await startTicking(platform);
    }
  } else stopTicking();
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  await handleTabChange(tabId, tab.url);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id === tabId) await handleTabChange(tabId, tab.url);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) { stopTicking(); return; }
  const [tab] = await chrome.tabs.query({ active: true, windowId });
  if (tab?.id) await handleTabChange(tab.id, tab.url);
});

chrome.idle.onStateChanged.addListener((state) => {
  if (state === "idle" || state === "locked") stopTicking();
  else chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
    if (tab?.id) await handleTabChange(tab.id, tab.url);
  });
});

chrome.idle.setDetectionInterval(60);

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  (async () => {
    if (message.type === "GET_STATE") {
      const data = await getStorage();
      sendResponse({ type: "STATE_RESPONSE", data });
    } else if (message.type === "FOCUS_MODE_TOGGLE") {
      const storage = await getStorage();
      const willBeActive = !storage.focusMode.active;
      await updateBlockingRules(willBeActive);
      if (willBeActive) stopTicking();
      else {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) await handleTabChange(tab.id, tab.url);
      }
    } else if (message.type === "RESET_TODAY") {
      const storage = await getStorage();
      const today = todayKey();
      const weeklyData = { ...storage.weeklyData };
      if (weeklyData[today]) { weeklyData[today] = {}; await patchStorage({ weeklyData, notifiedToday: {} as Record<PlatformId, boolean> }); }
    }
  })();
  return true;
});

chrome.alarms.create("daily-reset", { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "daily-reset") {
    const storage = await getStorage();
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 8);
    const weeklyData = { ...storage.weeklyData };
    for (const key of Object.keys(weeklyData)) { if (new Date(key) < cutoff) delete weeklyData[key]; }
    await patchStorage({ weeklyData });
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await getStorage();
  const patch: Partial<StorageSchema> = {};
  if (!existing.settings || Object.keys(existing.settings).length === 0) patch.settings = DEFAULT_STORAGE.settings;
  if (!existing.streak?.lastCheckedDate) patch.streak = DEFAULT_STORAGE.streak;
  if (Object.keys(patch).length) await patchStorage(patch);
});

export { };