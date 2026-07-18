import { useTheme, cardStyle } from "../context/ThemeContext";

/**
 * Stat card — obsidian chrome + tinted glow matching the metric accent.
 */
export default function StatCard({ label, value, valuePrefix, icon, gradient, iconShadow, glow, sub, onClick, stackPrefix = false }) {
  const { theme: t } = useTheme();

  return (
    <div
      className="ui-interactive"
      onClick={onClick}
      style={{
        ...cardStyle(t, { interactive: Boolean(onClick) }),
        padding: "20px 22px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: onClick ? "pointer" : "default",
        boxShadow: glow ? `${t.cardShadow}, ${glow}` : t.cardShadow,
        minHeight: 96,
      }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: 14,
          flexShrink: 0,
          background: gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: iconShadow,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
        {stackPrefix && valuePrefix != null ? (
          <>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: t.textMuted,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                lineHeight: 1,
                marginBottom: 2,
              }}
            >
              {valuePrefix}
            </div>
            <div
              style={{
                fontSize: 27,
                fontWeight: 700,
                color: t.textPrimary,
                letterSpacing: -1,
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.1,
              }}
            >
              {value}
            </div>
          </>
        ) : (
          <div
            style={{
              fontSize: 27,
              fontWeight: 700,
              color: t.textPrimary,
              letterSpacing: -1,
              fontVariantNumeric: "tabular-nums",
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              lineHeight: 1.1,
            }}
          >
            {valuePrefix != null && (
              <span style={{ fontSize: 13, fontWeight: 600, color: t.textSecondary, letterSpacing: 0 }}>
                {valuePrefix}
              </span>
            )}
            <span>{value}</span>
          </div>
        )}
        <div style={{ fontSize: 12, color: t.textSecondary, fontWeight: 500, marginTop: 1 }}>{label}</div>
        {sub && (
          <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 500 }}>{sub}</div>
        )}
      </div>
    </div>
  );
}
