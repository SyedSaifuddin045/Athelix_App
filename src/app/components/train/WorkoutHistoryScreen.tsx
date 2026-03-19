import { useNavigate } from "react-router";
import { ArrowLeft, ChevronRight, Trophy, Clock, Dumbbell } from "lucide-react";

const SESSIONS = [
  { id: "1", name: "Upper Body Push", date: "Today", time: "6:30 AM", duration: 52, sets: 18, volume: "8.4k kg", prs: 1, mood: "💪" },
  { id: "2", name: "Lower Body Power", date: "Yesterday", time: "5:45 PM", duration: 61, sets: 22, volume: "12.2k kg", prs: 0, mood: "😊" },
  { id: "3", name: "Pull Day", date: "Mon, Mar 16", time: "7:00 AM", duration: 48, sets: 20, volume: "7.8k kg", prs: 0, mood: "😐" },
  { id: "4", name: "Upper Body Push", date: "Sat, Mar 14", time: "10:00 AM", duration: 55, sets: 19, volume: "8.1k kg", prs: 2, mood: "🔥" },
  { id: "5", name: "Lower Body Power", date: "Thu, Mar 12", time: "6:00 PM", duration: 58, sets: 21, volume: "11.9k kg", prs: 0, mood: "💪" },
  { id: "6", name: "Pull Day", date: "Tue, Mar 10", time: "7:15 AM", duration: 47, sets: 18, volume: "7.5k kg", prs: 1, mood: "😊" },
  { id: "7", name: "Full Body Power", date: "Sun, Mar 8", time: "9:30 AM", duration: 72, sets: 16, volume: "9.2k kg", prs: 0, mood: "😴" },
];

const WEEKS: Record<string, typeof SESSIONS[0][]> = {
  "This Week": SESSIONS.slice(0, 3),
  "Last Week": SESSIONS.slice(3, 6),
  "2 Weeks Ago": SESSIONS.slice(6),
};

export function WorkoutHistoryScreen() {
  const navigate = useNavigate();

  const totalVol = SESSIONS.reduce((a, s) => a + parseFloat(s.volume.replace("k", "")) * 1000, 0);

  return (
    <div className="min-h-full pb-6"
      style={{ background: "linear-gradient(180deg, #0a1218 0%, #080e0e 28%, #080e0e 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-44 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,180,140,0.12) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative flex items-center gap-3 px-5 pt-13 pb-4">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <ArrowLeft size={16} color="white" />
        </button>
        <div>
          <h1 className="text-white text-[17px] font-bold">Workout History</h1>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>{SESSIONS.length} sessions shown</p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="px-5 mb-4">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Total Sessions", value: "248" },
            { label: "Total Volume", value: `${Math.round(totalVol / 1000)}k kg` },
            { label: "Best Streak", value: "14 days" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-white text-[15px] font-extrabold">{s.value}</p>
              <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grouped Sessions */}
      <div className="px-4">
        {Object.entries(WEEKS).map(([week, sessions]) => (
          <div key={week} className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              {week}
            </p>
            <div className="flex flex-col gap-2">
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/train/history/${s.id}`)}
                  className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.07)" }}>
                    {s.mood}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[13px] font-semibold truncate">{s.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {s.date} · {s.time}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1">
                        <Clock size={10} color="rgba(255,255,255,0.3)" />
                        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{s.duration}m</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Dumbbell size={10} color="rgba(255,255,255,0.3)" />
                        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{s.sets} sets</span>
                      </div>
                      {s.prs > 0 && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(251,191,36,0.15)" }}>
                          <Trophy size={9} color="#fbbf24" />
                          <span className="text-[9px] font-bold" style={{ color: "#fbbf24" }}>{s.prs} PR</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
