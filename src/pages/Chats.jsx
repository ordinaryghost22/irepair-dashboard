import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme, secondaryBtnStyle, primaryBtnStyle, cardStyle, EASE } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import ConversationAvatar from "../components/ConversationAvatar";
import ConnectWhatsAppModal from "../components/ConnectWhatsAppModal";
import { getChatSessions, getWhatsAppIntegrationStatus, sendWhatsAppText } from "../api";
import { STATUS_COLORS } from "../constants";
import { useStore } from "../store/useStore";
import { getCustomerTier } from "../utils/customerTier";
import { getInitials, timeAgo, inboxDateLabel } from "../utils/format";

const CHANNEL_FILTERS = ["All", "Website", "WhatsApp", "Instagram", "Messenger"];

const CHANNEL_SLUG = {
  Website: "website",
  WhatsApp: "whatsapp",
  Instagram: "instagram",
  Messenger: "messenger",
};

const CHANNEL_LABEL = {
  website: "Website",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  messenger: "Messenger",
};

/** Channels not yet wired (WhatsApp connect status is fetched separately). */
const UNCONNECTED_CHANNELS = new Set(["instagram", "messenger"]);

/** Channels that support outbound replies from the inbox. */
const REPLYABLE_CHANNELS = new Set(["whatsapp"]);

function normalizeChannel(raw) {
  const s = String(raw || "website").trim().toLowerCase();
  return CHANNEL_LABEL[s] ? s : "website";
}

function channelLabel(slug) {
  return CHANNEL_LABEL[slug] || "Website";
}

function customerLabel(collected) {
  const c = collected && typeof collected === "object" ? collected : {};
  const name = (c.name || "").toString().trim();
  if (name) return name;
  const phone = (c.phone || "").toString().trim();
  if (phone) return phone;
  const device = (c.device || "").toString().trim();
  const issue = (c.issue || "").toString().trim();
  // Avoid "iphone 13 — iphone 13" when device/issue were parsed as the same string
  if (device && issue) {
    if (device.toLowerCase() === issue.toLowerCase()) return device;
    return `${device} — ${issue}`;
  }
  if (device) return device;
  if (issue) return issue;
  return "Unknown";
}

/**
 * Avatar input: real customer name → initials; else device icon; else "?".
 * Never pass device/issue strings into getInitials.
 */
function avatarProps(collected) {
  const c = collected && typeof collected === "object" ? collected : {};
  const name = (c.name || "").toString().trim();
  const device = (c.device || "").toString().trim();
  // Name that is just a device model → treat as device for avatar purposes
  if (name && !(device && name.toLowerCase() === device.toLowerCase())) {
    return { name, fallbackIcon: null };
  }
  if (device) return { name: "", fallbackIcon: "📱" };
  return { name: "", fallbackIcon: null };
}

function previewText(history) {
  if (!Array.isArray(history) || history.length === 0) return "No messages yet";
  const last = [...history].reverse().find((m) => m?.content);
  if (!last) return "No messages yet";
  const text = String(last.content).replace(/\s+/g, " ").trim();
  return text.length > 80 ? text.slice(0, 77) + "…" : text;
}

function messageAt(m, fallback) {
  return m?.at || m?.timestamp || m?.created_at || fallback || null;
}

/** Clock time e.g. "2:27 PM" */
function formatClock(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return null;
  }
}

/** Inline **bold** segments */
function renderInlineMarkdown(text) {
  const parts = String(text).split(/(\*\*[^*\n]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} style={{ fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * Lightweight markdown: **bold**, bullet lists (- / * / •), line breaks.
 * No full markdown library — inbox-safe subset only.
 */
function MessageContent({ text, color }) {
  const raw = String(text ?? "");
  const lines = raw.split("\n");
  const blocks = [];
  let bullets = [];

  const flushBullets = () => {
    if (!bullets.length) return;
    const key = `ul-${blocks.length}`;
    blocks.push(
      <ul
        key={key}
        style={{
          margin: "4px 0 2px",
          paddingLeft: 18,
          listStyleType: "disc",
        }}
      >
        {bullets.map((b, i) => (
          <li key={i} style={{ marginBottom: 2 }}>
            {renderInlineMarkdown(b)}
          </li>
        ))}
      </ul>
    );
    bullets = [];
  };

  lines.forEach((line, i) => {
    const m = line.match(/^\s*[-*•]\s+(.*)$/);
    if (m) {
      bullets.push(m[1]);
      return;
    }
    flushBullets();
    if (line.trim() === "") {
      blocks.push(<div key={`br-${i}`} style={{ height: 6 }} />);
      return;
    }
    blocks.push(
      <div key={`p-${i}`} style={{ margin: 0 }}>
        {renderInlineMarkdown(line)}
      </div>
    );
  });
  flushBullets();

  return (
    <div
      style={{
        fontSize: 14,
        color,
        lineHeight: 1.5,
        wordBreak: "break-word",
        overflowWrap: "anywhere",
      }}
    >
      {blocks}
    </div>
  );
}

/** iMessage / WhatsApp-style radii: top-rounded first, square middle, bottom-rounded last */
function bubbleRadius(isCustomer, first, last) {
  const only = first && last;
  if (isCustomer) {
    if (only) return "16px 16px 16px 4px";
    if (first) return "16px 16px 6px 6px";
    if (last) return "6px 16px 16px 4px";
    return "6px 16px 6px 6px";
  }
  if (only) return "16px 16px 4px 16px";
  if (first) return "16px 16px 6px 6px";
  if (last) return "16px 6px 4px 16px";
  return "16px 6px 6px 6px";
}

/**
 * Build render items: date dividers + grouped consecutive same-role bubbles.
 * Dividers only when the calendar day actually changes between messages that
 * have real timestamps — never invent mid-thread dividers from session.updated_at.
 */
function buildThreadItems(history) {
  const msgs = (Array.isArray(history) ? history : []).filter(
    (m) => m?.role === "user" || m?.role === "assistant"
  );
  if (msgs.length === 0) return [];

  const enriched = msgs.map((m, i) => ({
    ...m,
    _at: messageAt(m),
    _i: i,
  }));

  const items = [];
  let lastDateKey = null;
  let group = null;

  const flush = () => {
    if (group) items.push(group);
    group = null;
  };

  for (const m of enriched) {
    const dateKey = m._at ? new Date(m._at).toDateString() : null;
    if (dateKey && dateKey !== lastDateKey) {
      flush();
      // Only on a real date *change* (skip the first dated message — no prior day)
      if (lastDateKey !== null) {
        const label = inboxDateLabel(m._at);
        if (label) items.push({ type: "divider", label, key: `d-${dateKey}-${m._i}` });
      }
      lastDateKey = dateKey;
    }

    if (!group || group.role !== m.role) {
      flush();
      group = {
        type: "group",
        role: m.role,
        key: `g-${m._i}`,
        messages: [m],
        at: m._at,
      };
    } else {
      group.messages.push(m);
      if (m._at) group.at = m._at;
    }
  }
  flush();
  return items;
}

function CustomerContextPanel({ collected, t }) {
  const c = collected && typeof collected === "object" ? collected : {};
  const fields = [];
  const device = (c.device || "").toString().trim();
  const issue = (c.issue || "").toString().trim();
  const date = (c.date || c.requested_date || c.preferred_date || "").toString().trim();
  const time = (c.time || c.requested_time || c.preferred_time || "").toString().trim();

  if (device) fields.push({ label: "Device", value: device });
  if (issue && issue.toLowerCase() !== device.toLowerCase()) {
    fields.push({ label: "Issue", value: issue });
  }
  if (date) fields.push({ label: "Date", value: date });
  if (time) fields.push({ label: "Time", value: time });

  if (fields.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        padding: "10px 16px",
        borderBottom: `1px solid ${t.borderSub}`,
        flexShrink: 0,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      {fields.map((f) => (
        <span
          key={f.label}
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 5,
            padding: "5px 10px",
            borderRadius: 8,
            fontSize: 11,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${t.border}`,
            maxWidth: "100%",
          }}
        >
          <span
            style={{
              color: t.textMuted,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              flexShrink: 0,
            }}
          >
            {f.label}
          </span>
          <span
            style={{
              color: t.textSecondary,
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {f.value}
          </span>
        </span>
      ))}
    </div>
  );
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

function InboxListSkeleton({ t }) {
  const bar = {
    height: 52,
    borderRadius: 12,
    marginBottom: 8,
    background:
      "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.09) 45%, rgba(255,255,255,0.04) 100%)",
    backgroundSize: "200% 100%",
    animation: "inboxShimmer 1.4s ease-in-out infinite",
    border: `1px solid ${t.border}`,
  };
  return (
    <div style={{ padding: "10px 12px" }} aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            ...bar,
            animationDelay: `${i * 0.12}s`,
            opacity: 1 - i * 0.08,
          }}
        />
      ))}
    </div>
  );
}

export default function Chats() {
  const { theme: t } = useTheme();
  const { showToast } = useToast();
  const bookings = useStore((s) => s.bookings);
  const invoices = useStore((s) => s.invoices);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [channelFilter, setChannelFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [threadKey, setThreadKey] = useState(0);
  /** null = status not loaded yet (avoid flicker to "not connected") */
  const [waIntegration, setWaIntegration] = useState(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const threadEndRef = useRef(null);
  const threadScrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getChatSessions(100)
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data) ? data : [];
        setSessions(
          rows.map((s) => ({
            ...s,
            channel: normalizeChannel(s.channel || "website"),
          }))
        );
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

  useEffect(() => {
    let cancelled = false;
    getWhatsAppIntegrationStatus()
      .then((data) => {
        if (cancelled) return;
        setWaIntegration(
          data?.connected
            ? {
                connected: true,
                phone_number_id: data.phone_number_id || null,
                verified_name: data.verified_name || null,
                display_phone_number: data.display_phone_number || null,
                status: data.status || "connected",
              }
            : { connected: false, status: "not_connected" }
        );
      })
      .catch(() => {
        if (!cancelled) setWaIntegration({ connected: false, status: "not_connected" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filterSlug = channelFilter === "All" ? null : CHANNEL_SLUG[channelFilter];
  const waStatusPending = filterSlug === "whatsapp" && waIntegration === null;
  const whatsappConnected = Boolean(waIntegration?.connected);
  const filterUnconnected =
    filterSlug &&
    (UNCONNECTED_CHANNELS.has(filterSlug) ||
      (filterSlug === "whatsapp" && waIntegration !== null && !whatsappConnected));

  function handleWhatsAppConnected(data) {
    setWaIntegration({
      connected: true,
      phone_number_id: data?.phone_number_id || null,
      verified_name: data?.verified_name || null,
      display_phone_number: data?.display_phone_number || null,
      status: data?.status || "connected",
    });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = sessions;
    if (filterSlug) list = list.filter((s) => s.channel === filterSlug);
    if (q) {
      list = list.filter((s) => {
        const label = customerLabel(s.collected).toLowerCase();
        const phone = String(s.collected?.phone || "").toLowerCase();
        const name = String(s.collected?.name || "").toLowerCase();
        return label.includes(q) || phone.includes(q) || name.includes(q);
      });
    }
    return [...list].sort((a, b) => {
      const ta = new Date(a.updated_at || 0).getTime();
      const tb = new Date(b.updated_at || 0).getTime();
      return tb - ta;
    });
  }, [sessions, filterSlug, search]);

  const selected = useMemo(
    () => sessions.find((s) => s.session_id === selectedId) || null,
    [sessions, selectedId]
  );

  useEffect(() => {
    setDraft("");
    setThreadKey((k) => k + 1);
  }, [selectedId]);

  const historyLen = selected?.history?.length ?? 0;
  useEffect(() => {
    if (!selectedId) return;
    const scroll = () => {
      const pane = threadScrollRef.current;
      if (pane) pane.scrollTop = pane.scrollHeight;
      threadEndRef.current?.scrollIntoView?.({ block: "end" });
    };
    // After paint / bubble enter animation
    const id = requestAnimationFrame(() => {
      scroll();
      requestAnimationFrame(scroll);
    });
    const timer = setTimeout(scroll, 220);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(timer);
    };
  }, [selectedId, historyLen, threadKey]);

  function selectSession(session) {
    setSelectedId(session.session_id);
  }

  async function handleSend() {
    if (!selected || selected.channel !== "whatsapp") return;
    const text = draft.trim();
    const phone = selected.collected?.phone;
    if (!text || !phone) {
      showToast(phone ? "Type a message" : "No phone on this conversation", "error");
      return;
    }
    setSending(true);
    try {
      await sendWhatsAppText(phone, text);
      const now = new Date().toISOString();
      setSessions((prev) =>
        prev.map((s) => {
          if (s.session_id !== selected.session_id) return s;
          return {
            ...s,
            updated_at: now,
            history: [...(s.history || []), { role: "assistant", content: text, at: now }],
          };
        })
      );
      setDraft("");
      showToast("WhatsApp message sent");
    } catch (err) {
      showToast(err.message || "Failed to send", "error");
    } finally {
      setSending(false);
    }
  }

  const canReply = selected && REPLYABLE_CHANNELS.has(selected.channel);
  const selectedTier = selected
    ? getCustomerTier(selected.collected?.phone, bookings, invoices)
    : null;
  const selectedAvatar = selected ? avatarProps(selected.collected) : null;
  const threadItems = selected
    ? buildThreadItems(selected.history)
    : [];

  const paneShell = {
    ...cardStyle(t),
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
    height: "calc(100vh - 120px)",
    maxHeight: 820,
  };

  return (
    <div style={{ padding: "16px 16px 20px", maxWidth: 1200, height: "100%" }}>
      <style>{`
        @media (max-width: 860px) {
          .inbox-split { flex-direction: column !important; height: auto !important; }
          .inbox-split .inbox-sidebar { width: 100% !important; max-height: 42vh; }
          .inbox-split .inbox-thread { min-height: 48vh; }
        }
        @keyframes inboxThreadIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes inboxBubbleIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes inboxShimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        .inbox-card {
          transition: background 150ms cubic-bezier(0.16, 1, 0.3, 1),
            border-color 150ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .inbox-card:not(.inbox-card--active):hover {
          background: rgba(255,255,255,0.045) !important;
        }
        .inbox-bubble {
          position: relative;
          animation: inboxBubbleIn 180ms cubic-bezier(0.16, 1, 0.3, 1) both;
          max-width: 100%;
        }
        .inbox-bubble ul {
          margin: 4px 0 2px;
          padding-left: 18px;
        }
        .inbox-bubble li {
          margin-bottom: 2px;
        }
        .inbox-bubble--tail.inbox-bubble--customer::after {
          content: "";
          position: absolute;
          left: -5px;
          bottom: 0;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 0 10px 8px;
          border-color: transparent transparent rgba(255,255,255,0.05) transparent;
          filter: drop-shadow(-1px 0 0 rgba(255,255,255,0.08));
        }
        .inbox-bubble--tail.inbox-bubble--bot::after {
          content: "";
          position: absolute;
          right: -5px;
          bottom: 0;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 8px 10px 0;
          border-color: transparent rgba(139,92,246,0.14) transparent transparent;
          filter: drop-shadow(1px 0 0 rgba(139,92,246,0.28));
        }
      `}</style>

      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: t.textPrimary, letterSpacing: -0.6, margin: 0 }}>
          Inbox
        </h1>
        <p style={{ color: t.textSecondary, fontSize: 13, marginTop: 4 }}>
          {waStatusPending
            ? "WhatsApp · checking connection…"
            : filterUnconnected
              ? `${channelFilter} · not connected`
              : channelFilter === "WhatsApp" && whatsappConnected
                ? [
                    "WhatsApp · connected",
                    waIntegration?.verified_name,
                    waIntegration?.display_phone_number,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : `${filtered.length} conversation${filtered.length === 1 ? "" : "s"}`}
          {error ? ` · ${error}` : ""}
        </p>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {CHANNEL_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            className="ui-interactive"
            onClick={() => setChannelFilter(s)}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              background: channelFilter === s ? "rgba(255,255,255,0.06)" : "transparent",
              color: channelFilter === s ? t.textPrimary : t.textSecondary,
              border: `1px solid ${channelFilter === s ? t.borderHover : t.border}`,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {waStatusPending ? (
        <div style={{ ...cardStyle(t), padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: t.textMuted }}>Checking WhatsApp connection…</div>
        </div>
      ) : filterUnconnected ? (
        <div>
          <EmptyState
            icon="💬"
            title={`${channelFilter} not connected yet`}
            subtitle={`Connect ${channelFilter} to pull conversations into this inbox. Website chats are available now.`}
          />
          <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
            {channelFilter === "WhatsApp" ? (
              <button
                type="button"
                className="ui-interactive"
                onClick={() => setConnectOpen(true)}
                style={{
                  ...secondaryBtnStyle(t),
                  padding: "8px 16px",
                  fontSize: 12,
                }}
              >
                Connect WhatsApp
              </button>
            ) : (
              <button
                type="button"
                disabled
                style={{
                  ...secondaryBtnStyle(t),
                  padding: "8px 16px",
                  fontSize: 12,
                  opacity: 0.45,
                  cursor: "not-allowed",
                }}
              >
                Connect {channelFilter}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="inbox-split" style={{ display: "flex", gap: 12, alignItems: "stretch", ...{ height: "calc(100vh - 170px)", maxHeight: 820 } }}>
          {/* ── Sidebar ───────────────────────────────────────────── */}
          <div className="inbox-sidebar" style={{ ...paneShell, width: 360, flexShrink: 0 }}>
            {channelFilter === "WhatsApp" && whatsappConnected && (
              <div
                style={{
                  margin: "10px 12px 0",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.28)",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#86efac", marginBottom: 2 }}>
                  WhatsApp connected
                </div>
                <div style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.4 }}>
                  {[waIntegration?.verified_name, waIntegration?.display_phone_number]
                    .filter(Boolean)
                    .join(" · ") ||
                    (waIntegration?.phone_number_id
                      ? `Phone number ID ${waIntegration.phone_number_id}`
                      : "Ready to receive conversations")}
                </div>
              </div>
            )}
            <div style={{ padding: "12px 12px 8px", borderBottom: `1px solid ${t.borderSub}` }}>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or phone…"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 12,
                  background: t.inputBg,
                  border: `1px solid ${t.border}`,
                  color: t.textPrimary,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.border = `1px solid ${t.borderHover}`;
                }}
                onBlur={(e) => {
                  e.target.style.border = `1px solid ${t.border}`;
                }}
              />
            </div>

            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              {loading ? (
                <InboxListSkeleton t={t} />
              ) : filtered.length === 0 ? (
                <div style={{ padding: 24 }}>
                  <EmptyState
                    compact
                    icon="💬"
                    title={search ? "No matches" : channelFilter === "Website" ? "No website chats yet" : "No chats yet"}
                    subtitle={search ? "Try a different name or phone" : error || "Conversations will show up here"}
                  />
                </div>
              ) : (
                <div className="list-stagger" style={{ padding: "6px 8px" }}>
                  {filtered.map((session) => {
                    const label = customerLabel(session.collected);
                    const booked = Boolean(session.booking_id);
                    const phone = session.collected?.phone;
                    const tier = getCustomerTier(phone, bookings, invoices);
                    const active = session.session_id === selectedId;
                    const av = avatarProps(session.collected);
                    const bookedAccent = STATUS_COLORS.Confirmed;
                    return (
                      <div
                        key={session.session_id}
                        className={`ui-interactive inbox-card${active ? " inbox-card--active" : ""}`}
                        onClick={() => selectSession(session)}
                        style={{
                          display: "flex",
                          gap: 12,
                          padding: "12px 12px",
                          marginBottom: 4,
                          borderRadius: 12,
                          cursor: "pointer",
                          background: active ? "rgba(139,92,246,0.10)" : "transparent",
                          border: `1px solid ${active ? "rgba(139,92,246,0.28)" : "transparent"}`,
                          borderLeft: active
                            ? "3px solid #a78bfa"
                            : booked
                              ? `3px solid ${bookedAccent.dot}`
                              : "3px solid transparent",
                          boxShadow: active
                            ? "0 0 20px rgba(139,92,246,0.12)"
                            : "none",
                        }}
                      >
                        <ConversationAvatar
                          name={av.name}
                          fallbackIcon={av.fallbackIcon}
                          channel={session.channel}
                          size={44}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: t.textPrimary,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {label}
                            </div>
                            <div style={{ fontSize: 11, color: t.textMuted, flexShrink: 0 }}>
                              {timeAgo(session.updated_at)}
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: t.textSecondary,
                              marginTop: 3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {previewText(session.history)}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                            <BookingBadge booked={booked} />
                            {tier && <StatusBadge status={tier} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Thread pane ───────────────────────────────────────── */}
          <div className="inbox-thread" style={{ ...paneShell, flex: 1 }}>
            {!selected ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <EmptyState
                  compact
                  icon="✦"
                  title="Select a conversation"
                  subtitle="Pick a chat from the left to read the thread"
                />
              </div>
            ) : (
              <div
                key={threadKey}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  minHeight: 0,
                  animation: `inboxThreadIn 180ms ${EASE} both`,
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    borderBottom: `1px solid ${t.borderSub}`,
                    flexShrink: 0,
                  }}
                >
                  <ConversationAvatar
                    name={selectedAvatar.name}
                    fallbackIcon={selectedAvatar.fallbackIcon}
                    channel={selected.channel}
                    size={40}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: t.textPrimary }}>
                        {customerLabel(selected.collected)}
                      </div>
                      <StatusBadge status={channelLabel(selected.channel)} />
                      {selectedTier && <StatusBadge status={selectedTier} />}
                    </div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginTop: 3 }}>
                      {timeAgo(selected.updated_at)}
                      {selected.booking_id ? ` · ${selected.booking_id}` : ""}
                      {selected.collected?.phone ? ` · ${selected.collected.phone}` : ""}
                    </div>
                  </div>
                </div>

                <CustomerContextPanel collected={selected.collected} t={t} />

                {/* Messages */}
                <div
                  ref={threadScrollRef}
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "16px 16px 12px",
                    minHeight: 0,
                    background: "rgba(0,0,0,0.15)",
                  }}
                >
                  {threadItems.length === 0 ? (
                    <div style={{ textAlign: "center", color: t.textMuted, fontSize: 13, padding: "40px 0" }}>
                      No messages in this conversation.
                    </div>
                  ) : (
                    threadItems.map((item) => {
                      if (item.type === "divider") {
                        return (
                          <div
                            key={item.key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              margin: "14px 0",
                            }}
                          >
                            <div style={{ flex: 1, height: 1, background: t.borderSub }} />
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: t.textMuted,
                                padding: "3px 10px",
                                borderRadius: 20,
                                background: "rgba(255,255,255,0.04)",
                                border: `1px solid ${t.border}`,
                              }}
                            >
                              {item.label}
                            </span>
                            <div style={{ flex: 1, height: 1, background: t.borderSub }} />
                          </div>
                        );
                      }

                      const isCustomer = item.role === "user";
                      return (
                        <div
                          key={item.key}
                          style={{
                            display: "flex",
                            flexDirection: isCustomer ? "row" : "row-reverse",
                            alignItems: "flex-end",
                            gap: 8,
                            marginBottom: 12,
                          }}
                        >
                          {isCustomer ? (
                            <ConversationAvatar
                              name={selectedAvatar.name}
                              fallbackIcon={selectedAvatar.fallbackIcon}
                              channel={selected.channel}
                              size={28}
                              showChannel={false}
                            />
                          ) : (
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 700,
                                color: t.accent,
                                background: "rgba(139,92,246,0.15)",
                                border: "1px solid rgba(139,92,246,0.3)",
                              }}
                            >
                              {getInitials("Bot")}
                            </div>
                          )}
                          <div
                            style={{
                              maxWidth: "68%",
                              width: "fit-content",
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                              minWidth: 0,
                            }}
                          >
                            {item.messages.map((m, mi) => {
                              const first = mi === 0;
                              const last = mi === item.messages.length - 1;
                              const roleClass = isCustomer ? "inbox-bubble--customer" : "inbox-bubble--bot";
                              const tailClass = last ? " inbox-bubble--tail" : "";
                              const clock = formatClock(
                                m._at || item.at || selected.updated_at
                              );
                              return (
                                <div
                                  key={m._i}
                                  className={`inbox-bubble ${roleClass}${tailClass}`}
                                  style={{
                                    background: isCustomer
                                      ? "rgba(255,255,255,0.05)"
                                      : "rgba(139,92,246,0.14)",
                                    border: `1px solid ${isCustomer ? t.border : "rgba(139,92,246,0.28)"}`,
                                    borderRadius: bubbleRadius(isCustomer, first, last),
                                    padding: "10px 12px 6px",
                                    boxShadow: isCustomer ? "none" : "0 0 16px rgba(139,92,246,0.08)",
                                    animationDelay: `${Math.min(mi, 6) * 28}ms`,
                                    maxWidth: "100%",
                                    boxSizing: "border-box",
                                  }}
                                >
                                  {first && (
                                    <div
                                      style={{
                                        fontSize: 10,
                                        color: t.textMuted,
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: 0.6,
                                        marginBottom: 4,
                                      }}
                                    >
                                      {isCustomer ? "Customer" : "You"}
                                    </div>
                                  )}
                                  <MessageContent text={m.content} color={t.textPrimary} />
                                  {clock && (
                                    <div
                                      style={{
                                        fontSize: 10,
                                        color: t.textMuted,
                                        textAlign: "right",
                                        marginTop: 4,
                                        letterSpacing: 0.2,
                                        lineHeight: 1,
                                      }}
                                    >
                                      {clock}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={threadEndRef} />
                </div>

                {/* Reply composer */}
                {canReply ? (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      padding: "12px 14px",
                      borderTop: `1px solid ${t.borderSub}`,
                      flexShrink: 0,
                      background: "rgba(0,0,0,0.2)",
                    }}
                  >
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Reply on WhatsApp…"
                      disabled={sending}
                      style={{
                        flex: 1,
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: t.inputBg,
                        border: `1px solid ${t.border}`,
                        color: t.textPrimary,
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      className="ui-interactive"
                      disabled={sending || !draft.trim()}
                      onClick={handleSend}
                      style={{
                        ...primaryBtnStyle(t),
                        padding: "0 18px",
                        fontSize: 13,
                        opacity: sending || !draft.trim() ? 0.55 : 1,
                      }}
                    >
                      {sending ? "…" : "Send"}
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "12px 16px",
                      borderTop: `1px solid ${t.borderSub}`,
                      fontSize: 12,
                      color: t.textMuted,
                      textAlign: "center",
                      flexShrink: 0,
                    }}
                  >
                    Replies aren’t available for {channelLabel(selected.channel)} conversations yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <ConnectWhatsAppModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onConnected={handleWhatsAppConnected}
      />
    </div>
  );
}
