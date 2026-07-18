import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getBookingHistory } from "../api";

/**
 * Read-only chatbot conversation for a booking.
 * Messages come from chat_sessions.history linked by booking_id.
 */
export default function ConversationHistory({ bookingId }) {
  const { theme: t } = useTheme();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getBookingHistory(bookingId)
      .then((data) => {
        if (cancelled) return;
        setMessages(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load history");
        setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [bookingId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "36px 0", color: t.textMuted, fontSize: 13 }}>
        Loading conversation…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "36px 0", color: "#ef4444", fontSize: 13 }}>
        {error}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "36px 0", color: t.textMuted, fontSize: 13 }}>
        No chat history for this booking.
        <div style={{ marginTop: 6, fontSize: 12 }}>
          History appears for bookings made via the customer chatbot after linking is enabled.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "50vh", overflowY: "auto", paddingRight: 4 }}>
      {messages.map((m, i) => {
        const isCustomer = m.role === "user";
        const isBot = m.role === "assistant";
        if (!isCustomer && !isBot) return null;
        return (
          <div key={i} style={{ display: "flex", justifyContent: isCustomer ? "flex-start" : "flex-end" }}>
            <div
              style={{
                background: isCustomer ? t.cardBg2 : "linear-gradient(135deg,#667eea,#764ba2)",
                border: isCustomer ? `1px solid ${t.border}` : "none",
                borderRadius: isCustomer ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
                padding: "12px 14px",
                maxWidth: "85%",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: isCustomer ? t.textMuted : "rgba(255,255,255,.55)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                  marginBottom: 5,
                }}
              >
                {isCustomer ? "Customer" : "Bot"}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: isCustomer ? t.textPrimary : "#fff",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
