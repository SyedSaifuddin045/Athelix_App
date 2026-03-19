import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, Trash2, X, Check } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";

const INITIAL_ENTRIES = [
  { id: "1", date: "Mar 18, 2026", weight: 82.4, note: "Morning, post-workout" },
  { id: "2", date: "Mar 15, 2026", weight: 82.7, note: "" },
  { id: "3", date: "Mar 12, 2026", weight: 83.0, note: "After cheat day" },
  { id: "4", date: "Mar 9, 2026", weight: 82.8, note: "" },
  { id: "5", date: "Mar 6, 2026", weight: 83.3, note: "" },
  { id: "6", date: "Mar 3, 2026", weight: 83.1, note: "" },
  { id: "7", date: "Feb 28, 2026", weight: 83.6, note: "" },
  { id: "8", date: "Feb 24, 2026", weight: 83.9, note: "" },
  { id: "9", date: "Feb 20, 2026", weight: 84.1, note: "" },
  { id: "10", date: "Feb 16, 2026", weight: 84.3, note: "" },
];

const chartData = [
  { date: "Feb 16", w: 84.3 }, { date: "Feb 20", w: 84.1 },
  { date: "Feb 24", w: 83.9 }, { date: "Feb 28", w: 83.6 },
  { date: "Mar 3", w: 83.1 }, { date: "Mar 6", w: 83.3 },
  { date: "Mar 9", w: 82.8 }, { date: "Mar 12", w: 83.0 },
  { date: "Mar 15", w: 82.7 }, { date: "Mar 18", w: 82.4 },
];

export function BodyweightHistoryScreen() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState(INITIAL_ENTRIES);
  const [showAdd, setShowAdd] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newNote, setNewNote] = useState("");

  const handleAdd = () => {
    if (!newWeight) return;
    const entry = {
      id: Date.now().toString(),
      date: "Mar 18, 2026",
      weight: parseFloat(newWeight),
      note: newNote,
    };
    setEntries(e => [entry, ...e]);
    setShowAdd(false);
    setNewWeight("");
    setNewNote("");
  };

  const handleDelete = (id: string) =>
    setEntries(e => e.filter(en => en.id !== id));

  const latest = entries[0]?.weight || 82.4;
  const prev = entries[entries.length - 1]?.weight || 84.3;
  const change = latest - prev;

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
        <p className="text-white text-[15px] font-bold">Bodyweight</p>
        <button
          onClick={() => setShowAdd(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,212,168,0.15)", border: "1px solid rgba(0,212,168,0.3)" }}>
          <Plus size={16} color="#00d4a8" />
        </button>
      </div>

      {/* Current + Change */}
      <div className="px-5 mb-4">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-extrabold text-white">{latest}</span>
          <span className="text-lg" style={{ color: "rgba(255,255,255,0.4)" }}>kg</span>
          <span className="text-[14px] font-bold" style={{ color: change < 0 ? "#22c55e" : "#ef4444" }}>
            {change < 0 ? "↓" : "↑"} {Math.abs(change).toFixed(1)} kg
          </span>
        </div>
        <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.38)" }}>
          vs. 30 days ago ({prev} kg)
        </p>
      </div>

      {/* Chart */}
      <div className="px-4 mb-4">
        <div className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ height: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4a8" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#00d4a8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false}
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontFamily: "Inter" }}
                  interval={2} />
                <YAxis hide domain={["dataMin - 0.5", "dataMax + 0.5"]} />
                <Tooltip contentStyle={{
                  background: "#111", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px", fontSize: "11px", color: "white",
                }} formatter={(v: number) => [`${v} kg`, "Weight"]} />
                <ReferenceLine y={82.4} stroke="rgba(0,212,168,0.3)" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="w" stroke="#00d4a8" strokeWidth={2.5}
                  fill="url(#bwGrad)" dot={false}
                  activeDot={{ r: 5, fill: "#00d4a8", stroke: "none" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="px-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
          All Entries
        </p>
        <div className="flex flex-col gap-2">
          {entries.map((entry, i) => (
            <div key={entry.id}
              className="flex items-center gap-3 p-3.5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-white text-[16px] font-bold" style={{ color: i === 0 ? "#00d4a8" : "white" }}>
                    {entry.weight} kg
                  </span>
                  {i === 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(0,212,168,0.2)", color: "#00d4a8" }}>
                      Latest
                    </span>
                  )}
                  {i > 0 && (
                    <span className="text-[11px]" style={{
                      color: entry.weight < entries[i - 1]?.weight ? "#22c55e" : "#f87171",
                    }}>
                      {entry.weight < entries[i - 1]?.weight ? "↓" : "↑"}
                      {Math.abs(entry.weight - (entries[i - 1]?.weight || entry.weight)).toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
                  {entry.date}{entry.note ? ` · ${entry.note}` : ""}
                </p>
              </div>
              <button onClick={() => handleDelete(entry.id)}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(239,68,68,0.1)" }}>
                <Trash2 size={13} color="rgba(239,68,68,0.7)" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-[390px] rounded-t-3xl p-6"
            style={{ background: "#111d1b", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <p className="text-white text-[17px] font-bold">Log Bodyweight</p>
              <button onClick={() => setShowAdd(false)}>
                <X size={18} color="rgba(255,255,255,0.5)" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-[11px] font-semibold mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                Weight (kg)
              </label>
              <input
                type="number"
                placeholder="e.g. 82.5"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                className="w-full text-center text-2xl font-bold"
                style={{
                  background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "16px", color: "white", padding: "16px",
                  outline: "none", caretColor: "#00d4a8",
                }}
                autoFocus
              />
            </div>
            <div className="mb-5">
              <label className="block text-[11px] font-semibold mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                Note (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Morning, fasted"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "14px", color: "white", padding: "12px 16px",
                  fontSize: "14px", width: "100%", outline: "none", caretColor: "#00d4a8",
                }}
              />
            </div>
            <button
              onClick={handleAdd}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-[15px] font-bold text-black transition-all active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #00d4a8, #22c55e)" }}>
              <Check size={16} strokeWidth={3} color="black" /> Save Entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
