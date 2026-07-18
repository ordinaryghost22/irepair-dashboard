import { useTheme, secondaryBtnStyle, cardStyle } from "../context/ThemeContext";

export default function EmptyState({ icon = "◈", title, subtitle, action, onAction }) {
  const { theme: t } = useTheme();
  return (
    <div
      style={{
        ...cardStyle(t),
        padding: "56px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 22,
          marginBottom: 12,
          color: t.textMuted,
          lineHeight: 1,
          opacity: 0.85,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, marginBottom: subtitle ? 6 : 0 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: t.textMuted, marginBottom: action ? 18 : 0, lineHeight: 1.5 }}>
          {subtitle}
        </div>
      )}
      {action && onAction && (
        <button
          className="ui-interactive"
          onClick={onAction}
          style={{ ...secondaryBtnStyle(t), padding: "8px 18px", fontSize: 12 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = t.borderHover;
            e.currentTarget.style.color = t.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
            e.currentTarget.style.color = t.textSecondary;
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}
