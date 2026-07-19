import { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const API = "https://irepair-backend-production.up.railway.app";

const DEVICES = [
  { id: "iphone-16-pro-max", model: "iPhone 16 Pro Max", tier: "Flagship" },
  { id: "iphone-16-pro",     model: "iPhone 16 Pro",     tier: "Flagship" },
  { id: "iphone-16",         model: "iPhone 16",         tier: "Premium" },
  { id: "iphone-15-pro-max", model: "iPhone 15 Pro Max", tier: "Flagship" },
  { id: "iphone-15-pro",     model: "iPhone 15 Pro",     tier: "Flagship" },
  { id: "iphone-15",         model: "iPhone 15",         tier: "Premium" },
  { id: "iphone-14-pro-max", model: "iPhone 14 Pro Max", tier: "Flagship" },
  { id: "iphone-14-pro",     model: "iPhone 14 Pro",     tier: "Premium" },
  { id: "iphone-14",         model: "iPhone 14",         tier: "Premium" },
  { id: "iphone-13-pro-max", model: "iPhone 13 Pro Max", tier: "Premium" },
  { id: "iphone-13-pro",     model: "iPhone 13 Pro",     tier: "Premium" },
  { id: "iphone-13",         model: "iPhone 13",         tier: "Mid" },
  { id: "iphone-12-pro-max", model: "iPhone 12 Pro Max", tier: "Premium" },
  { id: "iphone-12-pro",     model: "iPhone 12 Pro",     tier: "Mid" },
  { id: "iphone-12",         model: "iPhone 12",         tier: "Mid" },
  { id: "iphone-11-pro-max", model: "iPhone 11 Pro Max", tier: "Mid" },
  { id: "iphone-11",         model: "iPhone 11",         tier: "Mid" },
  { id: "iphone-se-2022",    model: "iPhone SE (2022)",  tier: "Budget" },
  { id: "iphone-xr",         model: "iPhone XR",         tier: "Budget" },
  { id: "samsung-s24-ultra", model: "Samsung Galaxy S24 Ultra", tier: "Flagship" },
  { id: "samsung-s24",       model: "Samsung Galaxy S24",       tier: "Premium" },
  { id: "samsung-s23-ultra", model: "Samsung Galaxy S23 Ultra", tier: "Flagship" },
  { id: "samsung-s23",       model: "Samsung Galaxy S23",       tier: "Premium" },
  { id: "samsung-s22",       model: "Samsung Galaxy S22",       tier: "Mid" },
  { id: "samsung-a54",       model: "Samsung Galaxy A54",       tier: "Budget" },
  { id: "samsung-a34",       model: "Samsung Galaxy A34",       tier: "Budget" },
];

const TIER_PRICES = {
  Budget:   { "Screen Repair": 3000,  "Battery Replacement": 1500, "Software Fix": 1000, "Water Damage": 5000,  "Charging Port": 1500, "Camera Repair": 2000 },
  Mid:      { "Screen Repair": 6000,  "Battery Replacement": 2000, "Software Fix": 1500, "Water Damage": 7000,  "Charging Port": 2000, "Camera Repair": 3000 },
  Premium:  { "Screen Repair": 10000, "Battery Replacement": 3000, "Software Fix": 1500, "Water Damage": 9000,  "Charging Port": 2500, "Camera Repair": 4000 },
  Flagship: { "Screen Repair": 15000, "Battery Replacement": 4500, "Software Fix": 2000, "Water Damage": 12000, "Charging Port": 3000, "Camera Repair": 5500 },
};

const SERVICE_META = {
  "Screen Repair":       { icon: "screen",   duration: "~45 min" },
  "Battery Replacement": { icon: "battery",  duration: "~30 min" },
  "Software Fix":        { icon: "software", duration: "~20 min" },
  "Water Damage":        { icon: "water",    duration: "~2-3 days" },
  "Charging Port":       { icon: "port",     duration: "~40 min" },
  "Camera Repair":       { icon: "camera",   duration: "~45 min" },
};

const SERVICE_KEYWORDS = {
  "Screen Repair":       ["screen", "display", "glass", "crack", "broken screen", "shattered", "touch not working", "lcd"],
  "Battery Replacement": ["battery", "charge fast", "drain", "dies quickly", "doesn't hold charge", "battery health", "swollen"],
  "Software Fix":        ["software", "frozen", "slow", "app crash", "update", "virus", "restart", "stuck", "boot loop", "hang"],
  "Water Damage":        ["water", "wet", "liquid", "dropped in", "fell in", "rain", "moisture", "pool", "sink"],
  "Charging Port":       ["charging port", "charger", "not charging", "cable", "loose connector", "charging slow", "won't charge"],
  "Camera Repair":       ["camera", "photo", "lens", "blurry", "flash", "focus", "picture quality"],
};

const HEARD_FROM_OPTIONS = ["WhatsApp", "Instagram", "Google", "Walk-in", "Referral", "Facebook"];

const UTM_SOURCE_MAP = {
  google: "Google",
  facebook: "Facebook",
  instagram: "Instagram",
};

/** Read utm_source from the URL and map known values to dropdown labels. */
function captureUtmSource() {
  try {
    const raw = new URLSearchParams(window.location.search).get("utm_source");
    if (!raw || !raw.trim()) return null;
    const trimmed = raw.trim();
    return UTM_SOURCE_MAP[trimmed.toLowerCase()] || trimmed;
  } catch {
    return null;
  }
}

function suggestService(issueText) {
  if (!issueText) return null;
  const text = issueText.toLowerCase();
  let best = null, bestScore = 0;
  for (const [service, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    const score = keywords.filter(k => text.includes(k)).length;
    if (score > bestScore) { bestScore = score; best = service; }
  }
  return best;
}

function generateId() {
  return "BK-" + Date.now().toString(36).toUpperCase();
}

function WrenchIcon({ size = 24, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14.7 6.3a4 4 0 0 0-5.6 4.6L4 16l2 2 5.1-5.1a4 4 0 0 0 4.6-5.6l-2.5 2.5a1.5 1.5 0 0 1-2-2l2.5-2.5Z"
        stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

const IconBase = ({ children, size = 20, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

const ICONS = {
  screen:   (p) => <IconBase {...p}><rect x="6" y="3" width="12" height="18" rx="2" /><line x1="10" y1="19" x2="14" y2="19" /></IconBase>,
  battery:  (p) => <IconBase {...p}><rect x="3" y="8" width="16" height="8" rx="1.5" /><line x1="21" y1="10.5" x2="21" y2="13.5" /><line x1="7" y1="11" x2="7" y2="13" /></IconBase>,
  software: (p) => <IconBase {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></IconBase>,
  water:    (p) => <IconBase {...p}><path d="M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11Z" /></IconBase>,
  port:     (p) => <IconBase {...p}><rect x="7" y="9" width="10" height="7" rx="1.5" /><line x1="10" y1="4" x2="10" y2="9" /><line x1="14" y1="4" x2="14" y2="9" /></IconBase>,
  camera:   (p) => <IconBase {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="12" cy="13.5" r="3.3" /><path d="M9 7l1.2-2h3.6L15 7" /></IconBase>,
  check:    (p) => <IconBase {...p}><path d="M20 6 9 17l-5-5" /></IconBase>,
  bolt:     (p) => <IconBase {...p}><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></IconBase>,
  lock:     (p) => <IconBase {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></IconBase>,
  camera2:  (p) => <IconBase {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="12" cy="13.5" r="3.3" /></IconBase>,
  phone:    (p) => <IconBase {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6.3 6.3l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z" /></IconBase>,
  user:     (p) => <IconBase {...p}><circle cx="12" cy="8" r="3.5" /><path d="M4 20c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5" /></IconBase>,
  email:    (p) => <IconBase {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" /></IconBase>,
  chip:     (p) => <IconBase {...p}><rect x="7" y="7" width="10" height="10" rx="1.5" /><line x1="7" y1="3" x2="7" y2="7" /><line x1="12" y1="3" x2="12" y2="7" /><line x1="17" y1="3" x2="17" y2="7" /><line x1="7" y1="17" x2="7" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /><line x1="17" y1="17" x2="17" y2="21" /><line x1="3" y1="7" x2="7" y2="7" /><line x1="3" y1="12" x2="7" y2="12" /><line x1="3" y1="17" x2="7" y2="17" /><line x1="17" y1="7" x2="21" y2="7" /><line x1="17" y1="12" x2="21" y2="12" /><line x1="17" y1="17" x2="21" y2="17" /></IconBase>,
  chat:     (p) => <IconBase {...p}><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" /></IconBase>,
};

function Icon({ name, size = 20, color }) {
  const render = ICONS[name];
  return render ? render({ size, color }) : null;
}

function CustomSelect({ value, onChange, options, placeholder, t, dark, style }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <div onClick={() => setOpen(o => !o)} style={{ ...style, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", color: selected ? t.textPrimary : t.textMuted }}>
        <span>{selected ? selected.label : placeholder}</span>
        <span style={{ fontSize: 11, color: t.textMuted, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>▾</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20, background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 12, maxHeight: 240, overflowY: "auto", boxShadow: dark ? "0 16px 40px rgba(0,0,0,0.5)" : "0 16px 40px rgba(0,0,0,0.15)" }}>
          {options.map(o => (
            <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }} style={{ padding: "11px 15px", fontSize: 14.5, cursor: "pointer", color: o.value === value ? t.accent : t.textPrimary, fontWeight: o.value === value ? 600 : 400, background: o.value === value ? (dark ? "rgba(102,126,234,0.12)" : "#eef1ff") : "transparent" }}
              onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = dark ? "rgba(255,255,255,0.05)" : "#f8f9fe"; }}
              onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = "transparent"; }}
            >{o.label}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function DevicePicker({ value, tier, onSelect, t, dark, style }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { setQuery(value || ""); }, [value]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const matches = query.trim().length < 1 ? [] : DEVICES.filter(d => d.model.toLowerCase().includes(query.toLowerCase())).slice(0, 6);

  function pick(device) {
    setQuery(device.model);
    onSelect(device.model, device.tier);
    setOpen(false);
  }

  function handleTyping(v) {
    setQuery(v);
    setOpen(true);
    onSelect(v, null);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        style={style}
        value={query}
        onChange={e => handleTyping(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Start typing… e.g. iPhone 16 Pro Max"
      />
      {tier && (
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 10.5, fontWeight: 700, color: t.accent, background: dark ? "rgba(102,126,234,0.15)" : "#eef1ff", padding: "3px 8px", borderRadius: 999 }}>{tier}</span>
      )}
      {open && matches.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20, background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 12, maxHeight: 220, overflowY: "auto", boxShadow: dark ? "0 16px 40px rgba(0,0,0,0.5)" : "0 16px 40px rgba(0,0,0,0.15)" }}>
          {matches.map(d => (
            <div key={d.id} onClick={() => pick(d)} style={{ padding: "11px 15px", fontSize: 14, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.05)" : "#f8f9fe"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ color: t.textPrimary }}>{d.model}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: t.textMuted }}>{d.tier}</span>
            </div>
          ))}
        </div>
      )}
      {query.trim().length > 0 && !tier && !open && (
        <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 6 }}>
          Not in our list yet — no worries, we'll quote you a price after reviewing your request.
        </div>
      )}
    </div>
  );
}

export default function PublicBooking() {
  const { theme: t, dark, toggle } = useTheme();

  const [step, setStep] = useState(1);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState("");

  const [utmSource] = useState(() => captureUtmSource());
  const [form, setForm] = useState({
    name: "", phone: "", email: "", device: "", deviceTier: null, imei: "",
    issue: "", contactPref: "WhatsApp", heardFrom: utmSource || "", backupConfirmed: false, passcodeAtDropoff: false,
    service: "", date: "", time: "", notes: "", photo: null, photoPreview: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [suggestedService, setSuggestedService] = useState(null);
  const [showOptional, setShowOptional] = useState(false);
  const utmLocked = Boolean(utmSource);

  useEffect(() => {
    async function loadSlots() {
      try {
        const res = await fetch(`${API}/slots`);
        if (!res.ok) throw new Error("fail");
        const data = await res.json();
        setSlots(Array.isArray(data) ? data.filter(s => s.Status === "Available") : []);
      } catch {
        setSlotsError("Couldn't load live availability — pick your preferred time and we'll confirm by phone.");
      } finally {
        setLoadingSlots(false);
      }
    }
    loadSlots();
  }, []);

  function handleChange(field, value) { setForm(f => ({ ...f, [field]: value })); }
  function handleDeviceSelect(model, tier) { setForm(f => ({ ...f, device: model, deviceTier: tier })); }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, photo: file, photoPreview: reader.result }));
    reader.readAsDataURL(file);
  }

  const slotsByDate = {};
  slots.forEach(s => { if (!s.Date) return; (slotsByDate[s.Date] ||= []).push(s.Time); });
  const availableDates = Object.keys(slotsByDate).sort();
  const tierPrices = form.deviceTier ? TIER_PRICES[form.deviceTier] : null;

  function validateStep(n) {
    if (n === 1) {
      if (!form.name.trim() || !form.phone.trim() || !form.device.trim() || !form.issue.trim()) {
        setError("Please fill in your name, phone, device, and what's wrong with it.");
        return false;
      }
    }
    if (n === 2) {
      if (!form.service || !form.date || !form.time) {
        setError("Please pick a service, date, and time.");
        return false;
      }
    }
    if (n === 3) {
      if (!form.backupConfirmed) {
        setError("Please confirm you understand the data backup note before submitting.");
        return false;
      }
    }
    setError("");
    return true;
  }

  function nextStep() {
    if (!validateStep(step)) return;
    if (step === 1) {
      const suggestion = suggestService(form.issue);
      if (suggestion) {
        setSuggestedService(suggestion);
        if (!form.service) handleChange("service", suggestion);
      }
    }
    setStep(s => s + 1);
  }
  function prevStep() { setError(""); setStep(s => s - 1); }

  async function handleSubmit() {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;
    setSubmitting(true);
    setError("");

    const calculatedAmount =
      form.deviceTier && form.service && TIER_PRICES[form.deviceTier]
        ? TIER_PRICES[form.deviceTier][form.service]
        : null;

    const booking = {
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      device: form.device,
      service: form.service,
      issue: form.issue,
      date: form.date,
      time: form.time,
      status: "Pending",
      payment_status: "Unpaid",
      notes: form.notes || null,
      ...(form.heardFrom ? { source: form.heardFrom } : {}),
      ...(calculatedAmount != null ? { amount: calculatedAmount } : {}),
    };

    try {
      const res = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = typeof err.detail === "string" ? err.detail : null;
        if (res.status === 409) {
          throw new Error(detail || "This slot is no longer available, please choose another.");
        }
        if (res.status === 400) {
          throw new Error(detail || "Please check your phone number and try again.");
        }
        throw new Error(detail || `Server returned ${res.status}`);
      }
      setDone(true);
    } catch (err) {
      setError(err.message || "Something went wrong sending your request. Please try again, or message us directly.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "13px 15px", borderRadius: 12,
    background: dark ? "rgba(255,255,255,0.04)" : "#f8f9fe",
    border: `1.5px solid ${t.border}`,
    color: t.textPrimary, fontSize: 14.5, outline: "none",
    transition: "border-color .15s, box-shadow .15s",
  };
  const focusHandlers = {
    onFocus: e => { e.target.style.border = `1.5px solid ${t.accent}`; e.target.style.boxShadow = `0 0 0 4px ${t.accentGlow}`; },
    onBlur:  e => { e.target.style.border = `1.5px solid ${t.border}`; e.target.style.boxShadow = "none"; },
  };
  const label = { display: "block", fontSize: 12, fontWeight: 700, color: t.textSecondary, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 };

  const bgBlobs = (
    <>
      <div className="blob1" style={{ position: "fixed", top: "-10%", left: "-5%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(102,126,234,0.2),transparent 70%)", filter: "blur(20px)", pointerEvents: "none" }} />
      <div className="blob2" style={{ position: "fixed", bottom: "-15%", right: "-10%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.16),transparent 70%)", filter: "blur(20px)", pointerEvents: "none" }} />
    </>
  );

  const globalStyle = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    *{box-sizing:border-box;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeUpSm{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes popIn{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes drift1{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,20px)}}
    @keyframes drift2{0%,100%{transform:translate(0,0)}50%{transform:translate(-25px,-15px)}}
    @keyframes borderShift{0%{background-position:0% 50%}100%{background-position:200% 50%}}
    .blob1{animation:drift1 14s ease-in-out infinite;}
    .blob2{animation:drift2 16s ease-in-out infinite;}
  `;

  const trustStrip = (
    <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 26, animation: "fadeUpSm .4s ease .1s both" }}>
      {[["check", "No account needed"], ["bolt", "Instant confirmation"], ["lock", "Info stays private"]].map(([icon, txt]) => (
        <span key={txt} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: t.textMuted, fontWeight: 600, background: t.cardBg, border: `1px solid ${t.border}`, padding: "6px 12px", borderRadius: 999 }}>
          <Icon name={icon} size={12} color={t.accent} />{txt}
        </span>
      ))}
    </div>
  );

  const themeToggle = (
    <button onClick={toggle} title={dark ? "Switch to light mode" : "Switch to dark mode"} style={{ position: "fixed", top: 20, right: 20, zIndex: 3, width: 40, height: 40, borderRadius: 12, background: t.cardBg, border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, cursor: "pointer", boxShadow: dark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.06)" }}>{dark ? "☀️" : "🌙"}</button>
  );

  const checkboxRow = (checked, onChange, text) => (
    <div onClick={() => onChange(!checked)} style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", padding: "12px 14px", background: dark ? "rgba(255,255,255,0.03)" : "#f8f9fe", borderRadius: 12, border: `1px solid ${checked ? t.accent : t.border}` }}>
      <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1, border: `1.5px solid ${checked ? t.accent : t.border}`, background: checked ? t.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>
        {checked && "✓"}
      </div>
      <span style={{ fontSize: 12.5, color: t.textSecondary, lineHeight: 1.5 }}>{text}</span>
    </div>
  );

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: t.pageBg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter',system-ui,sans-serif", position: "relative", overflow: "hidden" }}>
        <style>{globalStyle}</style>
        {bgBlobs}{themeToggle}
        <div style={{ background: t.cardBg, borderRadius: 24, border: `1px solid ${t.border}`, padding: "48px 36px", maxWidth: 440, textAlign: "center", position: "relative", zIndex: 1, boxShadow: dark ? "0 30px 80px rgba(0,0,0,0.5)" : "0 30px 80px rgba(99,102,241,0.15)", animation: "popIn .35s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <div style={{ width: 76, height: 76, margin: "0 auto 22px", borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, boxShadow: "0 12px 32px rgba(34,197,94,0.4)" }}>✓</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, marginBottom: 10, letterSpacing: -0.4 }}>Request sent!</div>
          <div style={{ fontSize: 14.5, color: t.textSecondary, lineHeight: 1.7 }}>
            We've received your request for <strong style={{ color: t.textPrimary }}>{form.device}</strong> — {form.service} on{" "}
            <strong style={{ color: t.textPrimary }}>{form.date}</strong> at <strong style={{ color: t.textPrimary }}>{form.time}</strong>.
          </div>
          {form.email && (
            <div style={{ marginTop: 14, padding: "12px 16px", background: dark ? "rgba(34,197,94,0.1)" : "#f0fdf4", borderRadius: 12, fontSize: 13, color: "#16a34a", fontWeight: 600, border: "1px solid rgba(34,197,94,0.2)" }}>
              📧 Confirmation email sent to {form.email}
            </div>
          )}
          <div style={{ marginTop: 12, padding: "12px 16px", background: dark ? "rgba(102,126,234,0.1)" : "#eef1ff", borderRadius: 12, fontSize: 13, color: t.accent, fontWeight: 600 }}>
            📱 We'll also confirm on {form.phone} via {form.contactPref} shortly
          </div>
        </div>
      </div>
    );
  }

  const STEPS = ["You & Device", "Service & Time", "Review"];

  return (
    <div style={{ minHeight: "100vh", background: t.pageBg, fontFamily: "'Inter',system-ui,sans-serif", padding: "56px 16px 60px", position: "relative", overflow: "hidden" }}>
      <style>{globalStyle}</style>
      {bgBlobs}{themeToggle}

      <div style={{ maxWidth: 520, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 24, animation: "fadeUp .4s ease" }}>
          <div style={{ width: 60, height: 60, margin: "0 auto 18px", borderRadius: 18, background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 36px rgba(102,126,234,0.45)" }}><WrenchIcon size={26} /></div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: t.textPrimary, letterSpacing: -0.8, margin: 0 }}>Book a Repair</h1>
          <p style={{ color: t.textSecondary, fontSize: 14.5, fontWeight: 400, marginTop: 8, lineHeight: 1.5 }}>Tell us about your device — takes under a minute</p>
        </div>

        {trustStrip}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22, animation: "fadeUpSm .4s ease .15s both" }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 4, background: t.border, overflow: "hidden" }}>
                <div style={{ height: "100%", width: step > i + 1 ? "100%" : step === i + 1 ? "55%" : "0%", background: "linear-gradient(90deg,#667eea,#764ba2)", transition: "width .35s ease" }} />
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: step === i + 1 ? t.accent : t.textMuted, marginTop: 6, textAlign: "center" }}>{s}</div>
            </div>
          ))}
        </div>

        <div key={step} style={{ background: t.cardBg, borderRadius: 22, border: `1px solid ${t.border}`, padding: 30, position: "relative", overflow: "hidden", boxShadow: dark ? "0 24px 60px rgba(0,0,0,0.4)" : "0 24px 60px rgba(99,102,241,0.1)", animation: "fadeUp .3s ease" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg,#667eea,#764ba2,#667eea,#764ba2)", backgroundSize: "200% 100%", animation: "borderShift 6s linear infinite" }} />

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: 18 }}>
                <label style={label}>Your Name</label>
                <input style={inputStyle} {...focusHandlers} value={form.name} onChange={e => handleChange("name", e.target.value)} placeholder="Ali Hassan" />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={label}>Phone Number</label>
                <input style={inputStyle} {...focusHandlers} value={form.phone} onChange={e => handleChange("phone", e.target.value)} placeholder="0300-1234567" />
              </div>

              {/* ── EMAIL FIELD ── */}
              <div style={{ marginBottom: 18 }}>
                <label style={label}>
                  Email Address{" "}
                  <span style={{ textTransform: "none", fontWeight: 400, color: t.textMuted }}>(optional — for booking confirmation)</span>
                </label>
                <input
                  type="email"
                  style={inputStyle}
                  {...focusHandlers}
                  value={form.email}
                  onChange={e => handleChange("email", e.target.value)}
                  placeholder="you@email.com"
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={label}>Preferred Contact</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["WhatsApp", "Call"].map(opt => (
                    <button key={opt} onClick={() => handleChange("contactPref", opt)} style={{
                      flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer",
                      border: `1.5px solid ${form.contactPref === opt ? t.accent : t.border}`,
                      background: form.contactPref === opt ? (dark ? "rgba(102,126,234,0.12)" : "#eef1ff") : "transparent",
                      color: form.contactPref === opt ? t.accent : t.textSecondary,
                      fontSize: 13, fontWeight: 600,
                    }}>{opt === "WhatsApp" ? "💬 WhatsApp" : "📞 Call"}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={label}>Device (Brand & Model)</label>
                <DevicePicker value={form.device} tier={form.deviceTier} onSelect={handleDeviceSelect} t={t} dark={dark} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={label}>What's wrong with it?</label>
                <textarea style={{ ...inputStyle, resize: "vertical" }} {...focusHandlers} rows={3} value={form.issue} onChange={e => handleChange("issue", e.target.value)} placeholder="e.g. Screen cracked after a drop, still turns on fine" />
              </div>

              <button onClick={() => setShowOptional(o => !o)} style={{
                display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer",
                padding: "8px 0", fontSize: 12.5, fontWeight: 600, color: t.accent,
              }}>
                {showOptional ? "− Hide" : "+ Add"} optional details (photo, IMEI{utmLocked ? "" : ", how you found us"})
              </button>

              {showOptional && (
                <div style={{ marginTop: 4, animation: "fadeUpSm .2s ease" }}>
                  <div style={{ marginBottom: 16, marginTop: 12 }}>
                    <label style={label}>Photo of the damage</label>
                    <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: `1.5px dashed ${t.border}`, cursor: "pointer", background: dark ? "rgba(255,255,255,0.02)" : "#f8f9fe" }}>
                      {form.photoPreview ? (
                        <img src={form.photoPreview} alt="preview" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
                      ) : (
                        <Icon name="camera2" size={18} color={t.textMuted} />
                      )}
                      <span style={{ fontSize: 12.5, color: t.textSecondary }}>{form.photo ? form.photo.name : "Tap to add a photo"}</span>
                      <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
                    </label>
                  </div>
                  <div style={{ marginBottom: utmLocked ? 0 : 16 }}>
                    <label style={label}>IMEI / Serial</label>
                    <input style={inputStyle} {...focusHandlers} value={form.imei} onChange={e => handleChange("imei", e.target.value)} placeholder="Found in Settings → About" />
                  </div>
                  {!utmLocked && (
                    <div>
                      <label style={label}>Heard about us from?</label>
                      <CustomSelect t={t} dark={dark} style={inputStyle} value={form.heardFrom} onChange={v => handleChange("heardFrom", v)} placeholder="Select…"
                        options={HEARD_FROM_OPTIONS.map(o => ({ value: o, label: o }))} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <label style={{ ...label, marginBottom: 4 }}>Choose a Service</label>
              {suggestedService && (
                <div style={{ fontSize: 12, color: t.accent, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  ✨ Based on what you told us, we think it's <strong>{suggestedService}</strong> — feel free to change it
                </div>
              )}
              {!form.deviceTier && (
                <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 14, padding: "10px 13px", background: dark ? "rgba(255,255,255,0.03)" : "#f8f9fe", borderRadius: 10, border: `1px solid ${t.border}` }}>
                  ℹ️ Prices shown are estimates — since your exact device isn't in our list, we'll confirm a final price when we review your request.
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20, marginTop: suggestedService ? 0 : 4 }}>
                {Object.keys(SERVICE_META).map(service => {
                  const meta = SERVICE_META[service];
                  const price = tierPrices ? tierPrices[service] : null;
                  const selected = form.service === service;
                  const isSuggested = suggestedService === service && !selected;
                  return (
                    <div key={service} onClick={() => handleChange("service", service)} style={{
                      padding: "14px 14px", borderRadius: 14, cursor: "pointer", position: "relative",
                      border: `1.5px solid ${selected ? t.accent : isSuggested ? t.accent + "80" : t.border}`,
                      background: selected ? (dark ? "rgba(102,126,234,0.12)" : "#eef1ff") : (dark ? "rgba(255,255,255,0.03)" : "#f8f9fe"),
                      transition: "all .15s", boxShadow: selected ? `0 0 0 4px ${t.accentGlow}` : "none",
                    }}>
                      {selected && <div style={{ position: "absolute", top: 10, right: 10, width: 18, height: 18, borderRadius: "50%", background: t.accent, color: "#fff", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", animation: "popIn .2s ease" }}>✓</div>}
                      {isSuggested && <div style={{ position: "absolute", top: 8, right: 8, fontSize: 9, fontWeight: 700, color: t.accent, background: dark ? "rgba(102,126,234,0.15)" : "#eef1ff", padding: "2px 7px", borderRadius: 999 }}>SUGGESTED</div>}
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: selected ? t.accent : (dark ? "rgba(255,255,255,0.06)" : "#eef1ff"), display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                        <Icon name={meta.icon} size={17} color={selected ? "#fff" : t.accent} />
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: t.textPrimary, marginBottom: 3 }}>{service}</div>
                      <div style={{ fontSize: 12, color: t.textSecondary, fontWeight: 600 }}>{price ? `₨${price.toLocaleString()}` : "Get a Quote"}</div>
                      <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{meta.duration}</div>
                    </div>
                  );
                })}
              </div>

              {loadingSlots ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: t.textMuted, marginBottom: 18 }}>
                  <span style={{ width: 14, height: 14, border: `2px solid ${t.border}`, borderTopColor: t.accent, borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  Loading available times…
                </div>
              ) : availableDates.length > 0 ? (
                <>
                  <div style={{ marginBottom: 18 }}>
                    <label style={label}>Date</label>
                    <CustomSelect t={t} dark={dark} style={inputStyle} value={form.date} onChange={v => handleChange("date", v)} placeholder="Select a date…"
                      options={availableDates.map(d => ({ value: d, label: d }))} />
                  </div>
                  {form.date && (
                    <div style={{ marginBottom: 6 }}>
                      <label style={label}>Time</label>
                      <CustomSelect t={t} dark={dark} style={inputStyle} value={form.time} onChange={v => handleChange("time", v)} placeholder="Select a time…"
                        options={slotsByDate[form.date].map(time => ({ value: time, label: time }))} />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {slotsError && (
                    <div style={{ fontSize: 12.5, color: t.accent, marginBottom: 16, padding: "11px 14px", background: dark ? "rgba(102,126,234,0.1)" : "#eef1ff", borderRadius: 12, border: `1px solid ${dark ? "rgba(102,126,234,0.2)" : "#dde4ff"}`, fontWeight: 500 }}>
                      ℹ️ {slotsError}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <label style={label}>Preferred Date</label>
                      <input type="date" style={inputStyle} {...focusHandlers} value={form.date} onChange={e => handleChange("date", e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={label}>Preferred Time</label>
                      <input type="time" style={inputStyle} {...focusHandlers} value={form.time} onChange={e => handleChange("time", e.target.value)} />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <label style={{ ...label, marginBottom: 12 }}>Review Your Request</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {[
                  ["user",    "Name",       form.name],
                  ["phone",   "Phone",      `${form.phone} (${form.contactPref})`],
                  ["email",   "Email",      form.email || "Not provided"],
                  ["screen",  "Device",     form.device + (form.deviceTier ? ` · ${form.deviceTier}` : "")],
                  ["software","Issue",      form.issue],
                  [SERVICE_META[form.service]?.icon || "screen", "Service", `${form.service}${tierPrices ? ` — ₨${tierPrices[form.service]?.toLocaleString()}` : " — Quote pending"}`],
                  ["bolt",    "Date & Time",`${form.date} at ${form.time}`],
                  ["camera2", "Photo",      form.photo ? form.photo.name : "Not attached"],
                ].map(([icon, k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", background: dark ? "rgba(255,255,255,0.03)" : "#f8f9fe", borderRadius: 12, border: `1px solid ${t.border}` }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: dark ? "rgba(255,255,255,0.06)" : "#eef1ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={icon} size={14} color={t.accent} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.6 }}>{k}</div>
                      <div style={{ fontSize: 13.5, color: t.textPrimary, fontWeight: 600, marginTop: 2 }}>{v || "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {checkboxRow(form.backupConfirmed, v => handleChange("backupConfirmed", v), "I understand my device's data may be affected during repair and it's my responsibility to back it up.")}
                {checkboxRow(form.passcodeAtDropoff, v => handleChange("passcodeAtDropoff", v), "I'll provide my device passcode at drop-off so it can be tested (never share it here).")}
              </div>
              <div style={{ marginBottom: 6 }}>
                <label style={label}>Anything else? <span style={{ textTransform: "none", fontWeight: 400, color: t.textMuted }}>(optional)</span></label>
                <textarea style={{ ...inputStyle, resize: "vertical" }} {...focusHandlers} rows={2} value={form.notes} onChange={e => handleChange("notes", e.target.value)} placeholder="Anything extra we should know?" />
              </div>
            </>
          )}

          {error && (
            <div style={{ marginTop: 16, padding: "12px 15px", background: t.name === "dark" ? "rgba(239,68,68,0.12)" : "#FEF2F2", color: "#ef4444", borderRadius: 12, fontSize: 13, fontWeight: 500, border: `1px solid ${t.name === "dark" ? "rgba(239,68,68,0.25)" : "#fca5a5"}` }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            {step > 1 && (
              <button onClick={prevStep} style={{ padding: "15px 20px", borderRadius: 14, border: `1.5px solid ${t.border}`, background: "transparent", color: t.textSecondary, fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}>← Back</button>
            )}
            {step < 3 ? (
              <button onClick={nextStep} style={{ flex: 1, padding: "15px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 12px 32px rgba(102,126,234,0.4)", transition: "transform .15s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >Continue →</button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: "15px", borderRadius: 14, border: "none", background: submitting ? "rgba(102,126,234,0.5)" : "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: submitting ? "wait" : "pointer", boxShadow: submitting ? "none" : "0 12px 32px rgba(102,126,234,0.4)", transition: "transform .15s" }}
                onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { if (!submitting) e.currentTarget.style.transform = "translateY(0)"; }}
              >{submitting ? "Sending…" : "Confirm Request ✓"}</button>
            )}
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: t.textMuted, marginTop: 22 }}>Powered by iRepair</p>
      </div>
    </div>
  );
}