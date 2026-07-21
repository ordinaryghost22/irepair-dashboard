import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useTheme } from "../context/ThemeContext";
import { NAV_ITEMS } from "../constants";
import { useSwipeNav } from "../hooks/useSwipeNav";
import GlobalSearch from "./GlobalSearch";
import NotifBell from "./NotifBell";
import { useMobile } from "../hooks/useMobile";
import OwnerBot from "./OwnerBot";
import { NavIcon, LogoutIcon } from "./icons";
import { BUSINESS_NAME, BUSINESS_SUBTITLE } from "../constants/brand";
import logoSrc from "../assets/logo.png";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme: t } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const bookings = useStore((s) => s.bookings);
  const newBadge = useStore((s) => s.newBadge);
  const clearBadge = useStore((s) => s.clearBadge);
  const isPaused = useStore((s) => s.isPaused);
  const setIsPaused = useStore((s) => s.setIsPaused);
  const lastFetch = useStore((s) => s.lastFetch);
  useSwipeNav();
  const isMobile = useMobile();

  const pendingCount = bookings.filter((b) => b.Status === "Pending").length;

  const lastFetchStr = lastFetch
    ? lastFetch.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "—";

  const toggleSidebar = () => {
    if (isMobile) setMobileOpen((o) => !o);
    else setSidebarOpen((o) => !o);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: t.pageBg,
        fontFamily: 'var(--font-sans), "Inter", system-ui, -apple-system, sans-serif',
        transition: "background 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden",
      }}
    >
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        a{text-decoration:none;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px;}

        .sidebar-desktop{
          position:fixed;
          left:0;top:0;bottom:0;
          width:240px;
          display:flex;
          flex-direction:column;
          z-index:20;
          transform:translateX(0);
          transition:transform 250ms ease-in-out;
          will-change:transform;
        }
        .sidebar-desktop.is-closed{
          transform:translateX(-240px);
          pointer-events:none;
        }

        .layout-main{
          flex:1;
          display:flex;
          flex-direction:column;
          overflow:hidden;
          min-width:0;
          margin-left:240px;
          transition:margin-left 250ms ease-in-out;
        }
        .layout-main.is-closed{
          margin-left:0;
        }

        .sidebar-mobile-backdrop{
          display:none;
        }
        .sidebar-mobile{
          display:none;
        }

        @media(max-width:768px){
          .sidebar-desktop{display:none!important}
          .topbar-time{display:none!important}
          .topbar-badge{display:none!important}
          .layout-main,
          .layout-main.is-closed{margin-left:0!important}

          .sidebar-mobile-backdrop{
            display:block;
            position:fixed;
            inset:0;
            z-index:50;
            background:rgba(0,0,0,0.55);
            backdrop-filter:blur(4px);
            opacity:0;
            pointer-events:none;
            transition:opacity 250ms ease-in-out;
          }
          .sidebar-mobile-backdrop.is-open{
            opacity:1;
            pointer-events:auto;
          }

          .sidebar-mobile{
            display:flex;
            flex-direction:column;
            position:fixed;
            left:0;top:0;bottom:0;
            width:260px;
            z-index:60;
            transform:translateX(-100%);
            transition:transform 250ms ease-in-out;
            will-change:transform;
            pointer-events:none;
          }
          .sidebar-mobile.is-open{
            transform:translateX(0);
            pointer-events:auto;
          }
        }
        @media(min-width:769px){
          .mobile-nav-bottom{display:none!important}
          .sidebar-mobile,
          .sidebar-mobile-backdrop{display:none!important}
        }
        .topbar-menu:hover{
          color: #a78bfa !important;
          background: rgba(139,92,246,0.1) !important;
        }
      `}</style>

      <aside
        className={`sidebar-desktop${sidebarOpen ? "" : " is-closed"}`}
        style={{
          background: t.sidebarBg,
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <SidebarContent location={location} navigate={navigate} pendingCount={pendingCount} clearBadge={clearBadge} />
      </aside>

      <div
        className={`sidebar-mobile-backdrop${mobileOpen ? " is-open" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
      />
      <aside
        className={`sidebar-mobile${mobileOpen ? " is-open" : ""}`}
        style={{
          background: t.sidebarBg,
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <SidebarContent location={location} navigate={navigate} pendingCount={pendingCount} clearBadge={clearBadge} onNav={() => setMobileOpen(false)} />
      </aside>

      <div className={`layout-main${sidebarOpen ? "" : " is-closed"}`}>
        <div
          style={{
            height: 58,
            background: t.topbarBg,
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 14px 0 10px",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            className="ui-interactive topbar-menu"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 19,
              color: t.textMuted,
              padding: "8px 10px",
              borderRadius: 8,
              flexShrink: 0,
              marginRight: 4,
              lineHeight: 1,
              position: "relative",
              zIndex: 2,
            }}
          >
            ☰
          </button>

          <div style={{ flex: "1 1 auto", minWidth: 0, maxWidth: 240, marginLeft: 2 }}>
            <GlobalSearch />
          </div>

          <div style={{ flex: 1 }} />

          <span className="topbar-time" style={{ fontSize: 11, color: t.textMuted, display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isPaused ? t.textMuted : t.accent,
                display: "inline-block",
                boxShadow: isPaused ? "none" : `0 0 8px ${t.accentGlow}`,
              }}
            />
            {lastFetchStr}
          </span>

          <NotifBell />

          <button
            className="ui-interactive"
            onClick={() => setIsPaused(!isPaused)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              borderRadius: 20,
              border: isPaused ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(34,197,94,0.3)",
              background: isPaused ? "transparent" : "rgba(34,197,94,0.15)",
              color: isPaused ? t.textMuted : "#4ade80",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
              whiteSpace: "nowrap",
              boxShadow: isPaused ? "none" : "0 0 12px rgba(34,197,94,0.15)",
              animation: isPaused ? "none" : "glow-pulse 2.5s ease-in-out infinite",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isPaused ? t.textMuted : "#4ade80",
                display: "inline-block",
                boxShadow: isPaused ? "none" : "0 0 8px rgba(34,197,94,0.4)",
              }}
            />
            <span>{isPaused ? "Paused" : "Live"}</span>
          </button>

          {newBadge > 0 && (
            <div
              className="topbar-badge ui-interactive"
              onClick={() => clearBadge()}
              style={{
                background: t.accentGlow,
                color: t.accent,
                border: `1px solid rgba(139,92,246,0.35)`,
                fontSize: 12,
                fontWeight: 700,
                padding: "7px 14px",
                borderRadius: 20,
                cursor: "pointer",
                flexShrink: 0,
                boxShadow: "0 0 20px rgba(139,92,246,0.22)",
              }}
            >
              {newBadge} new
            </div>
          )}
        </div>

        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 0 }}>
          <div key={location.pathname} className="page-enter page-content">
            {children}
          </div>
        </main>

        <div
          className="mobile-nav-bottom"
          style={{
            height: 60,
            background: t.sidebarBg,
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          {NAV_ITEMS.slice(0, 5).map(({ path, label, badge }) => {
            const active = location.pathname === path;
            const count = badge ? pendingCount : 0;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => badge && clearBadge()}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  padding: "6px 10px",
                  borderRadius: 10,
                  position: "relative",
                  color: active ? "#a78bfa" : t.textMuted,
                  transition: "color 150ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <NavIcon path={path} size={20} />
                <span style={{ fontSize: 9, fontWeight: 600 }}>{label}</span>
                {count > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 4,
                      background: "rgba(139,92,246,0.18)",
                      color: "#a78bfa",
                      fontSize: 9,
                      fontWeight: 800,
                      borderRadius: 20,
                      padding: "1px 5px",
                      minWidth: 16,
                      textAlign: "center",
                      border: "1px solid rgba(139,92,246,0.35)",
                    }}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "6px 10px",
              borderRadius: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: t.textMuted,
            }}
          >
            <span style={{ fontSize: 20 }}>⋯</span>
            <span style={{ fontSize: 9, fontWeight: 600 }}>More</span>
          </button>
        </div>
      </div>
      <OwnerBot />
    </div>
  );
}

function SidebarContent({ location, navigate, pendingCount, clearBadge, onNav }) {
  const { theme: t } = useTheme();
  return (
    <>
      <div style={{ padding: "26px 20px 22px", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "#030708",
              border: "1px solid rgba(34,211,238,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
              boxShadow: "0 0 24px rgba(34,211,238,0.22)",
            }}
          >
            <img
              src={logoSrc}
              alt=""
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div>
            <div style={{ color: t.textPrimary, fontWeight: 700, fontSize: 15, letterSpacing: -0.3, lineHeight: 1.2 }}>
              {BUSINESS_NAME}
            </div>
            <div style={{ color: "rgba(34,211,238,0.75)", fontSize: 10, marginTop: 2, letterSpacing: "0.14em", fontWeight: 600 }}>
              {BUSINESS_SUBTITLE}
            </div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto" }}>
        {NAV_ITEMS.map(({ path, label, badge }) => {
          const active = location.pathname === path;
          const count = badge ? pendingCount : 0;
          return (
            <Link
              key={path}
              to={path}
              onClick={() => {
                badge && clearBadge();
                onNav && onNav();
              }}
            >
              <div
                className="ui-interactive"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "10px 13px",
                  borderRadius: 10,
                  marginBottom: 2,
                  cursor: "pointer",
                  background: active
                    ? "linear-gradient(90deg, rgba(139,92,246,0.18), rgba(139,92,246,0.05))"
                    : "transparent",
                  border: active
                    ? "1px solid rgba(139,92,246,0.35)"
                    : "1px solid transparent",
                  boxShadow: active ? "0 0 20px rgba(139,92,246,0.22)" : "none",
                  color: active ? t.textPrimary : t.textSecondary,
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = t.textPrimary;
                    e.currentTarget.style.background = "rgba(139,92,246,0.06)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = t.textSecondary;
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span style={{ minWidth: 22, display: "flex", alignItems: "center", justifyContent: "center", opacity: active ? 1 : 0.75, color: active ? "#a78bfa" : "currentColor" }}>
                  <NavIcon path={path} />
                </span>
                <span style={{ flex: 1 }}>{label}</span>
                {count > 0 && (
                  <span
                    style={{
                      background: "rgba(139,92,246,0.18)",
                      color: "#a78bfa",
                      border: "1px solid rgba(139,92,246,0.35)",
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 20,
                      padding: "2px 8px",
                      minWidth: 20,
                      textAlign: "center",
                      boxShadow: "0 0 16px rgba(139,92,246,0.2)",
                    }}
                  >
                    {count}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "10px 10px 22px", borderTop: `1px solid ${t.border}` }}>
        <NavBtn
          label="Logout"
          onClick={() => {
            localStorage.removeItem("auth");
            navigate("/login");
          }}
        />
      </div>
    </>
  );
}

function NavBtn({ label, onClick }) {
  const { theme: t } = useTheme();
  return (
    <div
      className="ui-interactive"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "10px 13px",
        borderRadius: 10,
        color: t.textSecondary,
        fontSize: 14,
        cursor: "pointer",
        marginBottom: 2,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = t.textPrimary;
        e.currentTarget.style.background = "rgba(139,92,246,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = t.textSecondary;
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ minWidth: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LogoutIcon />
      </span>
      {label}
    </div>
  );
}
