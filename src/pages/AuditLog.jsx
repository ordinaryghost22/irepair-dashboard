import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import EmptyState from "../components/EmptyState";
import HourglassLoader from "../components/HourglassLoader";
import { getAuditEvents } from "../api";

const ACTION_META = {
  confirmed: { label: "Confirmed", icon: "✓", tone: "green" },
  rejected: { label: "Rejected", icon: "✕", tone: "red" },
  deleted: { label: "Deleted", icon: "⌫", tone: "red" },
  payment_changed: { label: "Payment Changed", icon: "Rs", tone: "amber" },
  completed_invoiced: { label: "Completed + Invoiced", icon: "✓", tone: "green" },
  invoice_status_changed: { label: "Invoice Status", icon: "⇄", tone: "blue" },
};

function badgeColors(tone, dark) {
  const map = {
    green: dark
      ? { bg: "rgba(34,197,94,0.15)", color: "#22c55e" }
      : { bg: "#dcfce7", color: "#16a34a" },
    red: dark
      ? { bg: "rgba(239,68,68,0.15)", color: "#ef4444" }
      : { bg: "#fee2e2", color: "#dc2626" },
    amber: dark
      ? { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" }
      : { bg: "#fef3c7", color: "#d97706" },
    blue: dark
      ? { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" }
      : { bg: "#dbeafe", color: "#2563eb" },
  };
  return map[tone] || map.blue;
}

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function customerLabel(event) {
  const details = event.details || {};
  if (details.name) return details.name;
  if (details.invoice_number) return details.invoice_number;
  return "—";
}

function entityId(event) {
  return event.booking_id || event.invoice_id || "—";
}

export default function AuditLog() {
  const { theme: t } = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try { localStorage.removeItem("irepair_audit"); } catch { /* ignore */ }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAuditEvents();
        if (!cancelled) setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setEvents([]);
          setError(err.message || "Failed to load audit log");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const TH = {
    padding: "10px 12px",
    fontSize: 11,
    fontWeight: 700,
    color: t.thColor,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "left",
    background: t.thBg,
    borderBottom: `1px solid ${t.borderSub}`,
  };
  const TD = {
    padding: "12px 12px",
    fontSize: 13,
    color: t.tdColor,
    borderBottom: `1px solid ${t.borderSub}`,
  };
  const dark = t.name === "dark";

  return (
    <div style={{ padding: "20px 16px", maxWidth: 1000, animation: "fadeIn .3s ease" }}>
      <style>{"@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}"}</style>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, letterSpacing: -0.6, margin: 0 }}>Audit Log</h1>
        <p style={{ color: t.textSecondary, fontSize: 13, marginTop: 5 }}>Every action taken on bookings</p>
      </div>

      {loading ? (
        <HourglassLoader />
      ) : error ? (
        <EmptyState icon="⚠" title="Couldn’t load audit log" subtitle={error} />
      ) : events.length === 0 ? (
        <EmptyState icon="📜" title="No actions yet" subtitle="Confirm or reject a booking to see the audit trail" />
      ) : (
        <div style={{ background: t.cardBg, borderRadius: 18, border: `1px solid ${t.border}`, boxShadow: t.cardShadow, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 320 }}>
              <thead>
                <tr>
                  {["Action", "Customer", "Booking ID", "When"].map((h) => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const meta = ACTION_META[e.action] || {
                    label: e.action || "Unknown",
                    icon: "•",
                    tone: "blue",
                  };
                  const colors = badgeColors(meta.tone, dark);
                  return (
                    <tr
                      key={e.id}
                      style={{ transition: "background .12s" }}
                      onMouseEnter={(x) => { x.currentTarget.style.background = t.rowHover; }}
                      onMouseLeave={(x) => { x.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={TD}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            background: colors.bg,
                            color: colors.color,
                          }}
                        >
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td style={{ ...TD, fontWeight: 600 }}>{customerLabel(e)}</td>
                      <td style={{ ...TD, fontFamily: "monospace", fontSize: 11, color: t.textMuted }}>
                        {entityId(e)}
                      </td>
                      <td style={{ ...TD, color: t.textMuted, fontSize: 12, whiteSpace: "nowrap" }}>
                        {formatWhen(e.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
