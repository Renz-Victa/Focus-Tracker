import { PLATFORMS, formatSeconds, todayKey } from "../types";
import type { useStorage } from "../hooks/useStorage";
type S = ReturnType<typeof useStorage>;

function WeeklyBarChart({ weeklyData }: { weeklyData: S["data"]["weeklyData"] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { label: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()], key: d.toISOString().slice(0, 10) };
  });
  const totals = days.map(({ key }) => Object.values(weeklyData[key] ?? {}).reduce((s, v) => s + v, 0));
  const max = Math.max(...totals, 60);
  const today = todayKey();
  const W = 332, H = 80, BW = 32, GAP = (W - 7 * BW) / 8;

  return (
    <div>
      <p className="section-label">Last 7 days</p>
      <svg viewBox={`0 0 ${W} ${H + 24}`} width="100%" style={{ display: "block" }}>
        {days.map((day, i) => {
          const barH = Math.max((totals[i] / max) * H, 2);
          const x = GAP + i * (BW + GAP), y = H - barH;
          const isToday = day.key === today;
          return (
            <g key={day.key}>
              <rect x={x} y={y} width={BW} height={barH} rx={4}
                fill={isToday ? "var(--accent)" : "var(--surface3)"}
                stroke={isToday ? "var(--accent)" : "var(--border)"} strokeWidth={1} />
              {totals[i] > 0 && (
                <text x={x + BW / 2} y={y - 4} textAnchor="middle"
                  fill={isToday ? "var(--accent)" : "var(--muted)"} fontSize={8} fontFamily="DM Sans">
                  {formatSeconds(totals[i])}
                </text>
              )}
              <text x={x + BW / 2} y={H + 16} textAnchor="middle"
                fill={isToday ? "var(--text)" : "var(--muted)"} fontSize={9} fontFamily="DM Sans"
                fontWeight={isToday ? "600" : "400"}>
                {day.label}
              </text>
            </g>
          );
        })}
        <line x1={0} y1={H} x2={W} y2={H} stroke="var(--border)" strokeWidth={1} />
      </svg>
    </div>
  );
}

function TodayBreakdown({ weeklyData, settings }: { weeklyData: S["data"]["weeklyData"]; settings: S["data"]["settings"] }) {
  const today = todayKey();
  const dayData = weeklyData[today] ?? {};
  const rows = PLATFORMS.map(p => ({ platform: p, seconds: dayData[p.id] ?? 0, limitSeconds: (settings[p.id]?.dailyLimitMinutes ?? 0) * 60 }))
    .filter(r => r.seconds > 0).sort((a, b) => b.seconds - a.seconds);
  const total = rows.reduce((s, r) => s + r.seconds, 0);

  if (total === 0) return (
    <div style={{ textAlign: "center", color: "var(--muted)", padding: "20px 0", fontSize: 11 }}>
      No activity yet today.
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <p className="section-label" style={{ marginBottom: 0 }}>Today</p>
        <span style={{ fontSize: 10, fontWeight: 500, color: "var(--accent2)" }}>{formatSeconds(total)} total</span>
      </div>
      {rows.map(({ platform, seconds, limitSeconds }) => {
        const pct = limitSeconds > 0 ? Math.min(seconds / limitSeconds, 1) : 0;
        const over = limitSeconds > 0 && seconds > limitSeconds;
        return (
          <div key={platform.id} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{platform.name}</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: over ? "var(--danger)" : "var(--muted)" }}>
                {formatSeconds(seconds)}{limitSeconds > 0 && <span style={{ color: "var(--muted)" }}> / {formatSeconds(limitSeconds)}</span>}
              </span>
            </div>
            {limitSeconds > 0 && (
              <div style={{ height: 3, background: "var(--surface3)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct * 100}%`, background: over ? "var(--danger)" : platform.color, borderRadius: 2, transition: "width 0.6s ease" }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard({ storage }: { storage: S }) {
  return (
    <div>
      <div className="card"><WeeklyBarChart weeklyData={storage.data.weeklyData} /></div>
      <div className="card"><TodayBreakdown weeklyData={storage.data.weeklyData} settings={storage.data.settings} /></div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase" }}>
          Best streak: {storage.data.streak.best}d
        </span>
        <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={storage.resetToday}>Reset today</button>
      </div>
    </div>
  );
}