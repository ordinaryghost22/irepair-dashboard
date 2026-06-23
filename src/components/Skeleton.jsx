import { useTheme } from "../context/ThemeContext";
export default function Skeleton({ rows=6 }) {
  const { theme:t } = useTheme();
  const s = { borderRadius:10, background:t.border, marginBottom:10, animation:"pulse 1.5s ease infinite" };
  return (
    <div style={{ padding:32 }}>
      <div style={{ ...s, height:28, width:180, marginBottom:24 }} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
        {[...Array(4)].map((_,i)=><div key={i} style={{ ...s, height:96, borderRadius:16, animationDelay:i*0.1+"s" }} />)}
      </div>
      {[...Array(rows)].map((_,i)=><div key={i} style={{ ...s, height:44, opacity:1-i*0.12, animationDelay:i*0.08+"s" }} />)}
      <style>{"@keyframes pulse{0%,100%{opacity:.6}50%{opacity:.25}}"}</style>
    </div>
  );
}
