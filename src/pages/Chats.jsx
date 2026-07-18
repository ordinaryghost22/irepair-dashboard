import { useEffect, useState } from "react";
import { useTheme, secondaryBtnStyle, cardStyle } from "../context/ThemeContext";
import EmptyState from "../components/EmptyState";
import Skeleton from "../components/Skeleton";
import Modal from "../components/Modal";
import ConversationHistory from "../components/ConversationHistory";
import { getChatSessions } from "../api";
import { STATUS_COLORS } from "../constants";

function customerLabel(collected) {
  const c = collected && typeof collected === "object" ? collected : {};
  const name = (c.name || "").toString().trim();
  if (name) return name;
  const phone = (c.phone || "").toString().trim();
  if (phone) return phone;
  const device = (c.device || "").toString().trim();
  const issue = (c.issue || "").toString().trim();
  if (device && issue) return `${device} — ${issue}`;
  if (device) return device;
  if (issue) return issue;
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
  const last = [...history].reverse().find((m) => m?.content);
  if (!last) return "No messages yet";
  const text = String(last.content).replace(/\s+/g, " ").trim();
  return text.length > 120 ? text.slice(0, 117) + "…" : text;
}

function BookingBadge({ booked }) {
  // Booked → Confirmed green; Not booked → muted Completed grey
  const cfg = booked ? STATUS_COLORS.Confirmed : STATUS_COLORS.Completed;
  const label = booked ? "Booked" : "Not booked";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        boxShadow: cfg.shadow || "none",
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
      {label}
    </span>
  );
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
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Skeleton rows={5} />;

  return (
    <div style={{ padding: "20px 16px", maxWidth: 900 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: t.textPrimary, letterSpacing: -0.6, margin: 0 }}>Chats</h1>
        <p style={{ color: t.textSecondary, fontSize: 13, marginTop: 5 }}>
          {sessions.length} conversation{sessions.length === 1 ? "" : "s"}
          {error ? ` · ${error}` : ""}
        </p>
      </div>

      {sessions.length === 0 ? (
        <EmptyState icon="💬" title="No chats yet" subtitle={error || "Customer bot conversations will show up here"} />
      ) : (
        <div className="list-stagger">
          {sessions.map((session) => {
            const label = customerLabel(session.collected);
            const booked = Boolean(session.booking_id);
            return (
              <div
                key={session.session_id}
                className="ui-interactive"
                onClick={() => setSelected(session)}
                style={{
                  ...cardStyle(t, { interactive: true }),
                  padding: 18,
                  marginBottom: 12,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = t.cardHover;
                  e.currentTarget.style.borderColor = t.borderHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = t.cardBg;
                  e.currentTarget.style.borderColor = t.border;
                  e.currentTarget.style.borderTopColor = t.borderTopHighlight;
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 10,
                    flexWrap: "wrap",
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: t.textPrimary }}>{label}</div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>
                      Last active · {formatUpdatedAt(session.updated_at)}
                    </div>
                  </div>
                  <BookingBadge booked={booked} />
                </div>
                <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.5 }}>{previewText(session.history)}</div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} maxWidth={520}>
        {selected && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: t.textPrimary }}>{customerLabel(selected.collected)}</div>
                <div style={{ fontSize: 12, color: t.textMuted, marginTop: 6 }}>
                  {formatUpdatedAt(selected.updated_at)}
                  {selected.booking_id ? ` · ${selected.booking_id}` : ""}
                </div>
              </div>
              <button
                type="button"
                className="ui-interactive"
                onClick={() => setSelected(null)}
                style={{
                  ...secondaryBtnStyle(t),
                  width: 36,
                  height: 36,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ background: t.cardBg2, borderRadius: 14, border: `1px solid ${t.border}`, padding: 14 }}>
              <div
                style={{
                  fontSize: 11,
                  color: t.textMuted,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                  marginBottom: 12,
                }}
              >
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
