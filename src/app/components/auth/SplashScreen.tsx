import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AuthShell } from "../shared/AuthShell";

export function SplashScreen() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing…");

  useEffect(() => {
    const steps = [
      { pct: 20, label: "Fetching app config…", delay: 400 },
      { pct: 50, label: "Restoring session…", delay: 900 },
      { pct: 75, label: "Syncing data…", delay: 1400 },
      { pct: 100, label: "Ready!", delay: 1900 },
    ];
    steps.forEach(({ pct, label, delay }) => {
      setTimeout(() => { setProgress(pct); setStatus(label); }, delay);
    });
    setTimeout(() => {
      const hasToken = localStorage.getItem("fit_auth");
      navigate(hasToken ? "/" : "/login");
    }, 2400);
  }, [navigate]);

  const r = 44, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - progress / 100);

  return (
    <AuthShell>
      <div
        className="w-full h-full flex flex-col items-center justify-center relative"
        style={{ background: "linear-gradient(180deg, #0a1a18 0%, #080e0e 50%, #080e0e 100%)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-80 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% -5%, rgba(0,180,140,0.25) 0%, transparent 70%)" }} />

        <div className="relative flex flex-col items-center gap-8">
          <div className="flex items-center justify-center"
            style={{ width: 96, height: 96, borderRadius: 28, background: "linear-gradient(135deg, #00d4a8, #22c55e)", boxShadow: "0 0 48px rgba(0,212,168,0.45)" }}>
            <span style={{ fontSize: 40 }}>💪</span>
          </div>
          <div className="text-center">
            <h1 className="text-white text-3xl font-extrabold tracking-tight">FitTrack</h1>
            <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Your training, elevated.</p>
          </div>
          <div className="relative flex items-center justify-center mt-4">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#00d4a8" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={dash}
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{ transition: "stroke-dashoffset 0.4s ease", filter: "drop-shadow(0 0 6px rgba(0,212,168,0.7))" }} />
            </svg>
            <span className="absolute text-[13px] font-bold" style={{ color: "#00d4a8" }}>{progress}%</span>
          </div>
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>{status}</p>
        </div>

        <p className="absolute bottom-10 text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>FitTrack Pro v1.0.0</p>
      </div>
    </AuthShell>
  );
}