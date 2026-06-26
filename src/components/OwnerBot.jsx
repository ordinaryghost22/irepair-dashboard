// OwnerBot.jsx
// Drop into: src/components/OwnerBot.jsx
// This AI assistant has REAL access to your booking/slot/lead data from Zustand store.
// It calls Groq (llama-3.3-70b-versatile) with a system prompt built from your live data.
// Add <OwnerBot /> anywhere in your dashboard — e.g. as a floating button or sidebar panel.

import { useState, useRef, useEffect } from "react";
import { useStore } from "../store/useStore"; // adjust path

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

// Builds a context string from your live Zustand data
function buildContext(bookings, slots, leads) {
  const today = new Date().toISOString().split("T")[0];

  const upcoming = bookings.filter(b => b.date >= today).slice(0, 20);
  const recent   = bookings.filter(b => b.date < today).slice(-10);
  const unpaid   = bookings.filter(b => b.paymentStatus === "Unpaid");

  const slotSummary = slots.slice(0, 14).map(s =>
    `${s.date}: ${s.available} available, ${s.booked} booked`
  ).join("\n");

  return `
=== iRepair Shop — Live Data (as of ${today}) ===

UPCOMING BOOKINGS (next 20):
${upcoming.map(b =>
  `- ${b.date} ${b.time} | ${b.name} | ${b.phone} | ${b.device} | ${b.issue} | ${b.paymentStatus || "Unpaid"}`
).join("\n") || "None"}

RECENT COMPLETED BOOKINGS (last 10):
${recent.map(b =>
  `- ${b.date} | ${b.name} | ${b.device} | ${b.issue} | ${b.paymentStatus || "?"}`
).join("\n") || "None"}

UNPAID BOOKINGS (${unpaid.length} total):
${unpaid.slice(0, 10).map(b =>
  `- ${b.date} | ${b.name} | ${b.phone} | ${b.device}`
).join("\n") || "None"}

SLOT AVAILABILITY (next 14 days):
${slotSummary || "No slot data"}

LEADS (${leads.length} total, last 5):
${leads.slice(-5).map(l =>
  `- ${l.name} | ${l.phone} | ${l.device} | ${l.issue}`
).join("\n") || "None"}
`.trim();
}

const SYSTEM_PROMPT = (context) => `
You are iRepair Assistant — the smartest employee at an iPhone repair shop in Lahore called iRepair.

RULES:
- You have REAL live shop data below. ALWAYS use it to answer. Never say you don't have access.
- Give SPECIFIC answers using the actual names, numbers, dates from the data.
- If owner asks "who hasn't paid" — list the actual names and phones.
- If owner asks "today's bookings" — list them with time, name, device.
- If owner asks for a summary — give real numbers from the data, not generic advice.
- Be concise and direct. No fluff. No "Great question!". No unnecessary explanations.
- If data shows 0 bookings, say "Abhi koi booking nahi hai" — don't make things up.
- Language: Owner writes Roman Urdu → reply Roman Urdu. Owner writes English → reply English.
- Format lists with dashes. Bold important info using *asterisks*.

YOU CAN ANSWER:
- Kaun kaun aaj aa raha hai aur kab
- Kiska payment pending hai (name + phone dena)
- Kitne slots available hain
- Is week kitni bookings hain
- Leads mein se kisko follow up karna chahiye
- Overall shop performance summary
- Koi specific customer ki details

NEVER:
- Say "I don't have access to that data"
- Give generic business advice when specific data is available
- Make up names or numbers
- Be overly formal or robotic

${context}
`.trim();


export default function OwnerBot() {
  const bookings = useStore(s => s.bookings || []);
  const slots    = useStore(s => s.slots    || []);
  const leads    = useStore(s => s.leads    || []);

  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Salam! I have access to your live shop data. Ask me anything — bookings, payments, slots, leads." }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const context = buildContext(bookings, slots, leads);
      const history = [...messages, userMsg].map(m => ({
        role: m.role, content: m.content
      }));

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT(context) },
            ...history,
          ],
          max_tokens: 600,
          temperature: 0.4,
        }),
      });

      if (!res.ok) throw new Error(`Groq error ${res.status}`);
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Sorry, no response.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Error reaching AI: ${err.message}. Check your VITE_GROQ_API_KEY.`
      }]);
    } finally {
      setLoading(false);
    }
  }

  // ── Styles (no ThemeContext dependency for portability) ──────────────────
  const panel = {
    position: "fixed", bottom: 80, right: 20, zIndex: 1000,
    width: 360, maxWidth: "calc(100vw - 40px)",
    background: "var(--color-background-primary, #fff)",
    border: "0.5px solid var(--color-border-secondary, #d0d0d0)",
    borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
    display: "flex", flexDirection: "column", overflow: "hidden",
    height: 480,
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 1001,
          width: 52, height: 52, borderRadius: "50%",
          background: "#2563EB", color: "#fff",
          border: "none", cursor: "pointer",
          fontSize: 22, display: "flex", alignItems: "center",
          justifyContent: "center", boxShadow: "0 2px 8px rgba(37,99,235,0.4)",
          transition: "transform 0.15s",
        }}
        title="AI Assistant"
        aria-label="Open AI assistant"
      >
        {open ? "✕" : "✦"}
      </button>

      {/* Chat Panel */}
      {open && (
        <div style={panel}>
          {/* Header */}
          <div style={{
            padding: "12px 16px", borderBottom: "0.5px solid var(--color-border-tertiary, #eee)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "#EEF2FF", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 14,
            }}>✦</div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>
                iRepair Assistant
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>
                {bookings.length} bookings · {leads.length} leads in context
              </p>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "12px 16px",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
              }}>
                <div style={{
                  padding: "8px 12px",
                  background: m.role === "user" ? "#2563EB" : "var(--color-background-secondary, #f4f4f4)",
                  color: m.role === "user" ? "#fff" : "var(--color-text-primary)",
                  borderRadius: m.role === "user"
                    ? "12px 12px 4px 12px"
                    : "12px 12px 12px 4px",
                  fontSize: 13, lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start" }}>
                <div style={{
                  padding: "8px 14px",
                  background: "var(--color-background-secondary, #f4f4f4)",
                  borderRadius: "12px 12px 12px 4px",
                  fontSize: 13, color: "var(--color-text-secondary)",
                }}>
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px",
            borderTop: "0.5px solid var(--color-border-tertiary, #eee)",
            display: "flex", gap: 8,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask about bookings, payments, slots…"
              disabled={loading}
              style={{
                flex: 1, border: "0.5px solid var(--color-border-secondary, #ccc)",
                borderRadius: 8, padding: "7px 10px",
                fontSize: 13, background: "var(--color-background-primary)",
                color: "var(--color-text-primary)", outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: "7px 14px", background: "#2563EB", color: "#fff",
                border: "none", borderRadius: 8, fontSize: 13,
                cursor: loading ? "wait" : "pointer",
                opacity: (!input.trim() || loading) ? 0.5 : 1,
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── SAMPLE QUESTIONS TO ASK ──────────────────────────────────────────────────
// "How many unpaid bookings do I have?"
// "Who is coming in tomorrow?"
// "What slots are available this week?"
// "Which device is booked most often?"
// "Show me leads from the last 5 days"
// "Total bookings this month?"
