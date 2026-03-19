import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, SlidersHorizontal, ChevronRight, X } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  emoji: string;
}

const ALL_EXERCISES: Exercise[] = [
  { id: "1", name: "Bench Press", primaryMuscle: "Chest", equipment: "Barbell", difficulty: "Intermediate", emoji: "🏋️" },
  { id: "2", name: "Back Squat", primaryMuscle: "Quadriceps", equipment: "Barbell", difficulty: "Intermediate", emoji: "🦵" },
  { id: "3", name: "Deadlift", primaryMuscle: "Hamstrings", equipment: "Barbell", difficulty: "Advanced", emoji: "💪" },
  { id: "4", name: "Overhead Press", primaryMuscle: "Shoulders", equipment: "Barbell", difficulty: "Intermediate", emoji: "🙌" },
  { id: "5", name: "Pull-up", primaryMuscle: "Back", equipment: "Bodyweight", difficulty: "Intermediate", emoji: "⬆️" },
  { id: "6", name: "Barbell Row", primaryMuscle: "Back", equipment: "Barbell", difficulty: "Intermediate", emoji: "🏋️" },
  { id: "7", name: "Romanian Deadlift", primaryMuscle: "Hamstrings", equipment: "Barbell", difficulty: "Intermediate", emoji: "🔃" },
  { id: "8", name: "Dumbbell Curl", primaryMuscle: "Biceps", equipment: "Dumbbell", difficulty: "Beginner", emoji: "💪" },
  { id: "9", name: "Tricep Dips", primaryMuscle: "Triceps", equipment: "Bodyweight", difficulty: "Beginner", emoji: "👇" },
  { id: "10", name: "Leg Press", primaryMuscle: "Quadriceps", equipment: "Machine", difficulty: "Beginner", emoji: "🦵" },
  { id: "11", name: "Lateral Raise", primaryMuscle: "Shoulders", equipment: "Dumbbell", difficulty: "Beginner", emoji: "🙆" },
  { id: "12", name: "Cable Row", primaryMuscle: "Back", equipment: "Cable", difficulty: "Beginner", emoji: "🔗" },
  { id: "13", name: "Incline DB Press", primaryMuscle: "Chest", equipment: "Dumbbell", difficulty: "Intermediate", emoji: "📐" },
  { id: "14", name: "Face Pull", primaryMuscle: "Rear Delts", equipment: "Cable", difficulty: "Beginner", emoji: "😤" },
  { id: "15", name: "Bulgarian Split Squat", primaryMuscle: "Quadriceps", equipment: "Dumbbell", difficulty: "Advanced", emoji: "🦵" },
  { id: "16", name: "Hip Thrust", primaryMuscle: "Glutes", equipment: "Barbell", difficulty: "Intermediate", emoji: "🍑" },
];

const MUSCLES = ["All", "Chest", "Back", "Shoulders", "Quadriceps", "Hamstrings", "Biceps", "Triceps", "Glutes"];
const EQUIPMENT = ["All", "Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight"];
const DIFFICULTY_COLORS: Record<string, string> = { Beginner: "#22c55e", Intermediate: "#f59e0b", Advanced: "#ef4444" };

export function ExploreScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("All");
  const [equip, setEquip] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = ALL_EXERCISES.filter(e => {
    const q = query.toLowerCase();
    return (
      (e.name.toLowerCase().includes(q) || e.primaryMuscle.toLowerCase().includes(q)) &&
      (muscle === "All" || e.primaryMuscle === muscle) &&
      (equip === "All" || e.equipment === equip)
    );
  });

  const activeFilters = [muscle !== "All" && muscle, equip !== "All" && equip].filter(Boolean) as string[];

  return (
    <div className="min-h-full pb-6"
      style={{ background: "linear-gradient(180deg, #0a1218 0%, #080e0e 28%, #080e0e 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-52 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(0,120,180,0.14) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative px-5 pt-13 pb-4">
        <h1 className="text-white text-2xl font-extrabold">Exercise Library</h1>
        <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
          {ALL_EXERCISES.length} exercises · Search, filter, explore
        </p>

        {/* Search */}
        <div className="flex gap-2 mt-4">
          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-3 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <Search size={15} color="rgba(255,255,255,0.4)" />
            <input
              type="text"
              placeholder="Search exercises…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[13px]"
              style={{ color: "white", caretColor: "#00d4a8" }}
            />
            {query && (
              <button onClick={() => setQuery("")}>
                <X size={13} color="rgba(255,255,255,0.4)" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-12 rounded-2xl flex items-center justify-center transition-all active:scale-90"
            style={{
              background: showFilters ? "rgba(0,212,168,0.2)" : "rgba(255,255,255,0.07)",
              border: showFilters ? "1px solid rgba(0,212,168,0.35)" : "1px solid rgba(255,255,255,0.09)",
            }}
          >
            <SlidersHorizontal size={15} color={showFilters ? "#00d4a8" : "rgba(255,255,255,0.6)"} />
          </button>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex gap-2 mt-2.5">
            {activeFilters.map(f => (
              <div key={f}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: "rgba(0,212,168,0.15)", border: "1px solid rgba(0,212,168,0.3)", color: "#00d4a8" }}>
                {f}
                <button onClick={() => { if (muscle === f) setMuscle("All"); if (equip === f) setEquip("All"); }}>
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <div className="px-4 mb-3">
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "rgba(255,255,255,0.35)" }}>Muscle Group</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {MUSCLES.map(m => (
                <button key={m} onClick={() => setMuscle(m)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                  style={{
                    background: muscle === m ? "rgba(0,212,168,0.2)" : "rgba(255,255,255,0.06)",
                    border: muscle === m ? "1px solid rgba(0,212,168,0.4)" : "1px solid rgba(255,255,255,0.08)",
                    color: muscle === m ? "#00d4a8" : "rgba(255,255,255,0.5)",
                  }}>
                  {m}
                </button>
              ))}
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "rgba(255,255,255,0.35)" }}>Equipment</p>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT.map(eq => (
                <button key={eq} onClick={() => setEquip(eq)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                  style={{
                    background: equip === eq ? "rgba(0,212,168,0.2)" : "rgba(255,255,255,0.06)",
                    border: equip === eq ? "1px solid rgba(0,212,168,0.4)" : "1px solid rgba(255,255,255,0.08)",
                    color: equip === eq ? "#00d4a8" : "rgba(255,255,255,0.5)",
                  }}>
                  {eq}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="px-4">
        <p className="text-[11px] mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
          {filtered.length} results
        </p>
        <div className="flex flex-col gap-2">
          {filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => navigate(`/explore/${ex.id}`)}
              className="flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.06)" }}>
                {ex.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-semibold truncate">{ex.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {ex.primaryMuscle} · {ex.equipment}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${DIFFICULTY_COLORS[ex.difficulty]}18`, color: DIFFICULTY_COLORS[ex.difficulty] }}>
                  {ex.difficulty}
                </span>
                <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
              </div>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-12 gap-3">
              <span className="text-4xl">🔍</span>
              <p className="text-white text-[15px] font-semibold">No exercises found</p>
              <p className="text-[13px] text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                Try different search terms or filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
