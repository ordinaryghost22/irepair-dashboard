import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

const STATUSES = [
  { value: "Unpaid",  label: "Unpaid",  bg: "#FEF2F2", color: "#B91C1C", dark_bg: "#450A0A", dark_color: "#FCA5A5" },
  { value: "Paid",    label: "Paid",    bg: "#F0FDF4", color: "#15803D", dark_bg: "#052E16", dark_color: "#86EFAC" },
  { value: "Onsite",  label: "Onsite",  bg: "#FFF7ED", color: "#C2410C", dark_bg: "#431407", dark_color: "#FDBA74" },
];

export function PaymentBadge({ status }) {
  const s = STATUSES.find(x => x.value === status) || STATUSES[0];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
      background: s.bg, color: s.color,
      border: `1px solid ${s.color}30`,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: s.color,
        display: "inline-block",
      }} />
      {s.label}
    </span>
  );
}

export function PaymentStatusCycler({ status, bookingId, onChange, loading }) {
  const idx = STATUSES.findIndex(x => x.value === status);
  const current = STATUSES[idx === -1 ? 0 : idx];

  function cycle() {
    if (loading) return;
    const next = STATUSES[(idx + 1) % STATUSES.length];
    onChange?.(bookingId, next.value);
  }

  return (
    <button
      onClick={cycle}
      disabled={loading}
      title="Click to change payment status"
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
        background: current.bg, color: current.color,
        boxShadow: `0 4px 20px ${current.bg}40`,
        border: `1px solid ${current.color}30`,
        cursor: loading ? "wait" : "pointer",
        transition: "opacity 0.15s",
        opacity: loading ? 0.6 : 1,
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: current.color,
        display: "inline-block",
      }} />
      {current.label}
      <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 2 }}>↻</span>
    </button>
  );
}

export function PaymentStatCards({ bookings = [] }) {
  const { theme: t } = useTheme();
  const paid   = bookings.filter(b => b["Payment Status"] === "Paid").length;
  const unpaid = bookings.filter(b => b["Payment Status"] === "Unpaid" || !b["Payment Status"]).length;
  const onsite = bookings.filter(b => b["Payment Status"] === "Onsite").length;

  const stats = [
    { label: "Paid",   count: paid,   gradient: "linear-gradient(135deg,#22c55e,#16a34a)", icon: "✓", glow: "rgba(34,197,94,0.3)" },
    { label: "Unpaid", count: unpaid, gradient: "linear-gradient(135deg,#ef4444,#dc2626)", icon: "✕", glow: "rgba(239,68,68,0.3)" },
    { label: "Onsite", count: onsite, gradient: "linear-gradient(135deg,#f97316,#ea580c)", icon: "◉", glow: "rgba(249,115,22,0.3)" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: t.cardBg, borderRadius: 18, padding: "20px 22px",
          border: `1px solid ${t.border}`, boxShadow: t.cardShadow,
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 50, height: 50, borderRadius: 15, flexShrink: 0,
            background: s.gradient, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 22, color: "#fff", fontWeight: 800,
            boxShadow: `0 4px 14px ${s.glow}`,
          }}>
            {s.icon}
          </div>
          <div>
            <div style={{ fontSize: 27, fontWeight: 800, color: t.textPrimary, letterSpacing: -1 }}>{s.count}</div>
            <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2, fontWeight: 500 }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}