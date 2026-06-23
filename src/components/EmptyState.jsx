import { useTheme } from "../context/ThemeContext";
export default function EmptyState({ icon="📭", title, subtitle, action, onAction }) {
  const { theme:t } = useTheme();
  return (
    <div style={{ background:t.cardBg, borderRadius:18, border:`1px solid ${t.border}`, padding:"72px 24px", textAlign:"center", boxShadow:t.cardShadow }}>
      <div style={{ fontSize:52, marginBottom:16, lineHeight:1 }}>{icon}</div>
      <div style={{ color:t.textPrimary, fontWeight:700, fontSize:16, marginBottom:6 }}>{title}</div>
      {subtitle && <div style={{ color:t.textMuted, fontSize:13, marginBottom:action?20:0 }}>{subtitle}</div>}
      {action && onAction && (
        <button onClick={onAction} style={{ padding:"10px 24px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#667eea,#764ba2)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", boxShadow:"0 4px 16px rgba(102,126,234,.3)" }}>{action}</button>
      )}
    </div>
  );
}
