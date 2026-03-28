import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Search, SlidersHorizontal, ChevronRight, X, Loader2 } from "lucide-react";
import { exerciseService } from "../../../api/services/exercise";
import type { Exercise, ExerciseFiltersResponse } from "../../../api/types";

const DIFFICULTY_COLORS: Record<string, string> = { Beginner: "#22c55e", Intermediate: "#f59e0b", Advanced: "#ef4444" };
const EMOJI_MAP: Record<string, string> = {
  chest: "💪", back: "🔙", shoulders: "🙌", arms: "💪", legs: "🦵", core: "🎯",
  cardio: "🏃", default: "🏋️"
};

function getEmojiForMuscle(muscle: string): string {
  const lower = muscle.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(key)) return emoji;
  }
  return EMOJI_MAP.default;
}

export function ExploreScreen() {
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState<ExerciseFiltersResponse | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [query, setQuery] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchFilters = useCallback(async () => {
    try {
      setLoadingFilters(true);
      const data = await exerciseService.getFilters();
      setFilters(data);
    } catch (err) {
      console.error("Failed to fetch filters:", err);
    } finally {
      setLoadingFilters(false);
    }
  }, []);

  const fetchExercises = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await exerciseService.getExercises({
        q: query || undefined,
        body_part: selectedBodyPart || undefined,
        equipment: selectedEquipment || undefined,
        target: selectedTarget || undefined,
        limit: 50,
      });
      setExercises(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load exercises");
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, [query, selectedBodyPart, selectedEquipment, selectedTarget]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const activeFilters = [
    selectedBodyPart && { type: "body_part" as const, value: selectedBodyPart },
    selectedEquipment && { type: "equipment" as const, value: selectedEquipment },
    selectedTarget && { type: "target" as const, value: selectedTarget },
  ].filter(Boolean) as { type: "body_part" | "equipment" | "target"; value: string }[];

  const clearFilter = (type: "body_part" | "equipment" | "target") => {
    if (type === "body_part") setSelectedBodyPart("");
    if (type === "equipment") setSelectedEquipment("");
    if (type === "target") setSelectedTarget("");
  };

  const clearAllFilters = () => {
    setSelectedBodyPart("");
    setSelectedEquipment("");
    setSelectedTarget("");
    setQuery("");
  };

  return (
    <div className="min-h-full pb-6"
      style={{ background: "linear-gradient(180deg, #0a1218 0%, #080e0e 28%, #080e0e 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-52 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(0,120,180,0.14) 0%, transparent 70%)" }} />

      <div className="relative px-5 pt-13 pb-4">
        <h1 className="text-white text-2xl font-extrabold">Exercise Library</h1>
        <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
          {loading ? "Loading..." : `${total} exercises`} · Search, filter, explore
        </p>

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

        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {activeFilters.map(f => (
              <div key={f.type}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: "rgba(0,212,168,0.15)", border: "1px solid rgba(0,212,168,0.3)", color: "#00d4a8" }}>
                {f.value}
                <button onClick={() => clearFilter(f.type)}>
                  <X size={10} />
                </button>
              </div>
            ))}
            {activeFilters.length > 1 && (
              <button onClick={clearAllFilters} className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {showFilters && (
        <div className="px-4 mb-3">
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {loadingFilters ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={20} className="animate-spin" style={{ color: "#00d4a8" }} />
              </div>
            ) : filters ? (
              <>
                <div className="mb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Body Part
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {filters.body_parts.map(part => (
                      <button key={part} onClick={() => setSelectedBodyPart(selectedBodyPart === part ? "" : part)}
                        className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all capitalize"
                        style={{
                          background: selectedBodyPart === part ? "rgba(0,212,168,0.2)" : "rgba(255,255,255,0.06)",
                          border: selectedBodyPart === part ? "1px solid rgba(0,212,168,0.4)" : "1px solid rgba(255,255,255,0.08)",
                          color: selectedBodyPart === part ? "#00d4a8" : "rgba(255,255,255,0.5)",
                        }}>
                        {part.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Equipment
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {filters.equipment.map(eq => (
                      <button key={eq} onClick={() => setSelectedEquipment(selectedEquipment === eq ? "" : eq)}
                        className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all capitalize"
                        style={{
                          background: selectedEquipment === eq ? "rgba(0,212,168,0.2)" : "rgba(255,255,255,0.06)",
                          border: selectedEquipment === eq ? "1px solid rgba(0,212,168,0.4)" : "1px solid rgba(255,255,255,0.08)",
                          color: selectedEquipment === eq ? "#00d4a8" : "rgba(255,255,255,0.5)",
                        }}>
                        {eq.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Target Muscle
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {filters.targets.map(t => (
                      <button key={t} onClick={() => setSelectedTarget(selectedTarget === t ? "" : t)}
                        className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all capitalize"
                        style={{
                          background: selectedTarget === t ? "rgba(0,212,168,0.2)" : "rgba(255,255,255,0.06)",
                          border: selectedTarget === t ? "1px solid rgba(0,212,168,0.4)" : "1px solid rgba(255,255,255,0.08)",
                          color: selectedTarget === t ? "#00d4a8" : "rgba(255,255,255,0.5)",
                        }}>
                        {t.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      <div className="px-4">
        <p className="text-[11px] mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
          {loading ? "Loading exercises..." : `${exercises.length} results`}
        </p>
        
        {error && (
          <div className="rounded-xl p-4 text-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-[13px]" style={{ color: "#f87171" }}>{error}</p>
            <button 
              onClick={fetchExercises}
              className="mt-2 text-[12px] font-semibold"
              style={{ color: "#00d4a8" }}
            >
              Try again
            </button>
          </div>
        )}

        {!error && (
          <div className="flex flex-col gap-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl animate-pulse"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-11 h-11 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div className="flex-1">
                    <div className="h-4 rounded w-32 mb-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <div className="h-3 rounded w-24" style={{ background: "rgba(255,255,255,0.04)" }} />
                  </div>
                </div>
              ))
            ) : exercises.length > 0 ? (
              exercises.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => navigate(`/explore/${ex.id}`)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: "rgba(255,255,255,0.06)" }}>
                    {getEmojiForMuscle(ex.target || ex.body_part)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[13px] font-semibold truncate">{ex.name}</p>
                    <p className="text-[11px] mt-0.5 capitalize" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {ex.body_part?.replace("_", " ")} · {ex.equipment?.replace("_", " ")}
                    </p>
                  </div>
                  <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center py-12 gap-3">
                <span className="text-4xl">🔍</span>
                <p className="text-white text-[15px] font-semibold">No exercises found</p>
                <p className="text-[13px] text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Try different search terms or filters
                </p>
                {activeFilters.length > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-[12px] font-semibold mt-2"
                    style={{ color: "#00d4a8" }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
