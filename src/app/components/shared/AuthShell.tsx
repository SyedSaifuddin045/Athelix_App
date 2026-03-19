import { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#040707", fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @media (min-width: 768px) {
          .auth-phone {
            border-radius: 44px !important;
            box-shadow: 0 0 0 1px rgba(255,255,255,0.07), 0 48px 96px rgba(0,0,0,0.95) !important;
          }
        }
        ::-webkit-scrollbar { display: none; }
      `}</style>
      <div
        className="auth-phone relative w-full md:max-w-[390px] overflow-y-auto"
        style={{ height: "100svh", maxHeight: "844px", background: "#080e0e", scrollbarWidth: "none" }}
      >
        {children}
      </div>
    </div>
  );
}
