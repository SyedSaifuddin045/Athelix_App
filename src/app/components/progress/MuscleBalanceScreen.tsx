import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";

const muscleData = [
  { muscle: "Chest", sets: 18, target: 16, color: "#00d4a8" },
  { muscle: "Back", sets: 22, target: 20, color: "#22c55e" },
  { muscle: "Shoulders", sets: 14, target: 16, color: "#f59e0b" },
  { muscle: "Quadriceps", sets: 16, target: 16, color: "#00d4a8" },
  { muscle: "Hamstrings", sets: 10, target: 12, color: "#ef4444" },
  { muscle: "Glutes", sets: 8, target: 12, color: "#ef4444" },
  { muscle: "Biceps", sets: 9, target: 10, color: "#f59e0b" },
  { muscle: "Triceps", sets: 12, target: 10, color: "#22c55e" },
  { muscle: "Core", sets: 6, target: 8, color: "#f59e0b" },
  { muscle: "Calves", sets: 4, target: 8, color: "#ef4444" },
];

const PERIODS = ["1W", "2W", "4W", "8W"];

const getStatus = (sets: number, target: number) => {
  const ratio = sets / target;
  if (ratio >= 1.1) return { label: "Over", color: "#22c55e" };
  if (ratio >= 0.85) return { label: "On track", color: "#00d4a8" };
  if (ratio >= 0.6) return { label: "Under", color: "#f59e0b" };
  return { label: "Low", color: "#ef4444" };
};

export function MuscleBalanceScreen() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("1W");

  const underTargets = muscleData.filter(m => m.sets < m.target);

  return (
    <div className="min-h-full pb-8"
      style={{ background: "linear-gradient(180deg, #0d0a1c 0%, #080e0e 30%, #080e0e 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-44 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,92,246,0.15) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pt-13 pb-4">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <ArrowLeft size={16} color="white" />
        </button>
        <p className="text-white text-[15px] font-bold">Muscle Balance</p>
        <button className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <Info size={15} color="rgba(255,255,255,0.6)" />
        </button>
      </div>

      {/* Period selector */}
      <div className="px-5 mb-4">
        <div className="flex rounded-2xl p-1"
          style={{ background: "rgba(255,255,255,0.05)" }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all"
              style={{
                background: period === p ? "rgba(139,92,246,0.25)" : "transparent",
                color: period === p ? "#a78bfa" : "rgba(255,255,255,0.4)",
                border: period === p ? "1px solid rgba(139,92,246,0.35)" : "1px solid transparent",
              }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 mb-4">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "On Track", value: muscleData.filter(m => m.sets >= m.target * 0.85).length.toString(), color: "#00d4a8" },
            { label: "Under Target", value: underTargets.length.toString(), color: "#f59e0b" },
            { label: "Over Target", value: muscleData.filter(m => m.sets > m.target * 1.1).length.toString(), color: "#22c55e" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[20px] font-extrabold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="px-4 mb-4">
        <div className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-white text-[13px] font-semibold">Sets by Muscle Group</p>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: "#00d4a8" }} />
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>Actual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: "rgba(255,255,255,0.15)" }} />
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>Target</span>
            </div>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={muscleData}
                layout="vertical"
                barCategoryGap="20%"
                barSize={8}
              >
                <XAxis type="number" axisLine={false} tickLine={false}
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontFamily: "Inter" }} />
                <YAxis type="category" dataKey="muscle" axisLine={false} tickLine={false} width={70}
                  tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 10, fontFamily: "Inter" }} />
                <Tooltip contentStyle={{
                  background: "#111", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px", fontSize: "11px", color: "white",
                }} />
                <Bar dataKey="target" radius={[0, 4, 4, 0]} fill="rgba(255,255,255,0.1)" />
                <Bar dataKey="sets" radius={[0, 4, 4, 0]}>
                  {muscleData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detail List */}
      <div className="px-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
          Breakdown
        </p>
        <div className="flex flex-col gap-2">
          {muscleData.map(m => {
            const st = getStatus(m.sets, m.target);
            const pct = Math.min(100, (m.sets / m.target) * 100);
            return (
              <div key={m.muscle} className="rounded-2xl p-3.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white text-[13px] font-semibold">{m.muscle}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {m.sets}/{m.target} sets
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${st.color}18`, color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: m.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
