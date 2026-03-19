import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Check } from "lucide-react";

const FITNESS_LEVELS = ["Beginner", "Intermediate", "Advanced", "Elite"];
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const UNITS = [{ label: "Metric (kg / cm)", value: "metric" }, { label: "Imperial (lbs / ft)", value: "imperial" }];
const GOALS = ["Build muscle", "Lose fat", "Improve strength", "General fitness", "Athletic performance"];

export function ProfileSetupScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: "Jordan Davis",
    dob: "1995-06-15",
    gender: "Male",
    height: "180",
    weight: "82",
    fitnessLevel: "Intermediate",
    unit: "metric",
    goal: "Improve strength",
  });

  const set = (k: string) => (val: string) => setForm(f => ({ ...f, [k]: val }));

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "14px",
    color: "white",
    padding: "13px 16px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    caretColor: "#00d4a8",
  };

  return (
    <div className="min-h-full pb-10"
      style={{ background: "linear-gradient(180deg, #0a1a18 0%, #080e0e 30%)" }}>
      <div className="absolute top-0 left-0 right-0 h-52 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(0,180,140,0.18) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pt-13 pb-5">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <ArrowLeft size={16} color="white" />
        </button>
        <div className="text-center">
          <p className="text-white text-[15px] font-bold">Profile Setup</p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>Tell us about yourself</p>
        </div>
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold"
          style={{ background: "linear-gradient(135deg, #00d4a8, #22c55e)", color: "black" }}>
          <Check size={13} strokeWidth={3} /> Save
        </button>
      </div>

      <div className="px-5 flex flex-col gap-5">
        {/* Basic Info */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Basic Info
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Display Name
              </label>
              <input type="text" value={form.displayName}
                onChange={e => set("displayName")(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Date of Birth
              </label>
              <input type="date" value={form.dob}
                onChange={e => set("dob")(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.map(g => (
                  <button key={g} onClick={() => set("gender")(g)}
                    className="py-2.5 rounded-xl text-[12px] font-semibold transition-all"
                    style={{
                      background: form.gender === g ? "rgba(0,212,168,0.18)" : "rgba(255,255,255,0.06)",
                      border: form.gender === g ? "1px solid rgba(0,212,168,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      color: form.gender === g ? "#00d4a8" : "rgba(255,255,255,0.5)",
                    }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Body Stats */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Body Stats
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Height ({form.unit === "metric" ? "cm" : "ft"})
              </label>
              <input type="number" value={form.height}
                onChange={e => set("height")(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Weight ({form.unit === "metric" ? "kg" : "lbs"})
              </label>
              <input type="number" value={form.weight}
                onChange={e => set("weight")(e.target.value)} style={inputStyle} />
            </div>
          </div>
        </section>

        {/* Fitness Level */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Fitness Level
          </p>
          <div className="grid grid-cols-2 gap-2">
            {FITNESS_LEVELS.map(level => (
              <button key={level} onClick={() => set("fitnessLevel")(level)}
                className="py-3 rounded-xl text-[13px] font-semibold transition-all"
                style={{
                  background: form.fitnessLevel === level ? "rgba(0,212,168,0.18)" : "rgba(255,255,255,0.05)",
                  border: form.fitnessLevel === level ? "1px solid rgba(0,212,168,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  color: form.fitnessLevel === level ? "#00d4a8" : "rgba(255,255,255,0.5)",
                }}>
                {level}
              </button>
            ))}
          </div>
        </section>

        {/* Primary Goal */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Primary Goal
          </p>
          <div className="flex flex-col gap-2">
            {GOALS.map(g => (
              <button key={g} onClick={() => set("goal")(g)}
                className="flex items-center gap-3 py-3 px-4 rounded-xl text-left transition-all"
                style={{
                  background: form.goal === g ? "rgba(0,212,168,0.12)" : "rgba(255,255,255,0.04)",
                  border: form.goal === g ? "1px solid rgba(0,212,168,0.35)" : "1px solid rgba(255,255,255,0.07)",
                }}>
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: form.goal === g ? "#00d4a8" : "rgba(255,255,255,0.3)" }}>
                  {form.goal === g && <div className="w-2 h-2 rounded-full" style={{ background: "#00d4a8" }} />}
                </div>
                <span className="text-[13px] font-medium" style={{ color: form.goal === g ? "#00d4a8" : "rgba(255,255,255,0.6)" }}>
                  {g}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Units */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Preferred Units
          </p>
          <div className="flex flex-col gap-2">
            {UNITS.map(u => (
              <button key={u.value} onClick={() => set("unit")(u.value)}
                className="flex items-center gap-3 py-3 px-4 rounded-xl text-left transition-all"
                style={{
                  background: form.unit === u.value ? "rgba(0,212,168,0.12)" : "rgba(255,255,255,0.04)",
                  border: form.unit === u.value ? "1px solid rgba(0,212,168,0.35)" : "1px solid rgba(255,255,255,0.07)",
                }}>
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: form.unit === u.value ? "#00d4a8" : "rgba(255,255,255,0.3)" }}>
                  {form.unit === u.value && <div className="w-2 h-2 rounded-full" style={{ background: "#00d4a8" }} />}
                </div>
                <span className="text-[13px] font-medium"
                  style={{ color: form.unit === u.value ? "#00d4a8" : "rgba(255,255,255,0.6)" }}>
                  {u.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Save */}
        <button
          onClick={() => navigate("/profile")}
          className="w-full py-4 rounded-2xl text-[15px] font-extrabold text-black transition-all active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #00d4a8, #22c55e)",
            boxShadow: "0 4px 24px rgba(0,212,168,0.35)",
          }}>
          Save Profile
        </button>
      </div>
    </div>
  );
}
