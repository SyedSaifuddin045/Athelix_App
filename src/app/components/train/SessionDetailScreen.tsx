import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Trash2, Edit3, Trophy, Clock, Dumbbell, MoreHorizontal } from "lucide-react";

const SESSION_DATA = {
  id: "1", name: "Upper Body Push",
  date: "Today · 6:30 AM", duration: 52, sets: 18, volume: "8.4k kg", prs: 1,
  mood: "💪", notes: "Felt strong today. Hit a new bench PR!",
  exercises: [
    {
      name: "Bench Press", emoji: "🏋️", pr: true,
      sets: [
        { type: "W", weight: "80", reps: "5", rpe: "-" },
        { type: "1", weight: "100", reps: "5", rpe: "7" },
        { type: "2", weight: "100", reps: "5", rpe: "8" },
        { type: "3", weight: "110", reps: "3", rpe: "9" },
      ],
    },
    {
      name: "OHP", emoji: "🙌", pr: false,
      sets: [
        { type: "1", weight: "60", reps: "8", rpe: "7" },
        { type: "2", weight: "62.5", reps: "7", rpe: "8" },
        { type: "3", weight: "62.5", reps: "6", rpe: "9" },
      ],
    },
    {
      name: "Incline DB Press", emoji: "📐", pr: false,
      sets: [
        { type: "1", weight: "32", reps: "10", rpe: "7" },
        { type: "2", weight: "32", reps: "9", rpe: "8" },
        { type: "3", weight: "32", reps: "8", rpe: "9" },
      ],
    },
    {
      name: "Lateral Raise", emoji: "🙆", pr: false,
      sets: [
        { type: "1", weight: "14", reps: "15", rpe: "7" },
        { type: "2", weight: "14", reps: "15", rpe: "7" },
        { type: "3", weight: "14", reps: "12", rpe: "8" },
      ],
    },
    {
      name: "Tricep Dips", emoji: "👇", pr: false,
      sets: [
        { type: "1", weight: "BW", reps: "12", rpe: "7" },
        { type: "2", weight: "BW", reps: "10", rpe: "8" },
        { type: "3", weight: "BW+5", reps: "8", rpe: "9" },
      ],
    },
  ],
};

export function SessionDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showMenu, setShowMenu] = useState(false);

  const s = SESSION_DATA;

  const handleDelete = () => {
    if (confirm("Delete this session? PRs will be recalculated.")) {
      navigate("/train/history");
    }
  };

  return (
    <div className="min-h-full pb-8"
      style={{ background: "linear-gradient(180deg, #0a1218 0%, #080e0e 28%, #080e0e 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-44 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,180,140,0.12) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pt-13 pb-4">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <ArrowLeft size={16} color="white" />
        </button>
        <p className="text-white text-[15px] font-bold">Session Detail</p>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <MoreHorizontal size={16} color="rgba(255,255,255,0.7)" />
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-11 rounded-2xl py-1 z-50 w-44"
              style={{ background: "#111d1b", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
              <button
                onClick={() => { setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[13px]"
                style={{ color: "rgba(255,255,255,0.7)" }}>
                <Edit3 size={14} /> Edit session
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-3 px-4 py-3 text-[13px]"
                style={{ color: "#f87171" }}>
                <Trash2 size={14} /> Delete session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{s.mood}</span>
          <div>
            <h1 className="text-white text-xl font-extrabold">{s.name}</h1>
            <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.38)" }}>{s.date}</p>
          </div>
          {s.prs > 0 && (
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
              style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.25)" }}>
              <Trophy size={13} color="#fbbf24" />
              <span className="text-[12px] font-bold" style={{ color: "#fbbf24" }}>{s.prs} PR!</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Duration", value: `${s.duration}m`, icon: Clock },
            { label: "Sets", value: s.sets.toString(), icon: Dumbbell },
            { label: "Volume", value: s.volume, icon: Dumbbell },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl p-3.5 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Icon size={13} color="#00d4a8" className="mx-auto mb-1" />
              <p className="text-white text-[16px] font-extrabold">{value}</p>
              <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
            </div>
          ))}
        </div>

        {s.notes && (
          <div className="mt-3 rounded-2xl p-3.5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              "{s.notes}"
            </p>
          </div>
        )}
      </div>

      {/* Exercises */}
      <div className="px-4 flex flex-col gap-3">
        {s.exercises.map((ex, i) => (
          <div key={i} className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-lg">{ex.emoji}</span>
              <p className="text-white text-[13px] font-bold flex-1">{ex.name}</p>
              {ex.pr && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(251,191,36,0.15)" }}>
                  <Trophy size={10} color="#fbbf24" />
                  <span className="text-[10px] font-bold" style={{ color: "#fbbf24" }}>PR</span>
                </div>
              )}
            </div>
            <div className="px-4 py-3">
              <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: "28px 1fr 1fr 1fr" }}>
                {["Set", "kg", "Reps", "RPE"].map(h => (
                  <span key={h} className="text-[10px] font-semibold uppercase text-center"
                    style={{ color: "rgba(255,255,255,0.28)" }}>{h}</span>
                ))}
              </div>
              {ex.sets.map((set, si) => (
                <div key={si} className="grid gap-2 mb-1.5 items-center"
                  style={{ gridTemplateColumns: "28px 1fr 1fr 1fr" }}>
                  <span className="text-[11px] font-bold text-center"
                    style={{ color: set.type === "W" ? "#f59e0b" : "rgba(255,255,255,0.45)" }}>
                    {set.type}
                  </span>
                  {[set.weight, set.reps, set.rpe].map((v, vi) => (
                    <div key={vi} className="rounded-lg py-1.5 text-center"
                      style={{ background: "rgba(255,255,255,0.06)" }}>
                      <span className="text-white text-[12px] font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
