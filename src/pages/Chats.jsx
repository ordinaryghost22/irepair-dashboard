import { useStore } from "../store/useStore";
import { useTheme } from "../context/ThemeContext";
import Skeleton from "../components/Skeleton";
import EmptyState from "../components/EmptyState";

export default function Chats() {
  const chats = useStore(s => s.chats);
  const loading = useStore(s => s.loading);
  const { theme:t } = useTheme();
  if (loading) return <Skeleton />;
  return (
    <div style={{ padding:"20px 16px", maxWidth:900, animation:"fadeIn .3s ease" }}>
      <style>{"@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}"}</style>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:t.textPrimary, letterSpacing:-0.6, margin:0 }}>Chats</h1>
        <p style={{ color:t.textSecondary, fontSize:13, marginTop:5 }}>{chats.length} conversations</p>
      </div>
      {chats.length===0 ? <EmptyState icon="💬" title="No chats yet" subtitle="Customer bot conversations will show up here" /> : chats.map((chat,i)=>(
        <div key={i} style={{ background:t.cardBg, borderRadius:18, border:`1px solid ${t.border}`, boxShadow:t.cardShadow, padding:18, marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:8 }}>
            <span style={{ background:"linear-gradient(135deg,#667eea,#764ba2)", color:"#fff", fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20 }}>Session {chat["Session ID"]}</span>
            <span style={{ fontSize:12, color:t.textMuted }}>{chat.Timestamp}</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex" }}>
              <div style={{ background:t.cardBg2, border:`1px solid ${t.border}`, borderRadius:"18px 18px 18px 4px", padding:"12px 14px", maxWidth:"80%" }}>
                <div style={{ fontSize:11, color:t.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:.7, marginBottom:5 }}>Customer</div>
                <div style={{ fontSize:14, color:t.textPrimary, lineHeight:1.5 }}>{chat["Customer Message"]}</div>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <div style={{ background:"linear-gradient(135deg,#667eea,#764ba2)", borderRadius:"18px 18px 4px 18px", padding:"12px 14px", maxWidth:"80%" }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.55)", fontWeight:700, textTransform:"uppercase", letterSpacing:.7, marginBottom:5 }}>Bot</div>
                <div style={{ fontSize:14, color:"#fff", lineHeight:1.5 }}>{chat["Bot Reply"]}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
