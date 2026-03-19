import { useNavigate, useParams } from "react-router";
import { ArrowLeft, TrendingUp, BarChart2, Calendar, Dumbbell, ChevronRight, Lock } from "lucide-react";
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from "recharts";

const volumeData = [
  { week: "W1", vol: 18200 }, { week: "W2", vol: 21400 },
  { week: "W3", vol: 24200 }, { week: "W4", vol: 0 },
  { week: "W5", vol: 0 }, { week: "W6", vol: 0 },
];

const LINKED_SESSIONS = [
  { id: "1", name: "Upper Body Push", date: "Today", sets: 18, vol: "8.4k" },
  { id: "2", name: "Lower Body Power", date: "Yesterday", sets: 22, vol: "12.2k" },
  { id: "3", name: "Pull Day", date: "Mon, Mar 16", sets: 20, vol: "7.8k" },
  { id: "4", name: "Upper Body Push", date: "Sat, Mar 14", sets: 19, vol: "8.1k" },
];

export function MesocycleDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="min-h-full pb-8"
      style={{ background: "linear-gradient(180deg, #0d0a1c 0%, #080e0e 30%, #080e0e 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-52 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(139,92,246,0.16) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pt-13 pb-4">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <ArrowLeft size={16} color="white" />
        </button>
        <p className="text-white text-[15px] font-bold">Mesocycle</p>
        <div className="w-9" />
      </div>

      {/* Hero */}
      <div className="px-5 mb-4">
        <div className="rounded-3xl p-5"
          style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#00d4a8", boxShadow: "0 0 6px #00d4a8" }} />
            <span className="text-[11px] font-semibold" style={{ color: "#00d4a8" }}>ACTIVE</span>
          </div>
          <h1 className="text-white text-xl font-extrabold">Strength Block</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Phase 1 — Linear Progression</p>

          <div className="flex items-center justify-between mt-4 mb-2">
            <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}>Week 3 of 6</span>
            <span className="text-[12px] font-bold" style={{ color: "#8b5cf6" }}>50%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-full rounded-full" style={{ width: "50%", background: "linear-gradient(90deg, #8b5cf6, #a78bfa)" }} />
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} color="rgba(255,255,255,0.35)" />
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>Mar 3 → Apr 13</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Dumbbell size={12} color="rgba(255,255,255,0.35)" />
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>14 sessions logged</span>
            </div>
          </div>
        </div>
      </div>

      {/* Volume Trend */}
      <div className="px-4 mb-4">
        <div className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-white text-[13px] font-semibold">Weekly Volume</p>
            <span className="text-[11px]" style={{ color: "#8b5cf6" }}>kg lifted</span>
          </div>
          <div style={{ height: 90 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData}>
                <defs>
                  <linearGradient id="mesoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" axisLine={false} tickLine={false}
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "Inter" }} />
                <Tooltip contentStyle={{
                  background: "#111", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px", fontSize: "11px", color: "white",
                }} />
                <Area type="monotone" dataKey="vol" stroke="#8b5cf6" strokeWidth={2}
                  fill="url(#mesoGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Analytics - Advanced */}
      <div className="px-4 mb-4">
        <div className="rounded-2xl p-4"
          style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Lock size={13} color="#8b5cf6" />
            <p className="text-[13px] font-semibold" style={{ color: "#8b5cf6" }}>Block Analytics</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "vs. Previous Block", value: "+12%", sub: "volume increase", good: true },
              { label: "Deload Suggestion", value: "Week 5", sub: "based on fatigue", good: null },
              { label: "Top Lift Gain", value: "+10kg", sub: "Deadlift e1RM", good: true },
              { label: "Avg Session RPE", value: "7.8", sub: "within target 7-9", good: true },
            ].map(a => (
              <div key={a.label} className="rounded-xl p-3"
                style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.15)" }}>
                <p className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{a.label}</p>
                <p className="text-white text-[16px] font-bold" style={{ color: a.good === true ? "#22c55e" : a.good === false ? "#f87171" : "white" }}>
                  {a.value}
                </p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{a.sub}</p>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/progress/muscle-balance")}
            className="w-full mt-3 flex items-center justify-between p-3 rounded-xl"
            style={{ background: "rgba(139,92,246,0.12)" }}>
            <div className="flex items-center gap-2">
              <BarChart2 size={14} color="#8b5cf6" />
              <span className="text-[12px] font-semibold" style={{ color: "#8b5cf6" }}>Muscle Balance Analysis</span>
            </div>
            <ChevronRight size={13} color="#8b5cf6" />
          </button>
        </div>
      </div>

      {/* Linked Sessions */}
      <div className="px-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
          Linked Sessions
        </p>
        <div className="flex flex-col gap-2">
          {LINKED_SESSIONS.map(s => (
            <button key={s.id}
              onClick={() => navigate(`/train/history/${s.id}`)}
              className="flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.07)" }}>
                <Dumbbell size={16} color="#8b5cf6" />
              </div>
              <div className="flex-1">
                <p className="text-white text-[13px] font-semibold">{s.name}</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {s.date} · {s.sets} sets · {s.vol} kg
                </p>
              </div>
              <ChevronRight size={13} color="rgba(255,255,255,0.2)" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
