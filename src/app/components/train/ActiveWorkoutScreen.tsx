import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { X, Plus, Check, ChevronDown, Smile, MapPin, FileText } from "lucide-react";

interface WSet {
  id: string; weight: string; reps: string; duration: string; distance: string;
  rpe: string; done: boolean; warmup: boolean;
}
interface WExercise {
  id: string; name: string; emoji: string; category: "strength" | "cardio";
  sets: WSet[]; notes: string;
}

function newStrengthSet(prevWeight?: string, prevReps?: string): WSet {
  return { id: Date.now().toString(), weight: prevWeight || "60", reps: prevReps || "8", duration: "", distance: "", rpe: "", done: false, warmup: false };
}

function newCardioSet(): WSet {
  return { id: Date.now().toString(), weight: "", reps: "", duration: "", distance: "", rpe: "", done: false, warmup: false };
}

const INIT_EXERCISES: WExercise[] = [
  {
    id: "1", name: "Bench Press", emoji: "🏋️", category: "strength", notes: "",
    sets: [
      { id: "w1", weight: "80", reps: "5", duration: "", distance: "", rpe: "", done: false, warmup: true },
      { id: "s1", weight: "100", reps: "5", duration: "", distance: "", rpe: "", done: false, warmup: false },
      { id: "s2", weight: "100", reps: "5", duration: "", distance: "", rpe: "", done: false, warmup: false },
      { id: "s3", weight: "100", reps: "5", duration: "", distance: "", rpe: "", done: false, warmup: false },
    ],
  },
  {
    id: "2", name: "OHP", emoji: "🙌", category: "strength", notes: "",
    sets: [
      { id: "s4", weight: "60", reps: "8", duration: "", distance: "", rpe: "", done: false, warmup: false },
      { id: "s5", weight: "60", reps: "8", duration: "", distance: "", rpe: "", done: false, warmup: false },
    ],
  },
  {
    id: "3", name: "Running", emoji: "🏃", category: "cardio", notes: "",
    sets: [
      { id: "c1", weight: "", reps: "", duration: "10:00", distance: "2.0", rpe: "6", done: false, warmup: false },
      { id: "c2", weight: "", reps: "", duration: "8:30", distance: "1.7", rpe: "7", done: false, warmup: false },
    ],
  },
  {
    id: "4", name: "Cycling", emoji: "🚴", category: "cardio", notes: "",
    sets: [
      { id: "c3", weight: "", reps: "", duration: "15:00", distance: "5.0", rpe: "7", done: false, warmup: false },
    ],
  },
];

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}

export function ActiveWorkoutScreen() {
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(0);
  const [exercises, setExercises] = useState<WExercise[]>(INIT_EXERCISES);
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showFinish, setShowFinish] = useState(false);
  const [expanded, setExpanded] = useState<string | null>("1");

  useEffect(() => {
    const iv = setInterval(() => setElapsed(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const completedSets = exercises.flatMap(e => e.sets.filter(s => s.done && !s.warmup)).length;
  const totalSets = exercises.flatMap(e => e.sets.filter(s => !s.warmup)).length;

  const toggleSet = (eid: string, sid: string) =>
    setExercises(es => es.map(ex => ex.id === eid
      ? { ...ex, sets: ex.sets.map(s => s.id === sid ? { ...s, done: !s.done } : s) }
      : ex));

  const updateSet = (eid: string, sid: string, field: "weight" | "reps" | "rpe" | "duration" | "distance", val: string) =>
    setExercises(es => es.map(ex => ex.id === eid
      ? { ...ex, sets: ex.sets.map(s => s.id === sid ? { ...s, [field]: val } : s) }
      : ex));

  const addSet = (eid: string) =>
    setExercises(es => es.map(ex => {
      if (ex.id !== eid) return ex;
      const last = ex.sets.filter(s => !s.warmup).at(-1);
      const newSet = ex.category === "cardio"
        ? newCardioSet()
        : newStrengthSet(last?.weight, last?.reps);
      return { ...ex, sets: [...ex.sets, newSet] };
    }));

  const addExercise = (category: "strength" | "cardio" = "strength") => {
    const newEx: WExercise = {
      id: Date.now().toString(), name: category === "cardio" ? "Cardio" : "New Exercise",
      emoji: category === "cardio" ? "🏃" : "💪",
      category, notes: "",
      sets: category === "cardio"
        ? [newCardioSet()]
        : [newStrengthSet()],
    };
    setExercises(es => [...es, newEx]);
    setExpanded(newEx.id);
  };

  const cellInput = {
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px", color: "white", outline: "none",
    padding: "7px 6px", fontSize: "13px", textAlign: "center" as const,
    caretColor: "#00d4a8", width: "100%",
  };

  return (
    <div className="min-h-full pb-6" style={{ background: "#080e0e" }}>
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 px-4 pt-12 pb-3"
        style={{ background: "rgba(8,14,14,0.95)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
            <X size={13} /> Discard
          </button>
          <div className="text-center">
            <p className="text-white text-[18px] font-extrabold tabular-nums" style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatTime(elapsed)}
            </p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              {completedSets}/{totalSets} work sets done
            </p>
          </div>
          <button
            onClick={() => setShowFinish(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold"
            style={{ background: "linear-gradient(135deg, #00d4a8, #22c55e)", color: "black" }}>
            <Check size={13} strokeWidth={3} /> Finish
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-2.5 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${totalSets ? (completedSets / totalSets) * 100 : 0}%`,
              background: "linear-gradient(90deg, #00d4a8, #22c55e)",
              boxShadow: "0 0 8px rgba(0,212,168,0.6)",
            }}
          />
        </div>
      </div>

      {/* Exercises */}
      <div className="px-4 pt-4 flex flex-col gap-3">
        {exercises.map(ex => (
          <div key={ex.id}
            className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}
              className="w-full flex items-center gap-3 p-3.5">
              <span className="text-xl">{ex.emoji}</span>
              <p className="text-white text-[14px] font-bold flex-1 text-left">{ex.name}</p>
              <span className="text-[11px] mr-1" style={{ color: "rgba(255,255,255,0.38)" }}>
                {ex.sets.filter(s => s.done && !s.warmup).length}/{ex.sets.filter(s => !s.warmup).length}
              </span>
              <ChevronDown size={15} color="rgba(255,255,255,0.4)"
                style={{ transform: expanded === ex.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>

            {expanded === ex.id && (
              <div className="px-3.5 pb-3.5">
                {/* Headers */}
                {ex.category === "cardio" ? (
                  <div className="grid gap-2 mb-1.5" style={{ gridTemplateColumns: "32px 1fr 1fr 1fr 36px" }}>
                    {["Set", "Time", "Dist", "RPE", ""].map(h => (
                      <span key={h} className="text-[10px] font-semibold uppercase text-center"
                        style={{ color: "rgba(255,255,255,0.28)" }}>{h}</span>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-2 mb-1.5" style={{ gridTemplateColumns: "32px 1fr 1fr 1fr 36px" }}>
                    {["Set", "kg", "Reps", "RPE", ""].map(h => (
                      <span key={h} className="text-[10px] font-semibold uppercase text-center"
                        style={{ color: "rgba(255,255,255,0.28)" }}>{h}</span>
                    ))}
                  </div>
                )}

                {ex.sets.map((set) => (
                  <div key={set.id}
                    className="grid gap-2 mb-2 items-center transition-all"
                    style={{
                      gridTemplateColumns: "32px 1fr 1fr 1fr 36px",
                      opacity: set.done ? 0.55 : 1,
                    }}>
                    <div className="text-center">
                      {set.warmup
                        ? <span className="text-[11px] font-bold" style={{ color: "#f59e0b" }}>W</span>
                        : <span className="text-[12px] font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>
                          {ex.sets.filter(s => !s.warmup).indexOf(set) + 1}
                        </span>
                      }
                    </div>
                    {ex.category === "cardio" ? (
                      <>
                        <input
                          style={cellInput}
                          value={set.duration}
                          placeholder="mm:ss"
                          onChange={e => updateSet(ex.id, set.id, "duration", e.target.value)}
                        />
                        <input
                          style={cellInput}
                          value={set.distance}
                          placeholder="km"
                          onChange={e => updateSet(ex.id, set.id, "distance", e.target.value)}
                        />
                        <input
                          style={cellInput}
                          value={set.rpe}
                          placeholder="–"
                          onChange={e => updateSet(ex.id, set.id, "rpe", e.target.value)}
                        />
                      </>
                    ) : (
                      <>
                        <input
                          style={{ ...cellInput, textDecoration: set.done ? "line-through" : "none" }}
                          value={set.weight}
                          onChange={e => updateSet(ex.id, set.id, "weight", e.target.value)}
                        />
                        <input
                          style={{ ...cellInput, textDecoration: set.done ? "line-through" : "none" }}
                          value={set.reps}
                          onChange={e => updateSet(ex.id, set.id, "reps", e.target.value)}
                        />
                        <input
                          style={cellInput}
                          value={set.rpe}
                          placeholder="–"
                          onChange={e => updateSet(ex.id, set.id, "rpe", e.target.value)}
                        />
                      </>
                    )}
                    <button
                      onClick={() => toggleSet(ex.id, set.id)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
                      style={{
                        background: set.done ? "#00d4a8" : "rgba(255,255,255,0.07)",
                        border: set.done ? "none" : "1px solid rgba(255,255,255,0.12)",
                      }}>
                      {set.done && <Check size={15} color="black" strokeWidth={3} />}
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addSet(ex.id)}
                  className="w-full py-2 mt-1 rounded-xl flex items-center justify-center gap-1.5 text-[12px] font-semibold"
                  style={{ background: "rgba(0,212,168,0.07)", border: "1px dashed rgba(0,212,168,0.2)", color: "#00d4a8" }}>
                  <Plus size={12} /> Add Set
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add Exercise buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => addExercise("strength")}
            className="flex-1 p-4 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98]"
            style={{ background: "rgba(59,130,246,0.08)", border: "1px dashed rgba(59,130,246,0.25)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(59,130,246,0.15)" }}>
              <Plus size={18} color="#3b82f6" />
            </div>
            <p className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Strength</p>
          </button>
          <button
            onClick={() => addExercise("cardio")}
            className="flex-1 p-4 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98]"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px dashed rgba(245,158,11,0.25)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(245,158,11,0.15)" }}>
              <Plus size={18} color="#f59e0b" />
            </div>
            <p className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Cardio</p>
          </button>
        </div>

        {/* Session meta */}
        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
            Session Notes
          </p>
          <div className="flex gap-2 mb-3">
            {["😴", "😐", "😊", "💪", "🔥"].map(m => (
              <button key={m} onClick={() => setMood(m)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90"
                style={{
                  background: mood === m ? "rgba(0,212,168,0.2)" : "rgba(255,255,255,0.06)",
                  border: mood === m ? "1px solid rgba(0,212,168,0.4)" : "1px solid transparent",
                }}>
                {m}
              </button>
            ))}
          </div>
          <div className="flex items-start gap-2.5">
            <FileText size={14} color="rgba(255,255,255,0.3)" className="mt-2" />
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="How did this session feel? Any notes…"
              rows={2}
              className="flex-1 bg-transparent outline-none text-[13px] resize-none"
              style={{ color: "rgba(255,255,255,0.7)", caretColor: "#00d4a8" }}
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <MapPin size={12} color="rgba(255,255,255,0.3)" />
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>Fitness First — City Centre</span>
          </div>
        </div>
      </div>

      {/* Finish Modal */}
      {showFinish && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowFinish(false)}>
          <div className="w-full max-w-[390px] rounded-t-3xl p-6"
            style={{ background: "#111d1b", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
            </div>
            <p className="text-white text-xl font-extrabold text-center mb-1">Finish Workout?</p>
            <p className="text-[13px] text-center mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
              {formatTime(elapsed)} elapsed · {completedSets}/{totalSets} sets completed
            </p>
            <div className="flex items-center gap-3 mb-3">
              <Smile size={16} color="#00d4a8" />
              <div className="flex gap-2">
                {["😴", "😐", "😊", "💪", "🔥"].map(m => (
                  <button key={m} onClick={() => setMood(m)}
                    className="text-xl transition-all" style={{ opacity: mood && mood !== m ? 0.4 : 1 }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => navigate("/train/history/new")}
              className="w-full py-4 rounded-2xl text-[15px] font-extrabold text-black mb-2.5 transition-all active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #00d4a8, #22c55e)",
                boxShadow: "0 4px 20px rgba(0,212,168,0.35)",
              }}>
              ✓ Finish & Save
            </button>
            <button onClick={() => setShowFinish(false)}
              className="w-full py-3 rounded-2xl text-[14px] font-semibold"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}>
              Keep going
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
