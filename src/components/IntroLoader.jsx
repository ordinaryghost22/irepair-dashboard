import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import logoSrc from "../assets/logo.png";
import { BUSINESS_NAME } from "../constants/brand";

const STORAGE_KEY = "irepair_intro_seen";
const SEQUENCE_MS = 2600;
const WIPE_MS = 900;

/** Force replay with /login?intro=1 — clears the session skip flag. */
export function shouldPlayIntro() {
  try {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("intro") === "1" || params.get("intro") === "true") {
        sessionStorage.removeItem(STORAGE_KEY);
        return true;
      }
    }
    return sessionStorage.getItem(STORAGE_KEY) !== "1";
  } catch {
    return true;
  }
}

function markIntroSeen() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Full-screen login intro overlay. Plays once per session, then wipes away
 * and calls onComplete so the parent can unmount it.
 * Replay anytime: /login?intro=1
 */
export default function IntroLoader({ onComplete }) {
  const [wiping, setWiping] = useState(false);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const wipeTimer = window.setTimeout(() => setWiping(true), SEQUENCE_MS);
    const doneTimer = window.setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      markIntroSeen();
      onCompleteRef.current?.();
    }, SEQUENCE_MS + WIPE_MS);

    return () => {
      window.clearTimeout(wipeTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  const overlay = (
    <div
      className={wiping ? "intro-loader intro-loader--wipe" : "intro-loader"}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "#0a0d0a",
      }}
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <style>{`
        .intro-loader--wipe {
          animation: introWipe ${WIPE_MS}ms cubic-bezier(.76, 0, .24, 1) forwards;
        }

        @keyframes introWipe {
          from { clip-path: circle(150% at 50% 50%); }
          to   { clip-path: circle(0% at 50% 50%); }
        }

        @keyframes introDrawTrace {
          to { stroke-dashoffset: 0; }
        }

        @keyframes introDotLit {
          from { opacity: 0; transform: scale(0.4); }
          to   { opacity: 1; transform: scale(1); }
        }

        @keyframes introLogoIn {
          0%   { opacity: 0; transform: scale(0.55); }
          70%  { opacity: 1; transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes introRingPulse {
          0%   { transform: scale(0.72); opacity: 0.55; }
          70%  { opacity: 0.18; }
          100% { transform: scale(1.55); opacity: 0; }
        }

        @keyframes introFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes introBlink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.25; }
        }

        @keyframes introProgressFill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        .intro-trace {
          fill: none;
          stroke: #22c55e;
          stroke-width: 1.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 180;
          stroke-dashoffset: 180;
          animation: introDrawTrace 1.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .intro-trace-d1 { animation-delay: 0ms; }
        .intro-trace-d2 { animation-delay: 60ms; }
        .intro-trace-d3 { animation-delay: 120ms; }
        .intro-trace-d4 { animation-delay: 180ms; }
        .intro-trace-d5 { animation-delay: 240ms; }
        .intro-trace-d6 { animation-delay: 300ms; }
        .intro-trace-d7 { animation-delay: 90ms; }
        .intro-trace-d8 { animation-delay: 150ms; }

        .intro-endpoint {
          fill: #22c55e;
          opacity: 0;
          transform-origin: center;
          transform-box: fill-box;
          animation: introDotLit 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .intro-endpoint-d1 { animation-delay: 900ms; }
        .intro-endpoint-d2 { animation-delay: 980ms; }
        .intro-endpoint-d3 { animation-delay: 1060ms; }
        .intro-endpoint-d4 { animation-delay: 1140ms; }
        .intro-endpoint-d5 { animation-delay: 1220ms; }
        .intro-endpoint-d6 { animation-delay: 1300ms; }
        .intro-endpoint-d7 { animation-delay: 1000ms; }
        .intro-endpoint-d8 { animation-delay: 1100ms; }

        .intro-logo-wrap {
          position: relative;
          width: 112px;
          height: 112px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: introLogoIn 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) 500ms both;
        }

        .intro-ring {
          position: absolute;
          inset: -18px;
          border-radius: 50%;
          border: 1.5px solid rgba(34, 197, 94, 0.55);
          animation: introRingPulse 1.8s cubic-bezier(0.16, 1, 0.3, 1) 700ms infinite;
          pointer-events: none;
        }

        .intro-ring-delay {
          animation-delay: 1.4s;
        }

        .intro-logo-img {
          width: 96px;
          height: 96px;
          object-fit: contain;
          filter: drop-shadow(0 0 18px rgba(34, 197, 94, 0.45))
                  drop-shadow(0 0 40px rgba(34, 197, 94, 0.22));
          user-select: none;
          -webkit-user-drag: none;
        }

        .intro-brand {
          margin-top: 28px;
          color: #ffffff;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
          max-width: 280px;
          line-height: 1.25;
          animation: introFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 750ms both;
        }

        .intro-loading-row {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.55);
          font-size: 13px;
          font-weight: 500;
          animation: introFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 900ms both;
        }

        .intro-blink-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.7);
          animation: introBlink 1s ease-in-out infinite;
        }

        .intro-progress-track {
          margin-top: 22px;
          width: 200px;
          height: 2px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
          animation: introFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 950ms both;
        }

        .intro-progress-fill {
          display: block;
          width: 100%;
          height: 100%;
          transform-origin: left center;
          transform: scaleX(0);
          background: linear-gradient(90deg, #16a34a 0%, #22c55e 55%, #4ade80 100%);
          animation: introProgressFill 1.3s cubic-bezier(0.4, 0, 0.2, 1) 700ms forwards;
        }

        .intro-circuit {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          opacity: 0.85;
        }

        .intro-center {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 0 24px;
        }
      `}</style>

      <svg
        className="intro-circuit"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g transform="translate(200 200)">
          <path className="intro-trace intro-trace-d1" d="M0 -28 V -150 H -36" />
          <path className="intro-trace intro-trace-d2" d="M0 28 V 150 H 40" />
          <path className="intro-trace intro-trace-d3" d="M28 0 H 160 V -32" />
          <path className="intro-trace intro-trace-d4" d="M-28 0 H -160 V 28" />
          <path className="intro-trace intro-trace-d5" d="M20 -20 L 72 -72 H 120 L 148 -100" />
          <path className="intro-trace intro-trace-d6" d="M-20 20 L -70 70 V 118 L -98 146" />
          <path className="intro-trace intro-trace-d7" d="M20 20 L 68 68 V 110 H 130" />
          <path className="intro-trace intro-trace-d8" d="M-20 -20 L -64 -64 H -118 L -145 -91" />

          <circle className="intro-endpoint intro-endpoint-d1" cx="-36" cy="-150" r="2.5" />
          <circle className="intro-endpoint intro-endpoint-d2" cx="40" cy="150" r="2.5" />
          <circle className="intro-endpoint intro-endpoint-d3" cx="160" cy="-32" r="2.5" />
          <circle className="intro-endpoint intro-endpoint-d4" cx="-160" cy="28" r="2.5" />
          <circle className="intro-endpoint intro-endpoint-d5" cx="148" cy="-100" r="2.5" />
          <circle className="intro-endpoint intro-endpoint-d6" cx="-98" cy="146" r="2.5" />
          <circle className="intro-endpoint intro-endpoint-d7" cx="130" cy="110" r="2.5" />
          <circle className="intro-endpoint intro-endpoint-d8" cx="-145" cy="-91" r="2.5" />
        </g>
      </svg>

      <div className="intro-center">
        <div className="intro-logo-wrap">
          <span className="intro-ring" aria-hidden="true" />
          <span className="intro-ring intro-ring-delay" aria-hidden="true" />
          <img src={logoSrc} alt="" className="intro-logo-img" draggable={false} />
        </div>

        <div className="intro-brand">{BUSINESS_NAME}</div>

        <div className="intro-loading-row">
          <span className="intro-blink-dot" aria-hidden="true" />
          <span>Loading your dashboard</span>
        </div>

        <div className="intro-progress-track" aria-hidden="true">
          <span className="intro-progress-fill" />
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}
