import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useTheme } from "../context/ThemeContext";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const bookings = useStore((s) => s.bookings);
  const leads = useStore((s) => s.leads);
  const waitlist = useStore((s) => s.waitlist);
  const { theme: t } = useTheme();
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    const keys = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        ref.current?.querySelector("input")?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keys);
    };
  }, []);

  const q = query.toLowerCase().trim();
  const results =
    q.length < 2
      ? []
      : [
          ...bookings
            .filter(
              (b) =>
                b.Name?.toLowerCase().includes(q) ||
                b.Phone?.includes(q) ||
                b.Service?.toLowerCase().includes(q)
            )
            .slice(0, 4)
            .map((b) => ({
              type: "Booking",
              label: b.Name,
              sub: b.Service + " · " + b.Date,
              status: b.Status,
              path: "/bookings",
            })),
          ...leads
            .filter(
              (l) =>
                l.Name?.toLowerCase().includes(q) ||
                l.Phone?.includes(q) ||
                l.Device?.toLowerCase().includes(q) ||
                l.Issue?.toLowerCase().includes(q)
            )
            .slice(0, 3)
            .map((l) => ({
              type: "Lead",
              label: l.Name,
              sub: (l.Device || l.Issue || "Lead") + " · " + l.Phone,
              path: "/leads",
            })),
          ...waitlist
            .filter((w) => w.Name?.toLowerCase().includes(q) || w.Phone?.includes(q))
            .slice(0, 3)
            .map((w) => ({
              type: "Waitlist",
              label: w.Name,
              sub: w.Service + " · " + w["Preferred Day"],
              path: "/waitlist",
            })),
        ];

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", minWidth: 0 }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: t.textMuted }}>
          🔍
        </span>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={(e) => {
            setOpen(true);
            e.target.style.border = `1px solid ${t.borderHover}`;
          }}
          onBlur={(e) => {
            e.target.style.border = `1px solid ${t.border}`;
          }}
          placeholder="Search… (Ctrl+K)"
          style={{
            width: "100%",
            padding: "9px 36px 9px 36px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${t.border}`,
            color: t.textPrimary,
            fontSize: 13,
            outline: "none",
            transition: "border-color 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              color: t.textMuted,
            }}
          >
            ×
          </button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div
          className="modal-surface"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: t.cardBg,
            borderRadius: 14,
            border: `1px solid ${t.border}`,
            borderTop: `1px solid ${t.borderTopHighlight}`,
            boxShadow: t.cardShadow,
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: "20px 16px", textAlign: "center", color: t.textMuted, fontSize: 13 }}>
              No results for "{query}"
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: "10px 14px 6px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: t.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                {results.length} result{results.length !== 1 ? "s" : ""}
              </div>
              {results.map((r, i) => (
                <div
                  key={i}
                  className="ui-interactive"
                  onClick={() => {
                    navigate(r.path);
                    setOpen(false);
                    setQuery("");
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = t.rowHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.06)",
                      color: t.textSecondary,
                      border: "1px solid rgba(255,255,255,0.1)",
                      flexShrink: 0,
                    }}
                  >
                    {r.type}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: t.textPrimary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.label}
                    </div>
                    <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>{r.sub}</div>
                  </div>
                  {r.status && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, flexShrink: 0 }}>{r.status}</span>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
