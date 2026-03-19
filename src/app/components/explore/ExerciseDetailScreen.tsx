import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Plus, TrendingUp, ChevronRight } from "lucide-react";

const EXERCISES: Record<string, {
  name: string; emoji: string; primaryMuscle: string; secondaryMuscles: string[];
  equipment: string; difficulty: string; category: string;
  instructions: string[]; tips: string[];
}> = {
  "1": {
    name: "Bench Press", emoji: "🏋️",
    primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"],
    equipment: "Barbell", difficulty: "Intermediate", category: "Compound",
    instructions: [
      "Lie flat on bench with eyes under the bar. Grip slightly wider than shoulder-width.",
      "Unrack the bar and hold it directly above your chest with arms fully extended.",
      "Lower the bar to your lower chest in a controlled arc, keeping elbows at ~75°.",
      "Press the bar back up explosively, driving through your feet and upper back.",
      "Lock out at the top without hyperextending the elbows.",
    ],
    tips: ["Keep your back arched and shoulder blades retracted", "Drive your feet into the floor", "Bar should touch lower chest, not sternum"],
  },
  "2": {
    name: "Back Squat", emoji: "🦵",
    primaryMuscle: "Quadriceps", secondaryMuscles: ["Glutes", "Hamstrings", "Core"],
    equipment: "Barbell", difficulty: "Intermediate", category: "Compound",
    instructions: [
      "Set bar on upper traps. Step back, feet shoulder-width apart, toes slightly out.",
      "Brace your core and take a deep breath before descending.",
      "Descend by pushing knees out and hips back simultaneously.",
      "Break parallel — crease of hip below top of knee.",
      "Drive through the whole foot to stand, keeping chest tall.",
    ],
    tips: ["Keep knees tracking over toes", "Maintain neutral spine", "Brace hard before every rep"],
  },
  "3": {
    name: "Deadlift", emoji: "💪",
    primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes", "Back", "Core", "Traps"],
    equipment: "Barbell", difficulty: "Advanced", category: "Compound",
    instructions: [
      "Stand with bar over mid-foot, feet hip-width. Grip just outside shins.",
      "Hinge at hips, push them back. Shoulders over the bar.",
      "Create tension: pull slack out of the bar before lifting.",
      "Push the floor away — legs and back rising at the same rate.",
      "Lockout by squeezing glutes, hips fully extended, standing tall.",
    ],
    tips: ["Bar stays close to legs throughout", "Hips shouldn't shoot up first", "Take the slack out before pulling"],
  },
};

const FALLBACK = {
  name: "Exercise", emoji: "💪",
  primaryMuscle: "Various", secondaryMuscles: ["Core"],
  equipment: "Barbell", difficulty: "Intermediate", category: "Compound",
  instructions: ["Follow proper form for this exercise.", "Maintain controlled movement throughout.", "Focus on the target muscle contraction."],
  tips: ["Use full range of motion", "Control the eccentric", "Breathe consistently"],
};

const DIFF_COLOR: Record<string, string> = { Beginner: "#22c55e", Intermediate: "#f59e0b", Advanced: "#ef4444" };

export function ExerciseDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ex = EXERCISES[id || ""] || FALLBACK;

  return (
    <div className="min-h-full pb-8"
      style={{ background: "linear-gradient(180deg, #0a1218 0%, #080e0e 30%, #080e0e 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-52 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(0,180,140,0.14) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pt-13 pb-4">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <ArrowLeft size={16} color="white" />
        </button>
        <p className="text-white text-[15px] font-semibold">Exercise Detail</p>
        <button
          onClick={() => navigate("/train/templates/new")}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-semibold"
          style={{ background: "rgba(0,212,168,0.15)", border: "1px solid rgba(0,212,168,0.3)", color: "#00d4a8" }}>
          <Plus size={13} /> Add
        </button>
      </div>

      {/* Hero */}
      <div className="px-5 pb-4">
        <div
          className="rounded-3xl p-6 flex items-center gap-5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.07)" }}>
            {ex.emoji}
          </div>
          <div>
            <h1 className="text-white text-xl font-extrabold">{ex.name}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: `${DIFF_COLOR[ex.difficulty] || "#f59e0b"}18`, color: DIFF_COLOR[ex.difficulty] || "#f59e0b" }}>
                {ex.difficulty}
              </span>
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{ex.category}</span>
            </div>
            <div className="flex gap-3 mt-2">
              {[ex.equipment, ex.primaryMuscle].map(t => (
                <span key={t} className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Muscles */}
      <div className="px-5 mb-3">
        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Muscles Worked
          </p>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(0,212,168,0.15)", border: "1px solid rgba(0,212,168,0.3)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#00d4a8" }} />
              <span className="text-[12px] font-semibold" style={{ color: "#00d4a8" }}>Primary: {ex.primaryMuscle}</span>
            </div>
            {ex.secondaryMuscles.map(m => (
              <div key={m} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.4)" }} />
                <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-5 mb-3">
        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>How To</p>
          {ex.instructions.map((step, i) => (
            <div key={i} className="flex gap-3 mb-3 last:mb-0">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: "rgba(0,212,168,0.2)", color: "#00d4a8" }}>
                {i + 1}
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="px-5 mb-3">
        <div className="rounded-2xl p-4" style={{ background: "rgba(0,212,168,0.06)", border: "1px solid rgba(0,212,168,0.18)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#00d4a8" }}>Pro Tips</p>
          {ex.tips.map((tip, i) => (
            <div key={i} className="flex gap-2.5 mb-2 last:mb-0">
              <span style={{ color: "#00d4a8" }}>→</span>
              <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.7)" }}>{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Link */}
      <div className="px-5">
        <button
          onClick={() => navigate(`/progress/exercise/${id}`)}
          className="w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98]"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <TrendingUp size={18} color="#00d4a8" />
            <div>
              <p className="text-white text-[13px] font-semibold">Your Progress</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>View e1RM history & volume trends</p>
            </div>
          </div>
          <ChevronRight size={15} color="rgba(255,255,255,0.25)" />
        </button>
      </div>
    </div>
  );
}
