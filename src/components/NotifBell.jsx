import { useState, useRef, useEffect } from "react";
import { useNotifStore } from "../store/useNotifStore";
import { useTheme } from "../context/ThemeContext";

const TYPE_ICON = { info: "ℹ️", success: "✅", warning: "⚠️", error: "❌", booking: "📋" };

export default function NotifBell() {
  const { theme: t } = useTheme();
  const notifications = useNotifStore((s) => s.notifications);
  const unread = useNotifStore((s) => s.unread);
  const markAllRead = useNotifStore((s) => s.markAllRead);
  const markRead = useNotifStore((s) => s.markRead);
  const clear = useNotifStore((s) => s.clear);

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const timeStr = (d) => {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="ui-interactive"
        onClick={() => {
          setOpen(!open);
          if (!open) markAllRead();
        }}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 20,
          padding: "4px 8px",
          borderRadius: 10,
          color: "rgba(255,255,255,0.6)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        🔔
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              background: "#f87171",
              borderRadius: "50%",
              boxShadow: "0 0 8px rgba(248,113,113,0.6)",
              display: "block",
            }}
          />
        )}
      </button>

      {open && (
        <div
          className="modal-surface"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 340,
            background: t.cardBg,
            borderRadius: 14,
            border: `1px solid ${t.border}`,
            borderTop: `1px solid ${t.borderTopHighlight}`,
            boxShadow: t.cardShadow,
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: `1px solid ${t.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}>Notifications</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={markAllRead}
                style={{ fontSize: 11, color: t.textSecondary, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                Mark all read
              </button>
              <button onClick={clear} style={{ fontSize: 11, color: t.textMuted, background: "none", border: "none", cursor: "pointer" }}>
                Clear
              </button>
            </div>
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: t.textMuted, fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>🔕</div>
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="ui-interactive"
                  onClick={() => markRead(n.id)}
                  style={{
                    padding: "12px 18px",
                    borderBottom: `1px solid ${t.borderSub}`,
                    cursor: "pointer",
                    background: n.read ? "transparent" : "rgba(255,255,255,0.03)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = t.rowHover)}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = n.read ? "transparent" : "rgba(255,255,255,0.03)")
                  }
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 18, flexShrink: 0, opacity: 0.7 }}>{TYPE_ICON[n.type] || "🔔"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: t.textPrimary }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>{n.body}</div>
                      <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>{timeStr(n.time)}</div>
                    </div>
                    {!n.read && (
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "var(--accent)",
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
