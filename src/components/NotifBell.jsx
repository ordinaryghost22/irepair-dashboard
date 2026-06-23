import { useState, useRef, useEffect } from "react";
import { useNotifStore } from "../store/useNotifStore";
import { useTheme } from "../context/ThemeContext";

const TYPE_ICON = { info:"ℹ️", success:"✅", warning:"⚠️", error:"❌", booking:"📋" };
const TYPE_COLOR = { info:"#667eea", success:"#22c55e", warning:"#eab308", error:"#ef4444", booking:"#667eea" };

export default function NotifBell() {
  const { theme:t, dark } = useTheme();
  const notifications = useNotifStore(s => s.notifications);
  const unread        = useNotifStore(s => s.unread);
  const markAllRead   = useNotifStore(s => s.markAllRead);
  const markRead      = useNotifStore(s => s.markRead);
  const clear         = useNotifStore(s => s.clear);

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const timeStr = (d) => {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    return `${Math.floor(s/3600)}h ago`;
  };

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        style={{ position:"relative", background:"none", border:"none", cursor:"pointer", fontSize:20, padding:"4px 8px", borderRadius:10, color:t.textSecondary, transition:"background .15s" }}
        onMouseEnter={e => e.currentTarget.style.background=dark?"rgba(255,255,255,0.07)":"#f3f4f6"}
        onMouseLeave={e => e.currentTarget.style.background="transparent"}
      >
        🔔
        {unread > 0 && (
          <span style={{ position:"absolute", top:2, right:2, width:16, height:16, background:"#ef4444", borderRadius:"50%", fontSize:9, fontWeight:800, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", animation:"badgePulse 2s infinite" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:340, background:t.cardBg, borderRadius:16, border:`1px solid ${t.border}`, boxShadow:"0 16px 48px rgba(0,0,0,0.25)", zIndex:9999, overflow:"hidden", animation:"popIn .15s ease" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontWeight:700, fontSize:14, color:t.textPrimary }}>Notifications</span>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={markAllRead} style={{ fontSize:11, color:t.accent, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>Mark all read</button>
              <button onClick={clear} style={{ fontSize:11, color:t.textMuted, background:"none", border:"none", cursor:"pointer" }}>Clear</button>
            </div>
          </div>

          <div style={{ maxHeight:360, overflowY:"auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding:"40px 20px", textAlign:"center", color:t.textMuted, fontSize:13 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🔕</div>
                No notifications yet
              </div>
            ) : notifications.map(n => (
              <div key={n.id} onClick={() => markRead(n.id)}
                style={{ padding:"12px 18px", borderBottom:`1px solid ${t.borderSub}`, cursor:"pointer", transition:"background .12s", background:n.read?"transparent":(dark?"rgba(102,126,234,0.06)":"rgba(102,126,234,0.04)") }}
                onMouseEnter={e => e.currentTarget.style.background=t.rowHover}
                onMouseLeave={e => e.currentTarget.style.background=n.read?"transparent":(dark?"rgba(102,126,234,0.06)":"rgba(102,126,234,0.04)")}
              >
                <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{TYPE_ICON[n.type]||"🔔"}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:n.read?500:700, color:t.textPrimary }}>{n.title}</div>
                    <div style={{ fontSize:12, color:t.textSecondary, marginTop:2 }}>{n.body}</div>
                    <div style={{ fontSize:11, color:t.textMuted, marginTop:4 }}>{timeStr(n.time)}</div>
                  </div>
                  {!n.read && <div style={{ width:7, height:7, borderRadius:"50%", background:TYPE_COLOR[n.type]||"#667eea", flexShrink:0, marginTop:4 }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
