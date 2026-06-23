export const BASE_URL = "http://localhost:5678/webhook";

export const STATUS_COLORS = {
  Confirmed: { bg:"#dcfce7", color:"#15803d", dot:"#22c55e",  darkBg:"rgba(34,197,94,0.15)",  darkColor:"#4ade80" },
  Pending:   { bg:"#fef9c3", color:"#a16207", dot:"#eab308",  darkBg:"rgba(234,179,8,0.15)",   darkColor:"#facc15" },
  Rejected:  { bg:"#fee2e2", color:"#b91c1c", dot:"#ef4444",  darkBg:"rgba(239,68,68,0.15)",   darkColor:"#f87171" },
  Available: { bg:"#dcfce7", color:"#15803d", dot:"#22c55e",  darkBg:"rgba(34,197,94,0.15)",  darkColor:"#4ade80" },
  Booked:    { bg:"#fee2e2", color:"#b91c1c", dot:"#ef4444",  darkBg:"rgba(239,68,68,0.15)",   darkColor:"#f87171" },
  default:   { bg:"#f3f4f6", color:"#6b7280", dot:"#9ca3af",  darkBg:"rgba(156,163,175,0.15)", darkColor:"#d1d5db" },
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
  { path:"/",          label:"Dashboard",  icon:"◈" },
  { path:"/bookings",  label:"Bookings",   icon:"📋", badge:true },
  { path:"/slots",     label:"Slots",      icon:"🕐" },
  { path:"/leads",     label:"Leads",      icon:"👥" },
  { path:"/waitlist",  label:"Waitlist",   icon:"⏳" },
  { path:"/chats",     label:"Chats",      icon:"💬" },
  { path:"/analytics", label:"Analytics",  icon:"📊" },
  { path:"/audit",     label:"Audit Log",  icon:"📜" },
  { path:"/security",  label:"Security",   icon:"🛡️" },
  { path:"/settings",  label:"Settings",   icon:"⚙️" },
];

export const DATE_RANGES = ["Today", "This Week", "This Month", "All Time"];
