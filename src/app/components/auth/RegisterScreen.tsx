import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { AuthShell } from "../shared/AuthShell";

export function RegisterScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleRegister = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("fit_auth", "demo_token");
      navigate("/profile/setup");
    }, 1200);
  };

  const checks = [
    { label: "8+ characters", ok: form.password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(form.password) },
    { label: "Number", ok: /[0-9]/.test(form.password) },
  ];

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
      <div
        className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,180,140,0.18) 0%, transparent 70%)" }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 pt-14 pb-8">
        <button
          onClick={() => navigate("/login")}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <ArrowLeft size={16} color="white" />
        </button>
        <div>
          <h1 className="text-white text-xl font-extrabold">Create Account</h1>
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>Start your fitness journey</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
            Username
          </label>
          <input
            type="text"
            placeholder="jordan_lifts"
            value={form.username}
            onChange={set("username")}
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
            Email
          </label>
          <input
            type="email"
            placeholder="jordan@example.com"
            value={form.email}
            onChange={set("email")}
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
              placeholder="Create a strong password"
              value={form.password}
              onChange={set("password")}
              style={{ ...inputStyle, paddingRight: "44px" }}
            />
            <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showPw
                ? <EyeOff size={16} color="rgba(255,255,255,0.4)" />
                : <Eye size={16} color="rgba(255,255,255,0.4)" />}
            </button>
          </div>

          {/* Password strength */}
          {form.password.length > 0 && (
            <div className="flex gap-3 mt-2.5">
              {checks.map(c => (
                <div key={c.label} className="flex items-center gap-1">
                  <div
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ background: c.ok ? "#00d4a8" : "rgba(255,255,255,0.1)" }}
                  >
                    {c.ok && <Check size={8} color="black" strokeWidth={3} />}
                  </div>
                  <span className="text-[10px]" style={{ color: c.ok ? "#00d4a8" : "rgba(255,255,255,0.35)" }}>
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
          By creating an account, you agree to our{" "}
          <span style={{ color: "#00d4a8" }}>Terms of Service</span> and{" "}
          <span style={{ color: "#00d4a8" }}>Privacy Policy</span>.
        </p>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 mt-1 transition-all active:scale-[0.98]"
          style={{
            background: loading ? "rgba(0,212,168,0.4)" : "linear-gradient(135deg, #00d4a8, #22c55e)",
            boxShadow: loading ? "none" : "0 4px 24px rgba(0,212,168,0.35)",
          }}
        >
          {loading ? (
            <div className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
          ) : (
            <>
              <span className="text-black text-[15px] font-bold">Create Account</span>
              <ArrowRight size={16} color="black" />
            </>
          )}
        </button>
      </div>

      <p className="text-center text-[13px] mt-6" style={{ color: "rgba(255,255,255,0.4)" }}>
        Already have an account?{" "}
        <button onClick={() => navigate("/login")} className="font-semibold" style={{ color: "#00d4a8" }}>
          Sign In
        </button>
      </p>
    </div>
    </AuthShell>
  );
}