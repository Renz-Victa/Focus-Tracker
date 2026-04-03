import { useState } from "react";
import { useStorage } from "../hooks/useStorage";
import Dashboard from "./Dashboard.tsx";
import FocusMode from "./FocusMode.tsx";
import Settings from "./Settings.tsx";

type Tab = "dashboard" | "focus" | "settings";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const storage = useStorage();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #f4f1eb; --surface: #ede9e1; --surface2: #e5e0d5; --surface3: #d8d2c5;
          --border: #ccc6b8; --text: #1a1916; --muted: #8a8474; --accent: #2d5a3d;
          --accent2: #b5651d; --danger: #a83232; --success: #2d5a3d;
          --font-serif: 'Instrument Serif', Georgia, serif;
          --font-sans: 'DM Sans', sans-serif; --r: 6px;
        }
        body { width: 380px; min-height: 480px; background: var(--bg); color: var(--text); font-family: var(--font-sans); font-size: 13px; line-height: 1.5; overflow-x: hidden; }
        .app { display: flex; flex-direction: column; min-height: 480px; }
        .header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px 13px; border-bottom: 1px solid var(--border); background: var(--bg); }
        .logo { display: flex; align-items: center; gap: 8px; }
        .logo-icon { width: 24px; height: 24px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #fff; }
        .logo-text { font-family: var(--font-serif); font-size: 16px; font-style: italic; color: var(--text); }
        .streak-badge { display: flex; align-items: center; gap: 5px; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 3px 10px; font-size: 10px; font-weight: 500; color: var(--accent2); }
        .tabs { display: flex; padding: 10px 18px; border-bottom: 1px solid var(--border); gap: 4px; background: var(--bg); }
        .tab { flex: 1; background: none; border: 1px solid transparent; color: var(--muted); font-family: var(--font-sans); font-size: 11px; font-weight: 500; padding: 5px 4px; cursor: pointer; border-radius: var(--r); transition: all 0.15s; }
        .tab:hover { color: var(--text); background: var(--surface); }
        .tab.active { background: var(--surface); border-color: var(--border); color: var(--text); }
        .content { flex: 1; overflow-y: auto; padding: 16px 18px; background: var(--bg); }
        .content::-webkit-scrollbar { width: 4px; }
        .content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
        .section-label { font-size: 9px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 14px; margin-bottom: 10px; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 16px; border-radius: var(--r); font-family: var(--font-sans); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; }
        .btn-primary { background: var(--accent); color: white; border-color: var(--accent); }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-ghost { background: var(--surface); border-color: var(--border); color: var(--text); }
        .btn-ghost:hover { background: var(--surface2); }
        .btn-danger { background: transparent; border-color: var(--danger); color: var(--danger); }
        .btn-danger:hover { background: var(--danger); color: white; }
        .toggle { position: relative; width: 32px; height: 18px; cursor: pointer; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; inset: 0; background: var(--surface3); border-radius: 18px; transition: 0.2s; border: 1px solid var(--border); }
        .toggle-slider::before { content: ''; position: absolute; width: 12px; height: 12px; left: 2px; bottom: 2px; background: var(--muted); border-radius: 50%; transition: 0.2s; }
        .toggle input:checked + .toggle-slider { background: var(--accent); border-color: var(--accent); }
        .toggle input:checked + .toggle-slider::before { transform: translateX(14px); background: white; }
      `}</style>
      <div className="app">
        <header className="header">
          <div className="logo">
            <div className="logo-icon">⏱</div>
            <span className="logo-text">Focus Tracker</span>
          </div>
          {!storage.loading && (
            <div className="streak-badge">🔥 {storage.data.streak.current}d streak</div>
          )}
        </header>
        <nav className="tabs">
          {(["dashboard", "focus", "settings"] as Tab[]).map((tab) => (
            <button key={tab} className={`tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </nav>
        <div className="content">
          {storage.loading ? (
            <div style={{ textAlign: "center", color: "var(--muted)", marginTop: 40 }}>Loading...</div>
          ) : (
            <>
              {activeTab === "dashboard" && <Dashboard storage={storage} />}
              {activeTab === "focus" && <FocusMode storage={storage} />}
              {activeTab === "settings" && <Settings storage={storage} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}