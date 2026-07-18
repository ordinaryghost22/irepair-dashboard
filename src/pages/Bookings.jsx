import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useTheme, primaryBtnStyle, secondaryBtnStyle } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import Skeleton from "../components/Skeleton";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import CustomerHistory from "../components/CustomerHistory";
import ConversationHistory from "../components/ConversationHistory";
import { exportToCSV } from "../utils/export";
import { formatDate, formatPhone, whatsappLink } from "../utils/format";
import BookingManager from "../components/BookingManager";
import { PaymentStatCards, PaymentStatusCycler } from "../components/PaymentStatus";
import { usePaymentStatus } from "../hooks/usePaymentStatus";
import { completeBookingWithInvoice } from "../api";


function BookingModal({ booking, onClose, onConfirm, onReject, onCompleted }) {
  const { theme:t } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState("details");
  const [completeOpen, setCompleteOpen] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTab("details");
    setCompleteOpen(false);
    setInvoiceAmount(booking?.amount != null && booking.amount !== "" ? String(booking.amount) : "");
  }, [booking?.["Booking ID"]]);

  if (!booking) return null;

  const row = (icon, label, val) => val ? (
    <div key={label} style={{ display:"flex", gap:12, alignItems:"center", padding:"11px 14px", background:t.cardBg2, borderRadius:12, border:`1px solid ${t.borderSub}` }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <div>
        <div style={{ fontSize:11, color:t.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:.7 }}>{label}</div>
        <div style={{ fontSize:14, color:t.textPrimary, fontWeight:500, marginTop:2 }}>{val}</div>
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
        padding: "9px 12px",
        borderRadius: 10,
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

  return (
    <>
    <Modal open={!!booking && !completeOpen} onClose={() => { setTab("details"); onClose(); }} maxWidth={480}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:t.textPrimary, letterSpacing:-0.5 }}>{booking.Name}</div>
          <div style={{ marginTop:8 }}><StatusBadge status={booking.Status} /></div>
        </div>
        <button onClick={() => { setTab("details"); onClose(); }} style={{ background:t.cardBg2, border:`1px solid ${t.border}`, borderRadius:10, width:36, height:36, cursor:"pointer", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", color:t.textSecondary }}>×</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {tabBtn("details", "Details")}
        {tabBtn("history", "History")}
      </div>

      {tab === "details" ? (
        <>
          <div style={{ display:"grid", gap:8, marginBottom:18 }}>
            {row("📞","Phone",formatPhone(booking.Phone))}
            {row("📧","Email",booking.Email)}
            {row("📱","Device",booking.Device)}
            {row("📅","Date",formatDate(booking.Date))}
            {row("🕐","Time",booking.Time)}
            {row("🔧","Service",booking.Service)}
            {row("📣","Source",booking.Source)}
            {row("💰","Amount",amountDisplay)}
            {booking.Notes && (
              <div style={{ padding:"11px 14px", background:"rgba(255,255,255,0.04)", borderRadius:10, border:`1px solid ${t.border}`, fontSize:13, color:t.textSecondary }}>
                {booking.Notes}
              </div>
            )}
          </div>
          <a href={whatsappLink(booking.Phone)} target="_blank" rel="noreferrer"
            className="ui-interactive"
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", borderRadius:10, background:"transparent", color:t.textSecondary, fontWeight:600, fontSize:14, textDecoration:"none", marginBottom:14, border:`1px solid rgba(255,255,255,0.12)` }}>
            WhatsApp {booking.Name}
          </a>
          {booking.Status==="Pending" && (
            <div style={{ display:"flex", gap:12, marginBottom: canComplete ? 12 : 0 }}>
              <button className="ui-interactive" onClick={()=>{onConfirm(booking["Booking ID"],booking.Name);onClose();}} style={{ ...primaryBtnStyle(t), flex:1, padding:"13px", fontSize:14 }}>Confirm</button>
              <button className="ui-interactive" onClick={()=>{onReject(booking["Booking ID"],booking.Name);onClose();}}  style={{ ...secondaryBtnStyle(t), flex:1, padding:"13px", fontSize:14 }}>Reject</button>
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
                width: "100%", padding: "13px", fontSize: 14,
              }}
            >
              Mark Completed
            </button>
          )}
          {booking.Status === "Completed" && (
            <div style={{
              padding: "12px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, textAlign: "center",
              background: "rgba(255,255,255,0.06)",
              color: t.textSecondary,
              border: `1px solid ${t.border}`,
            }}>
              Completed — invoice generated
            </div>
          )}
        </>
      ) : (
        <div style={{ background: t.cardBg2, borderRadius: 14, border: `1px solid ${t.border}`, padding: 14 }}>
          <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>
            Conversation · read-only
          </div>
          <ConversationHistory bookingId={booking["Booking ID"]} />
        </div>
      )}
    </Modal>

    {/* Invoice amount confirmation before completing */}
    <Modal open={completeOpen} onClose={() => !submitting && setCompleteOpen(false)} maxWidth={400}>
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
          color: t.textPrimary, outline: "none",
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
    </Modal>
    </>
  );
}

export default function Bookings() {
  const bookings        = useStore(s => s.bookings);
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
  async function handleDeleteBooking(bookingId) {
  if (!window.confirm("Delete this booking?")) return;
  await deleteBooking(bookingId);
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

  if (loading) return <Skeleton rows={8} />;

  const TH = { padding:"10px 12px", fontSize:11, fontWeight:600, color:t.thColor, textTransform:"uppercase", letterSpacing:0.8, textAlign:"left", background:"transparent", borderBottom:`1px solid ${t.border}` };
  const TD = { padding:"12px 12px", fontSize:13, color:t.tdColor };

  const filtered = bookings.filter(b => {
    const s = search.toLowerCase();
    return (b.Name?.toLowerCase().includes(s)||b.Phone?.toString().includes(s)||b.Service?.toLowerCase().includes(s)) && (filter==="All"||b.Status===filter);
  });

  const confirmBooking = (id, name) => storeConfirm(id, name, showToast);
  const rejectBooking  = (id, name) => storeReject(id, name, showToast);

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
      `}</style>

      <BookingModal
        booking={selected}
        onClose={()=>setSelected(null)}
        onConfirm={confirmBooking}
        onReject={rejectBooking}
        onCompleted={handleCompleted}
      />
      <CustomerHistory customer={customer} bookings={bookings} onClose={()=>setCustomer(null)} />

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

      <div className="bk-filterrow" style={{ display:"flex", gap:10, marginBottom:16 }}>
        <div style={{ position:"relative", flex:1 }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, color:t.textMuted }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search bookings..."
            style={{ width:"100%", padding:"11px 16px 11px 42px", borderRadius:12, background:t.inputBg, border:`1px solid ${t.border}`, fontSize:14, color:t.textPrimary, outline:"none" }}
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
      </div>

      {filtered.length===0 ? <EmptyState icon="📋" title="No bookings found" subtitle="Try a different search or filter" /> : (
        <div style={{ background:t.cardBg, borderRadius:16, border:`1px solid ${t.border}`, borderTop:`1px solid ${t.borderTopHighlight}`, boxShadow:t.cardShadow, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table className="bk-table data-table" style={{ width:"100%", minWidth:400 }}>
              <thead><tr>{["ID","Name","Phone","Service","Source","Date","Time","Status","Payment","Actions"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody className="list-stagger-rows">
                {filtered.map((b,i)=>(
                  <tr key={i} style={{ cursor:"pointer" }}
                    onClick={()=>setSelected(b)}
                  >
                    <td style={{...TD,fontFamily:"monospace",fontSize:11,color:t.textMuted}}>{b["Booking ID"]||"—"}</td>
                    <td style={{...TD,fontWeight:600,color:t.textPrimary,cursor:"pointer"}} onClick={e=>{e.stopPropagation();setCustomer(b);}}>{b.Name}</td>
                    <td style={TD}>{formatPhone(b.Phone?.toString()||"")}</td>
                    <td style={TD}>{b.Service}</td>
                    <td style={TD}>
                      {b.Source ? <StatusBadge status={b.Source} /> : <span style={{ color: t.textMuted }}>—</span>}
                    </td>
                    <td style={TD}>{formatDate(b.Date)}</td>
                    <td style={TD}>{b.Time}</td>
                  <td style={TD} onClick={e => e.stopPropagation()}>
  <button
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
  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    {b.Status === "Pending" && (
      <>
        <button className="btn-ghost-ok" onClick={() => confirmBooking(b["Booking ID"], b.Name)} title="Confirm">✓</button>
        <button className="btn-ghost-danger" onClick={() => rejectBooking(b["Booking ID"], b.Name)} title="Reject">✕</button>
      </>
    )}
    <button className="btn-ghost-danger" onClick={() => handleDeleteBooking(b["Booking ID"])} title="Delete">🗑</button>
  </div>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual booking manager */}
      <div style={{ marginTop:32 }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:t.textPrimary, marginBottom:14 }}>Manage Bookings</h2>
        <BookingManager />
      </div>
    </div>
  );
}
