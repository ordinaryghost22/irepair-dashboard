import LogoIntro from "../components/LogoIntro";
import logoSrc from "../assets/logo.png";
import { BUSINESS_NAME } from "../constants/brand";

/**
 * Lightweight client demo surface for logo intro / avatar preview.
 * Public route — no auth required.
 */
export default function ClientDemo() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f9fb",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      <LogoIntro src={logoSrc} alt={BUSINESS_NAME} variant="hero" />

      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "0 24px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 18px",
            background: "#fff",
            borderRadius: 16,
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <LogoIntro src={logoSrc} alt="" variant="avatar" size={80} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 650, color: "#111827" }}>
              {BUSINESS_NAME}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
              Connected account
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
