import { useStore } from "../store/useStore";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useIsMobile";
import Skeleton from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { formatDate, formatPhone, whatsappLink } from "../utils/format";

export default function Waitlist() {
  const waitlist = useStore(s => s.waitlist);
  const loading  = useStore(s => s.loading);
  const { theme:t } = useTheme();
  const isMobile = useIsMobile();
  if (loading) return <Skeleton />;
  const TH = { padding:"10px 14px", fontSize:11, fontWeight:700, color:t.thColor, textTransform:"uppercase", letterSpacing:0.8, textAlign:"left", background:t.thBg, borderBottom:`1px solid ${t.borderSub}` };
  const TD = { padding:"12px 14px", fontSize:13, color:t.tdColor, borderBottom:`1px solid ${t.borderSub}` };
  return (
    <div style={{ padding:isMobile?14:32, maxWidth:1400, animation:"fadeIn .3s ease" }}>
      <style>{"@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}"}</style>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:isMobile?20:22, fontWeight:800, color:t.textPrimary, letterSpacing:-0.6, margin:0 }}>Waitlist</h1>
        <p style={{ color:t.textSecondary, fontSize:13, marginTop:4 }}>{waitlist.length} customers waiting</p>
      </div>
      {waitlist.length===0 ? <EmptyState icon="⏳" title="Waitlist is empty" subtitle="Customers who cannot get a slot will appear here" /> : isMobile ? (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {waitlist.map((wl,i)=>(
            <div key={i} style={{ background:t.cardBg, borderRadius:14, border:`1px solid ${t.border}`, padding:"14px 16px", boxShadow:t.cardShadow }}>
              <div style={{ fontWeight:700, fontSize:15, color:t.textPrimary, marginBottom:4 }}>{wl.Name}</div>
              <a href={whatsappLink(wl.Phone)} target="_blank" rel="noreferrer" style={{ fontSize:13, color:"#22c55e", fontWeight:600, textDecoration:"none", display:"block", marginBottom:6 }}>{formatPhone(wl.Phone)} 💬</a>
              <div style={{ fontSize:12, color:t.textSecondary }}>{wl.Service} · {wl["Preferred Day"]}</div>
              <div style={{ fontSize:12, color:t.textMuted, marginTop:4 }}>Added: {formatDate(wl["Date Added"])}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background:t.cardBg, borderRadius:18, border:`1px solid ${t.border}`, boxShadow:t.cardShadow, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["Name","Phone","Email","Preferred Day","Service","Date Added"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {waitlist.map((wl,i)=>(
                <tr key={i} style={{transition:"background .12s"}} onMouseEnter={e=>e.currentTarget.style.background=t.rowHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{...TD,fontWeight:600}}>{wl.Name}</td>
                  <td style={TD}><a href={whatsappLink(wl.Phone)} target="_blank" rel="noreferrer" style={{color:"#22c55e",fontWeight:600,textDecoration:"none"}}>{formatPhone(wl.Phone)} 💬</a></td>
                  <td style={TD}>{wl.Email}</td>
                  <td style={TD}>{wl["Preferred Day"]}</td>
                  <td style={TD}>{wl.Service}</td>
                  <td style={TD}>{formatDate(wl["Date Added"])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
