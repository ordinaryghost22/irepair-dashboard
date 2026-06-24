import { useState } from "react";
import { useStore } from "../store/useStore";
import { useTheme } from "../context/ThemeContext";
import Skeleton from "../components/Skeleton";
import { useMobile } from "../hooks/useMobile";
import HourglassLoader from "../components/HourglassLoader";

function exportCSV(data) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(","), ...data.map(row=>keys.map(k=>JSON.stringify(row[k]??"")).join(","))].join("\n");
  const a = document.createElement("a"); a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv); a.download="slots.csv"; a.click();
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function CalendarView({ slots, theme: t, dark }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isMobile = useMobile();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const slotsByDate = {};
  slots.forEach(s => {
    if (!s.Date) return;
    if (!slotsByDate[s.Date]) slotsByDate[s.Date] = [];
    slotsByDate[s.Date].push(s);
  });

  const formatDate = (d) => {
    const dd = String(d).padStart(2, "0");
    const mm = String(month + 1).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  const getDotColor = (dateStr) => {
    const daySlots = slotsByDate[dateStr];
    if (!daySlots || daySlots.length === 0) return null;
    const hasAvailable = daySlots.some(s => s.Status === "Available");
    const hasBooked = daySlots.some(s => s.Status !== "Available");
    if (hasAvailable && hasBooked) return "mixed";
    if (hasAvailable) return "available";
    return "booked";
  };

  const cells = [];
  const startOffset = (firstDay + 6) % 7;
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedDateStr = selectedDay ? formatDate(selectedDay) : null;
  const selectedSlots = selectedDateStr ? (slotsByDate[selectedDateStr] || []) : [];

  return (
    <div>
      <style>{`
        @media(min-width:769px){
          .slots-cal-grid{display:grid!important;grid-template-columns:1fr 320px!important;gap:20px!important}
          .slots-day-panel{display:block!important}
        }
        @media(max-width:768px){
          .slots-cal-grid{display:block!important}
          .slots-day-panel{margin-top:14px!important}
        }
      `}</style>
      <div className="slots-cal-grid">
        {/* Calendar */}
        <div style={{ background:t.cardBg, borderRadius:18, border:`1px solid ${t.border}`, padding:20, boxShadow:t.cardShadow }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <button onClick={prevMonth} style={{ width:36, height:36, borderRadius:10, border:`1px solid ${t.border}`, background:t.cardBg2, color:t.textPrimary, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
            <div style={{ fontWeight:800, fontSize:16, color:t.textPrimary }}>{MONTHS[month]} {year}</div>
            <button onClick={nextMonth} style={{ width:36, height:36, borderRadius:10, border:`1px solid ${t.border}`, background:t.cardBg2, color:t.textPrimary, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:6 }}>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
              <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:t.textMuted, textTransform:"uppercase", letterSpacing:.6, padding:"4px 0" }}>{d}</div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = formatDate(day);
              const dot = getDotColor(dateStr);
              const isToday = today.getDate()===day && today.getMonth()===month && today.getFullYear()===year;
              const isSelected = selectedDay === day;
              const daySlots = slotsByDate[dateStr] || [];
              return (
                <div key={i} onClick={() => setSelectedDay(isSelected ? null : day)}
                  style={{ aspectRatio:"1", borderRadius:10, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all .15s", position:"relative",
                    background: isSelected ? "linear-gradient(135deg,#667eea,#764ba2)" : isToday ? "rgba(102,126,234,0.2)" : "transparent",
                    border: isToday && !isSelected ? "1px solid rgba(102,126,234,0.4)" : "1px solid transparent",
                  }}
                  onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background=dark?"rgba(255,255,255,0.06)":"rgba(102,126,234,0.08)"; }}
                  onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background=isToday?"rgba(102,126,234,0.2)":"transparent"; }}
                >
                  <span style={{ fontSize:12, fontWeight:isToday||isSelected?700:400, color:isSelected?"#fff":isToday?"#818cf8":t.textPrimary }}>{day}</span>
                  {dot && (
                    <div style={{ display:"flex", gap:2, marginTop:2 }}>
                      {dot === "available" && <span style={{ width:4, height:4, borderRadius:"50%", background:"#43e97b", display:"inline-block" }} />}
                      {dot === "booked"    && <span style={{ width:4, height:4, borderRadius:"50%", background:"#ff7675", display:"inline-block" }} />}
                      {dot === "mixed"     && <><span style={{ width:4, height:4, borderRadius:"50%", background:"#43e97b", display:"inline-block" }} /><span style={{ width:4, height:4, borderRadius:"50%", background:"#ff7675", display:"inline-block" }} /></>}
                    </div>
                  )}
                  {daySlots.length > 0 && (
                    <span style={{ position:"absolute", top:2, right:2, fontSize:8, fontWeight:700, background:"rgba(102,126,234,0.2)", color:"#818cf8", borderRadius:4, padding:"1px 3px" }}>{daySlots.length}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display:"flex", gap:14, marginTop:16, paddingTop:14, borderTop:`1px solid ${t.border}`, flexWrap:"wrap" }}>
            {[["#43e97b","Available"],["#ff7675","Booked"],["#818cf8","Today"]].map(([c,l]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:t.textMuted }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:c, display:"inline-block" }} />{l}
              </div>
            ))}
          </div>
        </div>

        {/* Day detail panel */}
        <div className="slots-day-panel" style={{ background:t.cardBg, borderRadius:18, border:`1px solid ${t.border}`, padding:18, boxShadow:t.cardShadow }}>
          {!selectedDay ? (
            <div style={{ height:"100%", minHeight:160, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:20 }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📅</div>
              <div style={{ fontWeight:700, fontSize:14, color:t.textPrimary, marginBottom:6 }}>Select a date</div>
              <div style={{ fontSize:13, color:t.textMuted }}>Tap any date to see slots</div>
            </div>
          ) : (
            <>
              <div style={{ fontWeight:800, fontSize:15, color:t.textPrimary, marginBottom:4 }}>{MONTHS[month]} {selectedDay}, {year}</div>
              <div style={{ fontSize:12, color:t.textMuted, marginBottom:14 }}>{selectedSlots.length} slot{selectedSlots.length!==1?"s":""} on this day</div>
              {selectedSlots.length === 0 ? (
                <div style={{ textAlign:"center", padding:"32px 0", color:t.textMuted, fontSize:13 }}>No slots on this date</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {selectedSlots.map((s,i) => (
                    <div key={i} style={{ padding:"12px 14px", borderRadius:12, background:s.Status==="Available"?"rgba(67,233,123,0.1)":"rgba(255,118,117,0.1)", border:`1px solid ${s.Status==="Available"?"rgba(67,233,123,0.25)":"rgba(255,118,117,0.25)"}` }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:s["Booked By"]?6:0 }}>
                        <span style={{ fontWeight:700, fontSize:14, color:t.textPrimary }}>{s.Time}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:s.Status==="Available"?"#43e97b":"#ff7675", background:s.Status==="Available"?"rgba(67,233,123,0.15)":"rgba(255,118,117,0.15)", padding:"3px 8px", borderRadius:20 }}>{s.Status}</span>
                      </div>
                      {s["Booked By"] && <div style={{ fontSize:12, color:t.textMuted }}>👤 {s["Booked By"]}</div>}
                      {s.Phone && <div style={{ fontSize:12, color:t.textMuted }}>📞 {s.Phone}</div>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Slots() {
  const slots = useStore(s => s.slots);
  const loading = useStore(s => s.loading);
  const { theme: t, dark } = useTheme();
  const [search, setSearch] = useState("");
  const [view, setView] = useState("calendar");
  if (loading) return <HourglassLoader />;

  const available = slots.filter(s=>s.Status==="Available").length;
  const filtered = slots.filter(s => s.Day?.toLowerCase().includes(search.toLowerCase()) || s["Booked By"]?.toLowerCase().includes(search.toLowerCase()));

  const cardStyle = { background:t.cardBg, borderRadius:18, border:`1px solid ${t.border}`, boxShadow:t.cardShadow };
  const TH = { padding:"10px 12px", fontSize:11, fontWeight:700, color:t.thColor, textTransform:"uppercase", letterSpacing:0.8, textAlign:"left", background:t.thBg, borderBottom:`1px solid ${t.borderSub}` };
  const TD = { padding:"12px 12px", fontSize:13, color:t.tdColor, borderBottom:`1px solid ${t.borderSub}` };

  return (
    <div style={{ padding:"20px 16px", maxWidth:1400, animation:"fadeIn .3s ease" }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:768px){
          .slots-header{flex-direction:column!important;gap:10px!important;align-items:flex-start!important}
          .slots-header-btns{width:100%!important}
          .slots-header-btns button{flex:1!important}
          .slots-statgrid{max-width:100%!important}
        }
      `}</style>
      <div className="slots-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:t.textPrimary, letterSpacing:-0.6, margin:0 }}>Slots</h1>
          <p style={{ color:t.textMuted, fontSize:13, marginTop:5 }}>{available} available · {slots.length-available} booked</p>
        </div>
        <div className="slots-header-btns" style={{ display:"flex", gap:8 }}>
          <button onClick={()=>setView(view==="table"?"calendar":"table")} style={{ padding:"9px 14px", borderRadius:12, border:`1px solid ${t.border}`, background:t.cardBg, color:t.textSecondary, fontWeight:600, fontSize:13, cursor:"pointer" }}>
            {view==="table"?"📅 Calendar":"📋 Table"}
          </button>
          <button onClick={()=>exportCSV(slots)} style={{ padding:"9px 14px", borderRadius:12, border:`1px solid ${t.border}`, background:t.cardBg, color:t.textSecondary, fontWeight:600, fontSize:13, cursor:"pointer" }}>⬇ Export</button>
        </div>
      </div>

      <div className="slots-statgrid" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:20, maxWidth:480 }}>
        {[{ label:"Available", value:available, icon:"✅", gradient:"linear-gradient(135deg,#43e97b,#38f9d7)", glow:"rgba(67,233,123,.3)" },
          { label:"Booked", value:slots.length-available, icon:"🔒", gradient:"linear-gradient(135deg,#ff4757,#c0392b)", glow:"rgba(255,71,87,.3)" }].map(c=>(
          <div key={c.label} style={{ ...cardStyle, padding:"16px 18px", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:13, background:c.gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:"0 6px 20px "+c.glow, flexShrink:0 }}>{c.icon}</div>
            <div>
              <div style={{ fontSize:22, fontWeight:800, color:t.textPrimary }}>{c.value}</div>
              <div style={{ fontSize:12, color:t.textMuted, fontWeight:500 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {view === "calendar" ? (
        <CalendarView slots={slots} theme={t} dark={dark} />
      ) : (
        <>
          <div style={{ position:"relative", marginBottom:14 }}>
            <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, opacity:.35 }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search slots..."
              style={{ width:"100%", padding:"11px 16px 11px 42px", borderRadius:12, background:t.inputBg, border:`1px solid ${t.border}`, fontSize:14, color:t.textPrimary, outline:"none" }}
              onFocus={e=>e.target.style.border="1px solid #667eea"} onBlur={e=>e.target.style.border=`1px solid ${t.border}`} />
          </div>
          <div style={{ ...cardStyle, overflow:"hidden" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", minWidth:480 }}>
                <thead><tr>{["ID","Day","Date","Time","Status","Booked By","Phone"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.length===0
                    ? <tr><td colSpan={7} style={{ padding:"40px", textAlign:"center", color:t.textMuted, fontSize:14 }}>No slots found</td></tr>
                    : filtered.map((s,i)=>(
                      <tr key={i} style={{ transition:"background .12s" }} onMouseEnter={e=>e.currentTarget.style.background=t.rowHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{ ...TD, fontFamily:"monospace", fontSize:11, color:t.textMuted }}>{s.ID}</td>
                        <td style={{ ...TD, fontWeight:600 }}>{s.Day}</td>
                        <td style={TD}>{s.Date}</td>
                        <td style={TD}>{s.Time}</td>
                        <td style={TD}>
                          <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:600, background:s.Status==="Available"?"rgba(67,233,123,0.15)":"rgba(255,118,117,0.15)", color:s.Status==="Available"?"#43e97b":"#ff7675" }}>
                            <span style={{ width:5, height:5, borderRadius:"50%", background:s.Status==="Available"?"#43e97b":"#ff7675", display:"inline-block" }} />{s.Status}
                          </span>
                        </td>
                        <td style={TD}>{s["Booked By"]||"—"}</td>
                        <td style={TD}>{s.Phone ? <a href={"https://wa.me/92"+(s.Phone||"").replace(/[^0-9]/g,"").replace(/^0/,"")} target="_blank" rel="noreferrer" style={{ color:"#00b894", fontWeight:600, textDecoration:"none" }}>{s.Phone} 💬</a> : "—"}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
