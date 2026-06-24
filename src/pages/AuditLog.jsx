import { useStore } from "../store/useStore";
import { useTheme } from "../context/ThemeContext";
import EmptyState from "../components/EmptyState";
import HourglassLoader from "../components/HourglassLoader";

export default function AuditLog() {
  const auditLog = useStore(s => s.auditLog);
  const { theme:t } = useTheme();
  const TH = { padding:"10px 12px", fontSize:11, fontWeight:700, color:t.thColor, textTransform:"uppercase", letterSpacing:0.8, textAlign:"left", background:t.thBg, borderBottom:`1px solid ${t.borderSub}` };
  const TD = { padding:"12px 12px", fontSize:13, color:t.tdColor, borderBottom:`1px solid ${t.borderSub}` };
  return (
    <div style={{ padding:"20px 16px", maxWidth:1000, animation:"fadeIn .3s ease" }}>
      <style>{"@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}"}</style>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:t.textPrimary, letterSpacing:-0.6, margin:0 }}>Audit Log</h1>
        <p style={{ color:t.textSecondary, fontSize:13, marginTop:5 }}>Every action taken on bookings</p>
      </div>
      {auditLog.length===0 ? <EmptyState icon="📜" title="No actions yet" subtitle="Confirm or reject a booking to see the audit trail" /> : (
        <div style={{ background:t.cardBg, borderRadius:18, border:`1px solid ${t.border}`, boxShadow:t.cardShadow, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:320 }}>
              <thead><tr>{["Action","Customer","Booking ID","When"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {auditLog.map((e,i)=>(
                  <tr key={i} style={{transition:"background .12s"}} onMouseEnter={x=>x.currentTarget.style.background=t.rowHover} onMouseLeave={x=>x.currentTarget.style.background="transparent"}>
                    <td style={TD}>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:600,
                        background:e.action==="Confirmed"?(t.name==="dark"?"rgba(34,197,94,0.15)":"#dcfce7"):(t.name==="dark"?"rgba(239,68,68,0.15)":"#fee2e2"),
                        color:e.action==="Confirmed"?"#22c55e":"#ef4444"
                      }}>
                        {e.action==="Confirmed"?"✓":"✕"} {e.action}
                      </span>
                    </td>
                    <td style={{...TD,fontWeight:600}}>{e.name||"—"}</td>
                    <td style={{...TD,fontFamily:"monospace",fontSize:11,color:t.textMuted}}>{e.bookingId}</td>
                    <td style={{...TD,color:t.textMuted,fontSize:12,whiteSpace:"nowrap"}}>{e.time}</td>
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
