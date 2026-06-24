import { useMemo, useState } from "react";
import { useStore } from "../store/useStore";
import { useTheme } from "../context/ThemeContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, AreaChart, Area, Cell, PieChart, Pie, Legend } from "recharts";
import Skeleton from "../components/Skeleton";
import { SERVICE_PRICES } from "../constants";

const DAYS_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export default function Analytics() {
  const bookings = useStore(s => s.bookings);
  const leads    = useStore(s => s.leads);
  const chats    = useStore(s => s.chats);
  const loading  = useStore(s => s.loading);
  const { theme:t } = useTheme();
  const [tab, setTab] = useState("overview");

  const tip = { contentStyle:{ borderRadius:12, border:`1px solid ${t.border}`, background:t.cardBg, color:t.textPrimary, fontSize:13 } };

  const analytics = useMemo(() => {
    const dayCount = Array(7).fill(0);
    bookings.forEach(b => { if (!b.Date) return; const d = new Date(b.Date); if (!isNaN(d)) dayCount[d.getDay()]++; });
    const busyDays = DAYS_FULL.map((day, i) => ({ day: day.slice(0,3), full:day, count: dayCount[i] }));
    const maxDay   = Math.max(...dayCount, 1);

    const hourCount = {};
    bookings.forEach(b => { if (!b.Time) return; const h = b.Time.split(":")[0] + ":00"; hourCount[h] = (hourCount[h] || 0) + 1; });
    const busyHours = Object.entries(hourCount).sort().map(([h,c]) => ({ hour:h, count:c }));

    const svcCount = {};
    bookings.forEach(b => { if(b.Service) svcCount[b.Service] = (svcCount[b.Service]||0)+1; });
    const services = Object.entries(svcCount).sort(([,a],[,b])=>b-a).map(([name,count]) => ({
      name, count, revenue: (SERVICE_PRICES[name]||0) * bookings.filter(b=>b.Service===name&&b.Status==="Confirmed").length
    }));

    const revByMonth = {};
    bookings.filter(b=>b.Status==="Confirmed").forEach(b => {
      if (!b.Date) return; const d = new Date(b.Date); if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      revByMonth[key] = (revByMonth[key]||0) + (SERVICE_PRICES[b.Service]||0);
    });
    const revenueByMonth = Object.entries(revByMonth).sort().slice(-6).map(([m,rev]) => ({ month:m.slice(5), rev }));

    const total     = bookings.length;
    const confirmed = bookings.filter(b=>b.Status==="Confirmed").length;
    const rejected  = bookings.filter(b=>b.Status==="Rejected").length;
    const pending   = bookings.filter(b=>b.Status==="Pending").length;
    const convRate  = total ? Math.round((confirmed/total)*100) : 0;

    const keywords = {};
    const stopWords = new Set(["i","the","a","is","my","to","it","and","of","in","for","what","how","can","do","you","me","we"]);
    chats.forEach(c => {
      const msg = (c["Customer Message"]||"").toLowerCase();
      msg.split(/[^a-z]+/).filter(w=>w.length>3&&!stopWords.has(w)).forEach(w => { keywords[w] = (keywords[w]||0)+1; });
    });
    const topKeywords = Object.entries(keywords).sort(([,a],[,b])=>b-a).slice(0,10).map(([word,count])=>({word,count}));

    const phoneBookings = {};
    bookings.forEach(b => { if (!b.Phone) return; phoneBookings[b.Phone] = (phoneBookings[b.Phone]||0)+1; });
    const returning  = Object.values(phoneBookings).filter(c=>c>1).length;
    const oneTime    = Object.values(phoneBookings).filter(c=>c===1).length;
    const retention  = Object.keys(phoneBookings).length ? Math.round((returning/Object.keys(phoneBookings).length)*100) : 0;

    const weeklyMap = {};
    bookings.forEach(b => {
      if (!b.Date) return; const d = new Date(b.Date); if (isNaN(d)) return;
      const week = `W${Math.ceil(d.getDate()/7)}-${d.getMonth()+1}`;
      weeklyMap[week] = (weeklyMap[week]||0)+1;
    });
    const weekly = Object.entries(weeklyMap).sort().slice(-8).map(([w,c])=>({week:w,count:c}));

    return { busyDays, maxDay, busyHours, services, revenueByMonth, total, confirmed, rejected, pending, convRate, topKeywords, returning, oneTime, retention, weekly };
  }, [bookings, leads, chats]);

  if (loading) return <Skeleton />;

  const card = { background:t.cardBg, borderRadius:18, padding:"20px 18px", border:`1px solid ${t.border}`, boxShadow:t.cardShadow };
  const cardTitle = { fontWeight:700, fontSize:15, color:t.textPrimary, marginBottom:16 };
  const TABS = ["overview","bookings","revenue","customers","chats"];

  return (
    <div style={{ padding:"20px 16px", maxWidth:1400, animation:"fadeIn .3s ease" }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:768px){
          .an-kpi{grid-template-columns:1fr 1fr!important}
          .an-2col{grid-template-columns:1fr!important}
          .an-3col{grid-template-columns:1fr 1fr!important}
          .an-funnel{grid-template-columns:1fr!important}
          .an-loyalty{grid-template-columns:1fr!important}
        }
        @media(min-width:769px){
          .an-kpi{grid-template-columns:repeat(5,1fr)!important}
          .an-2col{grid-template-columns:1fr 1fr!important}
          .an-3col{grid-template-columns:repeat(3,1fr)!important}
          .an-funnel{grid-template-columns:repeat(3,1fr)!important}
          .an-loyalty{grid-template-columns:200px 1fr!important}
        }
      `}</style>

      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:t.textPrimary, letterSpacing:-0.6, margin:0 }}>Advanced Analytics</h1>
        <p style={{ color:t.textSecondary, fontSize:13, marginTop:5 }}>Deep insights into your business performance</p>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
        {TABS.map(tb => (
          <button key={tb} onClick={()=>setTab(tb)} style={{ padding:"8px 16px", borderRadius:10, fontSize:12, fontWeight:600, cursor:"pointer", transition:"all .15s", textTransform:"capitalize",
            background:tab===tb?"linear-gradient(135deg,#667eea,#764ba2)":t.cardBg,
            color:tab===tb?"#fff":t.textSecondary, border:tab===tb?"1px solid transparent":`1px solid ${t.border}`,
            boxShadow:tab===tb?"0 4px 16px rgba(102,126,234,.3)":"none",
          }}>{tb}</button>
        ))}
      </div>

      {tab==="overview" && (
        <div style={{ display:"grid", gap:16 }}>
          <div className="an-kpi" style={{ display:"grid", gap:12 }}>
            {[
              { label:"Total Bookings", value:analytics.total,   icon:"📋", color:"#667eea" },
              { label:"Confirmed",      value:analytics.confirmed,icon:"✅", color:"#22c55e" },
              { label:"Pending",        value:analytics.pending,  icon:"⏳", color:"#eab308" },
              { label:"Conv. Rate",     value:analytics.convRate+"%",icon:"📈",color:"#06b6d4" },
              { label:"Retention",      value:analytics.retention+"%",icon:"🔄",color:"#f43f5e" },
            ].map(k => (
              <div key={k.label} style={{ ...card, display:"flex", alignItems:"center", gap:12, padding:"16px 14px" }}>
                <div style={{ width:40, height:40, borderRadius:12, background:`${k.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{k.icon}</div>
                <div>
                  <div style={{ fontSize:22, fontWeight:800, color:t.textPrimary }}>{k.value}</div>
                  <div style={{ fontSize:11, color:t.textMuted, fontWeight:500 }}>{k.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="an-2col" style={{ display:"grid", gap:16 }}>
            <div style={card}>
              <div style={cardTitle}>📅 Busiest Days</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {analytics.busyDays.map(d => (
                  <div key={d.day} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:32, fontSize:12, fontWeight:600, color:t.textSecondary }}>{d.day}</div>
                    <div style={{ flex:1, height:24, borderRadius:6, background:t.cardBg2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${(d.count/analytics.maxDay)*100}%`, borderRadius:6, background:"linear-gradient(135deg,#667eea,#764ba2)", minWidth:d.count>0?6:0 }} />
                    </div>
                    <div style={{ width:20, fontSize:12, fontWeight:700, color:t.textPrimary, textAlign:"right" }}>{d.count}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <div style={cardTitle}>⏰ Peak Hours</div>
              {analytics.busyHours.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={analytics.busyHours} barSize={20}>
                    <XAxis dataKey="hour" tick={{fontSize:10,fill:t.textMuted}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize:10,fill:t.textMuted}} axisLine={false} tickLine={false} />
                    <Tooltip {...tip} />
                    <Bar dataKey="count" fill="#667eea" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{height:180,display:"flex",alignItems:"center",justifyContent:"center",color:t.textMuted,fontSize:13}}>No time data yet</div>}
            </div>
          </div>
        </div>
      )}

      {tab==="bookings" && (
        <div style={{ display:"grid", gap:16 }}>
          <div className="an-2col" style={{ display:"grid", gap:16 }}>
            <div style={card}>
              <div style={cardTitle}>🔧 Service Popularity</div>
              {analytics.services.length > 0 ? (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {analytics.services.map((s,i) => (
                    <div key={s.name}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:t.textPrimary }}>{s.name}</span>
                        <span style={{ fontSize:12, color:t.textMuted }}>{s.count}</span>
                      </div>
                      <div style={{ height:8, borderRadius:4, background:t.cardBg2 }}>
                        <div style={{ height:"100%", borderRadius:4, width:`${(s.count/analytics.services[0].count)*100}%`, background:["#667eea","#22c55e","#eab308","#ef4444","#06b6d4","#f43f5e"][i%6] }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div style={{color:t.textMuted,fontSize:13,textAlign:"center",padding:"40px 0"}}>No data yet</div>}
            </div>
            <div style={card}>
              <div style={cardTitle}>📊 Weekly Trend</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={analytics.weekly}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#667eea" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.borderSub} />
                  <XAxis dataKey="week" tick={{fontSize:10,fill:t.textMuted}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize:10,fill:t.textMuted}} axisLine={false} tickLine={false} />
                  <Tooltip {...tip} />
                  <Area type="monotone" dataKey="count" stroke="#667eea" strokeWidth={2.5} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={cardTitle}>🎯 Booking Funnel</div>
            <div className="an-funnel" style={{ display:"grid", gap:12 }}>
              {[
                { label:"Total Received", value:analytics.total, color:"#667eea", pct:100 },
                { label:"Confirmed",      value:analytics.confirmed, color:"#22c55e", pct:analytics.total?Math.round(analytics.confirmed/analytics.total*100):0 },
                { label:"Rejected",       value:analytics.rejected,  color:"#ef4444", pct:analytics.total?Math.round(analytics.rejected/analytics.total*100):0 },
              ].map(f => (
                <div key={f.label} style={{ background:t.cardBg2, borderRadius:14, padding:18, border:`1px solid ${t.border}`, textAlign:"center" }}>
                  <div style={{ fontSize:28, fontWeight:800, color:f.color }}>{f.value}</div>
                  <div style={{ fontSize:12, color:t.textSecondary, marginTop:4 }}>{f.label}</div>
                  <div style={{ marginTop:10, height:6, borderRadius:3, background:t.border }}>
                    <div style={{ height:"100%", borderRadius:3, width:`${f.pct}%`, background:f.color }} />
                  </div>
                  <div style={{ fontSize:11, color:t.textMuted, marginTop:5 }}>{f.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="revenue" && (
        <div style={{ display:"grid", gap:16 }}>
          <div style={card}>
            <div style={cardTitle}>💰 Revenue by Month (₨)</div>
            {analytics.revenueByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analytics.revenueByMonth} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.borderSub} vertical={false} />
                  <XAxis dataKey="month" tick={{fontSize:12,fill:t.textMuted}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize:11,fill:t.textMuted}} axisLine={false} tickLine={false} tickFormatter={v=>"₨"+v.toLocaleString()} />
                  <Tooltip {...tip} formatter={v=>["₨"+v.toLocaleString(),"Revenue"]} />
                  <Bar dataKey="rev" radius={[8,8,0,0]}>
                    {analytics.revenueByMonth.map((_,i) => (
                      <Cell key={i} fill={i===analytics.revenueByMonth.length-1?"#22c55e":"#667eea"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{color:t.textMuted,fontSize:13,textAlign:"center",padding:"60px 0"}}>No revenue data yet</div>}
          </div>
          <div className="an-2col" style={{ display:"grid", gap:16 }}>
            <div style={card}>
              <div style={cardTitle}>🔧 Revenue by Service</div>
              {analytics.services.filter(s=>s.revenue>0).length > 0 ? (
                analytics.services.filter(s=>s.revenue>0).map(s => (
                  <div key={s.name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${t.borderSub}` }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:t.textPrimary }}>{s.name}</div>
                      <div style={{ fontSize:11, color:t.textMuted }}>{s.count} bookings</div>
                    </div>
                    <div style={{ fontSize:15, fontWeight:800, color:"#22c55e" }}>₨{s.revenue.toLocaleString()}</div>
                  </div>
                ))
              ) : <div style={{color:t.textMuted,fontSize:13,textAlign:"center",padding:"40px 0"}}>No confirmed bookings yet</div>}
            </div>
            <div style={card}>
              <div style={cardTitle}>📊 Summary</div>
              {[
                { label:"Confirmed Revenue", value:"₨"+analytics.services.reduce((s,x)=>s+x.revenue,0).toLocaleString(), color:"#22c55e" },
                { label:"Conversion Rate",   value:analytics.convRate+"%", color:"#667eea" },
                { label:"Avg. Booking Value", value:"₨"+(analytics.confirmed?Math.round(analytics.services.reduce((s,x)=>s+x.revenue,0)/analytics.confirmed):0).toLocaleString(), color:"#06b6d4" },
              ].map(r => (
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:`1px solid ${t.borderSub}` }}>
                  <span style={{ fontSize:13, color:t.textSecondary }}>{r.label}</span>
                  <span style={{ fontSize:15, fontWeight:800, color:r.color }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="customers" && (
        <div style={{ display:"grid", gap:16 }}>
          <div className="an-3col" style={{ display:"grid", gap:12 }}>
            {[
              { label:"Unique Customers", value:analytics.returning+analytics.oneTime, icon:"👥", color:"#667eea" },
              { label:"Returning", value:analytics.returning, icon:"🔄", color:"#22c55e" },
              { label:"Retention Rate", value:analytics.retention+"%", icon:"📈", color:"#f43f5e" },
            ].map(k => (
              <div key={k.label} style={{ ...card, display:"flex", alignItems:"center", gap:14, padding:"16px 14px" }}>
                <div style={{ width:44, height:44, borderRadius:14, background:`${k.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{k.icon}</div>
                <div>
                  <div style={{ fontSize:26, fontWeight:800, color:t.textPrimary }}>{k.value}</div>
                  <div style={{ fontSize:12, color:t.textMuted }}>{k.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={cardTitle}>🔄 Customer Loyalty</div>
            <div className="an-loyalty" style={{ display:"grid", gap:20, alignItems:"center" }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={[{name:"Returning",value:analytics.returning},{name:"One-time",value:analytics.oneTime}]}
                    cx="50%" cy="50%" innerRadius={50} outerRadius:75 paddingAngle={4} dataKey="value">
                    <Cell fill="#667eea" /><Cell fill="#e2e8f0" />
                  </Pie>
                  <Tooltip {...tip} />
                </PieChart>
              </ResponsiveContainer>
              <div>
                {[["#667eea","Returning",analytics.returning],["#e2e8f0","One-time",analytics.oneTime]].map(([c,l,v])=>(
                  <div key={l} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                    <div style={{ width:12, height:12, borderRadius:"50%", background:c, flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:t.textPrimary }}>{l}</div>
                      <div style={{ fontSize:11, color:t.textMuted }}>{v} customers</div>
                    </div>
                    <div style={{ fontSize:16, fontWeight:800, color:t.textPrimary }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==="chats" && (
        <div className="an-2col" style={{ display:"grid", gap:16 }}>
          <div style={card}>
            <div style={cardTitle}>💬 Most Asked Keywords</div>
            {analytics.topKeywords.length > 0 ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {analytics.topKeywords.map((k,i) => (
                  <div key={k.word} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:22, height:22, borderRadius:6, background:"linear-gradient(135deg,#667eea,#764ba2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff", flexShrink:0 }}>{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:t.textPrimary, textTransform:"capitalize" }}>{k.word}</span>
                        <span style={{ fontSize:12, color:t.textMuted }}>{k.count}x</span>
                      </div>
                      <div style={{ height:6, borderRadius:3, background:t.cardBg2 }}>
                        <div style={{ height:"100%", borderRadius:3, width:`${(k.count/analytics.topKeywords[0].count)*100}%`, background:"linear-gradient(135deg,#667eea,#764ba2)" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={{ textAlign:"center", padding:"50px 0", color:t.textMuted }}><div style={{ fontSize:36, marginBottom:10 }}>💬</div><div>No chat data yet</div></div>}
          </div>
          <div style={card}>
            <div style={cardTitle}>📊 Chat Volume</div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[
                { label:"Total Conversations", value:chats.length, icon:"💬", color:"#667eea" },
                { label:"Unique Topics",        value:analytics.topKeywords.length, icon:"🔍", color:"#22c55e" },
                { label:"Most Common Topic",    value:analytics.topKeywords[0]?.word||"—", icon:"🏆", color:"#eab308" },
              ].map(s => (
                <div key={s.label} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:t.cardBg2, borderRadius:14, border:`1px solid ${t.border}` }}>
                  <div style={{ fontSize:20 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800, color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:12, color:t.textMuted }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
