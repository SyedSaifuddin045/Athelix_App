import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Plus, Trash2, GripVertical, ChevronDown } from "lucide-react";

interface TemplateSet {
  reps: string; rpe: string; rest: string;
}
interface TemplateExercise {
  id: string; name: string; emoji: string;
  sets: TemplateSet[]; notes: string;
}

const DEFAULT_EXERCISES: TemplateExercise[] = [
  { id: "1", name: "Bench Press", emoji: "🏋️", notes: "",
    sets: [{ reps: "5", rpe: "7", rest: "3:00" }, { reps: "5", rpe: "8", rest: "3:00" }, { reps: "5", rpe: "9", rest: "3:00" }] },
  { id: "2", name: "OHP", emoji: "🙌", notes: "",
    sets: [{ reps: "8", rpe: "7", rest: "2:00" }, { reps: "8", rpe: "8", rest: "2:00" }] },
];

export function TemplateBuilderScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id && id !== "new";

  const [name, setName] = useState(isEdit ? "Upper Body Push" : "");
  const [exercises, setExercises] = useState<TemplateExercise[]>(isEdit ? DEFAULT_EXERCISES : []);
  const [expanded, setExpanded] = useState<string | null>(isEdit ? "1" : null);

  const addExercise = () => {
    const newEx: TemplateExercise = {
      id: Date.now().toString(),
      name: "New Exercise", emoji: "💪",
      sets: [{ reps: "8", rpe: "7", rest: "2:00" }],
      notes: "",
    };
    setExercises(e => [...e, newEx]);
    setExpanded(newEx.id);
  };

  const removeExercise = (eid: string) =>
    setExercises(e => e.filter(ex => ex.id !== eid));

  const addSet = (eid: string) =>
    setExercises(e => e.map(ex => ex.id === eid
      ? { ...ex, sets: [...ex.sets, { reps: "8", rpe: "7", rest: "2:00" }] }
      : ex));

  const removeSet = (eid: string, si: number) =>
    setExercises(e => e.map(ex => ex.id === eid
      ? { ...ex, sets: ex.sets.filter((_, i) => i !== si) }
      : ex));

  const updateSet = (eid: string, si: number, field: keyof TemplateSet, val: string) =>
    setExercises(e => e.map(ex => ex.id === eid
      ? { ...ex, sets: ex.sets.map((s, i) => i === si ? { ...s, [field]: val } : s) }
      : ex));

  const inputStyle = {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px", color: "white", outline: "none",
    padding: "8px", fontSize: "13px", textAlign: "center" as const,
    caretColor: "#00d4a8", width: "100%",
  };

  return (
    <div className="min-h-full pb-8"
      style={{ background: "#080e0e", fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-13 pb-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <ArrowLeft size={16} color="white" />
        </button>
        <p className="text-white text-[15px] font-bold">{isEdit ? "Edit Template" : "New Template"}</p>
        <button
          onClick={() => navigate("/train/templates")}
          className="px-4 py-1.5 rounded-xl text-[13px] font-bold transition-all active:scale-90"
          style={{ background: "linear-gradient(135deg, #00d4a8, #22c55e)", color: "black" }}>
          Save
        </button>
      </div>

      <div className="px-4 pt-4">
        {/* Template Name */}
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Template name (e.g. Push Day A)"
          style={{
            ...inputStyle, textAlign: "left" as const,
            width: "100%", padding: "14px 16px",
            fontSize: "16px", fontWeight: "600",
            borderRadius: "16px",
          }}
        />

        {/* Exercises */}
        <div className="flex flex-col gap-3 mt-4">
          {exercises.map((ex, ei) => (
            <div key={ex.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Exercise Header */}
              <div className="flex items-center gap-3 p-3.5">
                <GripVertical size={16} color="rgba(255,255,255,0.2)" />
                <span className="text-lg">{ex.emoji}</span>
                <p className="text-white text-[13px] font-semibold flex-1">{ex.name}</p>
                <button onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}>
                  <ChevronDown size={16} color="rgba(255,255,255,0.4)"
                    style={{ transform: expanded === ex.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                <button onClick={() => removeExercise(ex.id)}>
                  <Trash2 size={15} color="rgba(239,68,68,0.6)" />
                </button>
              </div>

              {/* Expanded Sets */}
              {expanded === ex.id && (
                <div className="px-3.5 pb-3.5">
                  {/* Column headers */}
                  <div className="grid grid-cols-4 gap-2 mb-2 px-2">
                    {["Set", "Reps", "RPE", "Rest"].map(h => (
                      <span key={h} className="text-[10px] font-semibold uppercase text-center"
                        style={{ color: "rgba(255,255,255,0.3)" }}>{h}</span>
                    ))}
                  </div>
                  {ex.sets.map((set, si) => (
                    <div key={si} className="grid grid-cols-4 gap-2 mb-2 items-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[12px] font-bold" style={{ color: "#00d4a8" }}>{si + 1}</span>
                        {ex.sets.length > 1 && (
                          <button onClick={() => removeSet(ex.id, si)}>
                            <Trash2 size={11} color="rgba(239,68,68,0.5)" />
                          </button>
                        )}
                      </div>
                      <input style={inputStyle} value={set.reps}
                        onChange={e => updateSet(ex.id, si, "reps", e.target.value)} />
                      <input style={inputStyle} value={set.rpe}
                        onChange={e => updateSet(ex.id, si, "rpe", e.target.value)} />
                      <input style={inputStyle} value={set.rest}
                        onChange={e => updateSet(ex.id, si, "rest", e.target.value)} />
                    </div>
                  ))}
                  <button
                    onClick={() => addSet(ex.id)}
                    className="w-full py-2 rounded-xl flex items-center justify-center gap-1.5 mt-1 text-[12px] font-semibold transition-all"
                    style={{ background: "rgba(0,212,168,0.08)", border: "1px dashed rgba(0,212,168,0.25)", color: "#00d4a8" }}>
                    <Plus size={13} /> Add Set
                  </button>

                  {/* Notes */}
                  <input
                    type="text"
                    placeholder="Notes (optional)…"
                    className="mt-2.5 w-full"
                    style={{ ...inputStyle, textAlign: "left" as const, padding: "9px 12px" }}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Add Exercise */}
          <button
            onClick={addExercise}
            className="rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.12)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,212,168,0.12)" }}>
              <Plus size={18} color="#00d4a8" />
            </div>
            <div>
              <p className="text-white text-[13px] font-semibold">Add Exercise</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Search from exercise library</p>
            </div>
          </button>

          {exercises.length === 0 && (
            <div className="text-center py-8">
              <p className="text-3xl mb-3">📋</p>
              <p className="text-white text-[14px] font-semibold">No exercises yet</p>
              <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.38)" }}>
                Tap "Add Exercise" to build your template
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
