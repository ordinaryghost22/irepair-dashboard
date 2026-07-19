import { useSecurity } from "../context/SecurityContext";
import { useTheme, cardStyle } from "../context/ThemeContext";
import EmptyState from "../components/EmptyState";

const EVENT_ICON = {
  "Login Success": "✓",
  "Login Failed": "✕",
  "Logout": "→",
  "Account Locked": "✱",
  "Session started": "●",
};

function CheckIcon() {
  return (
    <span
      style={{
        width: 22,
        height: 22,
        borderRadius: 8,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: 12,
        fontWeight: 700,
        color: "#4ade80",
        background: "rgba(34,197,94,0.15)",
        border: "1px solid rgba(34,197,94,0.3)",
        boxShadow: "0 0 12px rgba(34,197,94,0.15)",
      }}
    >
      ✓
    </span>
  );
}

export default function Security() {
  const { securityLog, logout } = useSecurity();
  const { theme: t } = useTheme();

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

  const attempts = JSON.parse(localStorage.getItem("irepair_attempts") || '{"count":0,"lockUntil":0}');
  const isLocked = attempts.lockUntil > Date.now();
  const session = JSON.parse(localStorage.getItem("irepair_session") || "{}");
  const sessionAge = session.start ? Math.round((Date.now() - session.start) / 60000) : 0;

  return (
    <div style={{ padding: "20px 16px", maxWidth: 1000 }}>
      <style>{`
        @media(max-width:768px){
          .sec-statgrid{grid-template-columns:1fr 1fr!important}
          .sec-featgrid{grid-template-columns:1fr!important}
          .sec-table td:nth-child(2){display:none}
          .sec-table th:nth-child(2){display:none}
        }
        @media(min-width:769px){
          .sec-statgrid{grid-template-columns:repeat(3,1fr)!important}
          .sec-featgrid{grid-template-columns:1fr 1fr!important}
        }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, letterSpacing: -0.6, margin: 0 }}>Security</h1>
        <p style={{ color: t.textSecondary, fontSize: 13, marginTop: 5 }}>Session management and access logs</p>
      </div>

      <div className="sec-statgrid" style={{ display: "grid", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Session Age", value: sessionAge + "m", icon: "⏱", color: sessionAge > 25 ? "#ef4444" : "#22c55e" },
          { label: "Login Attempts", value: attempts.count, icon: "✱", color: attempts.count >= 3 ? "#ef4444" : "#22c55e" },
          {
            label: "Account Status",
            value: isLocked ? "Locked" : "Active",
            icon: isLocked ? "✕" : "●",
            color: isLocked ? "#ef4444" : "#22c55e",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              ...cardStyle(t),
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                color: s.color,
                background: `${s.color}22`,
                border: `1px solid ${s.color}44`,
                boxShadow: `0 0 16px ${s.color}33`,
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: t.textMuted }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle(t), padding: "20px 18px", marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: t.textPrimary, marginBottom: 16 }}>
          Active Security Features
        </div>
        <div className="sec-featgrid" style={{ display: "grid", gap: 10 }}>
          {[
            ["Session timeout", "Soft-lock with Quick PIN if set; otherwise logout after 30 min idle"],
            ["Quick PIN unlock", "Optional 4–6 digit PIN — set in Settings; password fallback on lock screen"],
            ["Login rate limiting", "Account locked after 5 failed attempts for 15 min"],
            ["Activity tracking", "All events logged with timestamp"],
            ["Idle detection", "Tracks mouse, keyboard & scroll activity"],
            ["Tab visibility", "Pauses refresh when tab is hidden"],
            ["Encrypted session", "Session token stored securely"],
          ].map(([title, desc]) => (
            <div
              key={title}
              style={{
                display: "flex",
                gap: 12,
                padding: "12px 14px",
                background: t.cardBg2,
                borderRadius: 12,
                border: `1px solid ${t.border}`,
              }}
            >
              <CheckIcon />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>{title}</div>
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...cardStyle(t), overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 18px",
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, color: t.textPrimary }}>Security Log</div>
          <button
            className="ui-interactive"
            onClick={() => logout("Manual logout from security page")}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "1px solid rgba(248,113,113,0.35)",
              background: "rgba(248,113,113,0.15)",
              color: "#f87171",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 0 16px rgba(248,113,113,0.15)",
            }}
          >
            Force Logout
          </button>
        </div>
        {securityLog.length === 0 ? (
          <EmptyState icon="◈" title="No security events yet" subtitle="Events will appear as you use the app" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="sec-table data-table" style={{ width: "100%", minWidth: 280 }}>
              <thead>
                <tr>
                  {["Event", "Detail", "Time"].map((h) => (
                    <th key={h} style={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {securityLog.map((e, i) => (
                  <tr
                    key={i}
                    onMouseEnter={(x) => (x.currentTarget.style.background = t.rowHover)}
                    onMouseLeave={(x) => (x.currentTarget.style.background = "transparent")}
                  >
                    <td style={TD}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          color:
                            e.event.includes("Fail") || e.event.includes("Lock")
                              ? "#ef4444"
                              : e.event.includes("Success") || e.event.includes("start")
                                ? "#22c55e"
                                : t.textPrimary,
                        }}
                      >
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 6,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid ${t.border}`,
                          }}
                        >
                          {EVENT_ICON[e.event] || "●"}
                        </span>
                        {e.event}
                      </span>
                    </td>
                    <td style={{ ...TD, color: t.textMuted, fontSize: 12 }}>{e.detail || "—"}</td>
                    <td style={{ ...TD, color: t.textMuted, fontSize: 12, whiteSpace: "nowrap" }}>{e.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
