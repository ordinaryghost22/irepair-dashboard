import { useTheme } from "../context/ThemeContext";

export default function Skeleton({ rows = 6 }) {
  const { theme: t } = useTheme();
  const s = {
    borderRadius: 10,
    background: "rgba(255,255,255,0.06)",
    marginBottom: 10,
    animation: "skeletonPulse 1.5s ease infinite",
    border: `1px solid ${t.border}`,
  };
  return (
    <div style={{ padding: 32 }}>
      <div style={{ ...s, height: 28, width: 180, marginBottom: 24 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ ...s, height: 96, borderRadius: 14, animationDelay: i * 0.1 + "s" }} />
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} style={{ ...s, height: 44, animationDelay: i * 0.08 + "s" }} />
      ))}
    </div>
  );
}
