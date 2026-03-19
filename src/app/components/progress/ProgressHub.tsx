import { useNavigate } from "react-router";
import { Trophy, TrendingUp, BarChart2, ChevronRight } from "lucide-react";

const sections = [
  {
    path: "/progress/records",
    icon: Trophy,
    color: "#fbbf24",
    title: "Personal Records",
    desc: "All-time best lifts by exercise & record type",
    badge: "9 PRs total",
  },
  {
    path: "/progress/exercise/1",
    icon: TrendingUp,
    color: "#00d4a8",
    title: "Exercise Progress",
    desc: "e1RM history, volume trends & overload signals",
    badge: "16 exercises tracked",
  },
  {
    path: "/progress/muscle-balance",
    icon: BarChart2,
    color: "#8b5cf6",
    title: "Muscle Balance",
    desc: "Weekly sets by muscle group — spot imbalances",
    badge: "Updated today",
  },
];

const QUICK_STATS = [
  { label: "Total PRs", value: "9", color: "#fbbf24" },
  { label: "Best e1RM", value: "205kg", color: "#00d4a8" },
  { label: "This Month", value: "3 PRs", color: "#22c55e" },
];

export function ProgressHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full pb-6"
      style={{ background: "linear-gradient(180deg, #0d1018 0%, #080e0e 28%, #080e0e 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-52 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(251,191,36,0.1) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative px-5 pt-13 pb-5">
        <p className="text-[11px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Analytics</p>
        <h1 className="text-white text-2xl font-extrabold mt-0.5">Progress</h1>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          {QUICK_STATS.map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[18px] font-extrabold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="px-5 flex flex-col gap-3">
        {sections.map(s => (
          <button
            key={s.path}
            onClick={() => navigate(s.path)}
            className="w-full flex items-center gap-4 p-4 rounded-3xl text-left transition-all active:scale-[0.98]"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${s.color}20` }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}15` }}>
              <s.icon size={26} style={{ color: s.color }} />
            </div>
            <div className="flex-1">
              <p className="text-white text-[15px] font-bold">{s.title}</p>
              <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{s.desc}</p>
              <span className="mt-2 inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                style={{ background: `${s.color}15`, color: s.color }}>
                {s.badge}
              </span>
            </div>
            <ChevronRight size={16} color="rgba(255,255,255,0.25)" />
          </button>
        ))}
      </div>

      {/* Recent achievement */}
      <div className="px-5 mt-4">
        <div className="rounded-2xl p-4"
          style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)" }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-[13px] font-bold" style={{ color: "#fbbf24" }}>New Bench Press PR!</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>110 kg × 3 reps · 3 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
