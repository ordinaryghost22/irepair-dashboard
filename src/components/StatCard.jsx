import { useTheme } from "../context/ThemeContext";
export default function StatCard({ label, value, icon, gradient, glow, sub, onClick }) {
  const { theme:t } = useTheme();
  return (
    <div onClick={onClick} style={{ background:t.cardBg, borderRadius:18, padding:"20px 22px", border:`1px solid ${t.border}`, boxShadow:t.cardShadow, display:"flex", alignItems:"center", gap:16, cursor:onClick?"pointer":"default", transition:"transform .15s, box-shadow .15s" }}
      onMouseEnter={e=>{ if(onClick){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(0,0,0,0.12)";} }}
      onMouseLeave={e=>{ if(onClick){e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=t.cardShadow;} }}
    >
      <div style={{ width:50, height:50, borderRadius:15, flexShrink:0, background:gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:`0 6px 24px ${glow}` }}>{icon}</div>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:27, fontWeight:800, color:t.textPrimary, letterSpacing:-1 }}>{value}</div>
        <div style={{ fontSize:12, color:t.textSecondary, marginTop:2, fontWeight:500 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:"#22c55e", marginTop:2, fontWeight:600 }}>{sub}</div>}
      </div>
    </div>
  );
}
