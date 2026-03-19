import { useNavigate } from "react-router";
import { Settings, ChevronRight, Edit3, Scale, Trophy, TrendingUp, LogOut, User } from "lucide-react";

const STATS = [
  { label: "Workouts", value: "248" },
  { label: "Day Streak", value: "12" },
  { label: "All-time PRs", value: "9" },
];

const MENU_SECTIONS = [
  {
    label: "My Data",
    items: [
      { label: "Edit Profile", icon: User, path: "/profile/setup", color: "#00d4a8" },
      { label: "Bodyweight History", icon: Scale, path: "/profile/bodyweight", color: "#22c55e", badge: "82.4 kg" },
      { label: "Personal Records", icon: Trophy, path: "/progress/records", color: "#fbbf24" },
      { label: "Exercise Progress", icon: TrendingUp, path: "/progress/exercise/1", color: "#00d4a8" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Account Settings", icon: Settings, path: "/settings", color: "#8b5cf6" },
    ],
  },
];

const ACHIEVEMENTS = [
  { icon: "🏆", label: "100kg Bench", date: "Mar 2025" },
  { icon: "🔥", label: "14-Day Streak", date: "Jan 2026" },
  { icon: "💪", label: "100k kg Vol.", date: "Feb 2026" },
  { icon: "⚡", label: "Squat PR", date: "Mar 2026" },
];

export function ProfileScreen() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("fit_auth");
    navigate("/splash");
  };

  return (
    <div className="min-h-full pb-6"
      style={{ background: "linear-gradient(180deg, #0e0c1a 0%, #080e0e 30%, #080e0e 100%)" }}>
      <div className="absolute top-0 left-0 right-0 h-52 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(100,60,200,0.14) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pt-13 pb-4">
        <p className="text-white text-[17px] font-bold">Profile</p>
        <button onClick={() => navigate("/settings")}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <Settings size={16} color="rgba(255,255,255,0.65)" />
        </button>
      </div>

      {/* Avatar + Info */}
      <div className="px-5 flex flex-col items-center pb-5">
        <div className="relative mb-4">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-extrabold text-black"
            style={{
              background: "linear-gradient(135deg, #00d4a8, #22c55e)",
              boxShadow: "0 0 30px rgba(0,212,168,0.4)",
            }}
          >
            JD
          </div>
          <button
            onClick={() => navigate("/profile/setup")}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#111d1b", border: "2px solid #080e0e" }}>
            <Edit3 size={13} color="#00d4a8" />
          </button>
        </div>
        <p className="text-white text-xl font-extrabold">Jordan Davis</p>
        <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>@jordan_lifts</p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>Intermediate · 180cm · 82 kg</span>
        </div>

        {/* Stats Row */}
        <div className="flex items-center w-full mt-5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {STATS.map(({ label, value }, i, arr) => (
            <div key={label} className="flex-1 flex flex-col items-center py-4">
              <span className="text-[20px] font-extrabold"
                style={{ color: "#00d4a8", textShadow: "0 0 16px rgba(0,212,168,0.4)" }}>
                {value}
              </span>
              <span className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
              {i < arr.length - 1 && (
                <div className="absolute h-10" style={{
                  width: 1, background: "rgba(255,255,255,0.07)",
                  left: `${((i + 1) / arr.length) * 100}%`,
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Achievements Scroll */}
      <div className="mb-4">
        <div className="flex items-center justify-between px-5 mb-2.5">
          <p className="text-white text-[13px] font-semibold">Achievements</p>
          <span className="text-[11px]" style={{ color: "#00d4a8" }}>See All</span>
        </div>
        <div className="flex gap-3 px-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {ACHIEVEMENTS.map(a => (
            <div key={a.label}
              className="flex-shrink-0 rounded-2xl p-3.5"
              style={{ width: 110, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-2xl mb-2">{a.icon}</div>
              <p className="text-white text-[11px] font-semibold leading-tight">{a.label}</p>
              <p className="text-[10px] mt-1" style={{ color: "#00d4a8" }}>{a.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Sections */}
      {MENU_SECTIONS.map(section => (
        <div key={section.label} className="px-5 mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            {section.label}
          </p>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {section.items.map((item, i) => (
              <div key={item.label}>
                <button
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 transition-all active:bg-white/5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.color}18` }}>
                    <item.icon size={15} style={{ color: item.color }} />
                  </div>
                  <span className="flex-1 text-[13px] font-medium text-white text-left">{item.label}</span>
                  {"badge" in item && item.badge && (
                    <span className="text-[11px] font-semibold mr-1" style={{ color: "#00d4a8" }}>
                      {item.badge as string}
                    </span>
                  )}
                  <ChevronRight size={14} color="rgba(255,255,255,0.25)" />
                </button>
                {i < section.items.length - 1 && (
                  <div className="mx-4" style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Logout */}
      <div className="px-5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <LogOut size={15} color="#f87171" />
          <span className="text-[14px] font-semibold" style={{ color: "#f87171" }}>Sign Out</span>
        </button>
      </div>

      <p className="text-center text-[10px] mt-5" style={{ color: "rgba(255,255,255,0.18)" }}>
        FitTrack Pro v1.0.0 · member since Jan 2024
      </p>
    </div>
  );
}
