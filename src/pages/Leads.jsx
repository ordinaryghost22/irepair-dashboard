import { useState } from "react";
import { useStore } from "../store/useStore";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useIsMobile";
import Skeleton from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { exportToCSV } from "../utils/export";
import { formatDate, formatPhone, whatsappLink, timeAgo } from "../utils/format";

export default function Leads() {
  const leads   = useStore(s => s.leads);
  const loading = useStore(s => s.loading);
  const { theme:t } = useTheme();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  if (loading) return <Skeleton />;

  const TH = { padding:"10px 14px", fontSize:11, fontWeight:700, color:t.thColor, textTransform:"uppercase", letterSpacing:0.8, textAlign:"left", background:t.thBg, borderBottom:`1px solid ${t.borderSub}` };
  const TD = { padding:"12px 14px", fontSize:13, color:t.tdColor, borderBottom:`1px solid ${t.borderSub}` };
  const filtered = leads.filter(l=>l.Name?.toLowerCase().includes(search.toLowerCase())||l.Phone?.includes(search)||l["Service Interest"]?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding:isMobile?14:32, maxWidth:1400, animation:"fadeIn .3s ease" }}>
      <style>{"@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}"}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:isMobile?20:22, fontWeight:800, color:t.textPrimary, letterSpacing:-0.6, margin:0 }}>Leads</h1>
          <p style={{ color:t.textSecondary, fontSize:13, marginTop:4 }}>{leads.length} potential customers</p>
        </div>
        <button onClick={()=>exportToCSV(filtered,"leads.csv")} style={{ padding:"9px 14px", borderRadius:12, border:`1px solid ${t.border}`, background:t.cardBg, color:t.textSecondary, fontWeight:600, fontSize:12, cursor:"pointer" }}>⬇ CSV</button>
      </div>
      <div style={{ position:"relative", marginBottom:14 }}>
        <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, color:t.textMuted }}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search leads..."
          style={{ width:"100%", padding:"11px 16px 11px 42px", borderRadius:12, background:t.inputBg, border:`1px solid ${t.border}`, fontSize:14, color:t.textPrimary, outline:"none" }}
          onFocus={e=>e.target.style.border=`1px solid ${t.accent}`} onBlur={e=>e.target.style.border=`1px solid ${t.border}`} />
      </div>

      {filtered.length===0 ? <EmptyState icon="👥" title="No leads found" subtitle="Leads from your booking bot will appear here" /> : isMobile ? (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map((l,i)=>(
            <div key={i} style={{ background:t.cardBg, borderRadius:14, border:`1px solid ${t.border}`, padding:"14px 16px", boxShadow:t.cardShadow }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontWeight:700, fontSize:15, color:t.textPrimary }}>{l.Name}</span>
                <span style={{ fontSize:11, color:t.textMuted }}>{timeAgo(l.Date)}</span>
              </div>
              <div style={{ fontSize:12, color:t.textSecondary, marginBottom:6 }}>{l["Service Interest"]} · {formatDate(l.Date)}</div>
              <a href={whatsappLink(l.Phone)} target="_blank" rel="noreferrer" style={{ fontSize:13, color:"#22c55e", fontWeight:600, textDecoration:"none" }}>{formatPhone(l.Phone)} 💬</a>
              {l.Notes && <div style={{ fontSize:12, color:t.textMuted, marginTop:6 }}>{l.Notes}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background:t.cardBg, borderRadius:18, border:`1px solid ${t.border}`, boxShadow:t.cardShadow, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["Name","Phone","Service Interest","Date","Time Ago","Notes"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((l,i)=>(
                <tr key={i} style={{transition:"background .12s"}} onMouseEnter={e=>e.currentTarget.style.background=t.rowHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{...TD,fontWeight:600}}>{l.Name}</td>
                  <td style={TD}><a href={whatsappLink(l.Phone)} target="_blank" rel="noreferrer" style={{color:"#22c55e",fontWeight:600,textDecoration:"none"}}>{formatPhone(l.Phone)} 💬</a></td>
                  <td style={TD}>{l["Service Interest"]}</td>
                  <td style={TD}>{formatDate(l.Date)}</td>
                  <td style={{...TD,color:t.textMuted,fontSize:12}}>{timeAgo(l.Date)}</td>
                  <td style={{...TD,color:t.textMuted}}>{l.Notes||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
