import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from "recharts";
import Skeleton from "../components/Skeleton";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { exportToCSV } from "../utils/export";
import { formatDate, inRange } from "../utils/format";
import { DATE_RANGES, SERVICE_PRICES } from "../constants";

const COLORS = ["#22c55e","#eab308","#ef4444"];

export default function Dashboard() {
  const bookings = useStore(s => s.bookings);
  const slots    = useStore(s => s.slots);
  const leads    = useStore(s => s.leads);
  const waitlist = useStore(s => s.waitlist);
  const loading  = useStore(s => s.loading);
  const { theme:t } = useTheme();
  const navigate = useNavigate();

  const [range,       setRange]       = useState("All Time");
  const [selectedDay, setSelectedDay] = useState(null);

  if (loading) return <Skeleton />;

  const filtered  = bookings.filter(b => inRange(b.Date, range));
  const confirmed = filtered.filter(b => b.Status==="Confirmed").length;
  const pending   = filtered.filter(b => b.Status==="Pending").length;
  const rejected  = filtered.filter(b => b.Status==="Rejected").length;
  const available = slots.filter(s => s.Status==="Available").length;
  const revenue   = filtered.filter(b => b.Status==="Confirmed").reduce((s,b) => s+(SERVICE_PRICES[b.Service]||0), 0);

  const pieData  = [{name:"Confirmed",value:confirmed},{name:"Pending",value:pending},{name:"Rejected",value:rejected}].filter(d=>d.value>0);
  const byDate   = {}; filtered.forEach(b=>{byDate[b.Date]=(byDate[b.Date]||0)+1;});
  const lineData = Object.entries(byDate).sort().slice(-10).map(([date,count])=>({date:date.slice(-5),count}));

  const TH = { padding:"10px 12px", fontSize:11, fontWeight:700, color:t.thColor, textTransform:"uppercase", letterSpacing:0.8, textAlign:"left", background:t.thBg, borderBottom:`1px solid ${t.borderSub}` };
  const TD = { padding:"12px 12px", fontSize:13, color:t.tdColor, borderBottom:`1px solid ${t.borderSub}` };
  const tip = { contentStyle:{ borderRadius:12, border:`1px solid ${t.border}`, background:t.cardBg, color:t.textPrimary, boxShadow:"0 4px 24px rgba(0,0,0,0.15)", fontSize:13 } };

  return (
    <div style={{ padding:"20px 16px", maxWidth:1400, animation:"fadeIn .3s ease" }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:768px){
          .dash-header{flex-direction:column!important;gap:12px!important}
          .dash-ranges{flex-wrap:wrap!important;gap:6px!important}
          .dash-statgrid{grid-template-columns:1fr 1fr!important}
          .dash-chartgrid{grid-template-columns:1fr!important}
          .dash-table th:nth-child(3),.dash-table td:nth-child(3),
          .dash-table th:nth-child(4),.dash-table td:nth-child(4){display:none}
        }
        @media(min-width:769px){
          .dash-statgrid{grid-template-columns:repeat(4,1fr)!important}
          .dash-chartgrid{grid-template-columns:1fr 1fr 280px!important}
        }
      `}</style>

      {/* Header */}
      <div className="dash-header" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:t.textPrimary, letterSpacing:-0.6, margin:0 }}>Dashboard</h1>
          <p style={{ color:t.textSecondary, fontSize:13, marginTop:5 }}>Welcome back — here is what is happening</p>
        </div>
        <div className="dash-ranges" style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {DATE_RANGES.map(r => (
            <button key={r} onClick={()=>setRange(r)} style={{ padding:"7px 12px", borderRadius:10, fontSize:12, fontWeight:600, cursor:"pointer", transition:"all .15s",
              background:range===r?"linear-gradient(135deg,#667eea,#764ba2)":t.cardBg,
              color:range===r?"#fff":t.textSecondary, border:range===r?"1px solid transparent":`1px solid ${t.border}`,
              boxShadow:range===r?"0 4px 16px rgba(102,126,234,.3)":"none", whiteSpace:"nowrap"
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="dash-statgrid" style={{ display:"grid", gap:12, marginBottom:20 }}>
        <StatCard label="Total Bookings"  value={filtered.length}               icon="📋" gradient="linear-gradient(135deg,#667eea,#764ba2)" glow="rgba(102,126,234,.4)" onClick={()=>navigate("/bookings")} />
        <StatCard label="Total Leads"     value={leads.length}                  icon="👥" gradient="linear-gradient(135deg,#f43f5e,#e11d48)"  glow="rgba(244,63,94,.35)"  onClick={()=>navigate("/leads")} />
        <StatCard label="Available Slots" value={available}                     icon="🕐" gradient="linear-gradient(135deg,#06b6d4,#0284c7)"  glow="rgba(6,182,212,.35)"  onClick={()=>navigate("/slots")} />
        <StatCard label="Est. Revenue"    value={"₨"+revenue.toLocaleString()}  icon="💰" gradient="linear-gradient(135deg,#10b981,#059669)"  glow="rgba(16,185,129,.35)" sub={confirmed+" confirmed"} />
      </div>

      {/* Charts */}
      <div className="dash-chartgrid" style={{ display:"grid", gap:16, marginBottom:20 }}>
        <div style={{ background:t.cardBg, borderRadius:18, padding:20, border:`1px solid ${t.border}`, boxShadow:t.cardShadow }}>
          <div style={{ fontWeight:700, fontSize:15, color:t.textPrimary, marginBottom:16 }}>Booking Trend</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.borderSub} />
              <XAxis dataKey="date" tick={{fontSize:10,fill:t.textMuted}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize:10,fill:t.textMuted}} axisLine={false} tickLine={false} />
              <Tooltip {...tip} />
              <Line type="monotone" dataKey="count" stroke="#667eea" strokeWidth={2.5} dot={{fill:"#667eea",r:4,strokeWidth:0}} activeDot={{r:6,strokeWidth:0}} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:t.cardBg, borderRadius:18, padding:20, border:`1px solid ${t.border}`, boxShadow:t.cardShadow }}>
          <div style={{ fontWeight:700, fontSize:15, color:t.textPrimary, marginBottom:16 }}>Status Overview</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[{Confirmed:confirmed,Pending:pending,Rejected:rejected}]} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.borderSub} vertical={false} />
              <XAxis hide /><YAxis tick={{fontSize:11,fill:t.textMuted}} axisLine={false} tickLine={false} />
              <Tooltip {...tip} />
              <Bar dataKey="Confirmed" fill="#22c55e" radius={[8,8,0,0]} />
              <Bar dataKey="Pending"   fill="#eab308" radius={[8,8,0,0]} />
              <Bar dataKey="Rejected"  fill="#ef4444" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", gap:12, marginTop:12, flexWrap:"wrap" }}>
            {[["#22c55e","Confirmed",confirmed],["#eab308","Pending",pending],["#ef4444","Rejected",rejected]].map(([c,l,v])=>(
              <div key={l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:t.textSecondary }}>
                <span style={{ width:8,height:8,borderRadius:2,background:c,display:"inline-block" }} />
                {l}: <strong style={{color:t.textPrimary,marginLeft:3}}>{v}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:t.cardBg, borderRadius:18, padding:20, border:`1px solid ${t.border}`, boxShadow:t.cardShadow }}>
          <div style={{ fontWeight:700, fontSize:15, color:t.textPrimary, marginBottom:6 }}>Status Split</div>
          {pieData.length>0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} dataKey="value">
                  {pieData.map((_,i)=><Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip {...tip} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:12,color:t.textSecondary}} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center",color:t.textMuted,fontSize:13}}>No data yet</div>}
        </div>
      </div>

      {/* Recent Bookings */}
      <div style={{ background:t.cardBg, borderRadius:18, border:`1px solid ${t.border}`, boxShadow:t.cardShadow, overflow:"hidden" }}>
        <div style={{ padding:"16px 16px", borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontWeight:700, fontSize:15, color:t.textPrimary }}>Recent Bookings</div>
          <button onClick={()=>exportToCSV(filtered,"bookings.csv")} style={{ padding:"7px 14px", borderRadius:9, border:`1px solid ${t.border}`, background:t.cardBg2, cursor:"pointer", fontSize:12, fontWeight:600, color:t.textSecondary }}>📥 Export</button>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table className="dash-table" style={{ width:"100%", borderCollapse:"collapse", minWidth:320 }}>
            <thead><tr>{["Name","Service","Date","Time","Status"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={5} style={{padding:"40px",textAlign:"center",color:t.textMuted,fontSize:14}}>No bookings in this range</td></tr>
                : filtered.slice(0,6).map((b,i)=>(
                  <tr key={i} style={{transition:"background .12s"}} onMouseEnter={e=>e.currentTarget.style.background=t.rowHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{...TD,fontWeight:600}}>{b.Name}</td>
                    <td style={TD}>{b.Service}</td>
                    <td style={TD}>{formatDate(b.Date)}</td>
                    <td style={TD}>{b.Time}</td>
                    <td style={TD}><StatusBadge status={b.Status} /></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
