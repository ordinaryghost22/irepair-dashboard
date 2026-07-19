import {
  LayoutDashboard,
  ClipboardList,
  Receipt,
  Clock,
  Users,
  Hourglass,
  MessageSquare,
  BarChart3,
  ScrollText,
  Shield,
  Settings,
  LogOut,
  Sparkles,
  X,
  Banknote,
  UserRound,
  CalendarClock,
} from "lucide-react";

/** Single icon style for the whole app — outlined stroke, consistent weight */
export const ICON_STROKE = 1.75;
export const ICON_SIZE_NAV = 18;
export const ICON_SIZE_STAT = 22;
export const ICON_SIZE_FAB = 22;

const strokeProps = { strokeWidth: ICON_STROKE, absoluteStrokeWidth: false };

export const NAV_ICONS = {
  "/": LayoutDashboard,
  "/bookings": ClipboardList,
  "/invoices": Receipt,
  "/cash": Banknote,
  "/slots": Clock,
  "/leads": Users,
  "/waitlist": Hourglass,
  "/chats": MessageSquare,
  "/analytics": BarChart3,
  "/audit": ScrollText,
  "/security": Shield,
  "/settings": Settings,
};

export function NavIcon({ path, size = ICON_SIZE_NAV, color = "currentColor" }) {
  const Icon = NAV_ICONS[path] || LayoutDashboard;
  return <Icon size={size} color={color} {...strokeProps} />;
}

export function BrandSparkle({ size = 20, color = "currentColor" }) {
  return <Sparkles size={size} color={color} {...strokeProps} />;
}

export function LogoutIcon({ size = ICON_SIZE_NAV }) {
  return <LogOut size={size} {...strokeProps} />;
}

export function CloseIcon({ size = 18 }) {
  return <X size={size} {...strokeProps} />;
}

export function StatIconBookings({ size = ICON_SIZE_STAT }) {
  return <ClipboardList size={size} color="rgba(255,255,255,0.95)" {...strokeProps} />;
}

export function StatIconLeads({ size = ICON_SIZE_STAT }) {
  return <UserRound size={size} color="rgba(255,255,255,0.95)" {...strokeProps} />;
}

export function StatIconSlots({ size = ICON_SIZE_STAT }) {
  return <CalendarClock size={size} color="rgba(255,255,255,0.95)" {...strokeProps} />;
}

export function StatIconRevenue({ size = ICON_SIZE_STAT }) {
  return <Banknote size={size} color="rgba(255,255,255,0.95)" {...strokeProps} />;
}

export function StatIconCash({ size = ICON_SIZE_STAT }) {
  return <Banknote size={size} color="rgba(255,255,255,0.95)" {...strokeProps} />;
}

export function FabSparkle({ size = ICON_SIZE_FAB }) {
  return <Sparkles size={size} {...strokeProps} />;
}
