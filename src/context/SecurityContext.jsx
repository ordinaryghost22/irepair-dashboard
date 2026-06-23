import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";

const SecurityContext = createContext();

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 min
const WARN_BEFORE     = 2  * 60 * 1000; // warn 2 min before
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION   = 15 * 60 * 1000; // 15 min lockout

export function SecurityProvider({ children }) {
  const { theme: t } = useTheme();
  const navigate = useNavigate();
  const [showWarning,   setShowWarning]   = useState(false);
  const [countdown,     setCountdown]     = useState(120);
  const [securityLog,   setSecurityLog]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("irepair_seclog") || "[]"); } catch { return []; }
  });

  const timeoutRef  = useRef(null);
  const warnRef     = useRef(null);
  const countRef    = useRef(null);
  const lastActivity = useRef(Date.now());

  const addLog = useCallback((event, detail = "") => {
    const entry = {
      event, detail,
      time: new Date().toLocaleString(),
      ts: Date.now(),
    };
    setSecurityLog(prev => {
      const next = [entry, ...prev].slice(0, 100);
      localStorage.setItem("irepair_seclog", JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback((reason = "Manual logout") => {
    addLog("Logout", reason);
    localStorage.removeItem("auth");
    localStorage.removeItem("irepair_session");
    clearTimeout(timeoutRef.current);
    clearTimeout(warnRef.current);
    clearInterval(countRef.current);
    setShowWarning(false);
    navigate("/login");
  }, [addLog, navigate]);

  const resetTimer = useCallback(() => {
    lastActivity.current = Date.now();
    setShowWarning(false);
    clearTimeout(timeoutRef.current);
    clearTimeout(warnRef.current);
    clearInterval(countRef.current);

    warnRef.current = setTimeout(() => {
      setCountdown(WARN_BEFORE / 1000);
      setShowWarning(true);
      countRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countRef.current);
            logout("Session timeout");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, SESSION_TIMEOUT - WARN_BEFORE);

    timeoutRef.current = setTimeout(() => {
      logout("Session timeout");
    }, SESSION_TIMEOUT);
  }, [logout]);

  // Track user activity
  useEffect(() => {
    if (!localStorage.getItem("auth")) return;
    const events = ["mousedown","keydown","scroll","touchstart","click"];
    const handler = () => resetTimer();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetTimer();
    addLog("Login", "Session started");
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      clearTimeout(timeoutRef.current);
      clearTimeout(warnRef.current);
      clearInterval(countRef.current);
    };
  }, [resetTimer, addLog]);

  // ── Login attempt tracker (exported for Login page) ────────────────────────
  const checkLoginAttempt = useCallback((username) => {
    const key = "irepair_attempts";
    const data = JSON.parse(localStorage.getItem(key) || '{"count":0,"lockUntil":0}');
    const now = Date.now();

    if (data.lockUntil > now) {
      const mins = Math.ceil((data.lockUntil - now) / 60000);
      return { allowed: false, message: `Too many attempts. Locked for ${mins} min.` };
    }

    return { allowed: true };
  }, []);

  const recordLoginSuccess = useCallback((username) => {
    localStorage.removeItem("irepair_attempts");
    localStorage.setItem("irepair_session", JSON.stringify({ user: username, start: Date.now() }));
    addLog("Login Success", `User: ${username}`);
  }, [addLog]);

  const recordLoginFail = useCallback((username) => {
    const key = "irepair_attempts";
    const data = JSON.parse(localStorage.getItem(key) || '{"count":0,"lockUntil":0}');
    const count = data.count + 1;
    const lockUntil = count >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOCKOUT_DURATION : 0;
    localStorage.setItem(key, JSON.stringify({ count, lockUntil }));
    addLog("Login Failed", `User: ${username} (attempt ${count})`);
    if (lockUntil) addLog("Account Locked", `Locked for 15 min after ${count} failed attempts`);
    return { remaining: MAX_LOGIN_ATTEMPTS - count, locked: !!lockUntil };
  }, [addLog]);

  const remainingAttempts = () => {
    const data = JSON.parse(localStorage.getItem("irepair_attempts") || '{"count":0}');
    return MAX_LOGIN_ATTEMPTS - data.count;
  };

  return (
    <SecurityContext.Provider value={{ logout, securityLog, checkLoginAttempt, recordLoginSuccess, recordLoginFail, remainingAttempts, addLog }}>
      {children}

      {/* ── SESSION TIMEOUT WARNING MODAL ── */}
      {showWarning && (
        <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:t.cardBg, borderRadius:24, padding:36, maxWidth:400, width:"90%", textAlign:"center", border:`1px solid ${t.border}`, boxShadow:"0 32px 80px rgba(0,0,0,0.5)", animation:"popIn .2s ease" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>⏱️</div>
            <h2 style={{ color:t.textPrimary, fontWeight:800, fontSize:20, marginBottom:8 }}>Session Expiring</h2>
            <p style={{ color:t.textSecondary, fontSize:14, marginBottom:24 }}>You will be logged out in</p>
            <div style={{ fontSize:52, fontWeight:800, color: countdown < 30 ? "#ef4444" : "#667eea", marginBottom:24, fontVariantNumeric:"tabular-nums" }}>
              {Math.floor(countdown/60)}:{String(countdown%60).padStart(2,"0")}
            </div>
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={() => { resetTimer(); }} style={{ flex:1, padding:"13px", borderRadius:13, border:"none", background:"linear-gradient(135deg,#667eea,#764ba2)", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer" }}>
                Stay Logged In
              </button>
              <button onClick={() => logout("User chose to logout")} style={{ flex:1, padding:"13px", borderRadius:13, border:`1px solid ${t.border}`, background:t.cardBg2, color:t.textSecondary, fontWeight:700, fontSize:14, cursor:"pointer" }}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </SecurityContext.Provider>
  );
}

export const useSecurity = () => useContext(SecurityContext);
