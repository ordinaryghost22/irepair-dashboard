import LogoIntro from "../components/LogoIntro";
import logoSrc from "../assets/logo.png";
import { BUSINESS_NAME, BUSINESS_SUBTITLE } from "../constants/brand";

/**
 * Lightweight client demo surface for logo intro / avatar preview.
 * Public route — no auth required.
 */
export default function ClientDemo() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030708",
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
            background: "rgba(255,255,255,0.04)",
            borderRadius: 16,
            border: "1px solid rgba(34,211,238,0.2)",
            boxShadow: "0 0 24px rgba(34,211,238,0.08)",
          }}
        >
          <LogoIntro src={logoSrc} alt="" variant="avatar" size={80} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 650, color: "#fff" }}>
              {BUSINESS_NAME}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(34,211,238,0.85)",
                marginTop: 3,
                letterSpacing: "0.16em",
                fontWeight: 600,
              }}
            >
              {BUSINESS_SUBTITLE}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
