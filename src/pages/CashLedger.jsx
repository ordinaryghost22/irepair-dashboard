import { useState } from "react";
import { useStore } from "../store/useStore";
import { useTheme, cardStyle } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import HourglassLoader from "../components/HourglassLoader";
import { formatDate, inRange } from "../utils/format";
import { DATE_RANGES, CASH_ENTRY_TYPES, CASH_ENTRY_COLORS } from "../constants";
import { StatIconCash, StatIconRevenue } from "../components/icons";

const TYPE_FILTERS = [
  { value: "All", label: "All" },
  ...CASH_ENTRY_TYPES.map((t) => ({ value: t.value, label: t.label })),
];

function EntryTypeBadge({ type }) {
  const cfg = CASH_ENTRY_COLORS[type] || {
    bg: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.6)",
    border: "rgba(255,255,255,0.12)",
    label: type || "—",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

function formatAmount(n) {
  const num = Number(n) || 0;
  const abs = Math.abs(num).toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (num > 0) return `+₨${abs}`;
  if (num < 0) return `−₨${abs}`;
  return `₨${abs}`;
}

function formatRs(n) {
  return Math.abs(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function CashLedger() {
  const cashLedger = useStore((s) => s.cashLedger);
  const invoices = useStore((s) => s.invoices);
  const loading = useStore((s) => s.loading);
  const addCashLedgerEntry = useStore((s) => s.addCashLedgerEntry);
  const { theme: t } = useTheme();
  const { showToast } = useToast();

  const [range, setRange] = useState("All Time");
  const [typeFilter, setTypeFilter] = useState("All");
  const [cashAmount, setCashAmount] = useState("");
  const [cashReason, setCashReason] = useState("");
  const [cashType, setCashType] = useState("expense");
  const [cashSaving, setCashSaving] = useState(false);

  async function handleCashSave() {
    const amount = Number(cashAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Enter a positive amount", "error");
      return;
    }
    if (!cashReason.trim()) {
      showToast("Reason is required", "error");
      return;
    }
    setCashSaving(true);
    try {
      const saved = await addCashLedgerEntry({
        amount,
        entry_type: cashType,
        reason: cashReason.trim(),
      });
      if (!saved?.id) {
        throw new Error("Save succeeded but no entry was returned — check the cash_ledger table");
      }
      setCashAmount("");
      setCashReason("");
      // Reset type filter so the new row is visible
      setTypeFilter("All");
      showToast("Cash entry saved");
    } catch (err) {
      console.error("Cash ledger save failed:", err);
      const msg = err?.message || "Failed to save entry";
      if (err?.status === 404 || /404|Not Found/i.test(msg)) {
        showToast("Cash ledger API not found — deploy backend with /cash-ledger and run migration 007", "error");
      } else {
        showToast(msg, "error");
      }
    } finally {
      setCashSaving(false);
    }
  }

  if (loading && (!cashLedger || cashLedger.length === 0)) {
    return <HourglassLoader />;
  }

  const inDateRange = (entries) =>
    (entries || []).filter((e) => inRange(e.created_at, range));

  const ranged = inDateRange(cashLedger);
  const filtered = ranged.filter((e) =>
    typeFilter === "All" ? true : e.entry_type === typeFilter
  );

  // Stats for selected date range
  const drops = ranged
    .filter((e) => e.entry_type === "cash_drop")
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const expenses = ranged
    .filter((e) => e.entry_type === "expense")
    .reduce((s, e) => s + Math.abs(Number(e.amount || 0)), 0);
  const payouts = ranged
    .filter((e) => e.entry_type === "payout")
    .reduce((s, e) => s + Math.abs(Number(e.amount || 0)), 0);
  const ledgerNet = ranged.reduce((s, e) => s + Number(e.amount || 0), 0);
  const paidInRange = (invoices || [])
    .filter((i) => i.status === "paid" && inRange(i.created_at, range))
    .reduce((s, i) => s + Number(i.amount || 0), 0);
  // Known simplification: payment method is not tracked separately from "paid".
  const cashOnHand = ledgerNet + paidInRange;

  const panel = cardStyle(t);
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
  const TD = {
    padding: "12px 12px",
    fontSize: 13,
    color: t.tdColor,
    borderBottom: `1px solid ${t.borderSub}`,
  };

  const pillActive = {
    background: "linear-gradient(90deg, rgba(139,92,246,0.18), rgba(139,92,246,0.06))",
    color: t.textPrimary,
    border: "1px solid rgba(139,92,246,0.35)",
    boxShadow: "0 0 16px rgba(139,92,246,0.18)",
  };

  const pill = (active) => ({
    padding: "7px 12px",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    background: active ? pillActive.background : "transparent",
    color: active ? pillActive.color : t.textSecondary,
    border: active ? pillActive.border : `1px solid ${t.border}`,
    boxShadow: active ? pillActive.boxShadow : "none",
  });

  const cashInput = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 13,
    background: t.inputBg || "rgba(255,255,255,0.04)",
    border: `1px solid ${t.border}`,
    color: t.textPrimary,
    outline: "none",
  };

  const typeBtn = (value) => {
    const active = cashType === value;
    const colors = CASH_ENTRY_COLORS[value];
    return {
      flex: 1,
      padding: "10px 8px",
      borderRadius: 10,
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      border: `1px solid ${active ? colors.border : t.border}`,
      background: active ? colors.bg : "transparent",
      color: active ? colors.color : t.textSecondary,
      boxShadow: active ? `0 0 14px ${colors.border}` : "none",
    };
  };

  return (
    <div style={{ padding: "20px 16px", maxWidth: 1100, animation: "fadeIn .3s ease" }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:768px){
          .cash-header{flex-direction:column!important;gap:10px!important;align-items:stretch!important}
          .cash-pills{flex-wrap:wrap!important}
          .cash-statgrid{grid-template-columns:1fr 1fr!important}
          .cash-table th:nth-child(5),.cash-table td:nth-child(5){display:none}
        }
        @media(min-width:769px){
          .cash-statgrid{grid-template-columns:repeat(4,1fr)!important}
        }
      `}</style>

      <div className="cash-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, letterSpacing: -0.6, margin: 0 }}>
            Cash Ledger
          </h1>
          <p style={{ color: t.textSecondary, fontSize: 13, marginTop: 4 }}>
            Drops, expenses, and payouts — newest first
          </p>
        </div>
        <div className="cash-pills" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {DATE_RANGES.map((r) => (
            <button key={r} type="button" className="ui-interactive" onClick={() => setRange(r)} style={pill(range === r)}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          ...panel,
          padding: "14px 16px",
          marginBottom: 12,
          boxShadow: `${t.cardShadow}, 0 0 24px rgba(245,158,11,0.12)`,
          border: `1px solid rgba(245,158,11,0.22)`,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary, marginBottom: 2 }}>Log cash / expense</div>
        <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 10 }}>Cash drop adds; expense &amp; payout subtract</div>
        <div style={{ display: "grid", gap: 10 }}>
          <input
            type="number"
            min="0"
            step="1"
            placeholder="Amount"
            value={cashAmount}
            onChange={(e) => setCashAmount(e.target.value)}
            style={cashInput}
          />
          <div style={{ display: "flex", gap: 8 }} role="group" aria-label="Entry type">
            {CASH_ENTRY_TYPES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="ui-interactive"
                onClick={() => setCashType(opt.value)}
                style={typeBtn(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Reason"
            value={cashReason}
            onChange={(e) => setCashReason(e.target.value)}
            style={cashInput}
          />
          <button
            type="button"
            className="ui-interactive"
            disabled={cashSaving}
            onClick={handleCashSave}
            style={{
              padding: "11px 16px",
              borderRadius: 11,
              border: "none",
              cursor: cashSaving ? "wait" : "pointer",
              fontWeight: 700,
              fontSize: 13,
              color: "#fff",
              background: "linear-gradient(145deg,#f59e0b,#d97706)",
              boxShadow: "0 0 24px rgba(245,158,11,0.35)",
              opacity: cashSaving ? 0.7 : 1,
            }}
          >
            {cashSaving ? "Saving…" : "Save entry"}
          </button>
        </div>
      </div>

      <div className="cash-statgrid" style={{ display: "grid", gap: 10, marginBottom: 10 }}>
        <StatCard
          label="Cash on hand"
          value={formatRs(cashOnHand)}
          valuePrefix="Rs"
          stackPrefix
          icon={<StatIconCash />}
          gradient="linear-gradient(145deg,#10b981,#047857)"
          iconShadow="0 0 32px rgba(16,185,129,0.35), 0 0 8px rgba(16,185,129,0.45) inset"
          glow="0 0 28px rgba(16,185,129,0.18)"
          sub={`${range} · ledger + paid invoices`}
        />
        <StatCard
          label="Cash drops"
          value={formatRs(drops)}
          valuePrefix="Rs"
          stackPrefix
          icon={<StatIconRevenue />}
          gradient="linear-gradient(145deg,#22c55e,#15803d)"
          iconShadow="0 0 32px rgba(34,197,94,0.35), 0 0 8px rgba(34,197,94,0.45) inset"
          glow="0 0 28px rgba(34,197,94,0.16)"
          sub={range}
        />
        <StatCard
          label="Expenses"
          value={formatRs(expenses)}
          valuePrefix="Rs"
          stackPrefix
          icon={<StatIconCash />}
          gradient="linear-gradient(145deg,#f43f5e,#be123c)"
          iconShadow="0 0 32px rgba(244,63,94,0.35), 0 0 8px rgba(244,63,94,0.45) inset"
          glow="0 0 28px rgba(244,63,94,0.16)"
          sub={range}
        />
        <StatCard
          label="Payouts"
          value={formatRs(payouts)}
          valuePrefix="Rs"
          stackPrefix
          icon={<StatIconCash />}
          gradient="linear-gradient(145deg,#f59e0b,#d97706)"
          iconShadow="0 0 32px rgba(245,158,11,0.35), 0 0 8px rgba(245,158,11,0.45) inset"
          glow="0 0 28px rgba(245,158,11,0.16)"
          sub={range}
        />
      </div>
      <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 12, lineHeight: 1.4 }}>
        Payment method (cash vs digital) is not tracked separately — known simplification.
      </div>

      <div className="cash-pills" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className="ui-interactive"
            onClick={() => setTypeFilter(f.value)}
            style={pill(typeFilter === f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          compact
          icon="₨"
          title="No ledger entries"
          subtitle="Use the form above to log a cash drop, expense, or payout"
        />
      ) : (
        <div style={{ ...panel, overflow: "hidden", padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table className="cash-table data-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
              <thead>
                <tr>
                  {["Date", "Type", "Amount", "Reason", "Logged by"].map((h) => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const amt = Number(e.amount) || 0;
                  return (
                    <tr
                      key={e.id}
                      style={{ transition: "background .12s" }}
                      onMouseEnter={(ev) => { ev.currentTarget.style.background = t.rowHover; }}
                      onMouseLeave={(ev) => { ev.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={{ ...TD, color: t.textMuted, fontSize: 12, whiteSpace: "nowrap" }}>
                        {formatDate(e.created_at)}
                        <div style={{ fontSize: 11, marginTop: 2, opacity: 0.8 }}>
                          {e.created_at ? new Date(e.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </td>
                      <td style={TD}>
                        <EntryTypeBadge type={e.entry_type} />
                      </td>
                      <td
                        style={{
                          ...TD,
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                          color: amt > 0 ? "#4ade80" : amt < 0 ? "#f87171" : t.textPrimary,
                        }}
                      >
                        {formatAmount(amt)}
                      </td>
                      <td style={{ ...TD, maxWidth: 280 }}>{e.reason || "—"}</td>
                      <td style={{ ...TD, color: t.textMuted, fontSize: 12 }}>{e.logged_by || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
