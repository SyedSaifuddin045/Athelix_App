import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Play, Dumbbell, Clock, Zap } from "lucide-react";

const TEMPLATES = [
  { id: "1", name: "Upper Body Push", exercises: 5, sets: 20, duration: "~55 min", color: "#00d4a8", lastUsed: "Yesterday" },
  { id: "2", name: "Lower Body Power", exercises: 5, sets: 22, duration: "~65 min", color: "#22c55e", lastUsed: "3 days ago" },
  { id: "3", name: "Pull Day", exercises: 6, sets: 24, duration: "~55 min", color: "#3b82f6", lastUsed: "4 days ago" },
  { id: "4", name: "Upper Body Pull", exercises: 5, sets: 18, duration: "~50 min", color: "#8b5cf6", lastUsed: "1 week ago" },
];

const MESOCYCLES = [
  { id: "1", name: "Strength Block", week: "Week 3/6", color: "#00d4a8" },
  { id: "2", name: "Hypertrophy Phase", week: "Not started", color: "#8b5cf6" },
];

export function StartWorkoutScreen() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedMeso, setSelectedMeso] = useState<string | null>("1");

  const handleStart = () => navigate("/train/active");

  return (
    <div className="min-h-full pb-8"
      style={{ background: "linear-gradient(180deg, #0a1a18 0%, #080e0e 30%, #080e0e 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-52 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(0,180,140,0.2) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative flex items-center gap-3 px-5 pt-13 pb-5">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <ArrowLeft size={16} color="white" />
        </button>
        <div>
          <h1 className="text-white text-[17px] font-bold">Start Workout</h1>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>Choose how to begin</p>
        </div>
      </div>

      {/* Empty Workout */}
      <div className="px-5 mb-5">
        <button
          onClick={handleStart}
          className="w-full p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, rgba(0,212,168,0.12), rgba(34,197,94,0.08))",
            border: "1px solid rgba(0,212,168,0.3)",
          }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(0,212,168,0.2)" }}>
            <Zap size={22} color="#00d4a8" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white text-[15px] font-bold">Empty Workout</p>
            <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>Start from scratch, add exercises as you go</p>
          </div>
          <Play size={20} color="#00d4a8" fill="#00d4a8" />
        </button>
      </div>

      {/* Attach to Mesocycle (optional) */}
      <div className="px-5 mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
          Attach to Mesocycle (optional)
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setSelectedMeso(null)}
            className="p-3 rounded-xl text-left transition-all"
            style={{
              background: selectedMeso === null ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
              border: selectedMeso === null ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.07)",
            }}>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: selectedMeso === null ? "#00d4a8" : "rgba(255,255,255,0.3)" }}>
                {selectedMeso === null && <div className="w-2 h-2 rounded-full" style={{ background: "#00d4a8" }} />}
              </div>
              <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.6)" }}>No mesocycle</span>
            </div>
          </button>
          {MESOCYCLES.map(m => (
            <button key={m.id} onClick={() => setSelectedMeso(m.id)}
              className="p-3 rounded-xl text-left transition-all"
              style={{
                background: selectedMeso === m.id ? `${m.color}12` : "rgba(255,255,255,0.03)",
                border: selectedMeso === m.id ? `1px solid ${m.color}40` : "1px solid rgba(255,255,255,0.07)",
              }}>
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: selectedMeso === m.id ? m.color : "rgba(255,255,255,0.3)" }}>
                  {selectedMeso === m.id && <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />}
                </div>
                <div>
                  <p className="text-white text-[13px] font-semibold">{m.name}</p>
                  <p className="text-[10px]" style={{ color: m.color }}>{m.week}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Templates */}
      <div className="px-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
          From Template
        </p>
        <div className="flex flex-col gap-2.5">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(selectedTemplate === t.id ? null : t.id)}
              className="w-full p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
              style={{
                background: selectedTemplate === t.id ? `${t.color}12` : "rgba(255,255,255,0.04)",
                border: selectedTemplate === t.id ? `1px solid ${t.color}40` : "1px solid rgba(255,255,255,0.08)",
              }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: selectedTemplate === t.id ? t.color : "rgba(255,255,255,0.3)" }}>
                    {selectedTemplate === t.id && <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />}
                  </div>
                  <div>
                    <p className="text-white text-[14px] font-semibold">{t.name}</p>
                    <div className="flex gap-3 mt-0.5">
                      <div className="flex items-center gap-1">
                        <Dumbbell size={10} color="rgba(255,255,255,0.3)" />
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{t.exercises} exercises</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={10} color="rgba(255,255,255,0.3)" />
                        <span className="text-[10px]" style={{ color: "rgba(255,255,168,0.4)" }}>{t.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Used {t.lastUsed}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Start CTA */}
        {(selectedTemplate || true) && (
          <button
            onClick={handleStart}
            className="w-full mt-5 py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #00d4a8, #22c55e)",
              boxShadow: "0 4px 24px rgba(0,212,168,0.4)",
            }}>
            <Play size={18} color="black" fill="black" />
            <span className="text-black text-[15px] font-extrabold">
              {selectedTemplate ? `Start with ${TEMPLATES.find(t => t.id === selectedTemplate)?.name}` : "Start Workout"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
