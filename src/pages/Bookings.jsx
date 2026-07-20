import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useStore } from "../store/useStore";
import { useTheme, primaryBtnStyle, secondaryBtnStyle } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import Skeleton from "../components/Skeleton";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import CustomerHistory from "../components/CustomerHistory";
import ConversationHistory from "../components/ConversationHistory";
import { exportToCSV } from "../utils/export";
import { formatDate, formatPhone, whatsappLink, phoneKey } from "../utils/format";
import { isStalePending } from "../utils/sla";
import { getCustomerTier } from "../utils/customerTier";
import { PaymentStatCards, PaymentStatusCycler } from "../components/PaymentStatus";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import { completeBookingWithInvoice, updateBooking } from "../api";

/** CUST-8E942B6F → #8E942B */
function shortBookingId(id) {
  if (!id) return "—";
  const s = String(id).trim();
  const hex = s.match(/([A-Fa-f0-9]{6,})(?!.*[A-Fa-f0-9])/);
  if (hex) return `#${hex[1].slice(0, 6).toUpperCase()}`;
  const cleaned = s.replace(/^(CUST|BK)[-_]?/i, "");
  return `#${cleaned.slice(-6).toUpperCase()}`;
}

const ADD_EMPTY = {
  name: "",
  phone: "",
  device: "",
  issue: "",
  date: "",
  time: "",
  paymentStatus: "Unpaid",
  notes: "",
};

function AddBookingModal({ open, onClose, onSaved }) {
  const { theme: t } = useTheme();
  const { showToast } = useToast();
  const addBooking = useStore((s) => s.addBooking);
  const [form, setForm] = useState(ADD_EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(ADD_EMPTY);
    setError("");
    setSaving(false);
  }, [open]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    const required = ["name", "phone", "device", "issue", "date", "time"];
    const missing = required.filter((f) => !form[f]?.trim());
    if (missing.length) {
      setError(`Please fill in: ${missing.join(", ")}`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await addBooking({ ...form });
      showToast("Booking added");
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err.message || "Failed to add booking");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    border: `1px solid ${t.border}`,
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    background: t.inputBg,
    color: t.textPrimary,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <Modal open={open} onClose={() => !saving && onClose?.()} maxWidth={500} maxHeight="90vh">
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: t.textPrimary }}>Add booking</h2>
          <button
            type="button"
            disabled={saving}
            onClick={() => !saving && onClose?.()}
            style={{
              background: t.cardBg2,
              border: `1px solid ${t.border}`,
              borderRadius: 10,
              width: 34,
              height: 34,
              cursor: saving ? "default" : "pointer",
              fontSize: 18,
              color: t.textSecondary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <AddField label="Customer name *" span={2} t={t}>
            <input style={inputStyle} value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Ali Hassan" />
          </AddField>
          <AddField label="Phone *" t={t}>
            <input style={inputStyle} value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="0300-1234567" />
          </AddField>
          <AddField label="Payment status" t={t}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["Unpaid", "Paid", "Onsite"].map((status) => {
                const active = form.paymentStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleChange("paymentStatus", status)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "8px 10px",
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: `1px solid ${active ? "rgba(139,92,246,0.45)" : t.border}`,
                      background: active
                        ? "rgba(139,92,246,0.16)"
                        : t.inputBg,
                      color: active ? t.textPrimary : t.textSecondary,
                    }}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </AddField>
          <AddField label="Device *" span={2} t={t}>
            <input style={inputStyle} value={form.device} onChange={(e) => handleChange("device", e.target.value)} placeholder="iPhone 14 Pro" />
          </AddField>
          <AddField label="Issue *" span={2} t={t}>
            <input style={inputStyle} value={form.issue} onChange={(e) => handleChange("issue", e.target.value)} placeholder="Screen replacement" />
          </AddField>
          <AddField label="Date *" t={t}>
            <input style={inputStyle} type="date" value={form.date} onChange={(e) => handleChange("date", e.target.value)} />
          </AddField>
          <AddField label="Time *" t={t}>
            <input style={inputStyle} type="time" value={form.time} onChange={(e) => handleChange("time", e.target.value)} />
          </AddField>
          <AddField label="Notes" span={2} t={t}>
            <textarea
              style={{ ...inputStyle, resize: "vertical" }}
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any extra details…"
              rows={2}
            />
          </AddField>
        </div>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 14px",
              background: "rgba(239,68,68,0.1)",
              color: "#fca5a5",
              borderRadius: 10,
              fontSize: 13,
              border: "1px solid rgba(239,68,68,0.3)",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button
            type="button"
            className="ui-interactive"
            disabled={saving}
            onClick={() => !saving && onClose?.()}
            style={{ ...secondaryBtnStyle(t), padding: "9px 18px", fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ui-interactive"
            onClick={handleSave}
            disabled={saving}
            style={{
              ...primaryBtnStyle(t),
              padding: "9px 22px",
              fontSize: 13,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "wait" : "pointer",
            }}
          >
            {saving ? "Saving…" : "Add booking"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function AddField({ label, children, span = 1, t }) {
  return (
    <div style={{ gridColumn: span > 1 ? `span ${span}` : undefined }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 700,
          color: t.textMuted,
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function RowMoreMenu({ bookingId, onDelete }) {
  const { theme: t } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="bk-icon-btn"
        title="More actions"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreHorizontal size={16} strokeWidth={2} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: 4,
            minWidth: 140,
            padding: 4,
            borderRadius: 10,
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            boxShadow: t.cardShadow,
            zIndex: 20,
          }}
        >
          <button
            type="button"
            className="ui-interactive"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete?.(bookingId);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 10px",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "#f87171",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <Trash2 size={14} strokeWidth={2} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function BookingModal({ booking, bookings, invoices, onClose, onConfirm, onReject, onCompleted, onNotesSaved }) {
  const { theme:t } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState("details");
  const [completeOpen, setCompleteOpen] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    setTab("details");
    setCompleteOpen(false);
    setInvoiceAmount(booking?.amount != null && booking.amount !== "" ? String(booking.amount) : "");
    setNotes(booking?.Notes || "");
  }, [booking?.["Booking ID"], booking?.Notes]);

  if (!booking) return null;

  const tier = getCustomerTier(booking.Phone, bookings, invoices);
  const notesDirty = (notes || "") !== (booking.Notes || "");

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      await updateBooking(encodeURIComponent(booking["Booking ID"]), { notes: notes || null });
      onNotesSaved?.(booking["Booking ID"], notes || "");
      showToast("Notes saved");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to save notes", "error");
    } finally {
      setSavingNotes(false);
    }
  }

  const row = (icon, label, val) => val ? (
    <div key={label} style={{ display:"flex", gap:10, alignItems:"center", padding:"7px 11px", background:t.cardBg2, borderRadius:10, border:`1px solid ${t.borderSub}` }}>
      <span style={{ fontSize:14 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize:10, color:t.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:.6 }}>{label}</div>
        <div style={{ fontSize:13, color:t.textPrimary, fontWeight:500, marginTop:1 }}>{val}</div>
      </div>
    </div>
  ) : null;

  const tabBtn = (id, label) => (
    <button
      key={id}
      type="button"
      className="ui-interactive"
      onClick={() => setTab(id)}
      style={{
        flex: 1,
        padding: "8px 10px",
        borderRadius: 9,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        border: `1px solid ${tab === id ? t.borderHover : t.border}`,
        background: tab === id ? "rgba(255,255,255,0.06)" : "transparent",
        color: tab === id ? t.textPrimary : t.textSecondary,
      }}
    >
      {label}
    </button>
  );

  const canComplete = booking.Status === "Confirmed" || booking.Status === "Pending";
  const amountDisplay = booking.amount != null && booking.amount !== ""
    ? `₨${Number(booking.amount).toLocaleString()}`
    : null;

  async function handleGenerateInvoice() {
    const amount = Number(invoiceAmount);
    if (Number.isNaN(amount) || amount < 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    setSubmitting(true);
    try {
      await completeBookingWithInvoice(booking["Booking ID"], amount);
      showToast("Booking completed — invoice created");
      onCompleted?.(booking["Booking ID"], amount);
      setCompleteOpen(false);
      onClose();
      navigate("/invoices");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to complete booking", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const padX = 20;
  const hasFooterActions =
    booking.Status === "Pending" || canComplete || booking.Status === "Completed";

  return (
    <>
    <Modal open={!!booking && !completeOpen} onClose={() => { setTab("details"); onClose(); }} maxWidth={480} maxHeight="90vh">
      {/* Sticky header — close always visible */}
      <div style={{ flexShrink: 0, padding: `${16}px ${padX}px 0`, display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize:18, fontWeight:800, color:t.textPrimary, letterSpacing:-0.4, lineHeight:1.25 }}>{booking.Name}</div>
          <div style={{ marginTop:6, display:"flex", flexWrap:"wrap", gap:6 }}>
            <StatusBadge status={booking.Status} />
            {tier && <StatusBadge status={tier} />}
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setTab("details"); onClose(); }}
          style={{ flexShrink: 0, background:t.cardBg2, border:`1px solid ${t.border}`, borderRadius:10, width:34, height:34, cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", color:t.textSecondary }}
        >×</button>
      </div>

      <div style={{ flexShrink: 0, display: "flex", gap: 6, margin: `12px ${padX}px 0` }}>
        {tabBtn("details", "Details")}
        {tabBtn("history", "History")}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: `12px ${padX}px ${hasFooterActions && tab === "details" ? 8 : 16}px` }}>
        {tab === "details" ? (
          <>
            <div style={{ display:"grid", gap:5, marginBottom:12 }}>
              {row("📞","Phone",formatPhone(booking.Phone))}
              {row("📧","Email",booking.Email)}
              {row("📱","Device",booking.Device)}
              {row("📅","Date",formatDate(booking.Date))}
              {row("🕐","Time",booking.Time)}
              {row("🔧","Service",booking.Service)}
              {row("📣","Source",booking.Source)}
              {row("💰","Amount",amountDisplay)}
              <div style={{ padding:"8px 11px", background:t.cardBg2, borderRadius:10, border:`1px solid ${t.borderSub}` }}>
                <div style={{ fontSize:10, color:t.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:.6, marginBottom:6 }}>Notes</div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Add internal notes about this customer or booking…"
                  style={{
                    width: "100%", padding: "8px 10px", borderRadius: 8, resize: "vertical",
                    background: t.inputBg, border: `1px solid ${t.border}`, fontSize: 13,
                    color: t.textPrimary, outline: "none", boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  className="ui-interactive"
                  disabled={!notesDirty || savingNotes}
                  onClick={handleSaveNotes}
                  style={{
                    ...secondaryBtnStyle(t),
                    marginTop: 6, padding: "6px 12px", fontSize: 12,
                    opacity: !notesDirty || savingNotes ? 0.5 : 1,
                    cursor: !notesDirty || savingNotes ? "default" : "pointer",
                  }}
                >
                  {savingNotes ? "Saving…" : "Save notes"}
                </button>
              </div>
            </div>
            <a href={whatsappLink(booking.Phone)} target="_blank" rel="noreferrer"
              className="ui-interactive"
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px", borderRadius:10, background:"transparent", color:t.textSecondary, fontWeight:600, fontSize:13, textDecoration:"none", border:`1px solid rgba(255,255,255,0.12)` }}>
              WhatsApp {booking.Name}
            </a>
          </>
        ) : (
          <div style={{ background: t.cardBg2, borderRadius: 12, border: `1px solid ${t.border}`, padding: 12 }}>
            <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>
              Conversation · read-only
            </div>
            <ConversationHistory bookingId={booking["Booking ID"]} />
          </div>
        )}
      </div>

      {/* Sticky footer actions — Confirm/Reject stay visible */}
      {tab === "details" && hasFooterActions && (
        <div style={{
          flexShrink: 0,
          padding: `10px ${padX}px 16px`,
          borderTop: `1px solid ${t.border}`,
          background: t.cardBg,
        }}>
          {booking.Status==="Pending" && (
            <div style={{ display:"flex", gap:10, marginBottom: canComplete ? 8 : 0 }}>
              <button className="ui-interactive" onClick={()=>{onConfirm(booking["Booking ID"],booking.Name);onClose();}} style={{ ...primaryBtnStyle(t), flex:1, padding:"11px", fontSize:13 }}>Confirm</button>
              <button className="ui-interactive" onClick={()=>{onReject(booking["Booking ID"],booking.Name);onClose();}}  style={{ ...secondaryBtnStyle(t), flex:1, padding:"11px", fontSize:13 }}>Reject</button>
            </div>
          )}
          {canComplete && (
            <button
              className="ui-interactive"
              onClick={() => {
                setInvoiceAmount(booking.amount != null && booking.amount !== "" ? String(booking.amount) : "");
                setCompleteOpen(true);
              }}
              style={{
                ...primaryBtnStyle(t),
                width: "100%", padding: "11px", fontSize: 13,
              }}
            >
              Mark Completed
            </button>
          )}
          {booking.Status === "Completed" && (
            <div style={{
              padding: "10px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600, textAlign: "center",
              background: "rgba(255,255,255,0.06)",
              color: t.textSecondary,
              border: `1px solid ${t.border}`,
            }}>
              Completed — invoice generated
            </div>
          )}
        </div>
      )}
    </Modal>

    {/* Invoice amount confirmation before completing */}
    <Modal open={completeOpen} onClose={() => !submitting && setCompleteOpen(false)} maxWidth={400} maxHeight="90vh">
      <div style={{ padding: 24 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: t.textPrimary, marginBottom: 6 }}>Complete &amp; invoice</div>
      <p style={{ fontSize: 13, color: t.textSecondary, marginBottom: 18, lineHeight: 1.5 }}>
        Set the final amount for <strong style={{ color: t.textPrimary }}>{booking.Name}</strong>
        {booking.Service ? ` · ${booking.Service}` : ""}. You can override the quoted price.
      </p>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>
        Invoice amount (₨)
      </label>
      <input
        type="number"
        min="0"
        step="1"
        value={invoiceAmount}
        onChange={e => setInvoiceAmount(e.target.value)}
        placeholder="0"
        style={{
          width: "100%", padding: "12px 14px", borderRadius: 12, marginBottom: 18,
          background: t.inputBg, border: `1px solid ${t.border}`, fontSize: 16, fontWeight: 600,
          color: t.textPrimary, outline: "none", boxSizing: "border-box",
        }}
        onFocus={e => e.target.style.border = `1px solid ${t.accent}`}
        onBlur={e => e.target.style.border = `1px solid ${t.border}`}
      />
      <div style={{ display: "flex", gap: 10 }}>
        <button
          className="ui-interactive"
          disabled={submitting}
          onClick={() => setCompleteOpen(false)}
          style={{ ...secondaryBtnStyle(t), flex: 1, padding: "12px", fontSize: 13 }}
        >
          Cancel
        </button>
        <button
          className="ui-interactive"
          disabled={submitting}
          onClick={handleGenerateInvoice}
          style={{
            ...primaryBtnStyle(t),
            flex: 1, padding: "12px", fontSize: 13,
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Creating…" : "Confirm & Invoice"}
        </button>
      </div>
      </div>
    </Modal>
    </>
  );
}

export default function Bookings() {
  const bookings        = useStore(s => s.bookings);
  const invoices        = useStore(s => s.invoices);
  const loading         = useStore(s => s.loading);
  const storeConfirm    = useStore(s => s.confirmBooking);
  const storeReject     = useStore(s => s.rejectBooking);
  const fetchAll        = useStore(s => s.fetchAll);
  const { theme:t }     = useTheme();
  const { showToast }   = useToast();
  const { changeStatus, loadingId } = usePaymentStatus();
const deleteBooking = useStore(s => s.deleteBooking);
const updateBookingStatus = useStore(s => s.updateBookingStatus);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("All");
  const [selected, setSelected] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function confirmDeleteBooking() {
    if (!deleteTarget?.id) return;
    setDeleteBusy(true);
    try {
      await deleteBooking(deleteTarget.id);
      showToast("Booking deleted");
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to delete booking", "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  function handleCompleted(bookingId, amount) {
    useStore.setState(state => ({
      bookings: state.bookings.map(b =>
        b["Booking ID"] === bookingId
          ? { ...b, Status: "Completed", amount }
          : b
      ),
    }));
    setTimeout(() => fetchAll(true, showToast), 1500);
  }

  function handleNotesSaved(bookingId, notes) {
    useStore.setState(state => ({
      bookings: state.bookings.map(b =>
        b["Booking ID"] === bookingId ? { ...b, Notes: notes } : b
      ),
    }));
    setSelected(prev =>
      prev && prev["Booking ID"] === bookingId ? { ...prev, Notes: notes } : prev
    );
  }

  if (loading) return <Skeleton rows={8} />;

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
  const TD_NUM = {
    ...TD,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  };
  const TD_ELLIPSIS = {
    ...TD,
    maxWidth: 140,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const filtered = bookings.filter(b => {
    const s = search.toLowerCase();
    return (b.Name?.toLowerCase().includes(s)||b.Phone?.toString().includes(s)||b.Service?.toLowerCase().includes(s)) && (filter==="All"||b.Status===filter);
  });

  const confirmBooking = (id, name) => storeConfirm(id, name, showToast);
  const rejectBooking  = (id, name) => storeReject(id, name, showToast);

  // Precompute tiers once for table rows (avoids N×full scans in JSX)
  const tierByPhoneKey = (() => {
    const map = new Map();
    for (const b of bookings) {
      const key = phoneKey(b.Phone);
      if (!key || map.has(key)) continue;
      map.set(key, getCustomerTier(b.Phone, bookings, invoices));
    }
    return map;
  })();

  return (
    <div style={{ padding:"20px 16px", maxWidth:1400 }}>
      <style>{`
        @media(max-width:768px){
          .bk-header{flex-direction:column!important;gap:10px!important;align-items:flex-start!important}
          .bk-filterrow{flex-direction:column!important;gap:8px!important}
          .bk-filters{flex-wrap:wrap!important;gap:6px!important}
          .bk-table th:nth-child(1),.bk-table td:nth-child(1),
          .bk-table th:nth-child(4),.bk-table td:nth-child(4),
          .bk-table th:nth-child(5),.bk-table td:nth-child(5),
          .bk-table th:nth-child(7),.bk-table td:nth-child(7){display:none}
        }
        .bk-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          transition: color 150ms cubic-bezier(0.16, 1, 0.3, 1), background 150ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bk-icon-btn:hover {
          background: rgba(255,255,255,0.06);
        }
        .bk-row:hover .bk-icon-confirm {
          color: #4ade80;
        }
        .bk-row:hover .bk-icon-reject {
          color: #f87171;
        }
        .bk-row:hover .bk-icon-btn:not(.bk-icon-confirm):not(.bk-icon-reject) {
          color: rgba(255,255,255,0.55);
        }
        .bk-table tbody tr.bk-row {
          transition: background 150ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bk-table tbody tr.bk-row:hover {
          background: rgba(255,255,255,0.025);
        }
      `}</style>

      <BookingModal
        booking={selected}
        bookings={bookings}
        invoices={invoices}
        onClose={()=>setSelected(null)}
        onConfirm={confirmBooking}
        onReject={rejectBooking}
        onCompleted={handleCompleted}
        onNotesSaved={handleNotesSaved}
      />
      <AddBookingModal open={addOpen} onClose={() => setAddOpen(false)} />
      <CustomerHistory customer={customer} bookings={bookings} invoices={invoices} onClose={()=>setCustomer(null)} />

      <div className="bk-header" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:t.textPrimary, letterSpacing:-0.6, margin:0 }}>Bookings</h1>
          <p style={{ color:t.textSecondary, fontSize:13, marginTop:5 }}>{bookings.length} total · {bookings.filter(b=>b.Status==="Pending").length} pending</p>
        </div>
        <button className="ui-interactive" onClick={()=>exportToCSV(filtered,"bookings.csv")} style={{ ...secondaryBtnStyle(t), padding:"9px 16px", fontSize:13, whiteSpace:"nowrap" }}>Export</button>
      </div>

      {/* Payment stat cards */}
      <div style={{ marginBottom:20 }}>
        <PaymentStatCards bookings={bookings} />
      </div>

      <div className="bk-filterrow" style={{ display:"flex", gap:10, marginBottom:16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth: 180 }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, color:t.textMuted }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search bookings..."
            style={{ width:"100%", padding:"11px 16px 11px 42px", borderRadius:12, background:t.inputBg, border:`1px solid ${t.border}`, fontSize:14, color:t.textPrimary, outline:"none", boxSizing: "border-box" }}
            onFocus={e=>e.target.style.border=`1px solid ${t.accent}`} onBlur={e=>e.target.style.border=`1px solid ${t.border}`} />
        </div>
        <div className="bk-filters" style={{ display:"flex", gap:6 }}>
          {["All","Pending","Confirmed","Completed","Rejected"].map(s=>(
            <button key={s} className="ui-interactive" onClick={()=>setFilter(s)} style={{ padding:"9px 14px", borderRadius:10, fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap",
              background:filter===s?"rgba(255,255,255,0.06)":"transparent",
              color:filter===s?t.textPrimary:t.textSecondary,
              border:`1px solid ${filter===s?t.borderHover:t.border}`,
            }}>{s}</button>
          ))}
        </div>
        <button
          type="button"
          className="ui-interactive"
          onClick={() => setAddOpen(true)}
          style={{
            ...primaryBtnStyle(t),
            padding: "9px 16px",
            fontSize: 13,
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          Add Booking
        </button>
      </div>

      {filtered.length===0 ? <EmptyState icon="📋" title="No bookings found" subtitle="Try a different search or filter" /> : (
        <div style={{ background:t.cardBg, borderRadius:16, border:`1px solid ${t.border}`, borderTop:`1px solid ${t.borderTopHighlight}`, boxShadow:t.cardShadow, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table className="bk-table data-table" style={{ width:"100%", minWidth:400 }}>
              <thead><tr>{["ID","Name","Phone","Service","Source","Date","Time","Status","Payment","Actions"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody className="list-stagger-rows">
                {filtered.map((b,i)=>{
                  const stale = isStalePending(b);
                  const fullId = b["Booking ID"] || "";
                  return (
                  <tr
                    key={i}
                    className="bk-row"
                    style={{
                      cursor: "pointer",
                      ...(stale
                        ? {
                            background:
                              t.name === "dark"
                                ? "rgba(245,158,11,0.08)"
                                : "rgba(245,158,11,0.07)",
                            boxShadow: "inset 3px 0 0 #f59e0b, 0 0 18px rgba(245,158,11,0.12)",
                          }
                        : {}),
                    }}
                    onClick={()=>setSelected(b)}
                  >
                    <td
                      style={{
                        ...TD,
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        fontSize: 11,
                        color: t.textMuted,
                        letterSpacing: 0.3,
                        whiteSpace: "nowrap",
                      }}
                      title={fullId || undefined}
                    >
                      {shortBookingId(fullId)}
                    </td>
                    <td style={{...TD,fontWeight:600,color:t.textPrimary,cursor:"pointer", maxWidth: 180}} onClick={e=>{e.stopPropagation();setCustomer(b);}}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{b.Name}</span>
                        {tierByPhoneKey.get(phoneKey(b.Phone)) && (
                          <StatusBadge status={tierByPhoneKey.get(phoneKey(b.Phone))} />
                        )}
                      </div>
                    </td>
                    <td style={TD_ELLIPSIS} title={formatPhone(b.Phone?.toString()||"")}>
                      {formatPhone(b.Phone?.toString()||"")}
                    </td>
                    <td style={{ ...TD_ELLIPSIS, maxWidth: 160 }} title={b.Service || ""}>{b.Service}</td>
                    <td style={TD}>
                      {b.Source ? <StatusBadge status={b.Source} /> : <span style={{ color: t.textMuted }}>—</span>}
                    </td>
                    <td style={TD_NUM}>{formatDate(b.Date)}</td>
                    <td style={TD_NUM}>{b.Time}</td>
                    <td style={TD} onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={async () => {
                          if (b.Status === "Completed" || b.Status === "Cancelled") return;
                          const cycle = { "Pending": "Confirmed", "Confirmed": "Rejected", "Rejected": "Pending" };
                          const next = cycle[b.Status] || "Pending";
                          if (!window.confirm(`Change status to ${next}?`)) return;
                          await updateBookingStatus(b["Booking ID"], next);
                        }}
                        style={{ background: "none", border: "none", cursor: (b.Status === "Completed" || b.Status === "Cancelled") ? "default" : "pointer", padding: 0 }}
                      >
                        <StatusBadge status={b.Status} />
                      </button>
                    </td>
                    <td style={TD} onClick={e=>e.stopPropagation()}>
                      <PaymentStatusCycler
                        status={b["Payment Status"]}
                        bookingId={b["Booking ID"]}
                        onChange={(bookingId) => changeStatus(bookingId, b["Payment Status"])}
                        loading={loadingId === b["Booking ID"]}
                      />
                    </td>
                    <td style={TD} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 2, alignItems: "center", justifyContent: "flex-end" }}>
                        {b.Status === "Pending" && (
                          <>
                            <button
                              type="button"
                              className="bk-icon-btn bk-icon-confirm"
                              onClick={() => confirmBooking(b["Booking ID"], b.Name)}
                              title="Confirm"
                            >
                              <Check size={16} strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              className="bk-icon-btn bk-icon-reject"
                              onClick={() => rejectBooking(b["Booking ID"], b.Name)}
                              title="Reject"
                            >
                              <X size={16} strokeWidth={2} />
                            </button>
                          </>
                        )}
                        <RowMoreMenu
                          bookingId={b["Booking ID"]}
                          onDelete={(id) => setDeleteTarget({ id, name: b.Name })}
                        />
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

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => !deleteBusy && setDeleteTarget(null)}
        onConfirm={confirmDeleteBooking}
        busy={deleteBusy}
        title="Delete this booking?"
        message={
          deleteTarget?.name
            ? `Delete the booking for ${deleteTarget.name}? This can't be undone.`
            : "Are you sure? This can't be undone."
        }
        confirmLabel="Delete booking"
      />
    </div>
  );
}
