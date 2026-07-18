import { useState } from "react";
import { useTheme, primaryBtnStyle, cardStyle, EASE, DURATION } from "../context/ThemeContext";
import { SERVICE_PRICES } from "../constants";

const SECTION_ICONS = {
  appearance: "◈",
  shop: "✦",
  prices: "Rs",
  password: "✱",
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
  const [saved, setSaved] = useState(false);
  const [prices, setPrices] = useState(SERVICE_PRICES);

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
          {field("Shop Name", "iRepair Shop")}
          {field("Phone", "+92 300 0000000")}
          {field("Email", "owner@irepair.com", "email")}
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
