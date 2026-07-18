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
