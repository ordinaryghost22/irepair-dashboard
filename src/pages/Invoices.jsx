import { useState, useEffect } from "react";
import { useTheme, primaryBtnStyle, secondaryBtnStyle } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import Skeleton from "../components/Skeleton";
import { formatDate } from "../utils/format";
import {
  getInvoices,
  updateInvoiceStatus,
  downloadInvoicePdf,
} from "../api";

function formatRs(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "₨0";
  return `₨${num.toLocaleString()}`;
}

function InvoiceStatusBadge({ status }) {
  const paid = status === "paid";
  const cfg = paid
    ? { bg: "rgba(34,197,94,0.12)", color: "#4ade80", border: "rgba(34,197,94,0.22)", dot: "#22c55e", label: "Paid" }
    : { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.22)", dot: "#f59e0b", label: "Unpaid" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

export default function Invoices() {
  const { theme: t } = useTheme();
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      const data = await getInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load invoices", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const outstanding = invoices
    .filter((i) => i.status === "unpaid")
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const filtered = invoices.filter((i) => {
    if (filter === "All") return true;
    return i.status === filter.toLowerCase();
  });

  async function toggleStatus(inv) {
    const next = inv.status === "paid" ? "unpaid" : "paid";
    setBusyId(inv.id);
    try {
      const updated = await updateInvoiceStatus(inv.id, next);
      setInvoices((list) => list.map((i) => (i.id === inv.id ? { ...i, ...updated } : i)));
      showToast(`Invoice marked ${next}`);
    } catch (err) {
      console.error(err);
      showToast("Failed to update status", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDownload(inv) {
    setBusyId(inv.id);
    try {
      await downloadInvoicePdf(inv.id, `${inv.invoice_number || "invoice"}.pdf`);
    } catch (err) {
      console.error(err);
      showToast("Failed to download PDF", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <Skeleton rows={6} />;

  const TH = {
    padding: "10px 12px",
    fontSize: 11,
    fontWeight: 600,
    color: t.thColor,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "left",
    background: "transparent",
    borderBottom: `1px solid ${t.border}`,
  };
  const TD = {
    padding: "12px 12px",
    fontSize: 13,
    color: t.tdColor,
  };

  return (
    <div style={{ padding: "20px 16px", maxWidth: 1400 }}>
      <style>{`
        @media(max-width:768px){
          .inv-header{flex-direction:column!important;gap:10px!important;align-items:flex-start!important}
          .inv-table th:nth-child(3),.inv-table td:nth-child(3),
          .inv-table th:nth-child(4),.inv-table td:nth-child(4){display:none}
        }
      `}</style>

      <div className="inv-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: t.textPrimary, letterSpacing: -0.6, margin: 0 }}>Invoices</h1>
          <p style={{ color: t.textSecondary, fontSize: 13, marginTop: 5 }}>
            {invoices.length} total · {invoices.filter((i) => i.status === "unpaid").length} unpaid
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div
          style={{
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderTop: `1px solid ${t.borderTopHighlight}`,
            borderRadius: 16,
            padding: "18px 20px",
            boxShadow: t.cardShadow,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.7 }}>
            Outstanding (unpaid)
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: t.textPrimary, marginTop: 6, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums" }}>
            {formatRs(outstanding)}
          </div>
        </div>
        <div
          style={{
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderTop: `1px solid ${t.borderTopHighlight}`,
            borderRadius: 16,
            padding: "18px 20px",
            boxShadow: t.cardShadow,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.7 }}>
            All invoices
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: t.textPrimary, marginTop: 6, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums" }}>
            {formatRs(invoices.reduce((s, i) => s + (Number(i.amount) || 0), 0))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {["All", "Unpaid", "Paid"].map((s) => (
          <button
            key={s}
            className="ui-interactive"
            onClick={() => setFilter(s)}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              background: filter === s ? "rgba(255,255,255,0.06)" : "transparent",
              color: filter === s ? t.textPrimary : t.textSecondary,
              border: `1px solid ${filter === s ? t.borderHover : t.border}`,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🧾" title="No invoices yet" subtitle="Mark a booking as Completed to generate an invoice" />
      ) : (
        <div
          style={{
            background: t.cardBg,
            borderRadius: 16,
            border: `1px solid ${t.border}`,
            borderTop: `1px solid ${t.borderTopHighlight}`,
            boxShadow: t.cardShadow,
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table className="inv-table data-table" style={{ width: "100%", minWidth: 520 }}>
              <thead>
                <tr>
                  {["Invoice #", "Customer", "Service", "Device", "Amount", "Date", "Status", "Actions"].map((h) => (
                    <th key={h} style={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="list-stagger-rows">
                {filtered.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ ...TD, fontFamily: "monospace", fontSize: 12, fontWeight: 600 }}>{inv.invoice_number}</td>
                    <td style={{ ...TD, fontWeight: 600 }}>{inv.customer_name || "—"}</td>
                    <td style={TD}>{inv.service || "—"}</td>
                    <td style={TD}>{inv.device || "—"}</td>
                    <td style={{ ...TD, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{formatRs(inv.amount)}</td>
                    <td style={{ ...TD, fontVariantNumeric: "tabular-nums" }}>{formatDate(inv.created_at)}</td>
                    <td style={TD}>
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td style={TD}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          className="ui-interactive"
                          disabled={busyId === inv.id}
                          onClick={() => toggleStatus(inv)}
                          style={{
                            ...(inv.status === "paid" ? secondaryBtnStyle(t) : primaryBtnStyle(t)),
                            padding: "6px 12px",
                            fontSize: 12,
                            borderRadius: 8,
                            opacity: busyId === inv.id ? 0.6 : 1,
                          }}
                        >
                          {inv.status === "paid" ? "Mark Unpaid" : "Mark Paid"}
                        </button>
                        <button
                          className="ui-interactive"
                          disabled={busyId === inv.id}
                          onClick={() => handleDownload(inv)}
                          style={{
                            ...secondaryBtnStyle(t),
                            padding: "6px 12px",
                            fontSize: 12,
                            borderRadius: 8,
                            opacity: busyId === inv.id ? 0.6 : 1,
                          }}
                        >
                          Download PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
