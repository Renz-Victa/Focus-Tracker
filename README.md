# Focus Tracker — Chrome Extension

Track and limit time spent on social media. Built with React, TypeScript, and Vite.

---

## Setup

```bash
npm install
npm run build
```

Then in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

For hot-reload during development:
```bash
npm run dev
```
Then reload the extension in `chrome://extensions` after each rebuild.

---

## Architecture

The extension has **three isolated execution environments** that communicate via message passing:

```
┌─────────────────────────────┐
│   Background Service Worker  │  ← Owns timer, storage writes, alarms
│   src/background/            │    Runs even when popup is closed
└──────────┬──────────────────┘
           │ chrome.runtime.sendMessage
┌──────────▼──────────────────┐
│   Content Script             │  ← Injected into social media pages
│   src/content/tracker.ts     │    Reports visibility state
└─────────────────────────────┘
           │ chrome.storage.sync.onChanged
┌──────────▼──────────────────┐
│   Popup UI (React)           │  ← Reads storage, sends commands
│   src/popup/                 │    Ephemeral — only lives when open
└─────────────────────────────┘
```

### Chrome APIs used

| API | Purpose |
|-----|---------|
| `chrome.storage.sync` | Persist data across devices |
| `chrome.tabs` | Detect active tab switches |
| `chrome.idle` | Pause timer when user is idle |
| `chrome.alarms` | Periodic cleanup, daily reset |
| `chrome.notifications` | Alert when daily limit hit |
| `chrome.declarativeNetRequest` | Block sites during focus mode (network-level) |

---

## File structure

```
src/
├── background/
│   └── service-worker.ts     # Timer logic, alarm handling, blocking
├── content/
│   └── tracker.ts            # Visibility change reporting
├── popup/
│   ├── index.html            # Entry point
│   ├── main.tsx              # React root
│   ├── App.tsx               # Shell, tabs, global styles
│   ├── Dashboard.tsx         # Weekly SVG bar chart + today breakdown
│   ├── FocusMode.tsx         # Block toggle + countdown ring
│   └── Settings.tsx          # Per-platform limits
├── hooks/
│   └── useStorage.ts         # Custom hook wrapping Chrome Storage API
└── types/
    └── index.ts              # All TypeScript interfaces + helpers
```

---

## Interview talking points

- **Three execution environments** with message passing to keep state consistent
- **Custom `useStorage` hook** abstracting Chrome Storage API for clean React components
- **Raw SVG bar chart** — no Chart.js, full control over animation
- **`chrome.idle` API** to pause timer accurately when user walks away
- **`declarativeNetRequest`** for network-level blocking (not JS injection)
- **Chrome Storage Sync** so settings persist across devices
- Set up from scratch with Vite, no boilerplate — configured multiple entry points, manifest handling

---

## Publishing to Chrome Web Store

1. Create a developer account at https://chrome.google.com/webstore/devconsole
2. Run `npm run build`
3. Zip the `dist/` folder
4. Upload the zip in the developer console
5. Fill in store listing details and submit for review

Icons are required: create `public/icons/icon16.png`, `icon48.png`, `icon128.png`.
