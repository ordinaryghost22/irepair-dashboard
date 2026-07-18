import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import HourglassLoader from "../components/HourglassLoader";
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

function InvoiceStatusBadge({ status, dark }) {
  const paid = status === "paid";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: paid
        ? (dark ? "rgba(34,197,94,0.15)" : "#dcfce7")
        : (dark ? "rgba(234,179,8,0.15)" : "#fef9c3"),
      color: paid
        ? (dark ? "#4ade80" : "#15803d")
        : (dark ? "#facc15" : "#a16207"),
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: paid ? "#22c55e" : "#eab308", display: "inline-block",
      }} />
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}

export default function Invoices() {
  const { theme: t, dark } = useTheme();
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

  useEffect(() => { load(); }, []);

  const outstanding = invoices
    .filter(i => i.status === "unpaid")
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const filtered = invoices.filter(i => {
    if (filter === "All") return true;
    return i.status === filter.toLowerCase();
  });

  async function toggleStatus(inv) {
    const next = inv.status === "paid" ? "unpaid" : "paid";
    setBusyId(inv.id);
    try {
      const updated = await updateInvoiceStatus(inv.id, next);
      setInvoices(list => list.map(i => i.id === inv.id ? { ...i, ...updated } : i));
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

  if (loading) return <HourglassLoader />;

  const TH = { padding: "10px 12px", fontSize: 11, fontWeight: 700, color: t.thColor, textTransform: "uppercase", letterSpacing: 0.8, textAlign: "left", background: t.thBg, borderBottom: `1px solid ${t.borderSub}` };
  const TD = { padding: "12px 12px", fontSize: 13, color: t.tdColor, borderBottom: `1px solid ${t.borderSub}` };

  return (
    <div style={{ padding: "20px 16px", maxWidth: 1400, animation: "fadeIn .3s ease" }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:768px){
          .inv-header{flex-direction:column!important;gap:10px!important;align-items:flex-start!important}
          .inv-table th:nth-child(3),.inv-table td:nth-child(3),
          .inv-table th:nth-child(4),.inv-table td:nth-child(4){display:none}
        }
      `}</style>

      <div className="inv-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, letterSpacing: -0.6, margin: 0 }}>Invoices</h1>
          <p style={{ color: t.textSecondary, fontSize: 13, marginTop: 5 }}>
            {invoices.length} total · {invoices.filter(i => i.status === "unpaid").length} unpaid
          </p>
        </div>
      </div>

      {/* Outstanding total */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20,
      }}>
        <div style={{
          background: dark ? "rgba(234,179,8,0.1)" : "#fffbeb",
          border: `1px solid ${dark ? "rgba(234,179,8,0.25)" : "#fde68a"}`,
          borderRadius: 16, padding: "18px 20px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: dark ? "#facc15" : "#a16207", textTransform: "uppercase", letterSpacing: 0.7 }}>
            Outstanding (unpaid)
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: t.textPrimary, marginTop: 6, letterSpacing: -0.5 }}>
            {formatRs(outstanding)}
          </div>
        </div>
        <div style={{
          background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: "18px 20px", boxShadow: t.cardShadow,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.7 }}>
            All invoices
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: t.textPrimary, marginTop: 6, letterSpacing: -0.5 }}>
            {formatRs(invoices.reduce((s, i) => s + (Number(i.amount) || 0), 0))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {["All", "Unpaid", "Paid"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: "9px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: filter === s ? "linear-gradient(135deg,#667eea,#764ba2)" : t.cardBg,
              color: filter === s ? "#fff" : t.textSecondary,
              border: filter === s ? "1px solid transparent" : `1px solid ${t.border}`,
              boxShadow: filter === s ? "0 4px 16px rgba(102,126,234,.3)" : "none",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🧾" title="No invoices yet" subtitle="Mark a booking as Completed to generate an invoice" />
      ) : (
        <div style={{ background: t.cardBg, borderRadius: 18, border: `1px solid ${t.border}`, boxShadow: t.cardShadow, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="inv-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
              <thead>
                <tr>
                  {["Invoice #", "Customer", "Service", "Device", "Amount", "Date", "Status", "Actions"].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr
                    key={inv.id}
                    style={{ transition: "background .12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ ...TD, fontFamily: "monospace", fontSize: 12, fontWeight: 600 }}>{inv.invoice_number}</td>
                    <td style={{ ...TD, fontWeight: 600 }}>{inv.customer_name || "—"}</td>
                    <td style={TD}>{inv.service || "—"}</td>
                    <td style={TD}>{inv.device || "—"}</td>
                    <td style={{ ...TD, fontWeight: 700 }}>{formatRs(inv.amount)}</td>
                    <td style={TD}>{formatDate(inv.created_at)}</td>
                    <td style={TD}><InvoiceStatusBadge status={inv.status} dark={dark} /></td>
                    <td style={TD}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          disabled={busyId === inv.id}
                          onClick={() => toggleStatus(inv)}
                          style={{
                            padding: "6px 12px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer",
                            background: inv.status === "paid"
                              ? (dark ? "rgba(234,179,8,0.15)" : "#fef9c3")
                              : (dark ? "rgba(34,197,94,0.15)" : "#dcfce7"),
                            color: inv.status === "paid" ? "#ca8a04" : "#16a34a",
                            opacity: busyId === inv.id ? 0.6 : 1,
                          }}
                        >
                          {inv.status === "paid" ? "Mark Unpaid" : "Mark Paid"}
                        </button>
                        <button
                          disabled={busyId === inv.id}
                          onClick={() => handleDownload(inv)}
                          style={{
                            padding: "6px 12px", borderRadius: 8, border: `1px solid ${t.border}`,
                            background: t.cardBg2, color: t.textSecondary, fontWeight: 700, fontSize: 12, cursor: "pointer",
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
