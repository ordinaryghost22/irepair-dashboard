import { useState, useEffect } from "react";
import { Download, Eye, Receipt } from "lucide-react";
import { useTheme, secondaryBtnStyle } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import Skeleton from "../components/Skeleton";
import { formatDate } from "../utils/format";
import { exportToCSV } from "../utils/export";
import {
  getInvoices,
  updateInvoiceStatus,
  downloadInvoicePdf,
  openInvoicePdf,
} from "../api";

function formatRs(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "₨0";
  return `₨${num.toLocaleString()}`;
}

/** INV-8E942B6F → #8E942B (scannable short id) */
function shortInvoiceId(id) {
  if (!id) return "—";
  const s = String(id).trim();
  const hex = s.match(/([A-Fa-f0-9]{6,})(?!.*[A-Fa-f0-9])/);
  if (hex) return `#${hex[1].slice(0, 6).toUpperCase()}`;
  const cleaned = s.replace(/^(INV|INVOICE)[-_]?/i, "");
  if (cleaned.length <= 8) return cleaned;
  return `#${cleaned.slice(-6).toUpperCase()}`;
}

function EmptyCell({ children }) {
  const empty = children == null || children === "" || children === "—";
  return (
    <span style={{ color: empty ? "rgba(255,255,255,0.28)" : undefined }}>
      {empty ? "—" : children}
    </span>
  );
}

function InvoiceStatusBadge({ status, onClick, busy }) {
  const paid = status === "paid";
  const cfg = paid
    ? { bg: "rgba(34,197,94,0.12)", color: "#4ade80", border: "rgba(34,197,94,0.22)", dot: "#22c55e", label: "Paid" }
    : { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.22)", dot: "#f59e0b", label: "Unpaid" };
  return (
    <button
      type="button"
      className="ui-interactive inv-status-badge"
      onClick={onClick}
      disabled={busy}
      title={paid ? "Click to mark unpaid" : "Click to mark paid"}
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
        cursor: busy ? "wait" : "pointer",
        opacity: busy ? 0.6 : 1,
        transition:
          "transform 160ms cubic-bezier(0.16, 1, 0.3, 1), opacity 160ms ease, background 160ms ease, border-color 160ms ease, color 160ms ease",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
      {cfg.label}
    </button>
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

  const allTotal = invoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);

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

  async function handlePreview(inv) {
    setBusyId(inv.id);
    try {
      await openInvoicePdf(inv.id);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to open PDF", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <Skeleton rows={6} />;

  const TH = {
    padding: "12px 14px",
    fontSize: 11,
    fontWeight: 600,
    color: t.thColor,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "left",
    background: "transparent",
    borderBottom: `1px solid ${t.border}`,
    whiteSpace: "nowrap",
  };
  const TD = {
    padding: "14px 14px",
    fontSize: 13,
    color: t.tdColor,
    verticalAlign: "middle",
  };
  const outstandingColor =
    outstanding > 0 ? "#f59e0b" : "rgba(255,255,255,0.45)";

  return (
    <div style={{ padding: "20px 16px", maxWidth: 1400 }}>
      <style>{`
        @media(max-width:768px){
          .inv-header{flex-direction:column!important;gap:10px!important;align-items:flex-start!important}
          .inv-table th:nth-child(3),.inv-table td:nth-child(3),
          .inv-table th:nth-child(4),.inv-table td:nth-child(4){display:none}
        }
        .inv-table tbody tr.inv-row {
          transition: background 160ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .inv-table tbody tr.inv-row:hover {
          background: rgba(255,255,255,0.02);
        }
        .inv-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: rgba(255,255,255,0.28);
          cursor: pointer;
          opacity: 0.35;
          transition: opacity 160ms cubic-bezier(0.16, 1, 0.3, 1), color 160ms ease, background 160ms ease;
        }
        .inv-row:hover .inv-icon-btn {
          opacity: 1;
          color: rgba(255,255,255,0.7);
        }
        .inv-icon-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.92);
        }
        .inv-icon-btn:disabled {
          cursor: wait;
          opacity: 0.4;
        }
        .inv-status-badge:active:not(:disabled) {
          transform: scale(0.96);
        }
      `}</style>

      <div className="inv-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, letterSpacing: -0.6, margin: 0 }}>Invoices</h1>
          <p style={{ color: t.textSecondary, fontSize: 13, marginTop: 5 }}>
            {invoices.length} total · {invoices.filter((i) => i.status === "unpaid").length} unpaid
          </p>
        </div>
        <button
          className="ui-interactive"
          onClick={() => {
            const rows = filtered.map((inv) => ({
              "Invoice #": inv.invoice_number,
              Customer: inv.customer_name || inv.Name || "",
              Service: inv.service || inv.Service || "",
              Device: inv.device || inv.Device || "",
              Amount: inv.amount,
              Date: inv.created_at,
              Status: inv.status,
              "Booking ID": inv.booking_id || "",
            }));
            exportToCSV(rows, "invoices.csv");
          }}
          style={{ ...secondaryBtnStyle(t), padding: "9px 16px", fontSize: 13, whiteSpace: "nowrap" }}
        >
          Export
        </button>
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
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: outstandingColor,
              marginTop: 6,
              letterSpacing: -0.5,
              fontVariantNumeric: "tabular-nums",
              transition: "color 200ms ease",
            }}
          >
            {formatRs(outstanding)}
          </div>
        </div>
        <div
          style={{
            background:
              "radial-gradient(circle at 90% 10%, rgba(139,92,246,0.14), transparent 55%), linear-gradient(180deg, #18181c 0%, #121214 100%)",
            border: `1px solid rgba(255,255,255,0.05)`,
            borderTop: `1px solid rgba(255,255,255,0.10)`,
            borderRadius: 16,
            padding: "18px 20px",
            boxShadow: t.cardShadow,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: 16,
              top: 16,
              opacity: 0.35,
              color: t.accent,
            }}
            aria-hidden
          >
            <Receipt size={22} strokeWidth={1.75} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.7 }}>
            All invoices
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: t.textPrimary,
              marginTop: 6,
              letterSpacing: -0.5,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatRs(allTotal)}
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
                {filtered.map((inv) => {
                  const fullNo = inv.invoice_number || "";
                  const busy = busyId === inv.id;
                  return (
                    <tr key={inv.id} className="inv-row">
                      <td
                        style={{
                          ...TD,
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          fontSize: 12,
                          fontWeight: 600,
                          color: t.textMuted,
                          letterSpacing: 0.3,
                          whiteSpace: "nowrap",
                        }}
                        title={fullNo || undefined}
                      >
                        {shortInvoiceId(fullNo)}
                      </td>
                      <td style={{ ...TD, fontWeight: 600, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <EmptyCell>{inv.customer_name}</EmptyCell>
                      </td>
                      <td style={{ ...TD, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <EmptyCell>{inv.service}</EmptyCell>
                      </td>
                      <td style={{ ...TD, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <EmptyCell>{inv.device}</EmptyCell>
                      </td>
                      <td
                        style={{
                          ...TD,
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatRs(inv.amount)}
                      </td>
                      <td style={{ ...TD, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                        {formatDate(inv.created_at)}
                      </td>
                      <td style={TD}>
                        <InvoiceStatusBadge
                          status={inv.status}
                          busy={busy}
                          onClick={() => toggleStatus(inv)}
                        />
                      </td>
                      <td style={TD}>
                        <div style={{ display: "flex", gap: 2, alignItems: "center", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="inv-icon-btn"
                            disabled={busy}
                            title="Preview PDF"
                            onClick={() => handlePreview(inv)}
                          >
                            <Eye size={16} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            className="inv-icon-btn"
                            disabled={busy}
                            title="Download PDF"
                            onClick={() => handleDownload(inv)}
                          >
                            <Download size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
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
