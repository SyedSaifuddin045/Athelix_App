import { useNavigate } from "react-router";
import { ArrowLeft, Plus, Play, Dumbbell, Clock, ChevronRight } from "lucide-react";

const TEMPLATES = [
  {
    id: "1", name: "Upper Body Push",
    exercises: ["Bench Press", "OHP", "Incline DB Press", "Lateral Raise", "Tricep Dips"],
    duration: "~55 min", sets: 20, color: "#00d4a8",
    lastUsed: "Yesterday",
  },
  {
    id: "2", name: "Lower Body Power",
    exercises: ["Back Squat", "Romanian DL", "Leg Press", "Bulgarian Split Squat", "Calf Raises"],
    duration: "~65 min", sets: 22, color: "#22c55e",
    lastUsed: "3 days ago",
  },
  {
    id: "3", name: "Pull Day",
    exercises: ["Deadlift", "Pull-up", "Barbell Row", "Cable Row", "Face Pull", "Dumbbell Curl"],
    duration: "~55 min", sets: 24, color: "#3b82f6",
    lastUsed: "4 days ago",
  },
  {
    id: "4", name: "Upper Body Pull",
    exercises: ["Weighted Pull-up", "Barbell Row", "Cable Row", "Face Pull", "Hammer Curl"],
    duration: "~50 min", sets: 18, color: "#8b5cf6",
    lastUsed: "1 week ago",
  },
  {
    id: "5", name: "Full Body Power",
    exercises: ["Power Clean", "Front Squat", "Push Press", "Romanian DL"],
    duration: "~70 min", sets: 16, color: "#f59e0b",
    lastUsed: "2 weeks ago",
  },
];

export function TemplateListScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full pb-6"
      style={{ background: "linear-gradient(180deg, #0a1218 0%, #080e0e 28%, #080e0e 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-52 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,180,140,0.14) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pt-13 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <ArrowLeft size={16} color="white" />
          </button>
          <div>
            <h1 className="text-white text-[17px] font-bold">Templates</h1>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>{TEMPLATES.length} saved</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/train/templates/new")}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all active:scale-90"
          style={{ background: "rgba(0,212,168,0.15)", border: "1px solid rgba(0,212,168,0.3)", color: "#00d4a8" }}>
          <Plus size={15} /> New
        </button>
      </div>

      {/* Template list */}
      <div className="px-4 flex flex-col gap-3">
        {TEMPLATES.map(t => (
          <div key={t.id}
            className="rounded-3xl p-4 transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color, boxShadow: `0 0 5px ${t.color}` }} />
                  <p className="text-white text-[15px] font-bold">{t.name}</p>
                </div>
                <p className="text-[11px] mt-1 ml-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {t.exercises.slice(0, 3).join(", ")}{t.exercises.length > 3 ? ` +${t.exercises.length - 3}` : ""}
                </p>
              </div>
              <button onClick={() => navigate("/train/templates/" + t.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.07)" }}>
                <ChevronRight size={13} color="rgba(255,255,255,0.5)" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Clock size={11} color="rgba(255,255,255,0.3)" />
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{t.duration}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Dumbbell size={11} color="rgba(255,255,255,0.3)" />
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{t.sets} sets</span>
                </div>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>Used {t.lastUsed}</span>
              </div>
              <button
                onClick={() => navigate("/train/start", { state: { templateId: t.id } })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all active:scale-90"
                style={{ background: `${t.color}22`, border: `1px solid ${t.color}40`, color: t.color }}>
                <Play size={11} fill="currentColor" /> Start
              </button>
            </div>
          </div>
        ))}

        {/* Create new */}
        <button
          onClick={() => navigate("/train/templates/new")}
          className="rounded-3xl p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.12)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            <Plus size={18} color="rgba(255,255,255,0.45)" />
          </div>
          <span className="text-[14px]" style={{ color: "rgba(255,255,255,0.4)" }}>Create new template</span>
        </button>
      </div>
    </div>
  );
}
