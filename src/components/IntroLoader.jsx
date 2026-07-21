import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import logoSrc from "../assets/logo.png";
import { BUSINESS_NAME, BUSINESS_SUBTITLE, BRAND_ACCENT } from "../constants/brand";

const STORAGE_KEY = "irepair_intro_seen";
const SEQUENCE_MS = 3200;
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
 * Full-screen login intro — cyan circuit theme matching We Fix badge.
 * Plays once per session, then circle-wipes to the login form.
 * Replay: /login?intro=1
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
      className={wiping ? "wf-intro wf-intro--wipe" : "wf-intro"}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "#030708",
      }}
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <style>{`
        .wf-intro--wipe {
          animation: wfWipe ${WIPE_MS}ms cubic-bezier(.76, 0, .24, 1) forwards;
        }

        @keyframes wfWipe {
          from { clip-path: circle(150% at 50% 50%); }
          to   { clip-path: circle(0% at 50% 50%); }
        }

        @keyframes wfCircuitDraw {
          to { stroke-dashoffset: 0; }
        }

        @keyframes wfCircuitPulse {
          0%, 100% { opacity: 0.35; filter: drop-shadow(0 0 2px ${BRAND_ACCENT}); }
          50%      { opacity: 0.9;  filter: drop-shadow(0 0 8px ${BRAND_ACCENT}); }
        }

        @keyframes wfGlowExpand {
          0%   { transform: scale(0.2); opacity: 0.55; }
          70%  { opacity: 0.12; }
          100% { transform: scale(2.4); opacity: 0; }
        }

        @keyframes wfDotLit {
          from { opacity: 0; transform: scale(0.3); }
          to   { opacity: 1; transform: scale(1); }
        }

        @keyframes wfBadgeIn {
          0%   { opacity: 0; transform: scale(0.95); }
          65%  { opacity: 1; transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes wfBreathe {
          0%, 100% {
            filter:
              drop-shadow(0 0 12px rgba(34, 211, 238, 0.35))
              drop-shadow(0 0 28px rgba(34, 211, 238, 0.18));
          }
          50% {
            filter:
              drop-shadow(0 0 20px rgba(34, 211, 238, 0.55))
              drop-shadow(0 0 48px rgba(34, 211, 238, 0.28));
          }
        }

        @keyframes wfTextUp {
          from { opacity: 0; transform: translateY(15px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes wfBlink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.25; }
        }

        @keyframes wfProgressFill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        .wf-circuit {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .wf-trace {
          fill: none;
          stroke: ${BRAND_ACCENT};
          stroke-width: 1.4;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation:
            wfCircuitDraw 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards,
            wfCircuitPulse 2.4s ease-in-out 1.4s infinite;
        }

        .wf-t1 { animation-delay: 0ms, 1.4s; }
        .wf-t2 { animation-delay: 70ms, 1.5s; }
        .wf-t3 { animation-delay: 140ms, 1.55s; }
        .wf-t4 { animation-delay: 210ms, 1.6s; }
        .wf-t5 { animation-delay: 100ms, 1.48s; }
        .wf-t6 { animation-delay: 180ms, 1.52s; }
        .wf-t7 { animation-delay: 250ms, 1.58s; }
        .wf-t8 { animation-delay: 320ms, 1.62s; }

        .wf-node {
          fill: ${BRAND_ACCENT};
          opacity: 0;
          transform-origin: center;
          transform-box: fill-box;
          animation: wfDotLit 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .wf-n1 { animation-delay: 950ms; }
        .wf-n2 { animation-delay: 1020ms; }
        .wf-n3 { animation-delay: 1100ms; }
        .wf-n4 { animation-delay: 1180ms; }
        .wf-n5 { animation-delay: 1050ms; }
        .wf-n6 { animation-delay: 1130ms; }
        .wf-n7 { animation-delay: 1210ms; }
        .wf-n8 { animation-delay: 1280ms; }

        .wf-center {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 0 20px;
          width: min(100%, 360px);
        }

        .wf-glow-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: min(72vw, 280px);
          height: min(72vw, 280px);
          margin: calc(min(72vw, 280px) / -2) 0 0 calc(min(72vw, 280px) / -2);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34, 211, 238, 0.22) 0%, transparent 68%);
          animation: wfGlowExpand 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          pointer-events: none;
          z-index: 0;
        }

        .wf-glow-ring-delay {
          animation-delay: 1.1s;
        }

        .wf-badge {
          position: relative;
          z-index: 1;
          width: min(56vw, 220px);
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation:
            wfBadgeIn 1.15s cubic-bezier(0.34, 1.56, 0.64, 1) 450ms both,
            wfBreathe 2.8s ease-in-out 1.6s infinite;
        }

        .wf-badge img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          display: block;
          user-select: none;
          -webkit-user-drag: none;
        }

        .wf-text {
          margin-top: 22px;
          animation: wfTextUp 0.75s cubic-bezier(0.16, 1, 0.3, 1) 900ms both;
        }

        .wf-text-title {
          margin: 0;
          color: #ffffff;
          font-size: clamp(22px, 5vw, 28px);
          font-weight: 700;
          letter-spacing: -0.4px;
          line-height: 1.15;
        }

        .wf-text-sub {
          margin: 8px 0 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .wf-text-sub::before,
        .wf-text-sub::after {
          content: "";
          width: 28px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.7), transparent);
        }

        .wf-loading {
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
          font-weight: 500;
          animation: wfTextUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 1100ms both;
        }

        .wf-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: ${BRAND_ACCENT};
          box-shadow: 0 0 10px rgba(34, 211, 238, 0.75);
          animation: wfBlink 1s ease-in-out infinite;
        }

        .wf-progress {
          margin-top: 20px;
          width: min(200px, 70vw);
          height: 2px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
          animation: wfTextUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 1150ms both;
        }

        .wf-progress > span {
          display: block;
          width: 100%;
          height: 100%;
          transform-origin: left center;
          transform: scaleX(0);
          background: linear-gradient(90deg, #0891b2 0%, ${BRAND_ACCENT} 55%, #67e8f9 100%);
          animation: wfProgressFill 1.4s cubic-bezier(0.4, 0, 0.2, 1) 700ms forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .wf-trace,
          .wf-node,
          .wf-badge,
          .wf-text,
          .wf-loading,
          .wf-progress,
          .wf-glow-ring,
          .wf-dot,
          .wf-progress > span {
            animation: none !important;
          }
          .wf-trace { stroke-dashoffset: 0; opacity: 0.6; }
          .wf-node { opacity: 1; }
          .wf-badge { opacity: 1; transform: none; filter: drop-shadow(0 0 16px rgba(34, 211, 238, 0.35)); }
          .wf-text, .wf-loading, .wf-progress { opacity: 1; transform: none; }
          .wf-progress > span { transform: scaleX(1); }
        }
      `}</style>

      <span className="wf-glow-ring" aria-hidden="true" />
      <span className="wf-glow-ring wf-glow-ring-delay" aria-hidden="true" />

      <svg
        className="wf-circuit"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g transform="translate(200 200)">
          <path className="wf-trace wf-t1" d="M0 -36 V -155 H -42" />
          <path className="wf-trace wf-t2" d="M0 36 V 155 H 44" />
          <path className="wf-trace wf-t3" d="M36 0 H 165 V -36" />
          <path className="wf-trace wf-t4" d="M-36 0 H -165 V 30" />
          <path className="wf-trace wf-t5" d="M24 -24 L 78 -78 H 128 L 155 -105" />
          <path className="wf-trace wf-t6" d="M-24 24 L -74 74 V 122 L -102 150" />
          <path className="wf-trace wf-t7" d="M24 24 L 72 72 V 114 H 138" />
          <path className="wf-trace wf-t8" d="M-24 -24 L -68 -68 H -124 L -152 -96" />

          <circle className="wf-node wf-n1" cx="-42" cy="-155" r="2.6" />
          <circle className="wf-node wf-n2" cx="44" cy="155" r="2.6" />
          <circle className="wf-node wf-n3" cx="165" cy="-36" r="2.6" />
          <circle className="wf-node wf-n4" cx="-165" cy="30" r="2.6" />
          <circle className="wf-node wf-n5" cx="155" cy="-105" r="2.6" />
          <circle className="wf-node wf-n6" cx="-102" cy="150" r="2.6" />
          <circle className="wf-node wf-n7" cx="138" cy="114" r="2.6" />
          <circle className="wf-node wf-n8" cx="-152" cy="-96" r="2.6" />
        </g>
      </svg>

      <div className="wf-center">
        <div className="wf-badge">
          <img src={logoSrc} alt={BUSINESS_NAME} draggable={false} />
        </div>

        <div className="wf-text">
          <p className="wf-text-title">{BUSINESS_NAME}</p>
          <p className="wf-text-sub">{BUSINESS_SUBTITLE}</p>
        </div>

        <div className="wf-loading">
          <span className="wf-dot" aria-hidden="true" />
          <span>Loading your dashboard</span>
        </div>

        <div className="wf-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}
