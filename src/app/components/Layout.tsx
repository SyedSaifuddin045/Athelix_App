import { Outlet, useLocation, useNavigate } from "react-router";
import { Home, Compass, Dumbbell, TrendingUp, User } from "lucide-react";

const NAV_TABS = [
  { path: "/", label: "Home", icon: Home },
  { path: "/explore", label: "Explore", icon: Compass },
  { path: "/train", label: "Train", icon: Dumbbell },
  { path: "/progress", label: "Progress", icon: TrendingUp },
  { path: "/profile", label: "Profile", icon: User },
];

const MAIN_PATHS = ["/", "/explore", "/train", "/progress", "/profile"];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const showNav = MAIN_PATHS.includes(location.pathname);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#040707", fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @media (min-width: 768px) {
          .fit-phone {
            border-radius: 44px !important;
            box-shadow: 0 0 0 1px rgba(255,255,255,0.07), 0 48px 96px rgba(0,0,0,0.95) !important;
          }
        }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div
        className="fit-phone relative w-full md:max-w-[390px] flex flex-col overflow-hidden"
        style={{ height: "100svh", maxHeight: "844px", background: "#080e0e" }}
      >
        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: "none" }}>
          <Outlet />
        </main>

        {showNav && (
          <div
            className="flex-shrink-0 relative z-50"
            style={{
              background: "rgba(8,14,14,0.98)",
              backdropFilter: "blur(24px)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingBottom: "env(safe-area-inset-bottom, 8px)",
            }}
          >
            <div className="flex items-center justify-around px-1 py-2">
              {NAV_TABS.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-90"
                  >
                    <div style={{ filter: isActive ? "drop-shadow(0 0 8px #00d4a8)" : "none" }}>
                      <Icon size={22} style={{ color: isActive ? "#00d4a8" : "#374151" }} />
                    </div>
                    {isActive && (
                      <div
                        className="absolute rounded-full"
                        style={{
                          width: "3px", height: "3px",
                          background: "#00d4a8",
                          boxShadow: "0 0 5px #00d4a8",
                          marginTop: "28px",
                        }}
                      />
                    )}
                    <span
                      className="text-[10px]"
                      style={{ color: isActive ? "#00d4a8" : "#374151", fontWeight: isActive ? 600 : 400 }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
