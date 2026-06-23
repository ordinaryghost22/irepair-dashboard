import { useState } from "react";
import { useStore } from "../store/useStore";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { useIsMobile } from "../hooks/useIsMobile";
import Skeleton from "../components/Skeleton";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import CustomerHistory from "../components/CustomerHistory";
import { exportToCSV } from "../utils/export";
import { formatDate, formatPhone, whatsappLink } from "../utils/format";

function BookingModal({ booking, onClose, onConfirm, onReject }) {
  const { theme:t } = useTheme();
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
  return (
    <Modal open={!!booking} onClose={onClose} maxWidth={480}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:t.textPrimary }}>{booking.Name}</div>
          <div style={{ marginTop:8 }}><StatusBadge status={booking.Status} /></div>
        </div>
        <button onClick={onClose} style={{ background:t.cardBg2, border:`1px solid ${t.border}`, borderRadius:10, width:36, height:36, cursor:"pointer", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", color:t.textSecondary }}>×</button>
      </div>
      <div style={{ display:"grid", gap:8, marginBottom:18 }}>
        {row("📞","Phone",formatPhone(booking.Phone))}
        {row("📧","Email",booking.Email)}
        {row("📅","Date",formatDate(booking.Date))}
        {row("🕐","Time",booking.Time)}
        {row("🔧","Service",booking.Service)}
        {booking.Notes && <div style={{ padding:"11px 14px", background:t.name==="dark"?"rgba(234,179,8,0.08)":"#fffbf0", borderRadius:12, border:`1px solid ${t.name==="dark"?"rgba(234,179,8,0.2)":"#fde9a0"}`, fontSize:13, color:t.textSecondary }}>📝 {booking.Notes}</div>}
      </div>
      <a href={whatsappLink(booking.Phone)} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", borderRadius:12, background:t.name==="dark"?"rgba(34,197,94,0.1)":"#dcfce7", color:"#22c55e", fontWeight:700, fontSize:14, textDecoration:"none", marginBottom:14, border:`1px solid ${t.name==="dark"?"rgba(34,197,94,0.2)":"#bbf7d0"}` }}>
        💬 WhatsApp {booking.Name}
      </a>
      {booking.Status==="Pending" && (
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={()=>{onConfirm(booking["Booking ID"],booking.Name);onClose();}} style={{ flex:1,padding:"13px",borderRadius:13,border:"none",background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer" }}>✓ Confirm</button>
          <button onClick={()=>{onReject(booking["Booking ID"],booking.Name);onClose();}}  style={{ flex:1,padding:"13px",borderRadius:13,border:"none",background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer" }}>✕ Reject</button>
        </div>
      )}
    </Modal>
  );
}

export default function Bookings() {
  const bookings      = useStore(s => s.bookings);
  const loading       = useStore(s => s.loading);
  const storeConfirm  = useStore(s => s.confirmBooking);
  const storeReject   = useStore(s => s.rejectBooking);
  const { theme:t }   = useTheme();
  const { showToast } = useToast();
  const isMobile      = useIsMobile();

  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("All");
  const [selected, setSelected] = useState(null);
  const [customer, setCustomer] = useState(null);

  if (loading) return <Skeleton />;

  const TH = { padding:isMobile?"10px 12px":"12px 20px", fontSize:11, fontWeight:700, color:t.thColor, textTransform:"uppercase", letterSpacing:0.8, textAlign:"left", background:t.thBg, borderBottom:`1px solid ${t.borderSub}` };
  const TD = { padding:isMobile?"10px 12px":"14px 20px", fontSize:isMobile?12:13.5, color:t.tdColor, borderBottom:`1px solid ${t.borderSub}` };

  const filtered = bookings.filter(b => {
    const s = search.toLowerCase();
    return (b.Name?.toLowerCase().includes(s)||b.Phone?.toString().includes(s)||b.Service?.toLowerCase().includes(s)) && (filter==="All"||b.Status===filter);
  });

  const confirmBooking = (id, name) => storeConfirm(id, name, showToast);
  const rejectBooking  = (id, name) => storeReject(id, name, showToast);

  return (
    <div style={{ padding:isMobile?14:32, maxWidth:1400, animation:"fadeIn .3s ease" }}>
      <style>{"@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}"}</style>
      <BookingModal booking={selected} onClose={()=>setSelected(null)} onConfirm={confirmBooking} onReject={rejectBooking} />
      <CustomerHistory customer={customer} bookings={bookings} onClose={()=>setCustomer(null)} />

      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:isMobile?20:22, fontWeight:800, color:t.textPrimary, letterSpacing:-0.6, margin:0 }}>Bookings</h1>
          <p style={{ color:t.textSecondary, fontSize:13, marginTop:4 }}>{bookings.length} total · {bookings.filter(b=>b.Status==="Pending").length} pending</p>
        </div>
        <button onClick={()=>exportToCSV(filtered,"bookings.csv")} style={{ padding:"9px 14px", borderRadius:12, border:`1px solid ${t.border}`, background:t.cardBg, color:t.textSecondary, fontWeight:600, fontSize:12, cursor:"pointer", flexShrink:0 }}>⬇ CSV</button>
      </div>

      {/* Search */}
      <div style={{ position:"relative", marginBottom:12 }}>
        <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, color:t.textMuted }}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, phone, service..."
          style={{ width:"100%", padding:"11px 16px 11px 42px", borderRadius:12, background:t.inputBg, border:`1px solid ${t.border}`, fontSize:14, color:t.textPrimary, outline:"none" }}
          onFocus={e=>e.target.style.border=`1px solid ${t.accent}`} onBlur={e=>e.target.style.border=`1px solid ${t.border}`} />
      </div>

      {/* Filter buttons — scrollable on mobile */}
      <div style={{ display:"flex", gap:8, marginBottom:16, overflowX:"auto", paddingBottom:4 }}>
        {["All","Pending","Confirmed","Rejected"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{ padding:"9px 16px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", transition:"all .15s", flexShrink:0,
            background:filter===s?"linear-gradient(135deg,#667eea,#764ba2)":t.cardBg,
            color:filter===s?"#fff":t.textSecondary, border:filter===s?"1px solid transparent":`1px solid ${t.border}`,
            boxShadow:filter===s?"0 4px 16px rgba(102,126,234,.3)":"none"
          }}>{s}</button>
        ))}
      </div>

      {filtered.length===0 ? <EmptyState icon="📋" title="No bookings found" subtitle="Try a different search or filter" /> : isMobile ? (
        /* Mobile: card list */
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map((b,i)=>(
            <div key={i} onClick={()=>setSelected(b)} style={{ background:t.cardBg, borderRadius:14, border:`1px solid ${t.border}`, padding:"14px 16px", boxShadow:t.cardShadow, cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <span style={{ fontWeight:700, fontSize:15, color:t.accent, cursor:"pointer" }} onClick={e=>{e.stopPropagation();setCustomer(b);}}>{b.Name}</span>
                <StatusBadge status={b.Status} />
              </div>
              <div style={{ fontSize:12, color:t.textSecondary, marginBottom:6 }}>{b.Service} · {formatDate(b.Date)} · {b.Time}</div>
              <div style={{ fontSize:12, color:t.textMuted }}>{formatPhone(b.Phone?.toString()||"")}</div>
              {b.Status==="Pending" && (
                <div style={{ display:"flex", gap:8, marginTop:12 }} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>confirmBooking(b["Booking ID"],b.Name)} style={{ flex:1, padding:"9px", borderRadius:10, border:"none", background:t.name==="dark"?"rgba(34,197,94,0.15)":"#dcfce7", color:"#22c55e", fontWeight:700, fontSize:13, cursor:"pointer" }}>✓ Confirm</button>
                  <button onClick={()=>rejectBooking(b["Booking ID"],b.Name)}  style={{ flex:1, padding:"9px", borderRadius:10, border:"none", background:t.name==="dark"?"rgba(239,68,68,0.15)":"#fee2e2", color:"#ef4444", fontWeight:700, fontSize:13, cursor:"pointer" }}>✕ Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Desktop: table */
        <div style={{ background:t.cardBg, borderRadius:18, border:`1px solid ${t.border}`, boxShadow:t.cardShadow, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["ID","Name","Phone","Service","Date","Time","Status","Actions"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((b,i)=>(
                <tr key={i} style={{ cursor:"pointer", transition:"background .12s" }} onClick={()=>setSelected(b)} onMouseEnter={e=>e.currentTarget.style.background=t.rowHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{...TD,fontFamily:"monospace",fontSize:11,color:t.textMuted}}>{b["Booking ID"]||"—"}</td>
                  <td style={{...TD,fontWeight:600,color:t.accent,cursor:"pointer"}} onClick={e=>{e.stopPropagation();setCustomer(b);}}>{b.Name}</td>
                  <td style={TD}>{formatPhone(b.Phone?.toString()||"")}</td>
                  <td style={TD}>{b.Service}</td>
                  <td style={TD}>{formatDate(b.Date)}</td>
                  <td style={TD}>{b.Time}</td>
                  <td style={TD}><StatusBadge status={b.Status} /></td>
                  <td style={TD} onClick={e=>e.stopPropagation()}>
                    {b.Status==="Pending" && (
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={()=>confirmBooking(b["Booking ID"],b.Name)} style={{ padding:"6px 14px", borderRadius:8, border:"none", background:t.name==="dark"?"rgba(34,197,94,0.15)":"#dcfce7", color:"#22c55e", fontWeight:700, fontSize:12, cursor:"pointer" }}>✓</button>
                        <button onClick={()=>rejectBooking(b["Booking ID"],b.Name)}  style={{ padding:"6px 14px", borderRadius:8, border:"none", background:t.name==="dark"?"rgba(239,68,68,0.15)":"#fee2e2", color:"#ef4444", fontWeight:700, fontSize:12, cursor:"pointer" }}>✕</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
