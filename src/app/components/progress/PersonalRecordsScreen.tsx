import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Trophy, ChevronRight, TrendingUp } from "lucide-react";

const ALL_PRS = [
  { id: "1", exercise: "Bench Press", exerciseId: "1", emoji: "🏋️",
    records: [
      { type: "1RM", value: "115 kg", date: "Mar 15, 2026", isNew: true },
      { type: "3RM", value: "110 kg", date: "Mar 15, 2026", isNew: false },
      { type: "5RM", value: "102.5 kg", date: "Feb 28, 2026", isNew: false },
    ]},
  { id: "2", exercise: "Back Squat", exerciseId: "2", emoji: "🦵",
    records: [
      { type: "1RM", value: "160 kg", date: "Feb 20, 2026", isNew: false },
      { type: "3RM", value: "145 kg", date: "Mar 10, 2026", isNew: true },
      { type: "5RM", value: "135 kg", date: "Jan 15, 2026", isNew: false },
    ]},
  { id: "3", exercise: "Deadlift", exerciseId: "3", emoji: "💪",
    records: [
      { type: "1RM", value: "200 kg", date: "Jan 30, 2026", isNew: false },
      { type: "3RM", value: "185 kg", date: "Feb 14, 2026", isNew: false },
      { type: "5RM", value: "175 kg", date: "Mar 1, 2026", isNew: true },
    ]},
  { id: "4", exercise: "Overhead Press", exerciseId: "4", emoji: "🙌",
    records: [
      { type: "1RM", value: "85 kg", date: "Mar 5, 2026", isNew: true },
      { type: "5RM", value: "75 kg", date: "Feb 22, 2026", isNew: false },
    ]},
  { id: "5", exercise: "Pull-up", exerciseId: "5", emoji: "⬆️",
    records: [
      { type: "1RM", value: "BW+50 kg", date: "Feb 10, 2026", isNew: false },
      { type: "5RM", value: "BW+35 kg", date: "Mar 8, 2026", isNew: true },
    ]},
];

const TYPES = ["All", "1RM", "3RM", "5RM"];

export function PersonalRecordsScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = ALL_PRS.filter(pr =>
    pr.exercise.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-full pb-6"
      style={{ background: "linear-gradient(180deg, #130f00 0%, #080e0e 30%, #080e0e 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-52 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(251,191,36,0.14) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative flex items-center gap-3 px-5 pt-13 pb-4">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <ArrowLeft size={16} color="white" />
        </button>
        <div>
          <h1 className="text-white text-[17px] font-bold">Personal Records</h1>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>
            Automatically tracked · read-only
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="px-5 mb-4">
        <div className="rounded-xl px-3.5 py-2.5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            PRs are automatically derived from completed sessions. They recalculate when sessions are edited or deleted.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 mb-3">
        <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <Trophy size={14} color="rgba(255,255,255,0.35)" />
          <input
            type="text"
            placeholder="Search exercises…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[13px]"
            style={{ color: "white", caretColor: "#fbbf24" }}
          />
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 px-5 mb-4">
        {TYPES.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className="px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all"
            style={{
              background: filter === t ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.06)",
              border: filter === t ? "1px solid rgba(251,191,36,0.4)" : "1px solid rgba(255,255,255,0.08)",
              color: filter === t ? "#fbbf24" : "rgba(255,255,255,0.5)",
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* PR Cards */}
      <div className="px-4 flex flex-col gap-3">
        {filtered.map(pr => (
          <div key={pr.id}
            className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Exercise header */}
            <button
              onClick={() => navigate(`/progress/exercise/${pr.exerciseId}`)}
              className="w-full flex items-center gap-3 px-4 py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-xl">{pr.emoji}</span>
              <p className="text-white text-[14px] font-bold flex-1 text-left">{pr.exercise}</p>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={13} color="rgba(255,255,255,0.3)" />
                <ChevronRight size={13} color="rgba(255,255,255,0.2)" />
              </div>
            </button>

            {/* Records */}
            <div className="px-4 py-3 flex flex-col gap-2.5">
              {pr.records
                .filter(r => filter === "All" || r.type === filter)
                .map(r => (
                  <div key={r.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(251,191,36,0.12)" }}>
                        <Trophy size={13} color="#fbbf24" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>{r.type}</p>
                        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{r.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-white text-[17px] font-extrabold"
                        style={{ color: "#fbbf24", filter: "drop-shadow(0 0 5px rgba(251,191,36,0.5))" }}>
                        {r.value}
                      </p>
                      {r.isNew && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{ background: "rgba(0,212,168,0.2)", color: "#00d4a8" }}>
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
