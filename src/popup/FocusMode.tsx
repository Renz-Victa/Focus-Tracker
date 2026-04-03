import { useState, useEffect } from "react";
import type { useStorage } from "../hooks/useStorage";
type S = ReturnType<typeof useStorage>;

const PRESETS = [15, 25, 45, 60, 90, 120];

function fmt(ms: number) {
  if (ms <= 0) return "0:00";
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function FocusMode({ storage }: { storage: S }) {
  const { focusMode } = storage.data;
  const [dur, setDur] = useState(focusMode.durationMinutes || 25);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!focusMode.active || !focusMode.endsAt) { setRemaining(0); return; }
    const tick = () => setRemaining(Math.max(0, focusMode.endsAt! - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [focusMode.active, focusMode.endsAt]);

  const R = 52, C = 2 * Math.PI * R;
  const progress = focusMode.active && focusMode.endsAt ? 1 - remaining / (focusMode.durationMinutes * 60 * 1000) : 0;

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
        <svg width={140} height={140} viewBox="0 0 140 140">
          <circle cx={70} cy={70} r={R} fill="none" stroke="var(--surface3)" strokeWidth={8} />
          {focusMode.active && (
            <circle cx={70} cy={70} r={R} fill="none" stroke="var(--accent)" strokeWidth={8}
              strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
              transform="rotate(-90 70 70)" style={{ transition: "stroke-dashoffset 1s linear" }} />
          )}
          <text x={70} y={65} textAnchor="middle" fill="var(--text)" fontSize={22}
            fontFamily="Instrument Serif" fontStyle="italic">
            {focusMode.active ? fmt(remaining) : `${dur}m`}
          </text>
          <text x={70} y={82} textAnchor="middle" fill="var(--muted)" fontSize={9}
            fontFamily="DM Sans" letterSpacing="0.08em">
            {focusMode.active ? "REMAINING" : "DURATION"}
          </text>
        </svg>
      </div>

      <div style={{ textAlign: "center", marginBottom: 16, fontSize: 11, fontWeight: 500 }}>
        {focusMode.active
          ? <span style={{ color: "var(--accent)" }}>● Focus mode active — all social blocked</span>
          : <span style={{ color: "var(--muted)" }}>○ Inactive</span>}
      </div>

      {!focusMode.active && (
        <div style={{ marginBottom: 16 }}>
          <p className="section-label">Duration</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PRESETS.map(min => (
              <button key={min} onClick={() => setDur(min)} style={{
                background: dur === min ? "var(--accent)" : "var(--surface2)",
                border: `1px solid ${dur === min ? "var(--accent)" : "var(--border)"}`,
                color: dur === min ? "white" : "var(--muted)",
                borderRadius: 5, padding: "5px 10px", fontFamily: "var(--font-sans)",
                fontSize: 11, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
              }}>
                {min >= 60 ? `${min / 60}h` : `${min}m`}
              </button>
            ))}
          </div>
        </div>
      )}

      <button className={`btn ${focusMode.active ? "btn-danger" : "btn-primary"}`}
        style={{ width: "100%", padding: "10px" }}
        onClick={() => storage.toggleFocusMode(dur)}>
        {focusMode.active ? "End Focus Mode" : "Start Focus Mode"}
      </button>

      <div className="card" style={{ marginTop: 12 }}>
        <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
          Focus mode blocks all tracked platforms at the network level using Chrome's declarativeNetRequest API.
        </p>
      </div>
    </div>
  );
}