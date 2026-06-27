// OwnerBot.jsx — Premium AI Assistant with ThemeContext support
import { useState, useRef, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useTheme } from "../context/ThemeContext";

export default function OwnerBot() {
  const { theme: t } = useTheme();
  const bookings = useStore(s => s.bookings || []);
  const slots    = useStore(s => s.slots    || []);
  const leads    = useStore(s => s.leads    || []);

  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Salam! I have access to your live shop data. Ask me anything — bookings, payments, slots, leads." }
  ]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  async function sendMessage(text) {
  const msg = (text || input).trim();
  if (!msg || loading) return;

  const userMsg = { role: "user", content: msg };
  setMessages(prev => [...prev, userMsg]);
  setInput("");
  setLoading(true);

  try {
    const history = [...messages, userMsg].map(m => ({
      role: m.role, content: m.content
    }));

    const res = await fetch("https://irepair-backend-production.up.railway.app/chat/owner", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("irepair_token")}`
      },
      body: JSON.stringify({ messages: history }),
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
  } catch (err) {
    setMessages(prev => [...prev, {
      role: "assistant",
      content: `Error: ${err.message}`
    }]);
  } finally {
    setLoading(false);
  }
}

  const isDark = t.name === "dark";

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1001,
          width: 54, height: 54, borderRadius: "50%",
          background: `linear-gradient(135deg, ${t.accent}, ${isDark ? "#6366f1" : "#4f46e5"})`,
          color: "#fff",
          border: "none", cursor: "pointer",
          fontSize: open ? 18 : 22,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 20px ${t.accentGlow}, 0 2px 8px rgba(0,0,0,0.2)`,
          transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          transform: open ? "scale(0.92)" : "scale(1)",
        }}
        title="AI Assistant"
        aria-label="Open AI assistant"
      >
        {open ? "✕" : "✦"}
      </button>

      {/* ── Chat Panel ── */}
      {open && (
        <div style={{
          position: "fixed", bottom: 90, right: 24, zIndex: 1000,
          width: 370, maxWidth: "calc(100vw - 48px)",
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: 20,
          boxShadow: isDark
            ? `0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px ${t.border}, inset 0 1px 0 rgba(255,255,255,0.04)`
            : `0 24px 60px rgba(99,102,241,0.12), 0 4px 16px rgba(0,0,0,0.08)`,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          height: 500,
          animation: "botSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}>

          {/* ── Header ── */}
          <div style={{
            padding: "14px 16px",
            background: isDark
              ? `linear-gradient(135deg, #1a1f35 0%, #151929 100%)`
              : `linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)`,
            borderBottom: `1px solid ${t.border}`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            {/* Avatar */}
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: `linear-gradient(135deg, ${t.accent}, ${isDark ? "#6366f1" : "#4f46e5"})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: "#fff",
              boxShadow: `0 2px 8px ${t.accentGlow}`,
              flexShrink: 0,
            }}>✦</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: 0, fontWeight: 700, fontSize: 14,
                color: t.textPrimary, letterSpacing: "-0.01em",
              }}>
                iRepair Assistant
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 6px rgba(34,197,94,0.6)",
                  display: "inline-block",
                }} />
                <p style={{
                  margin: 0, fontSize: 11, color: t.textSecondary,
                }}>
                  {bookings.length} bookings · {leads.length} leads in context
                </p>
              </div>
            </div>

            {/* Clear chat button */}
            <button
              onClick={() => setMessages([{ role: "assistant", content: "Salam! I have access to your live shop data. Ask me anything — bookings, payments, slots, leads." }])}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: t.textMuted, fontSize: 11, padding: "4px 8px",
                borderRadius: 6, transition: "all 0.15s",
              }}
              title="Clear chat"
            >
              Clear
            </button>
          </div>

          {/* ── Messages ── */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "14px 14px 8px",
            display: "flex", flexDirection: "column", gap: 10,
            scrollbarWidth: "thin",
            scrollbarColor: `${t.border} transparent`,
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "88%",
                animation: "msgFadeIn 0.2s ease",
              }}>
                {m.role === "assistant" && i === 0 && (
                  <p style={{
                    margin: "0 0 4px 4px", fontSize: 10,
                    color: t.textMuted, fontWeight: 600,
                    letterSpacing: "0.05em", textTransform: "uppercase",
                  }}>Assistant</p>
                )}
                <div style={{
                  padding: "9px 13px",
                  background: m.role === "user"
                    ? `linear-gradient(135deg, ${t.accent}, ${isDark ? "#6366f1" : "#4f46e5"})`
                    : t.cardBg2,
                  color: m.role === "user" ? "#fff" : t.textPrimary,
                  borderRadius: m.role === "user"
                    ? "16px 16px 4px 16px"
                    : "16px 16px 16px 4px",
                  fontSize: 13, lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  border: m.role === "user" ? "none" : `1px solid ${t.border}`,
                  boxShadow: m.role === "user"
                    ? `0 2px 12px ${t.accentGlow}`
                    : "none",
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ alignSelf: "flex-start" }}>
                <div style={{
                  padding: "10px 16px",
                  background: t.cardBg2,
                  border: `1px solid ${t.border}`,
                  borderRadius: "16px 16px 16px 4px",
                  display: "flex", gap: 5, alignItems: "center",
                }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: t.accent,
                      display: "inline-block",
                      animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Quick Prompts ── */}
          {messages.length <= 1 && (
            <div style={{
              padding: "6px 14px 8px",
              display: "flex", gap: 6, flexWrap: "wrap",
            }}>
              {QUICK_PROMPTS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  style={{
                    padding: "5px 10px",
                    background: t.cardBg2,
                    border: `1px solid ${t.border}`,
                    borderRadius: 20,
                    fontSize: 11, color: t.textSecondary,
                    cursor: "pointer", transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => {
                    e.target.style.borderColor = t.accent;
                    e.target.style.color = t.accent;
                  }}
                  onMouseLeave={e => {
                    e.target.style.borderColor = t.border;
                    e.target.style.color = t.textSecondary;
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* ── Input ── */}
          <div style={{
            padding: "10px 12px 12px",
            borderTop: `1px solid ${t.border}`,
            display: "flex", gap: 8, alignItems: "center",
            background: isDark ? t.cardBg : "#fafbff",
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Bookings, payments, slots pocho…"
              disabled={loading}
              style={{
                flex: 1,
                border: `1px solid ${input ? t.accent : t.border}`,
                borderRadius: 12, padding: "8px 12px",
                fontSize: 13,
                background: t.inputBg,
                color: t.textPrimary,
                outline: "none",
                transition: "border-color 0.15s",
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: 36, height: 36, flexShrink: 0,
                background: input.trim() && !loading
                  ? `linear-gradient(135deg, ${t.accent}, ${isDark ? "#6366f1" : "#4f46e5"})`
                  : t.cardBg2,
                color: input.trim() && !loading ? "#fff" : t.textMuted,
                border: `1px solid ${input.trim() && !loading ? "transparent" : t.border}`,
                borderRadius: 10, fontSize: 16,
                cursor: loading ? "wait" : input.trim() ? "pointer" : "default",
                transition: "all 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: input.trim() && !loading ? `0 2px 8px ${t.accentGlow}` : "none",
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* ── Keyframe Animations ── */}
      <style>{`
        @keyframes botSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes msgFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
