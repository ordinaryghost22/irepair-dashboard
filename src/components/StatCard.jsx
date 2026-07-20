import { useTheme, cardStyle } from "../context/ThemeContext";

/** Dashboard / StatCard surface — softer rim + #18181c→#121214 depth */
export function premiumCardStyle(t, { interactive = false } = {}) {
  return {
    ...cardStyle(t, { interactive }),
    background:
      "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.035), transparent 50%), linear-gradient(180deg, #18181c 0%, #121214 100%)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderTop: "1px solid rgba(255,255,255,0.10)",
  };
}

/** Desaturated slate-blue for secondary metric labels (not theme muted). */
export const STAT_LABEL_COLOR = "#64748b";

/**
 * Stat card — obsidian chrome + tinted glow matching the metric accent.
 */
export default function StatCard({
  label,
  value,
  valuePrefix,
  icon,
  gradient,
  iconShadow,
  glow,
  sub,
  onClick,
  stackPrefix = false,
}) {
  const { theme: t } = useTheme();

  return (
    <div
      className="ui-interactive"
      onClick={onClick}
      style={{
        ...premiumCardStyle(t, { interactive: Boolean(onClick) }),
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
                fontWeight: 800,
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
              fontWeight: 800,
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
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: t.textSecondary,
                  letterSpacing: 0,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {valuePrefix}
              </span>
            )}
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
          </div>
        )}
        <div style={{ fontSize: 12, color: STAT_LABEL_COLOR, fontWeight: 500, marginTop: 1 }}>{label}</div>
        {sub && (
          <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
