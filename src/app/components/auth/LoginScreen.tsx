import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { AuthShell } from "../shared/AuthShell";

export function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    setTimeout(() => {
      localStorage.setItem("fit_auth", "demo_token");
      navigate("/");
    }, 1200);
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "14px",
    color: "white",
    padding: "14px 16px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    caretColor: "#00d4a8",
  };

  return (
    <AuthShell>
    <div
      className="w-full flex flex-col"
      style={{
        minHeight: "100svh",
        background: "linear-gradient(180deg, #0a1a18 0%, #080e0e 40%)",
        fontFamily: "'Inter', sans-serif",
        padding: "0 24px",
      }}
    >
      {/* Glow */}
      <div
        className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,180,140,0.2) 0%, transparent 70%)" }}
      />

      {/* Logo */}
      <div className="flex flex-col items-center pt-16 pb-10">
        <div
          className="flex items-center justify-center mb-5"
          style={{
            width: 64, height: 64, borderRadius: 18,
            background: "linear-gradient(135deg, #00d4a8, #22c55e)",
            boxShadow: "0 0 30px rgba(0,212,168,0.4)",
          }}
        >
          <span style={{ fontSize: 28 }}>💪</span>
        </div>
        <h1 className="text-white text-2xl font-extrabold">Welcome back</h1>
        <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Sign in to continue your journey
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-3 w-full">
        <div>
          <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
            Email
          </label>
          <input
            type="email"
            placeholder="jordan@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ ...inputStyle, paddingRight: "44px" }}
            />
            <button
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPw
                ? <EyeOff size={16} color="rgba(255,255,255,0.4)" />
                : <Eye size={16} color="rgba(255,255,255,0.4)" />}
            </button>
          </div>
        </div>

        <button className="text-right text-[12px] font-medium" style={{ color: "#00d4a8" }}>
          Forgot password?
        </button>

        {error && (
          <div
            className="rounded-xl px-4 py-2.5 text-[12px]"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 mt-2 transition-all active:scale-[0.98]"
          style={{
            background: loading ? "rgba(0,212,168,0.4)" : "linear-gradient(135deg, #00d4a8, #22c55e)",
            boxShadow: loading ? "none" : "0 4px 24px rgba(0,212,168,0.35)",
          }}
        >
          {loading ? (
            <div className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
          ) : (
            <>
              <span className="text-black text-[15px] font-bold">Sign In</span>
              <ArrowRight size={16} color="black" />
            </>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>or continue as</span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
      </div>

      {/* Demo shortcut */}
      <button
        onClick={() => { localStorage.setItem("fit_auth", "demo_token"); navigate("/"); }}
        className="w-full py-3.5 rounded-2xl text-[14px] font-semibold transition-all active:scale-[0.98]"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.7)",
        }}
      >
        Continue as Demo User
      </button>

      <p className="text-center text-[13px] mt-6" style={{ color: "rgba(255,255,255,0.4)" }}>
        Don't have an account?{" "}
        <button onClick={() => navigate("/register")} className="font-semibold" style={{ color: "#00d4a8" }}>
          Sign Up
        </button>
      </p>
    </div>
    </AuthShell>
  );
}