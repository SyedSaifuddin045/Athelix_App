import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Check, Eye, EyeOff, Bell, Shield, Trash2 } from "lucide-react";

export function AccountSettingsScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "jordan_lifts",
    email: "jordan@example.com",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    prAlerts: true,
    weeklyReport: false,
    newFeatures: true,
  });
  const [saved, setSaved] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleNotif = (k: keyof typeof notifications) =>
    setNotifications(n => ({ ...n, [k]: !n[k] }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
      style={{ background: "linear-gradient(180deg, #0e0c1a 0%, #080e0e 30%)" }}>
      <div className="absolute top-0 left-0 right-0 h-44 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(100,60,200,0.1) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pt-13 pb-5">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <ArrowLeft size={16} color="white" />
        </button>
        <p className="text-white text-[15px] font-bold">Account Settings</p>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all"
          style={{
            background: saved ? "rgba(34,197,94,0.2)" : "linear-gradient(135deg, #00d4a8, #22c55e)",
            color: saved ? "#22c55e" : "black",
          }}>
          <Check size={13} strokeWidth={3} color={saved ? "#22c55e" : "black"} />
          {saved ? "Saved!" : "Save"}
        </button>
      </div>

      <div className="px-5 flex flex-col gap-6">
        {/* Account Details */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Account Details
          </p>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="px-4 pt-4 pb-3">
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Username
              </label>
              <input type="text" value={form.username} onChange={set("username")} style={inputStyle} />
            </div>
            <div className="mx-4" style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
            <div className="px-4 pt-3 pb-4">
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Email Address
              </label>
              <input type="email" value={form.email} onChange={set("email")} style={inputStyle} />
            </div>
          </div>
        </section>

        {/* Change Password */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Security
          </p>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="px-4 pt-4 pb-3">
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Leave blank to keep current"
                  value={form.newPassword}
                  onChange={set("newPassword")}
                  style={{ ...inputStyle, paddingRight: "44px" }}
                />
                <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPw
                    ? <EyeOff size={16} color="rgba(255,255,255,0.4)" />
                    : <Eye size={16} color="rgba(255,255,255,0.4)" />}
                </button>
              </div>
            </div>
            <div className="mx-4" style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
            <div className="px-4 pt-3 pb-4">
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                style={inputStyle}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2.5 px-1">
            <Shield size={13} color="rgba(255,255,255,0.3)" />
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              Password changes require re-authentication on all devices.
            </p>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Notifications
          </p>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {([
              ["workoutReminders", "Workout Reminders", "Daily reminders to stay consistent"],
              ["prAlerts", "PR Alerts", "Get notified when you set a new record"],
              ["weeklyReport", "Weekly Report", "Weekly summary of your training"],
              ["newFeatures", "New Features", "Updates about new app features"],
            ] as const).map(([key, label, desc], i, arr) => (
              <div key={key}>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <Bell size={15} color={notifications[key] ? "#00d4a8" : "rgba(255,255,255,0.3)"} />
                    <div>
                      <p className="text-white text-[13px] font-medium">{label}</p>
                      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{desc}</p>
                    </div>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => toggleNotif(key)}
                    className="relative flex-shrink-0"
                    style={{
                      width: 44, height: 26, borderRadius: 13,
                      background: notifications[key] ? "#00d4a8" : "rgba(255,255,255,0.12)",
                      transition: "background 0.2s",
                    }}>
                    <div
                      className="absolute top-1 rounded-full"
                      style={{
                        width: 18, height: 18, background: "white",
                        left: notifications[key] ? 22 : 4,
                        transition: "left 0.2s",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                      }}
                    />
                  </button>
                </div>
                {i < arr.length - 1 && (
                  <div className="mx-4" style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(239,68,68,0.6)" }}>
            Danger Zone
          </p>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <button className="w-full flex items-center gap-3 px-4 py-4 text-left">
              <Trash2 size={16} color="#f87171" />
              <div>
                <p className="text-[13px] font-semibold" style={{ color: "#f87171" }}>Delete Account</p>
                <p className="text-[11px]" style={{ color: "rgba(239,68,68,0.6)" }}>
                  Permanently delete all data. This cannot be undone.
                </p>
              </div>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
