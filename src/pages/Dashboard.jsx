import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useTheme } from "../context/ThemeContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from "recharts";
import StatCard, { premiumCardStyle } from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { exportToCSV } from "../utils/export";
import { formatDate, inRange } from "../utils/format";
import { isStalePending } from "../utils/sla";
import { DATE_RANGES, SERVICE_PRICES } from "../constants";
import HourglassLoader from "../components/HourglassLoader";
import { getInvoices } from "../api";
import {
  StatIconBookings,
  StatIconLeads,
  StatIconSlots,
  StatIconRevenue,
} from "../components/icons";

const STATUS_COLORS = {
  Confirmed: "#4ade80",
  Pending: "#fbbf24",
  Rejected: "#f87171",
};
const STATUS_GRADIENT = {
  Confirmed: { top: "#86efac", bottom: "#16a34a" },
  Pending: { top: "#fde047", bottom: "#d97706" },
  Rejected: { top: "#fca5a5", bottom: "#dc2626" },
};
const PLACEHOLDER = "rgba(255,255,255,0.08)";
const ACCENT = "#8b5cf6";
const AMBER = "#f59e0b";

/** Faint upward-trend silhouette for empty Booking Trend state */
function TrendEmptyGraphic() {
  return (
    <svg
      width="160"
      height="72"
      viewBox="0 0 160 72"
      fill="none"
      aria-hidden
      style={{ opacity: 0.22, marginBottom: 4 }}
    >
      <path
        d="M4 56 C28 54, 36 48, 48 40 C64 28, 72 36, 88 30 C104 24, 112 14, 128 12 C140 10, 148 8, 156 6"
        stroke="rgba(167,139,250,0.9)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M4 56 C28 54, 36 48, 48 40 C64 28, 72 36, 88 30 C104 24, 112 14, 128 12 C140 10, 148 8, 156 6 V72 H4 Z"
        fill="url(#trendEmptyFill)"
      />
      <defs>
        <linearGradient id="trendEmptyFill" x1="80" y1="6" x2="80" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(139,92,246,0.35)" />
          <stop offset="1" stopColor="rgba(139,92,246,0)" />
        </linearGradient>
      </defs>
      {[
        [48, 40],
        [88, 30],
        [128, 12],
        [156, 6],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="rgba(196,181,253,0.85)" />
      ))}
    </svg>
  );
}

const SUMMARY_COPY = {
  Today: { title: "Today's Summary", subtitle: "Live snapshot for today", bookings: "Bookings today" },
  "This Week": { title: "This Week's Summary", subtitle: "Live snapshot for this week", bookings: "Bookings this week" },
  "This Month": { title: "This Month's Summary", subtitle: "Live snapshot for this month", bookings: "Bookings this month" },
  "All Time": { title: "All Time Summary", subtitle: "Live snapshot for all time", bookings: "Bookings" },
};

export default function Dashboard() {
  const bookings = useStore((s) => s.bookings);
  const slots = useStore((s) => s.slots);
  const leads = useStore((s) => s.leads);
  const cashLedger = useStore((s) => s.cashLedger);
  const storeInvoices = useStore((s) => s.invoices);
  const loading = useStore((s) => s.loading);
  const { theme: t } = useTheme();
  const navigate = useNavigate();

  const [range, setRange] = useState("All Time");
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    getInvoices()
      .then((data) => setInvoices(Array.isArray(data) ? data : []))
      .catch(() => setInvoices([]));
  }, []);

  if (loading) return <HourglassLoader />;

  const filtered = bookings.filter((b) => inRange(b.Date, range));
  const confirmed = filtered.filter((b) => b.Status === "Confirmed").length;
  const pending = filtered.filter((b) => b.Status === "Pending").length;
  const rejected = filtered.filter((b) => b.Status === "Rejected").length;
  const available = slots.filter((s) => s.Status === "Available").length;
  const revenue = filtered
    .filter((b) => b.Status === "Confirmed")
    .reduce((s, b) => s + (SERVICE_PRICES[b.Service] || 0), 0);

  const summaryBookings = filtered.length;
  const unpaidInvoices = invoices.filter(
    (i) => i.status === "unpaid" && inRange(i.created_at, range)
  ).length;
  const summaryLeads = leads.filter((l) => inRange(l.created_at, range)).length;
  const summaryCopy = SUMMARY_COPY[range] || SUMMARY_COPY["All Time"];

  const needsAttention = bookings.filter(isStalePending).length;

  // All-time cash on hand for compact summary (ledger + paid invoices)
  const invForCash = (storeInvoices?.length ? storeInvoices : invoices) || [];
  const cashOnHand =
    (cashLedger || []).reduce((s, e) => s + Number(e.amount || 0), 0) +
    invForCash.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount || 0), 0);

  const statusCounts = [
    { name: "Confirmed", value: confirmed, color: STATUS_COLORS.Confirmed },
    { name: "Pending", value: pending, color: STATUS_COLORS.Pending },
    { name: "Rejected", value: rejected, color: STATUS_COLORS.Rejected },
  ].filter((d) => d.value > 0);

  // Single-status donut: gray remainder for visual split (hidden from legend/tooltip)
  let pieData = statusCounts;
  if (statusCounts.length === 1) {
    const only = statusCounts[0];
    pieData = [
      only,
      { name: "", value: Math.max(Math.round(only.value * 0.28), 1), color: PLACEHOLDER, placeholder: true },
    ];
  }

  const byDate = {};
  filtered.forEach((b) => {
    byDate[b.Date] = (byDate[b.Date] || 0) + 1;
  });
  const lineData = Object.entries(byDate)
    .sort()
    .slice(-10)
    .map(([date, count]) => ({ date: date.slice(-5), count }));

  const trendReady = filtered.length >= 3 && lineData.length >= 2;
  const singlePoint = lineData.length === 1;
  const statusTotal = statusCounts.reduce((s, d) => s + d.value, 0);

  const panel = premiumCardStyle(t);
  const TH = {
    padding: "10px 12px",
    fontSize: 11,
    fontWeight: 700,
    color: t.thColor,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "left",
    background: t.thBg,
    borderBottom: `1px solid ${t.borderSub}`,
  };
  const TD = { padding: "12px 12px", fontSize: 13, color: t.tdColor, borderBottom: `1px solid ${t.borderSub}` };
  const tip = {
    contentStyle: {
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      background: t.cardBg,
      color: t.textPrimary,
      boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
      fontSize: 13,
    },
  };

  const rangeActive = {
    background: "linear-gradient(90deg, rgba(139,92,246,0.18), rgba(139,92,246,0.06))",
    color: t.textPrimary,
    border: "1px solid rgba(139,92,246,0.35)",
    boxShadow: "0 0 16px rgba(139,92,246,0.18)",
  };

  return (
    <div style={{ padding: "20px 16px", maxWidth: 1400 }}>
      <style>{`
        @media(max-width:768px){
          .dash-header{flex-direction:column!important;gap:12px!important}
          .dash-ranges{flex-wrap:wrap!important;gap:6px!important}
          .dash-statgrid{grid-template-columns:1fr 1fr!important}
          .dash-chartgrid{grid-template-columns:1fr!important}
          .dash-table th:nth-child(3),.dash-table td:nth-child(3),
          .dash-table th:nth-child(4),.dash-table td:nth-child(4){display:none}
        }
        @media(min-width:769px){
          .dash-statgrid{grid-template-columns:repeat(4,1fr)!important}
          .dash-chartgrid{grid-template-columns:1fr 1fr 280px!important}
        }
        .dash-table tbody tr.dash-row {
          transition: background 160ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .dash-table tbody tr.dash-row:hover {
          background: ${t.rowHover};
        }
      `}</style>

      <div className="dash-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 16 }}>
        <div style={{ minWidth: 0, paddingLeft: 2 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, letterSpacing: -0.6, margin: 0, lineHeight: 1.25 }}>Dashboard</h1>
          <p style={{ color: t.textSecondary, fontSize: 13, marginTop: 5 }}>Welcome back — here is what is happening</p>
        </div>
        <div className="dash-ranges" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {DATE_RANGES.map((r) => (
            <button
              key={r}
              className="ui-interactive"
              onClick={() => setRange(r)}
              style={{
                padding: "7px 12px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: range === r ? rangeActive.background : "transparent",
                color: range === r ? rangeActive.color : t.textSecondary,
                border: range === r ? rangeActive.border : `1px solid ${t.border}`,
                boxShadow: range === r ? rangeActive.boxShadow : "none",
                whiteSpace: "nowrap",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {needsAttention > 0 && (
        <button
          type="button"
          className="ui-interactive"
          onClick={() => navigate("/bookings")}
          style={{
            ...panel,
            width: "100%",
            textAlign: "left",
            marginBottom: 16,
            padding: "14px 18px",
            cursor: "pointer",
            border: "1px solid rgba(245,158,11,0.35)",
            boxShadow: `${t.cardShadow}, 0 0 24px rgba(245,158,11,0.18)`,
            background:
              t.name === "dark"
                ? "linear-gradient(90deg, rgba(245,158,11,0.14), rgba(245,158,11,0.04))"
                : "linear-gradient(90deg, rgba(245,158,11,0.12), rgba(255,255,255,0.6))",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: AMBER }}>
            {needsAttention} booking{needsAttention === 1 ? "" : "s"} need attention
          </div>
          <div style={{ fontSize: 12, color: t.textMuted, marginTop: 3 }}>
            Pending for 4+ hours — tap to review
          </div>
        </button>
      )}

      <div
        style={{
          ...panel,
          padding: "18px 20px",
          marginBottom: 20,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.textPrimary, marginBottom: 2 }}>{summaryCopy.title}</div>
          <div style={{ fontSize: 12, color: t.textMuted }}>{summaryCopy.subtitle}</div>
        </div>
        <button type="button" className="ui-interactive" onClick={() => navigate("/bookings")} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, letterSpacing: -0.4, fontVariantNumeric: "tabular-nums" }}>{summaryBookings}</div>
          <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>{summaryCopy.bookings}</div>
        </button>
        <button type="button" className="ui-interactive" onClick={() => navigate("/invoices")} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, letterSpacing: -0.4, fontVariantNumeric: "tabular-nums" }}>{unpaidInvoices}</div>
          <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Unpaid invoices</div>
        </button>
        <button type="button" className="ui-interactive" onClick={() => navigate("/leads")} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, letterSpacing: -0.4, fontVariantNumeric: "tabular-nums" }}>{summaryLeads}</div>
          <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Leads</div>
        </button>
        <button type="button" className="ui-interactive" onClick={() => navigate("/cash")} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, letterSpacing: -0.4, fontVariantNumeric: "tabular-nums" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, marginRight: 4 }}>Rs</span>
            {cashOnHand.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Cash on hand</div>
          <div style={{ fontSize: 11, color: t.accent, fontWeight: 600, marginTop: 4 }}>Log entry →</div>
        </button>
      </div>

      <div className="dash-statgrid" style={{ display: "grid", gap: 12, marginBottom: 20 }}>
        <StatCard
          label="Total Bookings"
          value={filtered.length}
          icon={<StatIconBookings />}
          gradient="linear-gradient(145deg,#8b5cf6,#6d28d9)"
          iconShadow="0 0 18px rgba(139,92,246,0.28), 0 0 6px rgba(139,92,246,0.35) inset"
          glow="0 0 18px rgba(139,92,246,0.12)"
          onClick={() => navigate("/bookings")}
        />
        <StatCard
          label="Total Leads"
          value={leads.length}
          icon={<StatIconLeads />}
          gradient="linear-gradient(145deg,#f43f5e,#be123c)"
          iconShadow="0 0 18px rgba(244,63,94,0.28), 0 0 6px rgba(244,63,94,0.35) inset"
          glow="0 0 18px rgba(244,63,94,0.12)"
          onClick={() => navigate("/leads")}
        />
        <StatCard
          label="Available Slots"
          value={available}
          icon={<StatIconSlots />}
          gradient="linear-gradient(145deg,#22c55e,#15803d)"
          iconShadow="0 0 18px rgba(34,197,94,0.28), 0 0 6px rgba(34,197,94,0.35) inset"
          glow="0 0 18px rgba(34,197,94,0.12)"
          onClick={() => navigate("/slots")}
        />
        <StatCard
          label="Est. Revenue"
          value={revenue.toLocaleString()}
          valuePrefix="Rs"
          stackPrefix
          icon={<StatIconRevenue />}
          gradient="linear-gradient(145deg,#10b981,#047857)"
          iconShadow="0 0 18px rgba(16,185,129,0.28), 0 0 6px rgba(16,185,129,0.35) inset"
          glow="0 0 18px rgba(16,185,129,0.12)"
          sub={confirmed + " confirmed"}
        />
      </div>

      <div className="dash-chartgrid" style={{ display: "grid", gap: 16, marginBottom: 20 }}>
        <div style={{ ...panel, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: t.textPrimary, marginBottom: 16 }}>Booking Trend</div>
          {!trendReady ? (
            <div
              style={{
                height: 180,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                color: t.textMuted,
                fontSize: 13,
                position: "relative",
              }}
            >
              <TrendEmptyGraphic />
              <div style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, position: "relative" }}>
                Not enough data yet
              </div>
              {singlePoint && filtered.length > 0 ? (
                <div style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                  {lineData[0].count} booking{lineData[0].count === 1 ? "" : "s"} on {lineData[0].date}
                </div>
              ) : (
                <div style={{ fontSize: 12 }}>Need at least 3 bookings across 2+ days</div>
              )}
            </div>
          ) : (
            <div style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.35))" }}>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.borderSub} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: t.textMuted }} axisLine={false} tickLine={false} />
                  <YAxis
                    allowDecimals={false}
                    domain={[0, (max) => Math.max(max, 2)]}
                    tick={{ fontSize: 10, fill: t.textMuted }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip {...tip} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={ACCENT}
                    strokeWidth={2.5}
                    dot={{ fill: ACCENT, r: 5, strokeWidth: 0, filter: "drop-shadow(0 0 4px rgba(139,92,246,0.6))" }}
                    activeDot={{ r: 7, strokeWidth: 0, fill: "#a78bfa" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div style={{ ...panel, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: t.textPrimary, marginBottom: 16 }}>Status Overview</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[{ Confirmed: confirmed, Pending: pending, Rejected: rejected }]} barSize={40}>
              <defs>
                {Object.entries(STATUS_GRADIENT).map(([key, g]) => (
                  <linearGradient key={key} id={`barGrad${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={g.top} />
                    <stop offset="100%" stopColor={g.bottom} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.borderSub} vertical={false} />
              <XAxis hide />
              <YAxis
                tick={{ fontSize: 11, fill: t.textMuted }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                domain={[0, (max) => Math.max(max, 1)]}
              />
              <Tooltip {...tip} />
              <Bar dataKey="Confirmed" fill="url(#barGradConfirmed)" radius={[4, 4, 0, 0]} minPointSize={4} />
              <Bar dataKey="Pending" fill="url(#barGradPending)" radius={[4, 4, 0, 0]} minPointSize={4} />
              <Bar dataKey="Rejected" fill="url(#barGradRejected)" radius={[4, 4, 0, 0]} minPointSize={4} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            {[
              [STATUS_COLORS.Confirmed, "Confirmed", confirmed],
              [STATUS_COLORS.Pending, "Pending", pending],
              [STATUS_COLORS.Rejected, "Rejected", rejected],
            ].map(([c, l, v]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: t.textSecondary, fontVariantNumeric: "tabular-nums" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: "inline-block" }} />
                {l}: <strong style={{ color: t.textPrimary, marginLeft: 3 }}>{v}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...panel, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: t.textPrimary, marginBottom: 6 }}>Status Split</div>
          {statusCounts.length > 0 ? (
            <div style={{ filter: statusCounts[0]?.name === "Confirmed" ? "drop-shadow(0 0 8px rgba(74,222,128,0.4))" : "drop-shadow(0 0 6px rgba(139,92,246,0.3))" }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    {...tip}
                    formatter={(v, n, item) => (item?.payload?.placeholder || !n ? [null, null] : [v, n])}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, color: t.textSecondary, fontVariantNumeric: "tabular-nums" }}
                    payload={statusCounts.map((d) => {
                      const pct = statusTotal > 0 ? Math.round((d.value / statusTotal) * 100) : 0;
                      return {
                        value: `${d.name} · ${pct}%`,
                        type: "circle",
                        color: d.color,
                        id: d.name,
                      };
                    })}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: t.textMuted, fontSize: 13 }}>
              No data yet
            </div>
          )}
        </div>
      </div>

      <div style={{ ...panel, overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 16px",
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, color: t.textPrimary }}>Recent Bookings</div>
          <button
            className="ui-interactive"
            onClick={() => exportToCSV(filtered, "bookings.csv")}
            style={{
              padding: "7px 14px",
              borderRadius: 9,
              border: `1px solid ${t.border}`,
              background: "transparent",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              color: t.textSecondary,
              transition: "background 150ms cubic-bezier(0.16, 1, 0.3, 1), border-color 150ms cubic-bezier(0.16, 1, 0.3, 1), color 150ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(139,92,246,0.1)";
              e.currentTarget.style.borderColor = "rgba(139,92,246,0.35)";
              e.currentTarget.style.color = t.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = t.border;
              e.currentTarget.style.color = t.textSecondary;
            }}
          >
            Export
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="dash-table data-table" style={{ width: "100%", minWidth: 320 }}>
            <thead>
              <tr>
                {["Name", "Service", "Date", "Time", "Status"].map((h) => (
                  <th key={h} style={TH}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: t.textMuted, fontSize: 14 }}>
                    No bookings in this range
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 6).map((b, i) => (
                  <tr key={i} className="dash-row">
                    <td style={{ ...TD, fontWeight: 600 }}>{b.Name}</td>
                    <td style={TD}>{b.Service}</td>
                    <td style={{ ...TD, fontVariantNumeric: "tabular-nums" }}>{formatDate(b.Date)}</td>
                    <td style={{ ...TD, fontVariantNumeric: "tabular-nums" }}>{b.Time}</td>
                    <td style={TD}>
                      <StatusBadge status={b.Status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
