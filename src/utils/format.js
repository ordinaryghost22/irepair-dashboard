export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}
export function formatDateShort(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
}
export function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60)     return "just now";
  if (s < 3600)   return `${Math.floor(s/60)}m ago`;
  if (s < 86400)  return `${Math.floor(s/3600)}h ago`;
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return formatDate(dateStr);
}
export function formatPhone(phone) {
  if (!phone) return "—";
  const c = String(phone).replace(/\D/g, "");
  if (c.length === 11 && c.startsWith("92")) return `+${c.slice(0,2)} ${c.slice(2,5)} ${c.slice(5)}`;
  if (c.length === 10) return `+92 ${c.slice(0,3)} ${c.slice(3)}`;
  return phone;
}
export function truncate(text, max=50) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "..." : text;
}
export function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}
export function whatsappLink(phone) {
  if (!phone) return "#";
  return `https://wa.me/92${String(phone).replace(/\D/g,"").replace(/^0/,"")}`;
}
export function groupByDate(items, dateKey="Date") {
  return items.reduce((acc, item) => {
    const date = item[dateKey] || "Unknown";
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});
}

// ── FIXED inRange: handles any date format from n8n ──────────────────────────
export function inRange(dateStr, range) {
  if (range === "All Time" || !dateStr) return true;

  // Try multiple parse strategies
  let d = new Date(dateStr);

  // If invalid, try DD/MM/YYYY
  if (isNaN(d)) {
    const parts = String(dateStr).split(/[\/\-\.\s]/);
    if (parts.length === 3) {
      // Try DD/MM/YYYY
      d = new Date(`${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`);
    }
  }

  // Still invalid — only show in All Time
  if (isNaN(d)) return false;

  const now = new Date();
  now.setHours(23, 59, 59, 999);

  if (range === "Today") {
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }
  if (range === "This Week") {
    const w = new Date();
    w.setDate(w.getDate() - 7);
    w.setHours(0, 0, 0, 0);
    return d >= w;
  }
  if (range === "This Month") {
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }
  return true;
}
