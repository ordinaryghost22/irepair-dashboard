import { useTheme } from "../context/ThemeContext";
export default function Modal({ open, onClose, children, maxWidth=460 }) {
  const { theme:t } = useTheme();
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{"@keyframes popIn{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}"}</style>
      <div onClick={e=>e.stopPropagation()} style={{ background:t.cardBg, borderRadius:24, padding:32, width:"100%", maxWidth, boxShadow:"0 32px 80px rgba(0,0,0,0.35)", animation:"popIn .2s ease", border:`1px solid ${t.border}` }}>
        {children}
      </div>
    </div>
  );
}
