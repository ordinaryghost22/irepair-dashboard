import { useStore } from "../store/useStore";
import { useTheme } from "../context/ThemeContext";
import Skeleton from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { formatDate, formatPhone, whatsappLink } from "../utils/format";
import { useMobile } from "../hooks/useMobile";
import HourglassLoader from "../components/HourglassLoader";

export default function Waitlist() {
  const waitlist = useStore(s => s.waitlist);
  const loading = useStore(s => s.loading);
  const { theme:t } = useTheme();
  if (loading) return <HourglassLoader />;
  const TH = { padding:"10px 12px", fontSize:11, fontWeight:700, color:t.thColor, textTransform:"uppercase", letterSpacing:0.8, textAlign:"left", background:t.thBg, borderBottom:`1px solid ${t.borderSub}` };
  const TD = { padding:"12px 12px", fontSize:13, color:t.tdColor, borderBottom:`1px solid ${t.borderSub}` };
  return (
    <div style={{ padding:"20px 16px", maxWidth:1400, animation:"fadeIn .3s ease" }}>
      <style>{"@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}"}</style>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:t.textPrimary, letterSpacing:-0.6, margin:0 }}>Waitlist</h1>
        <p style={{ color:t.textSecondary, fontSize:13, marginTop:5 }}>{waitlist.length} customers waiting</p>
      </div>
      {waitlist.length===0 ? <EmptyState icon="⏳" title="Waitlist is empty" subtitle="Customers who cannot get a slot will appear here" /> : (
        <div style={{ background:t.cardBg, borderRadius:18, border:`1px solid ${t.border}`, boxShadow:t.cardShadow, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:400 }}>
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
        </div>
      )}
    </div>
  );
}
