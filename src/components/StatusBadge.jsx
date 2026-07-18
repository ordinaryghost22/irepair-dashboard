import { STATUS_COLORS } from "../constants";

export default function StatusBadge({ status }) {
  const cfg = STATUS_COLORS[status] || STATUS_COLORS.default;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        boxShadow: cfg.shadow || "none",
        transition: "box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1), background 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.dot,
          display: "inline-block",
          boxShadow: cfg.shadow !== "none" ? cfg.shadow : "none",
        }}
      />
      {status}
    </span>
  );
}
