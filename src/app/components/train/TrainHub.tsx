import { useNavigate } from "react-router";
import { Play, BookOpen, History, TrendingUp, ChevronRight, Lock } from "lucide-react";

export function TrainHub() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Templates",
      desc: "Saved workout plans & routines",
      icon: BookOpen,
      path: "/train/templates",
      color: "#00d4a8",
      badge: "12 saved",
    },
    {
      title: "Workout History",
      desc: "All past sessions & sets",
      icon: History,
      path: "/train/history",
      color: "#22c55e",
      badge: "248 sessions",
    },
    {
      title: "Mesocycles",
      desc: "Advanced block planning",
      icon: TrendingUp,
      path: "/train/mesocycles",
      color: "#8b5cf6",
      badge: "Advanced",
      advanced: true,
    },
  ];

  return (
    <div className="min-h-full pb-6"
      style={{ background: "linear-gradient(180deg, #0a1218 0%, #080e0e 28%, #080e0e 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-52 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(0,180,140,0.18) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative px-5 pt-13 pb-4">
        <p className="text-[11px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Train</p>
        <h1 className="text-white text-2xl font-extrabold mt-0.5">Workouts</h1>
      </div>

      {/* Start Workout CTA */}
      <div className="px-5 mb-5">
        <button
          onClick={() => navigate("/train/start")}
          className="w-full py-5 rounded-3xl flex flex-col items-center gap-2 transition-all active:scale-[0.98]"
          style={{
            background: "linear-gradient(145deg, #00d4a8, #22c55e)",
            boxShadow: "0 8px 32px rgba(0,212,168,0.4), 0 0 80px rgba(0,212,168,0.12)",
          }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.2)" }}>
            <Play size={26} color="white" fill="white" />
          </div>
          <div className="text-center">
            <p className="text-black text-[17px] font-extrabold">Start Workout</p>
            <p className="text-[12px] mt-0.5" style={{ color: "rgba(0,0,0,0.55)" }}>
              Begin now or choose a template
            </p>
          </div>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "This Week", value: "6", sub: "sessions" },
            { label: "Total Vol", value: "24k", sub: "kg this week" },
            { label: "Avg Duration", value: "54", sub: "minutes" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-white text-xl font-extrabold">{s.value}</p>
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
            style={{
              background: `rgba(255,255,255,0.04)`,
              border: `1px solid ${s.advanced ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}18` }}>
              <s.icon size={22} style={{ color: s.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-white text-[15px] font-bold">{s.title}</p>
                {s.advanced && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)" }}>
                    <Lock size={9} color="#8b5cf6" />
                    <span className="text-[9px] font-semibold" style={{ color: "#8b5cf6" }}>ADVANCED</span>
                  </div>
                )}
              </div>
              <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.desc}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{
                  background: s.advanced ? "rgba(139,92,246,0.15)" : `${s.color}18`,
                  color: s.advanced ? "#8b5cf6" : s.color,
                }}>
                {s.badge}
              </span>
              <ChevronRight size={14} color="rgba(255,255,255,0.25)" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
