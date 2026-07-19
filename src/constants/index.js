export const BASE_URL = "http://localhost:5678/webhook";

/**
 * Status badges — exact glow values from premium pass.
 */
export const STATUS_COLORS = {
  Pending: {
    bg: "rgba(234,179,8,0.15)",
    color: "#fbbf24",
    border: "rgba(234,179,8,0.3)",
    dot: "#fbbf24",
    shadow: "0 0 20px rgba(234,179,8,0.2)",
  },
  Confirmed: {
    bg: "rgba(34,197,94,0.15)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.3)",
    dot: "#4ade80",
    shadow: "0 0 20px rgba(34,197,94,0.2)",
  },
  Rejected: {
    bg: "rgba(248,113,113,0.15)",
    color: "#f87171",
    border: "rgba(248,113,113,0.3)",
    dot: "#f87171",
    shadow: "0 0 20px rgba(248,113,113,0.2)",
  },
  Completed: {
    bg: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.6)",
    border: "rgba(255,255,255,0.12)",
    dot: "rgba(255,255,255,0.4)",
    shadow: "none",
  },
  Cancelled: {
    bg: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.40)",
    border: "rgba(255,255,255,0.10)",
    dot: "rgba(255,255,255,0.28)",
    shadow: "none",
  },
  "Repeat customer": {
    bg: "rgba(56,189,248,0.12)",
    color: "#38bdf8",
    border: "rgba(56,189,248,0.28)",
    dot: "#38bdf8",
    shadow: "0 0 16px rgba(56,189,248,0.18)",
  },
  New: {
    bg: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.55)",
    border: "rgba(255,255,255,0.12)",
    dot: "rgba(255,255,255,0.4)",
    shadow: "none",
  },
  Returning: {
    bg: "rgba(56,189,248,0.12)",
    color: "#38bdf8",
    border: "rgba(56,189,248,0.28)",
    dot: "#38bdf8",
    shadow: "0 0 16px rgba(56,189,248,0.18)",
  },
  Loyal: {
    bg: "rgba(34,197,94,0.15)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.3)",
    dot: "#4ade80",
    shadow: "0 0 20px rgba(34,197,94,0.2)",
  },
  VIP: {
    bg: "rgba(251,191,36,0.16)",
    color: "#fbbf24",
    border: "rgba(251,191,36,0.4)",
    dot: "#fbbf24",
    shadow: "0 0 24px rgba(251,191,36,0.35)",
  },
  "At risk": {
    bg: "rgba(248,113,113,0.14)",
    color: "#fb923c",
    border: "rgba(248,113,113,0.35)",
    dot: "#f87171",
    shadow: "0 0 18px rgba(248,113,113,0.22)",
  },
  Available: {
    bg: "rgba(34,197,94,0.15)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.3)",
    dot: "#4ade80",
    shadow: "0 0 20px rgba(34,197,94,0.2)",
  },
  Booked: {
    bg: "rgba(248,113,113,0.15)",
    color: "#f87171",
    border: "rgba(248,113,113,0.3)",
    dot: "#f87171",
    shadow: "0 0 20px rgba(248,113,113,0.2)",
  },
  default: {
    bg: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.6)",
    border: "rgba(255,255,255,0.12)",
    dot: "rgba(255,255,255,0.4)",
    shadow: "none",
  },
};

export const PAYMENT_COLORS = {
  Paid: {
    bg: "rgba(34,197,94,0.15)",
    color: "#4ade80",
    border: "rgba(34,197,94,0.3)",
    dot: "#4ade80",
    shadow: "0 0 20px rgba(34,197,94,0.2)",
  },
  Unpaid: {
    bg: "rgba(245,158,11,0.15)",
    color: "#fbbf24",
    border: "rgba(245,158,11,0.3)",
    dot: "#fbbf24",
    shadow: "0 0 20px rgba(245,158,11,0.2)",
  },
  Onsite: {
    bg: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.6)",
    border: "rgba(255,255,255,0.12)",
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