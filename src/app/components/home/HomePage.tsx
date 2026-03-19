import { useNavigate } from "react-router";
import { Bell, ChevronRight, Flame, Plus, TrendingUp, Dumbbell, Trophy, Scale } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";

const weeklyBars = [
  { day: "M", v: 1 }, { day: "T", v: 1 }, { day: "W", v: 0 },
  { day: "T", v: 1 }, { day: "F", v: 1 }, { day: "S", v: 1 },
  { day: "S", v: 1 },
];

const recentPRs = [
  { exercise: "Bench Press", value: "110 kg", date: "3 days ago", color: "#00d4a8" },
  { exercise: "Squat", value: "145 kg", date: "1 week ago", color: "#22c55e" },
  { exercise: "Deadlift", value: "185 kg", date: "2 weeks ago", color: "#00d4a8" },
  { exercise: "OHP", value: "78 kg", date: "2 weeks ago", color: "#22c55e" },
];

function StatPill({ label, value, icon: Icon, color = "#00d4a8" }: { label: string; value: string; icon: any; color?: string }) {
  return (
    <div className="flex flex-col gap-1 items-center">
      <div className="flex items-center gap-1">
        <Icon size={11} style={{ color }} />
        <span className="text-white text-[15px] font-bold">{value}</span>
      </div>
      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</span>
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-full pb-6"
      style={{ background: "linear-gradient(180deg, #0a1a18 0%, #080e0e 28%, #080e0e 100%)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-72 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(0,180,140,0.22) 0%, transparent 70%)" }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pt-13 pb-3">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black"
            style={{ background: "linear-gradient(135deg, #00d4a8, #22c55e)", boxShadow: "0 0 16px rgba(0,212,168,0.4)" }}
          >
            JD
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.38)" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </p>
            <p className="text-white text-[15px] font-semibold leading-tight">Hey, Jordan 👋</p>
          </div>
        </button>
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center relative"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          <Bell size={16} color="rgba(255,255,255,0.65)" />
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#00d4a8", boxShadow: "0 0 6px #00d4a8" }} />
        </button>
      </div>

      {/* Active Mesocycle Banner */}
      <div className="px-4 mt-3">
        <button
          onClick={() => navigate("/train/mesocycles/1")}
          className="w-full rounded-2xl px-4 py-3 flex items-center justify-between transition-all active:scale-[0.98]"
          style={{ background: "rgba(0,212,168,0.1)", border: "1px solid rgba(0,212,168,0.22)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,212,168,0.2)" }}>
              <TrendingUp size={15} color="#00d4a8" />
            </div>
            <div>
              <p className="text-[11px] font-semibold" style={{ color: "#00d4a8" }}>Active Mesocycle</p>
              <p className="text-white text-[13px] font-bold">Strength Block — Week 3/6</p>
            </div>
          </div>
          <ChevronRight size={14} color="rgba(255,255,255,0.35)" />
        </button>
      </div>

      {/* Overview Card */}
      <div className="px-4 mt-3">
        <div
          className="rounded-3xl p-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Weekly bar */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-white text-[13px] font-semibold">This Week</p>
            <span className="text-[11px] font-medium" style={{ color: "#00d4a8" }}>6 / 7 days</span>
          </div>
          <div style={{ height: 68 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyBars} barCategoryGap="30%">
                <XAxis dataKey="day" axisLine={false} tickLine={false}
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "Inter" }} />
                <Bar dataKey="v" radius={[4, 4, 4, 4]} maxBarSize={22}>
                  {weeklyBars.map((e, i) => (
                    <Cell key={i}
                      fill={e.v === 0 ? "rgba(255,255,255,0.07)" : i === 6 ? "#00d4a8" : "rgba(255,255,255,0.22)"}
                      style={i === 6 ? { filter: "drop-shadow(0 0 5px rgba(0,212,168,0.7))" } : {}}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stat pills */}
          <div className="flex items-center justify-around mt-3 pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <StatPill label="Day Streak" value="12" icon={Flame} color="#f97316" />
            <div className="w-px h-7" style={{ background: "rgba(255,255,255,0.07)" }} />
            <StatPill label="Workouts" value="248" icon={Dumbbell} />
            <div className="w-px h-7" style={{ background: "rgba(255,255,255,0.07)" }} />
            <StatPill label="This Week" value="6" icon={TrendingUp} color="#22c55e" />
          </div>
        </div>
      </div>

      {/* Latest Bodyweight */}
      <div className="px-4 mt-3">
        <button
          onClick={() => navigate("/profile/bodyweight")}
          className="w-full rounded-2xl px-4 py-3.5 flex items-center justify-between transition-all active:scale-[0.98]"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.07)" }}>
              <Scale size={16} color="#00d4a8" />
            </div>
            <div>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>Latest Bodyweight</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-white text-[18px] font-bold">82.4</span>
                <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>kg</span>
                <span className="text-[11px] font-medium" style={{ color: "#22c55e" }}>↓ 0.3kg</span>
              </div>
            </div>
          </div>
          <ChevronRight size={15} color="rgba(255,255,255,0.25)" />
        </button>
      </div>

      {/* Last Workout */}
      <div className="px-4 mt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white text-[13px] font-semibold">Last Workout</p>
          <button onClick={() => navigate("/train/history")}
            className="flex items-center gap-0.5 text-[11px] font-medium" style={{ color: "#00d4a8" }}>
            See All <ChevronRight size={12} />
          </button>
        </div>
        <button
          onClick={() => navigate("/train/history/1")}
          className="w-full rounded-2xl p-4 transition-all active:scale-[0.98]"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white text-[15px] font-bold">Upper Body Push</p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>Yesterday · 6:30 PM</p>
            </div>
            <div className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
              style={{ background: "rgba(0,212,168,0.18)", color: "#00d4a8" }}>
              Done ✓
            </div>
          </div>
          <div className="flex gap-5 mt-3">
            {[["52 min", "Duration"], ["18 sets", "Sets"], ["8.4k kg", "Volume"]].map(([v, l]) => (
              <div key={l}>
                <span className="text-white text-[14px] font-bold">{v}</span>
                <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{l}</p>
              </div>
            ))}
          </div>
        </button>
      </div>

      {/* Personal Records */}
      <div className="mt-3">
        <div className="flex items-center justify-between px-4 mb-2.5">
          <p className="text-white text-[13px] font-semibold">Recent PRs</p>
          <button onClick={() => navigate("/progress/records")}
            className="flex items-center gap-0.5 text-[11px] font-medium" style={{ color: "#00d4a8" }}>
            All PRs <ChevronRight size={12} />
          </button>
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {recentPRs.map(pr => (
            <button
              key={pr.exercise}
              onClick={() => navigate("/progress/records")}
              className="flex-shrink-0 rounded-2xl p-3.5 transition-all active:scale-[0.97]"
              style={{ width: 126, background: "rgba(255,255,255,0.04)", border: `1px solid ${pr.color}28` }}
            >
              <div className="flex items-center gap-1 mb-2">
                <Trophy size={10} style={{ color: pr.color }} />
                <span className="text-[9px] uppercase tracking-wider" style={{ color: pr.color }}>PR</span>
              </div>
              <p className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{pr.exercise}</p>
              <p className="text-white text-[16px] font-extrabold" style={{ color: pr.color, filter: `drop-shadow(0 0 5px ${pr.color}80)` }}>
                {pr.value}
              </p>
              <p className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{pr.date}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Start Workout CTA */}
      <div className="px-4 mt-5">
        <button
          onClick={() => navigate("/train/start")}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #00d4a8, #22c55e)",
            boxShadow: "0 4px 28px rgba(0,212,168,0.4), 0 0 60px rgba(0,212,168,0.12)",
          }}
        >
          <Plus size={20} color="black" strokeWidth={2.5} />
          <span className="text-black text-[16px] font-extrabold">Start Workout</span>
        </button>
      </div>
    </div>
  );
}
