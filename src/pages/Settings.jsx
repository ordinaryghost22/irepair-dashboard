import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { SERVICE_PRICES } from "../constants";
import { useMobile } from "../hooks/useMobile";
import HourglassLoader from "../components/HourglassLoader";

export default function Settings() {
  const { theme:t, dark, toggle } = useTheme();
  const [saved,  setSaved]  = useState(false);
  const [prices, setPrices] = useState(SERVICE_PRICES);
  const isMobile = useMobile();

  const section = { background:t.cardBg, borderRadius:18, border:`1px solid ${t.border}`, boxShadow:t.cardShadow, padding:"22px 20px", marginBottom:16 };
  const sTitle  = { fontWeight:700, fontSize:14, color:t.textPrimary, marginBottom:20, paddingBottom:14, borderBottom:`1px solid ${t.borderSub}` };

  const field = (label, defaultValue, type="text") => (
    <div key={label}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:t.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:7 }}>{label}</label>
      <input type={type} defaultValue={defaultValue}
        style={{ width:"100%", padding:"12px 14px", borderRadius:12, background:t.inputBg, border:`1px solid ${t.border}`, color:t.textPrimary, fontSize:14, outline:"none", transition:"border .2s" }}
        onFocus={e=>e.target.style.border=`1px solid ${t.accent}`} onBlur={e=>e.target.style.border=`1px solid ${t.border}`} />
    </div>
  );

  return (
    <div style={{ padding:"20px 16px", maxWidth:720, animation:"fadeIn .3s ease" }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:768px){
          .settings-grid{grid-template-columns:1fr!important}
        }
        @media(min-width:769px){
          .settings-grid{grid-template-columns:1fr 1fr!important}
        }
      `}</style>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:t.textPrimary, letterSpacing:-0.6, margin:0 }}>Settings</h1>
        <p style={{ color:t.textSecondary, fontSize:13, marginTop:5 }}>Manage your shop details and preferences</p>
      </div>

      {/* Appearance */}
      <div style={section}>
        <div style={sTitle}>🎨 Appearance</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:t.cardBg2, borderRadius:14, border:`1px solid ${t.border}` }}>
          <div>
            <div style={{ fontWeight:600, color:t.textPrimary, fontSize:14 }}>{dark?"Dark Mode":"Light Mode"}</div>
            <div style={{ color:t.textMuted, fontSize:12, marginTop:3 }}>{dark?"Switch to clean light theme":"Switch to deep dark theme"}</div>
          </div>
          <div onClick={toggle} style={{ width:52, height:28, borderRadius:14, background:dark?"linear-gradient(135deg,#667eea,#764ba2)":"#e2e8f0", cursor:"pointer", position:"relative", transition:"all .25s", flexShrink:0 }}>
            <div style={{ position:"absolute", top:3, left:dark?26:3, width:22, height:22, borderRadius:"50%", background:"#fff", boxShadow:"0 2px 6px rgba(0,0,0,0.2)", transition:"left .25s" }} />
          </div>
        </div>
      </div>

      {/* Shop Info */}
      <div style={section}>
        <div style={sTitle}>🏪 Shop Information</div>
        <div className="settings-grid" style={{ display:"grid", gap:16 }}>
          {field("Shop Name","iRepair Shop")}
          {field("Phone","+92 300 0000000")}
          {field("Email","owner@irepair.com","email")}
          {field("Address","Lahore, Pakistan")}
          {field("City","Lahore")}
          {field("Opening Hours","10:00 AM – 8:00 PM")}
        </div>
      </div>

      {/* Service Prices */}
      <div style={section}>
        <div style={sTitle}>💰 Service Prices (₨)</div>
        <div className="settings-grid" style={{ display:"grid", gap:14 }}>
          {Object.entries(prices).map(([service,price])=>(
            <div key={service}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:t.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:7 }}>{service}</label>
              <input type="number" value={price} onChange={e=>setPrices(p=>({...p,[service]:+e.target.value}))}
                style={{ width:"100%", padding:"12px 14px", borderRadius:12, background:t.inputBg, border:`1px solid ${t.border}`, color:t.textPrimary, fontSize:14, outline:"none" }}
                onFocus={e=>e.target.style.border=`1px solid ${t.accent}`} onBlur={e=>e.target.style.border=`1px solid ${t.border}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div style={section}>
        <div style={sTitle}>🔐 Change Password</div>
        <div className="settings-grid" style={{ display:"grid", gap:16 }}>
          {field("Current Password","","password")}
          {field("New Password","","password")}
        </div>
      </div>

      <button onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2500);}} style={{ padding:"13px 32px", borderRadius:14, border:"none", background:saved?"linear-gradient(135deg,#22c55e,#16a34a)":"linear-gradient(135deg,#667eea,#764ba2)", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", boxShadow:saved?"0 6px 24px rgba(34,197,94,.35)":"0 6px 24px rgba(102,126,234,.35)", transition:"all .3s", width:"100%" }}>
        {saved ? "✓ Saved!" : "Save Changes"}
      </button>
    </div>
  );
}
