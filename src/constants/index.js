export const BASE_URL = "http://localhost:5678/webhook";

/**
 * Status / channel badges — translucent bg + crisp text (no neon glow).
 */
export const STATUS_COLORS = {
  Pending: {
    bg: "rgba(234,179,8,0.12)",
    color: "#fbbf24",
    border: "rgba(234,179,8,0.22)",
    dot: "#fbbf24",
    shadow: "none",
  },
  Confirmed: {
    bg: "rgba(34,197,94,0.12)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.22)",
    dot: "#4ade80",
    shadow: "none",
  },
  Rejected: {
    bg: "rgba(248,113,113,0.12)",
    color: "#f87171",
    border: "rgba(248,113,113,0.22)",
    dot: "#f87171",
    shadow: "none",
  },
  Completed: {
    bg: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.65)",
    border: "rgba(255,255,255,0.10)",
    dot: "rgba(255,255,255,0.4)",
    shadow: "none",
  },
  Cancelled: {
    bg: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.10)",
    dot: "rgba(255,255,255,0.3)",
    shadow: "none",
  },
  "Repeat customer": {
    bg: "rgba(56,189,248,0.12)",
    color: "#38bdf8",
    border: "rgba(56,189,248,0.22)",
    dot: "#38bdf8",
    shadow: "none",
  },
  New: {
    bg: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.55)",
    border: "rgba(255,255,255,0.10)",
    dot: "rgba(255,255,255,0.4)",
    shadow: "none",
  },
  Returning: {
    bg: "rgba(56,189,248,0.12)",
    color: "#38bdf8",
    border: "rgba(56,189,248,0.22)",
    dot: "#38bdf8",
    shadow: "none",
  },
  Loyal: {
    bg: "rgba(34,197,94,0.12)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.22)",
    dot: "#4ade80",
    shadow: "none",
  },
  VIP: {
    bg: "rgba(251,191,36,0.12)",
    color: "#fbbf24",
    border: "rgba(251,191,36,0.28)",
    dot: "#fbbf24",
    shadow: "none",
  },
  "At risk": {
    bg: "rgba(248,113,113,0.12)",
    color: "#fb923c",
    border: "rgba(248,113,113,0.25)",
    dot: "#f87171",
    shadow: "none",
  },
  Available: {
    bg: "rgba(34,197,94,0.12)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.22)",
    dot: "#4ade80",
    shadow: "none",
  },
  Booked: {
    bg: "rgba(248,113,113,0.12)",
    color: "#f87171",
    border: "rgba(248,113,113,0.22)",
    dot: "#f87171",
    shadow: "none",
  },
  // Unified Inbox / Source channel badges
  Website: {
    bg: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.7)",
    border: "rgba(255,255,255,0.12)",
    dot: "rgba(255,255,255,0.45)",
    shadow: "none",
  },
  WhatsApp: {
    bg: "rgba(37,211,102,0.12)",
    color: "#4ade80",
    border: "rgba(37,211,102,0.22)",
    dot: "#25d366",
    shadow: "none",
  },
  Instagram: {
    bg: "rgba(219,39,119,0.15)",
    color: "#f472b6",
    border: "rgba(219,39,119,0.25)",
    dot: "#db2777",
    shadow: "none",
  },
  Messenger: {
    bg: "rgba(59,130,246,0.12)",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.22)",
    dot: "#3b82f6",
    shadow: "none",
  },
  default: {
    bg: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.6)",
    border: "rgba(255,255,255,0.10)",
    dot: "rgba(255,255,255,0.4)",
    shadow: "none",
  },
};

export const PAYMENT_COLORS = {
  Paid: {
    bg: "rgba(34,197,94,0.12)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.22)",
    dot: "#4ade80",
    shadow: "none",
  },
  Unpaid: {
    bg: "rgba(245,158,11,0.12)",
    color: "#fbbf24",
    border: "rgba(245,158,11,0.22)",
    dot: "#fbbf24",
    shadow: "none",
  },
  Onsite: {
    bg: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.6)",
    border: "rgba(255,255,255,0.10)",
    dot: "rgba(255,255,255,0.4)",
    shadow: "none",
  },
};

export const SERVICE_PRICES = {
  "Screen Repair":       5000,
  "Battery Replacement": 2500,
  "Software Fix":        1500,
  "Water Damage":        8000,
  "Charging Port":       3000,
  "Camera Repair":       4000,
};

export const NAV_ITEMS = [
  { path:"/",          label:"Dashboard",  badge:false },
  { path:"/bookings",  label:"Bookings",   badge:true },
  { path:"/invoices",  label:"Invoices" },
  { path:"/cash",      label:"Cash Ledger" },
  { path:"/slots",     label:"Slots" },
  { path:"/leads",     label:"Leads" },
  { path:"/waitlist",  label:"Waitlist" },
  { path:"/chats",     label:"Chats" },
  { path:"/analytics", label:"Analytics" },
  { path:"/audit",     label:"Audit Log" },
  { path:"/security",  label:"Security" },
  { path:"/settings",  label:"Settings" },
];

export const DATE_RANGES = ["Today", "This Week", "This Month", "All Time"];

export const CASH_ENTRY_TYPES = [
  { value: "cash_drop", label: "Cash Drop" },
  { value: "expense", label: "Expense" },
  { value: "payout", label: "Payout" },
];

export const CASH_ENTRY_COLORS = {
  cash_drop: {
    bg: "rgba(34,197,94,0.15)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.3)",
    label: "Cash Drop",
  },
  expense: {
    bg: "rgba(248,113,113,0.15)",
    color: "#f87171",
    border: "rgba(248,113,113,0.3)",
    label: "Expense",
  },
  payout: {
    bg: "rgba(245,158,11,0.15)",
    color: "#fbbf24",
    border: "rgba(245,158,11,0.3)",
    label: "Payout",
  },
};