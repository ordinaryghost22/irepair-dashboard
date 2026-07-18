import { createContext, useContext, useEffect } from "react";

/** Smooth deceleration — starts fast, settles gently */
export const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export const DURATION = {
  micro: "150ms",
  card: "220ms",
  page: "250ms",
  press: "100ms",
  backdrop: "180ms",
};

/**
 * Premium dark theme — exact visual tokens.
 * CSS variables injected on :root.
 */
export const DARK = {
  name: "dark",
  // Backgrounds
  pageBg:
    "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139,92,246,0.10), transparent), #0a0a0c",
  // Obsidian surface — glossy black catching ambient light
  cardBg:
    "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.04), transparent 50%), linear-gradient(180deg, #17171a 0%, #0f0f11 100%)",
  cardBgSolid: "#0f0f11",
  cardBg2: "rgba(255,255,255,0.03)",
  cardHover:
    "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.06), transparent 50%), linear-gradient(180deg, #1a1a1e 0%, #121214 100%)",
  sidebarBg: "linear-gradient(180deg, #0d0d0f 0%, #0a0a0c 100%)",
  topbarBg: "transparent",
  inputBg: "rgba(255,255,255,0.04)",
  // Borders — soft white/purple rim
  border: "rgba(255,255,255,0.08)",
  borderSub: "rgba(255,255,255,0.06)",
  borderHover: "rgba(139,92,246,0.28)",
  borderTopHighlight: "rgba(255,255,255,0.14)",
  // Text
  textPrimary: "rgba(255,255,255,0.92)",
  textSecondary: "rgba(255,255,255,0.55)",
  textMuted: "rgba(255,255,255,0.32)",
  // Table
  thBg: "transparent",
  thColor: "rgba(255,255,255,0.32)",
  tdColor: "rgba(255,255,255,0.92)",
  rowHover: "rgba(139,92,246,0.08)",
  // Shadow — exact card depth
  cardShadow:
    "0 1px 0 rgba(255,255,255,0.05) inset, 0 4px 12px rgba(0,0,0,0.4), 0 16px 40px rgba(0,0,0,0.3)",
  cardRadius: 16,
  // Primary accent — violet (#8b5cf6 solid / #a78bfa soft UI)
  accent: "#a78bfa",
  accentSolid: "#8b5cf6",
  accentGlow: "rgba(139,92,246,0.22)",
  accentHover: "#c4b5fd",
  // Primary button — dark metal + purple glow
  btnPrimaryBg: "linear-gradient(180deg, #2c2c30 0%, #18181b 100%)",
  btnPrimaryColor: "#f5f5f5",
  btnPrimaryShadow:
    "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px rgba(139,92,246,0.15), 0 1px 2px rgba(0,0,0,0.3)",
};

/** @deprecated Light mode removed */
export const LIGHT = DARK;

const CSS_VARS = {
  "--bg-page": "#0a0a0c",
  "--bg-page-full": DARK.pageBg,
  "--bg-sidebar": "#0a0a0c",
  "--bg-card": "#0f0f11",
  "--bg-card-hover": "#121214",
  "--border-subtle": "rgba(255,255,255,0.07)",
  "--border-hover": "rgba(255,255,255,0.12)",
  "--border-top-highlight": "rgba(255,255,255,0.14)",
  "--text-primary": DARK.textPrimary,
  "--text-secondary": DARK.textSecondary,
  "--text-muted": DARK.textMuted,
  "--accent": "#8b5cf6",
  "--accent-glow": "rgba(139,92,246,0.22)",
  "--accent-hover": "#a78bfa",
  "--card-shadow": DARK.cardShadow,
  "--ease-premium": EASE,
  "--duration-micro": DURATION.micro,
  "--duration-card": DURATION.card,
  "--duration-page": DURATION.page,
  "--font-sans": '"Inter", system-ui, -apple-system, sans-serif',
};

function applyCssVars() {
  const root = document.documentElement;
  Object.entries(CSS_VARS).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.style.colorScheme = "dark";
  root.setAttribute("data-theme", "dark");
}

const ThemeContext = createContext();

if (typeof document !== "undefined") {
  applyCssVars();
}

export function ThemeProvider({ children }) {
  useEffect(() => {
    applyCssVars();
    localStorage.setItem("irepair_dark", "1");
  }, []);

  const toggle = () => {};

  return (
    <ThemeContext.Provider value={{ theme: DARK, dark: true, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

/** Shared card chrome — obsidian surface + rim highlight */
export function cardStyle(t, { interactive = false } = {}) {
  return {
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderTop: `1px solid ${t.borderTopHighlight}`,
    borderRadius: t.cardRadius ?? 16,
    boxShadow: t.cardShadow,
    transition: interactive
      ? `background ${DURATION.micro} ${EASE}, border-color ${DURATION.micro} ${EASE}`
      : undefined,
  };
}

export function primaryBtnStyle(t) {
  return {
    background: t.btnPrimaryBg,
    color: t.btnPrimaryColor,
    boxShadow: t.btnPrimaryShadow,
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
    transition: `transform ${DURATION.press} ${EASE}, box-shadow ${DURATION.micro} ${EASE}, background ${DURATION.micro} ${EASE}, opacity ${DURATION.micro} ${EASE}`,
  };
}

export function secondaryBtnStyle(t) {
  return {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.12)",
    color: t.textSecondary,
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
    transition: `transform ${DURATION.press} ${EASE}, background ${DURATION.micro} ${EASE}, border-color ${DURATION.micro} ${EASE}, color ${DURATION.micro} ${EASE}`,
  };
}
