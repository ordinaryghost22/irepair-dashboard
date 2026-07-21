import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import logoSrc from "../assets/logo.png";
import { BUSINESS_NAME, BUSINESS_SUBTITLE, BRAND_ACCENT } from "../constants/brand";

const STORAGE_KEY = "irepair_intro_seen";
const SEQUENCE_MS = 4200;
const WIPE_MS = 1000;

/** Force replay with /login?intro=1 */
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
 * Cinematic We Fix login intro — cyan circuits, spring logo, breathe idle, circle wipe.
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
        background: "#020507",
      }}
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <style>{`
        .wf-intro {
          --cyan: ${BRAND_ACCENT};
          --cyan-dim: rgba(34, 211, 238, 0.35);
          --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
          --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
          --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
          --ease-wipe: cubic-bezier(0.76, 0, 0.24, 1);
        }

        .wf-intro--wipe {
          animation: wfWipe ${WIPE_MS}ms var(--ease-wipe) forwards;
        }

        @keyframes wfWipe {
          from { clip-path: circle(160% at 50% 48%); }
          to   { clip-path: circle(0% at 50% 48%); }
        }

        @keyframes wfAmbientIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes wfBloomPulse {
          0%, 100% { opacity: 0.45; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.85; transform: translate(-50%, -50%) scale(1.08); }
        }

        @keyframes wfDraw {
          to { stroke-dashoffset: 0; }
        }

        @keyframes wfTraceGlow {
          0%, 100% {
            opacity: 0.25;
            stroke-width: 1.1;
          }
          50% {
            opacity: 0.95;
            stroke-width: 1.65;
          }
        }

        @keyframes wfEnergyDash {
          to { stroke-dashoffset: -40; }
        }

        @keyframes wfNodePop {
          0%   { opacity: 0; transform: scale(0); }
          60%  { opacity: 1; transform: scale(1.35); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes wfNodeTwinkle {
          0%, 100% { opacity: 0.45; }
          50%      { opacity: 1; }
        }

        @keyframes wfHaloIn {
          0%   { opacity: 0; transform: scale(0.7) rotate(-12deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }

        @keyframes wfHaloSpin {
          to { transform: rotate(360deg); }
        }

        @keyframes wfBadgeReveal {
          0% {
            opacity: 0;
            transform: scale(0.82);
            filter: blur(14px) brightness(1.4);
          }
          55% {
            opacity: 1;
            transform: scale(1.045);
            filter: blur(0) brightness(1.08);
          }
          78% {
            transform: scale(0.985);
            filter: blur(0) brightness(1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0) brightness(1);
          }
        }

        @keyframes wfBreathe {
          0%, 100% {
            box-shadow:
              0 0 0 1px rgba(34, 211, 238, 0.25),
              0 0 28px rgba(34, 211, 238, 0.28),
              0 0 64px rgba(34, 211, 238, 0.12),
              0 18px 40px rgba(0, 0, 0, 0.45);
          }
          50% {
            box-shadow:
              0 0 0 1px rgba(34, 211, 238, 0.55),
              0 0 40px rgba(34, 211, 238, 0.5),
              0 0 90px rgba(34, 211, 238, 0.22),
              0 18px 40px rgba(0, 0, 0, 0.45);
          }
        }

        @keyframes wfShimmer {
          0%   { transform: translateX(-130%) rotate(18deg); opacity: 0; }
          15%  { opacity: 0.55; }
          45%  { opacity: 0.35; }
          100% { transform: translateX(130%) rotate(18deg); opacity: 0; }
        }

        @keyframes wfRingPulse {
          0%   { transform: scale(0.92); opacity: 0.55; }
          100% { transform: scale(1.55); opacity: 0; }
        }

        @keyframes wfFloatUp {
          from { opacity: 0; transform: translateY(18px); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        @keyframes wfLetterIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes wfLineGrow {
          from { transform: scaleX(0); opacity: 0; }
          to   { transform: scaleX(1); opacity: 1; }
        }

        @keyframes wfBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.3; transform: scale(0.85); }
        }

        @keyframes wfProgress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        @keyframes wfProgressShine {
          from { transform: translateX(-100%); }
          to   { transform: translateX(220%); }
        }

        @keyframes wfSpark {
          0%   { opacity: 0; transform: scale(0); }
          30%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.4) translateY(-28px); }
        }

        /* ── Ambient layers ── */
        .wf-vignette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 55% 50% at 50% 45%, rgba(34, 211, 238, 0.14), transparent 62%),
            radial-gradient(ellipse 80% 70% at 50% 100%, rgba(8, 47, 73, 0.5), transparent 55%),
            radial-gradient(circle at 50% 50%, transparent 30%, #020507 88%);
          animation: wfAmbientIn 0.8s var(--ease-out-expo) both;
          pointer-events: none;
        }

        .wf-bloom {
          position: absolute;
          top: 45%;
          left: 50%;
          width: min(70vw, 420px);
          height: min(70vw, 420px);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34, 211, 238, 0.28) 0%, rgba(34, 211, 238, 0.06) 35%, transparent 68%);
          animation: wfBloomPulse 3.2s ease-in-out infinite;
          pointer-events: none;
          will-change: transform, opacity;
        }

        .wf-circuit {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .wf-trace-bg {
          fill: none;
          stroke: rgba(34, 211, 238, 0.12);
          stroke-width: 1;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .wf-trace {
          fill: none;
          stroke: var(--cyan);
          stroke-width: 1.35;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 240;
          stroke-dashoffset: 240;
          filter: drop-shadow(0 0 4px rgba(34, 211, 238, 0.65));
          animation:
            wfDraw 1.65s var(--ease-smooth) forwards,
            wfTraceGlow 2.6s ease-in-out 1.55s infinite;
        }

        .wf-energy {
          fill: none;
          stroke: #a5f3fc;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-dasharray: 8 32;
          stroke-dashoffset: 0;
          opacity: 0;
          filter: drop-shadow(0 0 6px #22d3ee);
          animation:
            wfDraw 1.65s var(--ease-smooth) forwards,
            wfEnergyDash 0.9s linear 1.55s infinite;
        }

        .wf-t1 { animation-delay: 0ms, 1.55s; }
        .wf-t2 { animation-delay: 80ms, 1.62s; }
        .wf-t3 { animation-delay: 160ms, 1.68s; }
        .wf-t4 { animation-delay: 240ms, 1.74s; }
        .wf-t5 { animation-delay: 100ms, 1.58s; }
        .wf-t6 { animation-delay: 200ms, 1.66s; }
        .wf-t7 { animation-delay: 280ms, 1.72s; }
        .wf-t8 { animation-delay: 360ms, 1.78s; }
        .wf-t9 { animation-delay: 120ms, 1.6s; }
        .wf-t10 { animation-delay: 300ms, 1.7s; }

        .wf-e1 { animation-delay: 0ms, 1.55s; opacity: 0; }
        .wf-energy.wf-e1,
        .wf-energy.wf-e2,
        .wf-energy.wf-e3,
        .wf-energy.wf-e4 {
          animation-name: wfDraw, wfEnergyDash;
        }
        .wf-e1 { animation-delay: 0ms, 1.55s; }
        .wf-e2 { animation-delay: 160ms, 1.68s; }
        .wf-e3 { animation-delay: 100ms, 1.58s; }
        .wf-e4 { animation-delay: 280ms, 1.72s; }

        .wf-node {
          fill: #ecfeff;
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          filter: drop-shadow(0 0 5px var(--cyan));
          animation:
            wfNodePop 0.5s var(--ease-spring) forwards,
            wfNodeTwinkle 2s ease-in-out 1.8s infinite;
        }

        .wf-n1 { animation-delay: 1.05s, 1.8s; }
        .wf-n2 { animation-delay: 1.12s, 1.9s; }
        .wf-n3 { animation-delay: 1.18s, 2.0s; }
        .wf-n4 { animation-delay: 1.24s, 1.85s; }
        .wf-n5 { animation-delay: 1.15s, 1.95s; }
        .wf-n6 { animation-delay: 1.28s, 2.05s; }
        .wf-n7 { animation-delay: 1.32s, 1.88s; }
        .wf-n8 { animation-delay: 1.38s, 2.1s; }
        .wf-n9 { animation-delay: 1.2s, 1.92s; }
        .wf-n10 { animation-delay: 1.35s, 2.02s; }

        .wf-center {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 0 20px;
          width: min(100%, 380px);
        }

        .wf-badge-stage {
          position: relative;
          width: min(58vw, 236px);
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wf-orbit {
          position: absolute;
          inset: -14%;
          border-radius: 50%;
          border: 1px solid transparent;
          border-top-color: rgba(34, 211, 238, 0.75);
          border-right-color: rgba(34, 211, 238, 0.15);
          opacity: 0;
          animation:
            wfHaloIn 1s var(--ease-out-expo) 0.55s both,
            wfHaloSpin 8s linear 1.4s infinite;
          will-change: transform;
        }

        .wf-orbit-2 {
          inset: -22%;
          border-top-color: rgba(103, 232, 249, 0.35);
          border-left-color: rgba(34, 211, 238, 0.12);
          border-right-color: transparent;
          animation:
            wfHaloIn 1s var(--ease-out-expo) 0.7s both,
            wfHaloSpin 12s linear reverse 1.5s infinite;
        }

        .wf-pulse-ring {
          position: absolute;
          inset: -6%;
          border-radius: 50%;
          border: 1.5px solid rgba(34, 211, 238, 0.5);
          animation: wfRingPulse 2.4s var(--ease-out-expo) 1.2s infinite;
          pointer-events: none;
        }

        .wf-pulse-ring-b {
          animation-delay: 2.4s;
        }

        .wf-badge {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          background: #041016;
          animation:
            wfBadgeReveal 1.45s var(--ease-spring) 0.55s both,
            wfBreathe 3s ease-in-out 2s infinite;
          will-change: transform, filter, box-shadow;
        }

        .wf-badge img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          border-radius: 50%;
          user-select: none;
          -webkit-user-drag: none;
        }

        .wf-shimmer {
          position: absolute;
          inset: -20%;
          background: linear-gradient(
            105deg,
            transparent 35%,
            rgba(255, 255, 255, 0.08) 45%,
            rgba(165, 243, 252, 0.45) 50%,
            rgba(255, 255, 255, 0.08) 55%,
            transparent 65%
          );
          animation: wfShimmer 1.6s var(--ease-smooth) 1.35s both;
          pointer-events: none;
        }

        .wf-sparks {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .wf-spark {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #ecfeff;
          box-shadow: 0 0 8px var(--cyan);
          opacity: 0;
          animation: wfSpark 1.4s var(--ease-out-expo) forwards;
        }

        .wf-spark:nth-child(1) { left: 12%; top: 28%; animation-delay: 1.5s; }
        .wf-spark:nth-child(2) { left: 82%; top: 22%; animation-delay: 1.7s; }
        .wf-spark:nth-child(3) { left: 18%; top: 72%; animation-delay: 1.85s; }
        .wf-spark:nth-child(4) { left: 78%; top: 68%; animation-delay: 2.0s; }
        .wf-spark:nth-child(5) { left: 50%; top: 8%;  animation-delay: 1.6s; }

        .wf-text {
          margin-top: 28px;
          width: 100%;
        }

        .wf-text-title {
          margin: 0;
          color: #fff;
          font-size: clamp(26px, 6vw, 34px);
          font-weight: 750;
          letter-spacing: -0.6px;
          line-height: 1.1;
          text-shadow: 0 0 40px rgba(34, 211, 238, 0.25);
          animation: wfFloatUp 0.85s var(--ease-out-expo) 1.35s both;
        }

        .wf-text-sub {
          margin: 12px 0 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: rgba(165, 243, 252, 0.9);
          font-size: 11px;
          font-weight: 650;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          animation: wfFloatUp 0.85s var(--ease-out-expo) 1.55s both;
        }

        .wf-text-sub .wf-rule {
          display: block;
          width: 32px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--cyan), transparent);
          transform-origin: center;
          animation: wfLineGrow 0.7s var(--ease-out-expo) 1.7s both;
        }

        .wf-loading {
          margin-top: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          color: rgba(255, 255, 255, 0.48);
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.01em;
          animation: wfFloatUp 0.75s var(--ease-out-expo) 1.85s both;
        }

        .wf-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--cyan);
          box-shadow: 0 0 12px rgba(34, 211, 238, 0.9);
          animation: wfBlink 1.1s ease-in-out infinite;
        }

        .wf-progress {
          position: relative;
          margin-top: 22px;
          width: min(220px, 72vw);
          height: 3px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.07);
          overflow: hidden;
          animation: wfFloatUp 0.6s var(--ease-out-expo) 1.95s both;
        }

        .wf-progress-fill {
          display: block;
          width: 100%;
          height: 100%;
          transform-origin: left center;
          transform: scaleX(0);
          border-radius: inherit;
          background: linear-gradient(90deg, #0e7490, var(--cyan), #a5f3fc);
          box-shadow: 0 0 12px rgba(34, 211, 238, 0.65);
          animation: wfProgress 2s var(--ease-smooth) 0.85s forwards;
        }

        .wf-progress-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
          animation: wfProgressShine 1.4s var(--ease-smooth) 1.1s 2;
          pointer-events: none;
        }

        @media (max-width: 420px) {
          .wf-badge-stage { width: min(64vw, 200px); }
          .wf-text-title { font-size: 24px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .wf-intro *,
          .wf-intro *::before,
          .wf-intro *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition: none !important;
          }
          .wf-trace, .wf-energy { stroke-dashoffset: 0; opacity: 0.7; }
          .wf-node, .wf-badge, .wf-text-title, .wf-text-sub, .wf-loading, .wf-progress {
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
          .wf-progress-fill { transform: scaleX(1) !important; }
        }
      `}</style>

      <div className="wf-vignette" aria-hidden="true" />
      <div className="wf-bloom" aria-hidden="true" />

      <svg
        className="wf-circuit"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="wfStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0891b2" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a5f3fc" />
          </linearGradient>
        </defs>

        <g transform="translate(200 200)">
          {/* Soft underlay grid */}
          <path className="wf-trace-bg" d="M0 -40 V -170 H -50" />
          <path className="wf-trace-bg" d="M0 40 V 170 H 52" />
          <path className="wf-trace-bg" d="M40 0 H 175 V -40" />
          <path className="wf-trace-bg" d="M-40 0 H -175 V 34" />
          <path className="wf-trace-bg" d="M28 -28 L 88 -88 H 140 L 168 -116" />
          <path className="wf-trace-bg" d="M-28 28 L -82 82 V 132 L -112 162" />

          {/* Live drawing traces */}
          <path className="wf-trace wf-t1" stroke="url(#wfStrokeGrad)" d="M0 -40 V -170 H -50" />
          <path className="wf-trace wf-t2" stroke="url(#wfStrokeGrad)" d="M0 40 V 170 H 52" />
          <path className="wf-trace wf-t3" stroke="url(#wfStrokeGrad)" d="M40 0 H 175 V -40" />
          <path className="wf-trace wf-t4" stroke="url(#wfStrokeGrad)" d="M-40 0 H -175 V 34" />
          <path className="wf-trace wf-t5" stroke="url(#wfStrokeGrad)" d="M28 -28 L 88 -88 H 140 L 168 -116" />
          <path className="wf-trace wf-t6" stroke="url(#wfStrokeGrad)" d="M-28 28 L -82 82 V 132 L -112 162" />
          <path className="wf-trace wf-t7" stroke="url(#wfStrokeGrad)" d="M28 28 L 80 80 V 124 H 150" />
          <path className="wf-trace wf-t8" stroke="url(#wfStrokeGrad)" d="M-28 -28 L -76 -76 H -136 L -166 -106" />
          <path className="wf-trace wf-t9" stroke="url(#wfStrokeGrad)" d="M0 -40 L -22 -72 V -110 H -70" />
          <path className="wf-trace wf-t10" stroke="url(#wfStrokeGrad)" d="M0 40 L 24 78 H 70 V 120" />

          {/* Energy dashes racing along main paths */}
          <path className="wf-energy wf-e1" d="M0 -40 V -170 H -50" />
          <path className="wf-energy wf-e2" d="M40 0 H 175 V -40" />
          <path className="wf-energy wf-e3" d="M28 -28 L 88 -88 H 140 L 168 -116" />
          <path className="wf-energy wf-e4" d="M-28 28 L -82 82 V 132 L -112 162" />

          <circle className="wf-node wf-n1" cx="-50" cy="-170" r="2.8" />
          <circle className="wf-node wf-n2" cx="52" cy="170" r="2.8" />
          <circle className="wf-node wf-n3" cx="175" cy="-40" r="2.8" />
          <circle className="wf-node wf-n4" cx="-175" cy="34" r="2.8" />
          <circle className="wf-node wf-n5" cx="168" cy="-116" r="2.8" />
          <circle className="wf-node wf-n6" cx="-112" cy="162" r="2.8" />
          <circle className="wf-node wf-n7" cx="150" cy="124" r="2.8" />
          <circle className="wf-node wf-n8" cx="-166" cy="-106" r="2.8" />
          <circle className="wf-node wf-n9" cx="-70" cy="-110" r="2.4" />
          <circle className="wf-node wf-n10" cx="70" cy="120" r="2.4" />
        </g>
      </svg>

      <div className="wf-center">
        <div className="wf-badge-stage">
          <span className="wf-orbit" aria-hidden="true" />
          <span className="wf-orbit wf-orbit-2" aria-hidden="true" />
          <span className="wf-pulse-ring" aria-hidden="true" />
          <span className="wf-pulse-ring wf-pulse-ring-b" aria-hidden="true" />

          <div className="wf-badge">
            <img src={logoSrc} alt={BUSINESS_NAME} draggable={false} />
            <span className="wf-shimmer" aria-hidden="true" />
          </div>

          <div className="wf-sparks" aria-hidden="true">
            <span className="wf-spark" />
            <span className="wf-spark" />
            <span className="wf-spark" />
            <span className="wf-spark" />
            <span className="wf-spark" />
          </div>
        </div>

        <div className="wf-text">
          <p className="wf-text-title">{BUSINESS_NAME}</p>
          <p className="wf-text-sub">
            <span className="wf-rule" />
            {BUSINESS_SUBTITLE}
            <span className="wf-rule" />
          </p>
        </div>

        <div className="wf-loading">
          <span className="wf-dot" aria-hidden="true" />
          <span>Loading your dashboard</span>
        </div>

        <div className="wf-progress" aria-hidden="true">
          <span className="wf-progress-fill" />
          <span className="wf-progress-glow" />
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}
