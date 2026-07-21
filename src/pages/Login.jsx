import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSecurity } from "../context/SecurityContext";
import GenesisBootSplash, { shouldPlayIntro } from "../components/GenesisBootSplash";
import { BUSINESS_NAME, BUSINESS_SUBTITLE, BUSINESS_TAGLINE } from "../constants/brand";
import logoSrc from "../assets/logo.png";
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(() => shouldPlayIntro());
  const navigate = useNavigate();
  const { checkLoginAttempt, recordLoginSuccess, recordLoginFail } = useSecurity();

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    const check = checkLoginAttempt(username);
    if (!check.allowed) {
      setError(check.message);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("https://irepair-backend-production.up.railway.app/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const result = recordLoginFail(username);
        if (result.locked) {
          setError("Too many failed attempts. Account locked for 15 minutes.");
        } else {
          setError(
            `Invalid credentials. ${result.remaining} attempt${result.remaining !== 1 ? "s" : ""} remaining.`
          );
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem("irepair_token", data.access_token);
      localStorage.setItem("auth", "true");
      recordLoginSuccess(username);
      navigate("/");
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  const inputError = Boolean(error);

  return (
    <div className="login-page">
      {showIntro && (
        <GenesisBootSplash onDismiss={() => setShowIntro(false)} />
      )}
      <style>{`
        .login-page {
          min-height: 100vh;
          min-height: 100dvh;
          font-family: var(--font-sans), "Inter", system-ui, -apple-system, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(ellipse 60% 40% at 50% 15%, rgba(139,92,246,0.14), transparent 60%),
            radial-gradient(ellipse 50% 30% at 50% 90%, rgba(139,92,246,0.07), transparent 60%),
            #0a0a0c;
        }

        .login-page::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.045;
          background-image: radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        .login-shell {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 1;
        }

        .login-brand {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-logo {
          width: 72px;
          height: 72px;
          margin: 0 auto 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #030708;
          border: 1px solid rgba(34,211,238,0.45);
          box-shadow:
            0 0 24px rgba(34,211,238,0.3),
            0 0 48px rgba(34,211,238,0.12),
            0 4px 16px rgba(0,0,0,0.4);
        }

        .login-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .login-title {
          color: rgba(255,255,255,0.92);
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.6px;
          margin: 0;
        }

        .login-subtitle {
          margin: 8px 0 0;
          color: rgba(34,211,238,0.85);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .login-sub {
          color: rgba(255,255,255,0.4);
          font-size: 14px;
          margin: 8px 0 0;
        }

        .login-card {
          background:
            radial-gradient(circle at 20% 0%, rgba(139,92,246,0.06), transparent 50%),
            linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 40%),
            linear-gradient(180deg, #17171a 0%, #0f0f11 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-top: 1px solid rgba(255,255,255,0.14);
          border-radius: 16px;
          box-shadow:
            0 1px 0 rgba(255,255,255,0.05) inset,
            0 4px 12px rgba(0,0,0,0.4),
            0 16px 40px rgba(0,0,0,0.3),
            0 0 40px rgba(139,92,246,0.08);
          padding: 32px;
        }

        .login-label {
          display: block;
          color: rgba(255,255,255,0.48);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.1px;
          margin-bottom: 8px;
        }

        .login-input {
          width: 100%;
          padding: 13px 16px;
          border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.92);
          font-size: 15px;
          outline: none;
          font-family: inherit;
          box-sizing: border-box;
          transition: border-color 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1), background 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .login-input::placeholder {
          color: rgba(255,255,255,0.28);
        }

        .login-input:focus {
          border-color: rgba(139,92,246,0.55);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.18), 0 0 20px rgba(139,92,246,0.12);
          background: rgba(255,255,255,0.05);
        }

        .login-input.has-error {
          border-color: rgba(248,113,113,0.55);
          box-shadow: 0 0 0 3px rgba(248,113,113,0.12);
        }

        .login-input.has-error:focus {
          border-color: rgba(248,113,113,0.65);
          box-shadow: 0 0 0 3px rgba(248,113,113,0.16);
        }

        .login-pass-wrap {
          position: relative;
        }

        .login-pass-wrap .login-input {
          padding-right: 46px;
        }

        .login-eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255,255,255,0.62);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: color 150ms cubic-bezier(0.16, 1, 0.3, 1), background 150ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .login-eye:hover {
          color: rgba(255,255,255,0.9);
          background: rgba(139,92,246,0.1);
        }

        .login-forgot {
          display: inline-block;
          margin-top: 10px;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.48);
          text-decoration: none;
          transition: color 150ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .login-forgot:hover {
          color: #a78bfa;
        }

        .login-error {
          background: rgba(248,113,113,0.12);
          border: 1px solid rgba(248,113,113,0.35);
          border-radius: 10px;
          padding: 11px 14px;
          color: #f87171;
          font-size: 13px;
          margin-bottom: 18px;
          box-shadow: 0 0 16px rgba(248,113,113,0.12);
        }

        .login-submit {
          width: 100%;
          padding: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          color: #f5f5f5;
          background: linear-gradient(180deg, #2c2c30 0%, #18181b 100%);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.06),
            0 1px 2px rgba(0,0,0,0.3),
            0 8px 20px rgba(0,0,0,0.25);
          transition: all 200ms ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .login-submit:hover:not(:disabled) {
          background: linear-gradient(180deg, #35353a 0%, #1f1f23 100%);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 0 20px rgba(139,92,246,0.15),
            0 8px 20px rgba(0,0,0,0.25);
        }

        .login-submit:active:not(:disabled) {
          transform: scale(0.98);
          transition: transform 100ms ease, box-shadow 100ms ease, background 100ms ease;
        }

        .login-submit:disabled {
          opacity: 0.75;
          cursor: wait;
        }

        .login-spinner {
          animation: loginSpin 0.7s linear infinite;
        }

        @keyframes loginSpin {
          to { transform: rotate(360deg); }
        }

        .login-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-align: center;
          margin-top: 24px;
          font-size: 11px;
          color: rgba(255,255,255,0.4);
        }

        @keyframes loginEnter {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .login-enter {
          animation: loginEnter 300ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }

        .login-enter-1 { animation-delay: 0ms; }
        .login-enter-2 { animation-delay: 80ms; }
        .login-enter-3 { animation-delay: 160ms; }
        .login-enter-4 { animation-delay: 240ms; }
        .login-enter-5 { animation-delay: 320ms; }

        @media (prefers-reduced-motion: reduce) {
          .login-enter { animation: none !important; }
          .login-spinner { animation: none !important; }
        }

        @media (max-width: 768px) {
          .login-page { padding: 20px 16px; align-items: flex-start; padding-top: max(28px, 6vh); }
          .login-brand { margin-bottom: 24px; }
          .login-card { padding: 28px 24px; }
          .login-title { font-size: 26px; }
        }

        @media (max-width: 400px) {
          .login-page { padding: 16px 14px; padding-top: max(20px, 4vh); }
          .login-brand { margin-bottom: 18px; }
          .login-logo { width: 60px; height: 60px; margin-bottom: 12px; }
          .login-card { padding: 22px 18px; }
          .login-title { font-size: 24px; }
          .login-sub { margin-top: 6px; font-size: 13px; }
          .login-footer { margin-top: 18px; }
        }
      `}</style>

      <div className="login-shell">
        <div className="login-brand">
          <div className="login-logo login-enter login-enter-1">
            <img src={logoSrc} alt={BUSINESS_NAME} draggable={false} />
          </div>
          <h1 className="login-title login-enter login-enter-2">{BUSINESS_NAME}</h1>
          <p className="login-subtitle login-enter login-enter-2">{BUSINESS_SUBTITLE}</p>
          <p className="login-sub login-enter login-enter-3">{BUSINESS_TAGLINE}</p>
        </div>

        <div className="login-card login-enter login-enter-4">
          {error && <div className="login-error" role="alert">{error}</div>}

          <div style={{ marginBottom: 18 }}>
            <label className="login-label" htmlFor="login-username">Username</label>
            <input
              id="login-username"
              className={`login-input${inputError ? " has-error" : ""}`}
              type="text"
              value={username}
              placeholder="owner"
              autoComplete="username"
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label className="login-label" htmlFor="login-password">Password</label>
            <div className="login-pass-wrap">
              <input
                id="login-password"
                className={`login-input${inputError ? " has-error" : ""}`}
                type={showPass ? "text" : "password"}
                value={password}
                placeholder="••••••••"
                autoComplete="current-password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? "Hide password" : "Show password"}
                title={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
              </button>
            </div>
            <a
              className="login-forgot"
              href="mailto:support@irepair.local?subject=Password%20reset"
              onClick={(e) => {
                e.preventDefault();
                setError("Contact your admin to reset the owner password.");
              }}
            >
              Forgot password?
            </a>
          </div>

          <button
            type="button"
            className="login-submit"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} strokeWidth={2} className="login-spinner" />
                Verifying…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </div>

        <p className="login-footer login-enter login-enter-5">
          <Lock size={12} strokeWidth={2} />
          Protected by {BUSINESS_NAME} Security
        </p>
      </div>
    </div>
  );
}
