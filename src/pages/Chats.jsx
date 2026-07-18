import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import EmptyState from "../components/EmptyState";
import HourglassLoader from "../components/HourglassLoader";
import Modal from "../components/Modal";
import ConversationHistory from "../components/ConversationHistory";
import { getChatSessions } from "../api";

function customerLabel(collected) {
  const c = collected && typeof collected === "object" ? collected : {};
  const name = (c.name || "").toString().trim();
  if (name) return name;
  const phone = (c.phone || "").toString().trim();
  if (phone) return phone;
  return "Unknown";
}

function formatUpdatedAt(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  } catch {
    return String(value);
  }
}

function previewText(history) {
  if (!Array.isArray(history) || history.length === 0) return "No messages yet";
  const last = [...history].reverse().find(m => m?.content);
  if (!last) return "No messages yet";
  const text = String(last.content).replace(/\s+/g, " ").trim();
  return text.length > 120 ? text.slice(0, 117) + "…" : text;
}

export default function Chats() {
  const { theme: t } = useTheme();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getChatSessions(100)
      .then((data) => {
        if (cancelled) return;
        setSessions(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load conversations");
        setSessions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <HourglassLoader />;

  return (
    <div style={{ padding: "20px 16px", maxWidth: 900, animation: "fadeIn .3s ease" }}>
      <style>{"@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}"}</style>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, letterSpacing: -0.6, margin: 0 }}>Chats</h1>
        <p style={{ color: t.textSecondary, fontSize: 13, marginTop: 5 }}>
          {sessions.length} conversation{sessions.length === 1 ? "" : "s"}
          {error ? ` · ${error}` : ""}
        </p>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon="💬"
          title="No chats yet"
          subtitle={error || "Customer bot conversations will show up here"}
        />
      ) : (
        sessions.map((session) => {
          const label = customerLabel(session.collected);
          const booked = Boolean(session.booking_id);
          return (
            <div
              key={session.session_id}
              onClick={() => setSelected(session)}
              style={{
                background: t.cardBg,
                borderRadius: 18,
                border: `1px solid ${t.border}`,
                boxShadow: t.cardShadow,
                padding: 18,
                marginBottom: 14,
                cursor: "pointer",
                transition: "border-color .15s, transform .15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.accent || "#667eea"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: t.textPrimary }}>{label}</div>
                  <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>
                    Last active · {formatUpdatedAt(session.updated_at)}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: 20,
                    background: booked
                      ? (t.name === "dark" ? "rgba(34,197,94,0.15)" : "#dcfce7")
                      : (t.name === "dark" ? "rgba(148,163,184,0.15)" : "#f1f5f9"),
                    color: booked ? "#22c55e" : t.textMuted,
                    border: `1px solid ${booked
                      ? (t.name === "dark" ? "rgba(34,197,94,0.25)" : "#bbf7d0")
                      : t.border}`,
                  }}
                >
                  {booked ? "Booked" : "Not booked"}
                </span>
              </div>
              <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.5 }}>
                {previewText(session.history)}
              </div>
            </div>
          );
        })
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} maxWidth={520}>
        {selected && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: t.textPrimary }}>
                  {customerLabel(selected.collected)}
                </div>
                <div style={{ fontSize: 12, color: t.textMuted, marginTop: 6 }}>
                  {formatUpdatedAt(selected.updated_at)}
                  {selected.booking_id ? ` · ${selected.booking_id}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{
                  background: t.cardBg2,
                  border: `1px solid ${t.border}`,
                  borderRadius: 10,
                  width: 36,
                  height: 36,
                  cursor: "pointer",
                  fontSize: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: t.textSecondary,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ background: t.cardBg2, borderRadius: 14, border: `1px solid ${t.border}`, padding: 14 }}>
              <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>
                Conversation · read-only
              </div>
              <ConversationHistory messages={selected.history || []} />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
