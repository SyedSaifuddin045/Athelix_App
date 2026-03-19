import { useNavigate } from "react-router";
import { ArrowLeft, Plus, ChevronRight, Lock, TrendingUp, Calendar } from "lucide-react";

const MESOS = [
  {
    id: "1",
    name: "Strength Block",
    phase: "Phase 1 — Linear Progression",
    weeks: 6, currentWeek: 3,
    startDate: "Mar 3, 2026",
    endDate: "Apr 13, 2026",
    status: "active",
    sessions: 14,
    color: "#00d4a8",
  },
  {
    id: "2",
    name: "Hypertrophy Phase",
    phase: "Phase 2 — Volume Accumulation",
    weeks: 8, currentWeek: 0,
    startDate: "Apr 20, 2026",
    endDate: "Jun 14, 2026",
    status: "planned",
    sessions: 0,
    color: "#8b5cf6",
  },
  {
    id: "3",
    name: "Deload Week",
    phase: "Recovery — 60% intensity",
    weeks: 1, currentWeek: 1,
    startDate: "Feb 24, 2026",
    endDate: "Mar 2, 2026",
    status: "completed",
    sessions: 3,
    color: "#22c55e",
  },
];

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: "rgba(0,212,168,0.15)", color: "#00d4a8", label: "Active" },
  planned: { bg: "rgba(139,92,246,0.15)", color: "#8b5cf6", label: "Planned" },
  completed: { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)", label: "Completed" },
};

export function MesocycleListScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full pb-6"
      style={{ background: "linear-gradient(180deg, #0d0a1c 0%, #080e0e 30%, #080e0e 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-52 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(139,92,246,0.16) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pt-13 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <ArrowLeft size={16} color="white" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white text-[17px] font-bold">Mesocycles</h1>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)" }}>
                <Lock size={9} color="#8b5cf6" />
                <span className="text-[9px] font-semibold" style={{ color: "#8b5cf6" }}>ADVANCED</span>
              </div>
            </div>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>Block periodization planning</p>
          </div>
        </div>
        <button
          onClick={() => {}}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold"
          style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#8b5cf6" }}>
          <Plus size={14} /> New
        </button>
      </div>

      {/* Info Banner */}
      <div className="px-5 mb-4">
        <div className="rounded-2xl p-4"
          style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <div className="flex items-start gap-3">
            <TrendingUp size={18} color="#8b5cf6" className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#8b5cf6" }}>Advanced Planning Mode</p>
              <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                Mesocycles are optional training blocks. They help you plan progressive overload across weeks and compare performance between blocks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Meso List */}
      <div className="px-4 flex flex-col gap-3">
        {MESOS.map(m => {
          const st = statusStyles[m.status];
          const progress = m.weeks ? (m.currentWeek / m.weeks) * 100 : 0;
          return (
            <button
              key={m.id}
              onClick={() => navigate(`/train/mesocycles/${m.id}`)}
              className="w-full p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${m.color}22` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: m.color, boxShadow: `0 0 5px ${m.color}` }} />
                    <p className="text-white text-[15px] font-bold">{m.name}</p>
                  </div>
                  <p className="text-[11px] ml-4" style={{ color: "rgba(255,255,255,0.4)" }}>{m.phase}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                  <ChevronRight size={14} color="rgba(255,255,255,0.25)" />
                </div>
              </div>

              {m.status === "active" && (
                <>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                      Week {m.currentWeek} of {m.weeks}
                    </span>
                    <span className="text-[11px] font-semibold" style={{ color: m.color }}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: `${progress}%`, background: m.color }} />
                  </div>
                </>
              )}

              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <Calendar size={11} color="rgba(255,255,255,0.3)" />
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {m.startDate} → {m.endDate}
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {m.sessions} sessions logged
                </span>
              </div>
            </button>
          );
        })}

        {/* New Mesocycle */}
        <button
          className="p-4 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98]"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(139,92,246,0.2)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(139,92,246,0.12)" }}>
            <Plus size={18} color="#8b5cf6" />
          </div>
          <div>
            <p className="text-white text-[13px] font-semibold">Plan New Mesocycle</p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Set up a new training block</p>
          </div>
        </button>
      </div>
    </div>
  );
}
