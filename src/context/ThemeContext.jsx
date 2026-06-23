import { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

export const LIGHT = {
  name: "light",
  // Backgrounds
  pageBg:    "#f0f2f8",
  cardBg:    "#ffffff",
  cardBg2:   "#f8f9fe",
  sidebarBg: "linear-gradient(180deg,#0f0c29 0%,#1a1040 55%,#1e1550 100%)",
  topbarBg:  "#ffffff",
  inputBg:   "#f5f6fc",
  // Borders
  border:    "#e8eaf4",
  borderSub: "#f0f2f8",
  // Text
  textPrimary:   "#111827",
  textSecondary: "#6b7280",
  textMuted:     "#9ca3af",
  // Table
  thBg:    "#f8f9fe",
  thColor: "#6b7280",
  tdColor: "#1f2937",
  rowHover:"#f5f7ff",
  // Shadow
  cardShadow: "0 1px 20px rgba(99,102,241,0.06)",
  // Accents
  accent: "#667eea",
  accentGlow: "rgba(102,126,234,0.3)",
};

export const DARK = {
  name: "dark",
  // Backgrounds — layered depth
  pageBg:    "#0d0f1a",
  cardBg:    "#151929",
  cardBg2:   "#1a1f35",
  sidebarBg: "linear-gradient(180deg,#080b14 0%,#0f1120 55%,#0d1028 100%)",
  topbarBg:  "#111422",
  inputBg:   "#1a1f35",
  // Borders
  border:    "#252d4a",
  borderSub: "#1e2540",
  // Text — all visible
  textPrimary:   "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted:     "#64748b",
  // Table
  thBg:    "#131726",
  thColor: "#64748b",
  tdColor: "#e2e8f0",
  rowHover:"#1e2540",
  // Shadow
  cardShadow: "0 1px 20px rgba(0,0,0,0.4)",
  // Accents
  accent: "#818cf8",
  accentGlow: "rgba(129,140,248,0.25)",
};

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem("irepair_dark") === "1");
  const theme = dark ? DARK : LIGHT;

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("irepair_dark", next ? "1" : "0");
  };

  return (
    <ThemeContext.Provider value={{ theme, dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
