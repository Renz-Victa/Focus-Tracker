import type { PlatformId } from "../types";
import { PLATFORMS, formatMinutes } from "../types";
import type { useStorage } from "../hooks/useStorage";
type S = ReturnType<typeof useStorage>;

const LIMITS = [0, 10, 15, 20, 30, 45, 60, 90, 120];

export default function Settings({ storage }: { storage: S }) {
  return (
    <div>
      <p className="section-label">Per-platform limits</p>
      {PLATFORMS.map(platform => {
        const ps = storage.data.settings[platform.id] ?? { dailyLimitMinutes: 30, enabled: true };
        return (
          <div key={platform.id} className="card" style={{ padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ps.enabled ? 10 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: platform.color }} />
                <span style={{ fontWeight: 500, fontSize: 13 }}>{platform.name}</span>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={ps.enabled}
                  onChange={e => storage.updateSettings(platform.id as PlatformId, { enabled: e.target.checked })} />
                <span className="toggle-slider" />
              </label>
            </div>
            {ps.enabled && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Daily limit</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: ps.dailyLimitMinutes === 0 ? "var(--muted)" : "var(--accent2)" }}>
                    {formatMinutes(ps.dailyLimitMinutes)}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  {LIMITS.map(min => (
                    <button key={min}
                      onClick={() => storage.updateSettings(platform.id as PlatformId, { dailyLimitMinutes: min })}
                      style={{
                        flex: 1, background: ps.dailyLimitMinutes === min ? platform.color : "var(--surface3)",
                        border: `1px solid ${ps.dailyLimitMinutes === min ? platform.color : "var(--border)"}`,
                        color: ps.dailyLimitMinutes === min ? "white" : "var(--muted)",
                        borderRadius: 3, padding: "4px 1px", fontFamily: "var(--font-sans)",
                        fontSize: 9, fontWeight: 500, cursor: "pointer", transition: "all 0.12s",
                      }}>
                      {min === 0 ? "∞" : min >= 60 ? `${min / 60}h` : `${min}m`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      <p style={{ marginTop: 4, fontSize: 10, color: "var(--muted)", lineHeight: 1.6 }}>
        Settings sync across devices via Chrome Storage Sync.
      </p>
    </div>
  );
}