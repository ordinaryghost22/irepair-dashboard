import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useTheme } from "../context/ThemeContext";
import { NAV_ITEMS } from "../constants";
import GlobalSearch from "./GlobalSearch";
import NotifBell from "./NotifBell";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme:t, dark, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  const bookings   = useStore(s => s.bookings);
  const newBadge   = useStore(s => s.newBadge);
  const clearBadge = useStore(s => s.clearBadge);
  const isPaused   = useStore(s => s.isPaused);
  const setIsPaused= useStore(s => s.setIsPaused);
  const lastFetch  = useStore(s => s.lastFetch);

  const pendingCount = bookings.filter(b => b.Status === "Pending").length;

  const lastFetchStr = lastFetch
    ? lastFetch.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" })
    : "—";

  return (
    <div style={{ display:"flex", height:"100vh", background:t.pageBg, fontFamily:"'Inter',system-ui,sans-serif", transition:"background .25s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeIn  {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn   {from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes pulse   {0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes slideUp {from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes badgePulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)}70%{box-shadow:0 0 0 6px rgba(239,68,68,0)}}
        @keyframes spin    {to{transform:rotate(360deg)}}
        a{text-decoration:none;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:${dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"};border-radius:4px;}
        @media(max-width:768px){.sidebar-desktop{display:none!important}.mobile-overlay{display:flex!important}}
      `}</style>

      {/* ── MOBILE OVERLAY ── */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:260, height:"100%", background:t.sidebarBg }}>
            <SidebarContent location={location} navigate={navigate} pendingCount={pendingCount} clearBadge={clearBadge} dark={dark} toggle={toggle} onNav={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* ── SIDEBAR desktop ── */}
      {sidebarOpen && (
        <aside className="sidebar-desktop" style={{ width:240, flexShrink:0, background:t.sidebarBg, display:"flex", flexDirection:"column", borderRight:"1px solid rgba(255,255,255,0.06)", zIndex:10 }}>
          <SidebarContent location={location} navigate={navigate} pendingCount={pendingCount} clearBadge={clearBadge} dark={dark} toggle={toggle} />
        </aside>
      )}

      {/* ── MAIN ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
        {/* Topbar */}
        <div style={{ height:58, background:t.topbarBg, borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", padding:"0 20px", gap:12, flexShrink:0 }}>
          {/* Hamburger */}
          <button
            onClick={() => { setSidebarOpen(!sidebarOpen); setMobileOpen(!mobileOpen); }}
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:19, color:t.textMuted, padding:"4px 6px", borderRadius:8, flexShrink:0 }}
          >☰</button>

          <GlobalSearch />
          <div style={{ flex:1 }} />

          {/* Last fetch time */}
          <span style={{ fontSize:11, color:t.textMuted, display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:isPaused?"#9ca3af":"#22c55e", display:"inline-block", boxShadow:isPaused?"none":"0 0 6px rgba(34,197,94,0.6)" }} />
            {lastFetchStr}
          </span>

          {/* Notif Bell */}
          <NotifBell />
          {/* Pause/Resume */}
          <button onClick={() => setIsPaused(!isPaused)} style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 14px", borderRadius:20, border:`1px solid ${t.border}`, background:t.cardBg2, color:isPaused?t.textMuted:"#22c55e", fontSize:12, fontWeight:600, cursor:"pointer", flexShrink:0 }}>
            {isPaused ? "⏸ Paused" : "🔄 Live"}
          </button>

          {/* New booking alert */}
          {newBadge > 0 && (
            <div onClick={() => clearBadge()} style={{ background:"linear-gradient(135deg,#ef4444,#dc2626)", color:"#fff", fontSize:12, fontWeight:700, padding:"7px 14px", borderRadius:20, animation:"badgePulse 1.5s infinite", cursor:"pointer", flexShrink:0 }}>
              🔔 {newBadge} new!
            </div>
          )}
        </div>

        <main style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ location, navigate, pendingCount, clearBadge, dark, toggle, onNav }) {
  return (
    <>
      <div style={{ padding:"26px 20px 22px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:14, background:"linear-gradient(135deg,#667eea,#764ba2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:"0 4px 20px rgba(102,126,234,0.55)", flexShrink:0 }}>🔧</div>
          <div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:16, letterSpacing:-0.5 }}>iRepair</div>
            <div style={{ color:"rgba(255,255,255,0.32)", fontSize:11, marginTop:1 }}>Owner Dashboard</div>
          </div>
        </div>
      </div>

      <nav style={{ flex:1, padding:"14px 10px", overflowY:"auto" }}>
        {NAV_ITEMS.map(({ path, label, icon, badge }) => {
          const active = location.pathname === path;
          const count  = badge ? pendingCount : 0;
          return (
            <Link key={path} to={path} onClick={() => { badge && clearBadge(); onNav && onNav(); }}>
              <div
                style={{ display:"flex", alignItems:"center", gap:11, padding:"10px 13px", borderRadius:11, marginBottom:3, cursor:"pointer", transition:"all .15s",
                  background: active ? "rgba(129,140,248,0.15)" : "transparent",
                  border:     active ? "1px solid rgba(129,140,248,0.3)" : "1px solid transparent",
                  color:      active ? "#c7d2fe" : "rgba(255,255,255,0.4)",
                  fontWeight: active ? 600 : 400, fontSize:14,
                }}
                onMouseEnter={e => { if(!active){e.currentTarget.style.color="rgba(255,255,255,0.75)";e.currentTarget.style.background="rgba(255,255,255,0.06)";} }}
                onMouseLeave={e => { if(!active){e.currentTarget.style.color="rgba(255,255,255,0.4)";e.currentTarget.style.background="transparent";} }}
              >
                <span style={{ fontSize:17, minWidth:22, textAlign:"center" }}>{icon}</span>
                <span style={{ flex:1 }}>{label}</span>
                {count > 0 && (
                  <span style={{ background:"#ef4444", color:"#fff", fontSize:11, fontWeight:800, borderRadius:20, padding:"2px 8px", minWidth:20, textAlign:"center", animation:"badgePulse 2s infinite" }}>{count}</span>
                )}
                {active && count === 0 && <div style={{ width:6, height:6, borderRadius:"50%", background:"#818cf8", flexShrink:0 }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding:"10px 10px 22px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
        <NavBtn icon={dark?"☀️":"🌙"} label={dark?"Light Mode":"Dark Mode"} onClick={toggle} />
        <NavBtn icon="🚪" label="Logout" color="rgba(252,165,165,0.7)" hoverColor="#fca5a5" hoverBg="rgba(239,68,68,0.1)"
          onClick={() => { localStorage.removeItem("auth"); navigate("/login"); }} />
      </div>
    </>
  );
}

function NavBtn({ icon, label, onClick, color="rgba(255,255,255,0.4)", hoverColor="rgba(255,255,255,0.75)", hoverBg="rgba(255,255,255,0.06)" }) {
  return (
    <div onClick={onClick}
      style={{ display:"flex", alignItems:"center", gap:11, padding:"10px 13px", borderRadius:11, color, fontSize:14, cursor:"pointer", transition:"all .15s", marginBottom:2 }}
      onMouseEnter={e => { e.currentTarget.style.color=hoverColor; e.currentTarget.style.background=hoverBg; }}
      onMouseLeave={e => { e.currentTarget.style.color=color; e.currentTarget.style.background="transparent"; }}
    >
      <span style={{ fontSize:17, minWidth:22, textAlign:"center" }}>{icon}</span>
      {label}
    </div>
  );
}
