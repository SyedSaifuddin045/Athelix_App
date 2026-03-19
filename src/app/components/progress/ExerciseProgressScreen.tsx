import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Trophy } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, Cell,
} from "recharts";

const e1rmData = [
  { date: "Jan W1", e1rm: 108 }, { date: "Jan W2", e1rm: 110 },
  { date: "Jan W3", e1rm: 108 }, { date: "Jan W4", e1rm: 112 },
  { date: "Feb W1", e1rm: 110 }, { date: "Feb W2", e1rm: 114 },
  { date: "Feb W3", e1rm: 113 }, { date: "Feb W4", e1rm: 116 },
  { date: "Mar W1", e1rm: 115 }, { date: "Mar W2", e1rm: 118 },
  { date: "Mar W3", e1rm: 120 }, { date: "Mar W4", e1rm: 122 },
];

const weeklyVol = [
  { week: "W1", vol: 2800, highlight: false },
  { week: "W2", vol: 3100, highlight: false },
  { week: "W3", vol: 2600, highlight: false },
  { week: "W4", vol: 3400, highlight: false },
  { week: "W5", vol: 3200, highlight: false },
  { week: "W6", vol: 3800, highlight: true },
];

const PERIODS = ["1M", "3M", "6M", "1Y", "All"];

const EXERCISE_NAMES: Record<string, { name: string; emoji: string }> = {
  "1": { name: "Bench Press", emoji: "🏋️" },
  "2": { name: "Back Squat", emoji: "🦵" },
  "3": { name: "Deadlift", emoji: "💪" },
};

export function ExerciseProgressScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [period, setPeriod] = useState("3M");

  const ex = EXERCISE_NAMES[id || "1"] || { name: "Bench Press", emoji: "🏋️" };

  const currentE1rm = e1rmData.at(-1)?.e1rm || 0;
  const startE1rm = e1rmData[0]?.e1rm || 0;
  const gain = currentE1rm - startE1rm;

  return (
    <div className="min-h-full pb-8"
      style={{ background: "linear-gradient(180deg, #0a1218 0%, #080e0e 30%, #080e0e 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-44 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,180,140,0.12) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative flex items-center gap-3 px-5 pt-13 pb-4">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <ArrowLeft size={16} color="white" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{ex.emoji}</span>
          <div>
            <h1 className="text-white text-[17px] font-bold">{ex.name}</h1>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>Exercise Progress</p>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="px-5 mb-4">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Current e1RM", value: `${currentE1rm} kg`, color: "#00d4a8" },
            { label: "Gain (3M)", value: `+${gain} kg`, color: "#22c55e" },
            { label: "All-time PR", value: `${currentE1rm} kg`, color: "#fbbf24" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3.5 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[17px] font-extrabold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* e1RM Chart */}
      <div className="px-4 mb-4">
        <div className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-white text-[13px] font-semibold">e1RM History</p>
            <div className="flex gap-1">
              {PERIODS.map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                  style={{
                    background: period === p ? "rgba(0,212,168,0.2)" : "transparent",
                    color: period === p ? "#00d4a8" : "rgba(255,255,255,0.35)",
                    border: period === p ? "1px solid rgba(0,212,168,0.35)" : "1px solid transparent",
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={e1rmData}>
                <defs>
                  <linearGradient id="e1rmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4a8" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#00d4a8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false}
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 8, fontFamily: "Inter" }}
                  interval={2} />
                <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
                <Tooltip contentStyle={{
                  background: "#111", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px", fontSize: "11px", color: "white",
                }} formatter={(v: number) => [`${v} kg`, "e1RM"]} />
                <Area type="monotone" dataKey="e1rm" stroke="#00d4a8" strokeWidth={2.5}
                  fill="url(#e1rmGrad)" dot={false}
                  activeDot={{ r: 5, fill: "#00d4a8", stroke: "none" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly Volume */}
      <div className="px-4 mb-4">
        <div className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-white text-[13px] font-semibold mb-3">Weekly Volume</p>
          <div style={{ height: 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyVol} barCategoryGap="30%">
                <XAxis dataKey="week" axisLine={false} tickLine={false}
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "Inter" }} />
                <Bar dataKey="vol" radius={[4, 4, 4, 4]}>
                  {weeklyVol.map((e, i) => (
                    <Cell key={i} fill={e.highlight ? "#00d4a8" : "rgba(255,255,255,0.18)"}
                      style={e.highlight ? { filter: "drop-shadow(0 0 5px rgba(0,212,168,0.6))" } : {}} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Overloads */}
      <div className="px-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
          Recent Overloads
        </p>
        <div className="flex flex-col gap-2">
          {[
            { date: "Mar 15", change: "+5 kg", type: "Weight increase", session: "Upper Body Push" },
            { date: "Mar 8", change: "+1 rep", type: "Volume increase", session: "Upper Body Push" },
            { date: "Mar 1", change: "+2.5 kg", type: "Weight increase", session: "Upper Body Push" },
          ].map((o, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(34,197,94,0.15)" }}>
                <Trophy size={13} color="#22c55e" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold" style={{ color: "#22c55e" }}>{o.change}</span>
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>· {o.type}</span>
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{o.date} · {o.session}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
