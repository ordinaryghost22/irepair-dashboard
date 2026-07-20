import { useState, useEffect } from "react";
import { useTheme, primaryBtnStyle, cardStyle, EASE, DURATION } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { useSecurity } from "../context/SecurityContext";
import { SERVICE_PRICES } from "../constants";
import { BUSINESS_NAME } from "../constants/brand";
import { setPin, clearPin, testWhatsApp } from "../api";

const SECTION_ICONS = {
  appearance: "◈",
  shop: "✦",
  prices: "Rs",
  password: "✱",
  pin: "⌘",
  // TEMPORARY — remove with WhatsApp test section below
  whatsapp: "✎",
};

function SectionTitle({ icon, label, t }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontWeight: 700,
        fontSize: 14,
        color: t.textPrimary,
        marginBottom: 20,
        paddingBottom: 14,
        borderBottom: `1px solid ${t.borderSub}`,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: icon === "Rs" ? 11 : 13,
          fontWeight: 700,
          color: t.accent,
          background: "rgba(139,92,246,0.12)",
          border: "1px solid rgba(139,92,246,0.25)",
          boxShadow: "0 0 16px rgba(139,92,246,0.15)",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      {label}
    </div>
  );
}

export default function Settings() {
  const { theme: t } = useTheme();
  const { showToast } = useToast();
  const { pinConfigured, setPinEnabled, refreshPinStatus } = useSecurity();
  const [saved, setSaved] = useState(false);
  const [prices, setPrices] = useState(SERVICE_PRICES);
  const [pin, setPinValue] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinPassword, setPinPassword] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [clearPassword, setClearPassword] = useState("");
  // TEMPORARY — WhatsApp Cloud API smoke test (remove this block + UI section later)
  const [waTestPhone, setWaTestPhone] = useState("");
  const [waTestBusy, setWaTestBusy] = useState(false);
  const [waTestResult, setWaTestResult] = useState(null);

  useEffect(() => {
    refreshPinStatus?.();
  }, [refreshPinStatus]);

  // TEMPORARY — remove with WhatsApp test UI
  async function handleTestWhatsApp() {
    const to = waTestPhone.trim();
    if (!to) {
      showToast("Enter a phone number to test", "error");
      return;
    }
    setWaTestBusy(true);
    setWaTestResult(null);
    try {
      const res = await testWhatsApp(to, "hello_world");
      setWaTestResult({ ok: true, text: `Sent hello_world to ${to}` });
      showToast("WhatsApp test message sent");
      console.info("WhatsApp test response:", res);
    } catch (err) {
      const text = err.message || "WhatsApp test failed";
      setWaTestResult({ ok: false, text });
      showToast(text, "error");
    } finally {
      setWaTestBusy(false);
    }
  }

  async function handleSavePin() {
    if (!/^\d{4,6}$/.test(pin)) {
      showToast("PIN must be 4–6 digits", "error");
      return;
    }
    if (pin !== pinConfirm) {
      showToast("PINs do not match", "error");
      return;
    }
    if (!pinPassword) {
      showToast("Enter your password to confirm", "error");
      return;
    }
    setPinBusy(true);
    try {
      await setPin(pin, pinPassword);
      setPinEnabled(true);
      setPinValue("");
      setPinConfirm("");
      setPinPassword("");
      showToast(pinConfigured ? "Quick PIN updated" : "Quick PIN enabled");
    } catch (err) {
      showToast(err.message || "Failed to save PIN", "error");
    } finally {
      setPinBusy(false);
    }
  }

  async function handleClearPin() {
    if (!clearPassword) {
      showToast("Enter your password to remove PIN", "error");
      return;
    }
    setPinBusy(true);
    try {
      await clearPin(clearPassword);
      setPinEnabled(false);
      setClearPassword("");
      showToast("Quick PIN removed — idle timeout will log out again");
    } catch (err) {
      showToast(err.message || "Failed to remove PIN", "error");
    } finally {
      setPinBusy(false);
    }
  }

  const section = {
    ...cardStyle(t),
    padding: "22px 20px",
    marginBottom: 16,
  };

  const inputBase = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    background: t.inputBg,
    border: `1px solid ${t.border}`,
    color: t.textPrimary,
    fontSize: 14,
    outline: "none",
    fontFamily: 'var(--font-sans), "Inter", system-ui, sans-serif',
    transition: `border-color ${DURATION.micro} ${EASE}, background ${DURATION.micro} ${EASE}`,
  };

  const field = (label, defaultValue, type = "text") => (
    <div key={label}>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 700,
          color: t.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 7,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        defaultValue={defaultValue}
        style={inputBase}
        onFocus={(e) => {
          e.target.style.border = "1px solid rgba(139,92,246,0.45)";
          e.target.style.background = "rgba(255,255,255,0.06)";
        }}
        onBlur={(e) => {
          e.target.style.border = `1px solid ${t.border}`;
          e.target.style.background = t.inputBg;
        }}
      />
    </div>
  );

  return (
    <div style={{ padding: "20px 16px", maxWidth: 720 }}>
      <style>{`
        @media(max-width:768px){
          .settings-grid{grid-template-columns:1fr!important}
        }
        @media(min-width:769px){
          .settings-grid{grid-template-columns:1fr 1fr!important}
        }
      `}</style>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, letterSpacing: -0.6, margin: 0 }}>
          Settings
        </h1>
        <p style={{ color: t.textSecondary, fontSize: 13, marginTop: 5 }}>
          Manage your shop details and preferences
        </p>
      </div>

      <div style={section}>
        <SectionTitle icon={SECTION_ICONS.appearance} label="Appearance" t={t} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            background: t.cardBg2,
            borderRadius: 14,
            border: `1px solid ${t.border}`,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: t.textPrimary, fontSize: 14 }}>Dark mode</div>
            <div style={{ color: t.textMuted, fontSize: 12, marginTop: 3 }}>
              Dashboard always uses the dark aesthetic
            </div>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              background: "rgba(139,92,246,0.15)",
              color: "#a78bfa",
              border: "1px solid rgba(139,92,246,0.3)",
              boxShadow: "0 0 20px rgba(139,92,246,0.2)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#a78bfa",
                display: "inline-block",
                boxShadow: "0 0 8px rgba(139,92,246,0.4)",
              }}
            />
            Always on
          </div>
        </div>
      </div>

      <div style={section}>
        <SectionTitle icon={SECTION_ICONS.shop} label="Shop Information" t={t} />
        <div className="settings-grid" style={{ display: "grid", gap: 16 }}>
          {field("Shop Name", BUSINESS_NAME)}
          {field("Phone", "+92 300 0000000")}
          {field("Email", "owner@ultimatephonerepair.com", "email")}
          {field("Address", "Lahore, Pakistan")}
          {field("City", "Lahore")}
          {field("Opening Hours", "10:00 AM – 8:00 PM")}
        </div>
      </div>

      <div style={section}>
        <SectionTitle icon={SECTION_ICONS.prices} label="Service Prices (₨)" t={t} />
        <div className="settings-grid" style={{ display: "grid", gap: 14 }}>
          {Object.entries(prices).map(([service, price]) => (
            <div key={service}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: t.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 7,
                }}
              >
                {service}
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrices((p) => ({ ...p, [service]: +e.target.value }))}
                style={inputBase}
                onFocus={(e) => {
                  e.target.style.border = "1px solid rgba(139,92,246,0.45)";
                  e.target.style.background = "rgba(255,255,255,0.06)";
                }}
                onBlur={(e) => {
                  e.target.style.border = `1px solid ${t.border}`;
                  e.target.style.background = t.inputBg;
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={section}>
        <SectionTitle icon={SECTION_ICONS.pin} label="Quick PIN" t={t} />
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            marginBottom: 16,
            background: pinConfigured ? "rgba(34,197,94,0.1)" : t.cardBg2,
            border: `1px solid ${pinConfigured ? "rgba(34,197,94,0.3)" : t.border}`,
            fontSize: 13,
            color: t.textSecondary,
            lineHeight: 1.45,
          }}
        >
          {pinConfigured
            ? "Enabled — after 30 min idle the screen locks; unlock with PIN (JWT stays valid)."
            : "Optional. Without a PIN, idle timeout still logs you out completely."}
        </div>
        <div className="settings-grid" style={{ display: "grid", gap: 16, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 7 }}>
              {pinConfigured ? "New PIN (4–6 digits)" : "PIN (4–6 digits)"}
            </label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
              style={inputBase}
              placeholder="••••"
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 7 }}>
              Confirm PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
              style={inputBase}
              placeholder="••••"
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 7 }}>
              Current password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={pinPassword}
              onChange={(e) => setPinPassword(e.target.value)}
              style={inputBase}
              placeholder="Required to set PIN"
            />
          </div>
        </div>
        <button
          type="button"
          className="ui-interactive"
          disabled={pinBusy}
          onClick={handleSavePin}
          style={{
            ...primaryBtnStyle(t),
            padding: "11px 20px",
            fontSize: 13,
            width: "100%",
            marginBottom: pinConfigured ? 16 : 0,
            opacity: pinBusy ? 0.7 : 1,
          }}
        >
          {pinBusy ? "Saving…" : pinConfigured ? "Update Quick PIN" : "Enable Quick PIN"}
        </button>
        {pinConfigured && (
          <div style={{ marginTop: 4, paddingTop: 16, borderTop: `1px solid ${t.borderSub}` }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 7 }}>
              Password to remove PIN
            </label>
            <input
              type="password"
              value={clearPassword}
              onChange={(e) => setClearPassword(e.target.value)}
              style={{ ...inputBase, marginBottom: 10 }}
              placeholder="Owner password"
            />
            <button
              type="button"
              className="ui-interactive"
              disabled={pinBusy}
              onClick={handleClearPin}
              style={{
                width: "100%",
                padding: "11px 20px",
                borderRadius: 12,
                border: "1px solid rgba(248,113,113,0.35)",
                background: "rgba(248,113,113,0.12)",
                color: "#f87171",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Remove Quick PIN
            </button>
          </div>
        )}
      </div>

      {/* TEMPORARY — WhatsApp Cloud API smoke test UI. Delete this entire section
          (and waTest* state / handleTestWhatsApp / testWhatsApp in api.js) once
          real booking/invoice WhatsApp triggers are wired and verified. */}
      <div style={section}>
        <SectionTitle icon={SECTION_ICONS.whatsapp} label="WhatsApp test (temporary)" t={t} />
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            marginBottom: 16,
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.3)",
            fontSize: 13,
            color: t.textSecondary,
            lineHeight: 1.45,
          }}
        >
          Dev-only: sends Meta&apos;s <code style={{ color: t.textPrimary }}>hello_world</code> template
          via <code style={{ color: t.textPrimary }}>POST /test-whatsapp</code>. Recipient must be
          allowed in Meta test mode.
        </div>
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            color: t.textMuted,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginBottom: 7,
          }}
        >
          Recipient phone
        </label>
        <input
          type="tel"
          value={waTestPhone}
          onChange={(e) => setWaTestPhone(e.target.value)}
          placeholder="03001234567 or +923001234567"
          style={{ ...inputBase, marginBottom: 12 }}
        />
        <button
          type="button"
          className="ui-interactive"
          disabled={waTestBusy}
          onClick={handleTestWhatsApp}
          style={{
            ...primaryBtnStyle(t),
            padding: "11px 20px",
            fontSize: 13,
            width: "100%",
            opacity: waTestBusy ? 0.7 : 1,
          }}
        >
          {waTestBusy ? "Sending…" : "Send test WhatsApp"}
        </button>
        {waTestResult && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 10,
              fontSize: 12,
              lineHeight: 1.4,
              background: waTestResult.ok ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)",
              border: `1px solid ${waTestResult.ok ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)"}`,
              color: waTestResult.ok ? "#86efac" : "#fca5a5",
            }}
          >
            {waTestResult.text}
          </div>
        )}
      </div>

      <div style={section}>
        <SectionTitle icon={SECTION_ICONS.password} label="Change Password" t={t} />
        <div className="settings-grid" style={{ display: "grid", gap: 16 }}>
          {field("Current Password", "", "password")}
          {field("New Password", "", "password")}
        </div>
      </div>

      <button
        className="ui-interactive"
        onClick={() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        }}
        style={{ ...primaryBtnStyle(t), padding: "13px 32px", fontSize: 14, width: "100%" }}
      >
        {saved ? "Saved" : "Save Changes"}
      </button>
    </div>
  );
}
