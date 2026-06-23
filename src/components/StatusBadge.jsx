import { useTheme } from "../context/ThemeContext";
import { STATUS_COLORS } from "../constants";
export default function StatusBadge({ status }) {
  const { dark } = useTheme();
  const cfg = STATUS_COLORS[status] || STATUS_COLORS.default;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:600, background:dark?cfg.darkBg:cfg.bg, color:dark?cfg.darkColor:cfg.color }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:dark?cfg.darkColor:cfg.dot, display:"inline-block" }} />
      {status}
    </span>
  );
}
