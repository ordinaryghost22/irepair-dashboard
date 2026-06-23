import { useTheme } from "../context/ThemeContext";

export default function CustomerHistory({ customer, bookings, onClose }) {
  const { theme: t } = useTheme();
  if (!customer) return null;

  const SERVICE_PRICES = {
    "Screen Repair":5000,"Battery Replacement":2500,"Software Fix":1500,
    "Water Damage":8000,"Charging Port":3000,"Camera Repair":4000
  };

  const history = bookings.filter(b => b.Phone === customer.Phone);
  const totalSpent = history.filter(b => b.Status === "Confirmed").reduce((s,b) => s+(SERVICE_PRICES[b.Service]||0), 0);
  const firstVisit = history.length ? history[history.length-1].Date : "—";
  const lastVisit  = history.length ? history[0].Date : "—";

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:2000, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:t.cardBg, borderRadius:24, padding:32, width:"100%", maxWidth:520, boxShadow:"0 32px 100px rgba(0,0,0,0.5)", border:`1px solid ${t.border}`, animation:"popIn .2s ease", maxHeight:"80vh", overflowY:"auto" }}>
        
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:16, background:"linear-gradient(135deg,#667eea,#764ba2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:"#fff" }}>
              {customer.Name?.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:t.textPrimary }}>{customer.Name}</div>
              <div style={{ fontSize:13, color:t.textMuted, marginTop:2 }}>{customer.Phone}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:t.cardBg2, border:"none", borderRadius:10, width:36, height:36, cursor:"pointer", fontSize:20, color:t.textMuted }}>×</button>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
          {[
            { label:"Total Visits", value:history.length },
            { label:"Total Spent", value:"₨"+totalSpent.toLocaleString() },
            { label:"Confirmed", value:history.filter(b=>b.Status==="Confirmed").length },
          ].map(s => (
            <div key={s.label} style={{ background:t.cardBg2, borderRadius:14, padding:"14px 16px", border:`1px solid ${t.border}` }}>
              <div style={{ fontSize:18, fontWeight:800, color:t.textPrimary }}>{s.value}</div>
              <div style={{ fontSize:11, color:t.textMuted, marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Meta */}
        <div style={{ display:"flex", gap:16, marginBottom:20, fontSize:12, color:t.textMuted }}>
          <span>🗓 First visit: <strong style={{ color:t.textPrimary }}>{firstVisit}</strong></span>
          <span>🕐 Last visit: <strong style={{ color:t.textPrimary }}>{lastVisit}</strong></span>
        </div>

        {/* Booking history */}
        <div style={{ fontWeight:700, fontSize:14, color:t.textPrimary, marginBottom:12 }}>Booking History</div>
        {history.length === 0 ? (
          <div style={{ textAlign:"center", padding:"30px 0", color:t.textMuted, fontSize:13 }}>No bookings found</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {history.map((b,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", borderRadius:12, background:t.cardBg2, border:`1px solid ${t.border}` }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:t.textPrimary }}>{b.Service}</div>
                  <div style={{ fontSize:11, color:t.textMuted, marginTop:2 }}>{b.Date} · {b.Time}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20,
                    background:b.Status==="Confirmed"?"rgba(0,184,148,0.15)":b.Status==="Rejected"?"rgba(255,118,117,0.15)":"rgba(253,203,110,0.15)",
                    color:b.Status==="Confirmed"?"#00b894":b.Status==="Rejected"?"#ff7675":"#fdcb6e"
                  }}>{b.Status}</span>
                  {b.Status==="Confirmed" && <div style={{ fontSize:11, color:t.textMuted, marginTop:4 }}>₨{(SERVICE_PRICES[b.Service]||0).toLocaleString()}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}