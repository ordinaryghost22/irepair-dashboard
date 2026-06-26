import { useState } from "react";
import { useStore } from "../store/useStore";
import { useTheme } from "../context/ThemeContext";

const WEBHOOK = import.meta.env.VITE_N8N_BOOKING_WEBHOOK;

const EMPTY_FORM = {
  id: "",
  name: "",
  phone: "",
  device: "",
  issue: "",
  date: "",
  time: "",
  paymentStatus: "Unpaid",
  notes: "",
};

function generateId() {
  return "BK-" + Date.now().toString(36).toUpperCase();
}

export default function BookingManager() {
  const { theme: t } = useTheme();
  const bookings      = useStore(s => s.bookings || []);
  const addBooking    = useStore(s => s.addBooking);
  const updateBooking = useStore(s => s.updateBooking);
  const deleteBooking = useStore(s => s.deleteBooking);

  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [deleting, setDeleting] = useState(null);

  function openAdd() {
    setForm({ ...EMPTY_FORM, id: generateId() });
    setError("");
    setModal("add");
  }

  function openEdit(booking) {
    setForm({ ...EMPTY_FORM, ...booking });
    setError("");
    setModal("edit");
  }

  function closeModal() {
    setModal(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  function handleChange(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function syncToSheets(action, booking) {
    if (!WEBHOOK) return;
    const res = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, booking }),
    });
    if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
  }

  async function handleSave() {
    const required = ["name", "phone", "device", "issue", "date", "time"];
    const missing = required.filter(f => !form[f]?.trim());
    if (missing.length) {
      setError(`Please fill in: ${missing.join(", ")}`);
      return;
    }
    setSaving(true);
    setError("");
    const booking = { ...form };
    try {
      if (modal === "add") {
        addBooking(booking);
        await syncToSheets("add", booking);
      } else {
        updateBooking(booking.id, booking);
        await syncToSheets("edit", booking);
      }
      closeModal();
    } catch (err) {
      setError(`Sync failed: ${err.message}. Change saved locally.`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(booking) {
    if (!window.confirm(`Delete booking for ${booking.name} on ${booking.date}?`)) return;
    setDeleting(booking.id);
    try {
      deleteBooking(booking.id);
      await syncToSheets("delete", { id: booking.id });
    } catch (err) {
      console.error("Delete sync failed:", err);
    } finally {
      setDeleting(null);
    }
  }

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    return (
      b.name?.toLowerCase().includes(q) ||
      b.phone?.includes(q) ||
      b.device?.toLowerCase().includes(q) ||
      b.date?.includes(q)
    );
  });

  const paymentColors = {
    Paid:   { bg: t.name === "dark" ? "rgba(34,197,94,0.15)"  : "#F0FDF4", color: "#22c55e" },
    Unpaid: { bg: t.name === "dark" ? "rgba(239,68,68,0.15)"  : "#FEF2F2", color: "#ef4444" },
    Onsite: { bg: t.name === "dark" ? "rgba(251,146,60,0.15)" : "#FFF7ED", color: "#fb923c" },
  };

  const inputStyle = {
    width: "100%",
    border: `1px solid ${t.border}`,
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    background: t.inputBg,
    color: t.textPrimary,
    outline: "none",
    boxSizing: "border-box",
  };

  const TH = {
    padding: "10px 12px", fontSize: 11, fontWeight: 700,
    color: t.thColor, textTransform: "uppercase", letterSpacing: 0.8,
    textAlign: "left", background: t.thBg,
    borderBottom: `1px solid ${t.borderSub}`,
  };

  const TD = {
    padding: "11px 12px", fontSize: 13,
    color: t.tdColor, borderBottom: `1px solid ${t.borderSub}`,
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: t.textMuted, fontSize: 15 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search bookings…"
            style={{ ...inputStyle, paddingLeft: 36 }}
          />
        </div>
        <button
          onClick={openAdd}
          style={{
            padding: "8px 18px", background: t.accent, color: "#fff",
            border: "none", borderRadius: 10, fontSize: 13,
            cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap",
            boxShadow: `0 4px 14px ${t.accentGlow}`,
          }}
        >
          + Add Booking
        </button>
      </div>

      {/* Table */}
      <div style={{ background: t.cardBg, borderRadius: 16, border: `1px solid ${t.border}`, boxShadow: t.cardShadow, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
            <thead>
              <tr>
                {["Date", "Time", "Customer", "Device", "Issue", "Payment", "Actions"].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: t.textMuted, fontSize: 13 }}>
                    {search ? "No bookings match your search." : "No bookings yet. Add one above."}
                  </td>
                </tr>
              ) : (
                filtered.map((b, i) => {
                  const pc = paymentColors[b.paymentStatus] || paymentColors.Unpaid;
                  return (
                    <tr key={i}
                      onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      style={{ transition: "background .12s" }}
                    >
                      <td style={TD}>{b.date}</td>
                      <td style={TD}>{b.time}</td>
                      <td style={TD}>
                        <div style={{ fontWeight: 600, color: t.accent }}>{b.name}</div>
                        <div style={{ fontSize: 11, color: t.textMuted }}>{b.phone}</div>
                      </td>
                      <td style={TD}>{b.device}</td>
                      <td style={{ ...TD, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={b.issue}>{b.issue}</td>
                      <td style={TD}>
                        <span style={{
                          display: "inline-block", padding: "3px 10px",
                          borderRadius: 999, fontSize: 11, fontWeight: 700,
                          background: pc.bg, color: pc.color,
                        }}>
                          {b.paymentStatus || "Unpaid"}
                        </span>
                      </td>
                      <td style={TD}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => openEdit(b)}
                            style={{
                              padding: "5px 12px", border: `1px solid ${t.border}`,
                              borderRadius: 8, fontSize: 12, cursor: "pointer",
                              background: t.cardBg2, color: t.textSecondary, fontWeight: 600,
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(b)}
                            disabled={deleting === b.id}
                            style={{
                              padding: "5px 12px", fontSize: 12, cursor: "pointer",
                              borderRadius: 8, fontWeight: 600,
                              background: t.name === "dark" ? "rgba(239,68,68,0.15)" : "#FEF2F2",
                              color: "#ef4444",
                              border: t.name === "dark" ? "1px solid rgba(239,68,68,0.3)" : "1px solid #fca5a5",
                              opacity: deleting === b.id ? 0.5 : 1,
                            }}
                          >
                            {deleting === b.id ? "…" : "Del"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 2000,
          background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}>
          <div style={{
            background: t.cardBg, borderRadius: 16, padding: 24,
            width: "100%", maxWidth: 500,
            maxHeight: "90vh", overflowY: "auto",
            border: `1px solid ${t.border}`,
            boxShadow: t.cardShadow,
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: t.textPrimary }}>
                {modal === "add" ? "Add booking" : "Edit booking"}
              </h2>
              <button onClick={closeModal} style={{
                background: t.cardBg2, border: `1px solid ${t.border}`,
                borderRadius: 10, width: 34, height: 34,
                cursor: "pointer", fontSize: 18, color: t.textSecondary,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>

            {/* Fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Customer name *" span={2} t={t}>
                <input style={inputStyle} value={form.name} onChange={e => handleChange("name", e.target.value)} placeholder="Ali Hassan" />
              </Field>
              <Field label="Phone *" t={t}>
                <input style={inputStyle} value={form.phone} onChange={e => handleChange("phone", e.target.value)} placeholder="0300-1234567" />
              </Field>
              <Field label="Payment status" t={t}>
                <select style={inputStyle} value={form.paymentStatus} onChange={e => handleChange("paymentStatus", e.target.value)}>
                  <option>Unpaid</option>
                  <option>Paid</option>
                  <option>Onsite</option>
                </select>
              </Field>
              <Field label="Device *" span={2} t={t}>
                <input style={inputStyle} value={form.device} onChange={e => handleChange("device", e.target.value)} placeholder="iPhone 14 Pro" />
              </Field>
              <Field label="Issue *" span={2} t={t}>
                <input style={inputStyle} value={form.issue} onChange={e => handleChange("issue", e.target.value)} placeholder="Screen replacement" />
              </Field>
              <Field label="Date *" t={t}>
                <input style={inputStyle} type="date" value={form.date} onChange={e => handleChange("date", e.target.value)} />
              </Field>
              <Field label="Time *" t={t}>
                <input style={inputStyle} type="time" value={form.time} onChange={e => handleChange("time", e.target.value)} />
              </Field>
              <Field label="Notes" span={2} t={t}>
                <textarea style={{ ...inputStyle, resize: "vertical" }} value={form.notes} onChange={e => handleChange("notes", e.target.value)} placeholder="Any extra details…" rows={2} />
              </Field>
            </div>

            {error && (
              <div style={{
                marginTop: 12, padding: "10px 14px",
                background: t.name === "dark" ? "rgba(239,68,68,0.15)" : "#FEF2F2",
                color: "#ef4444", borderRadius: 10, fontSize: 13,
                border: t.name === "dark" ? "1px solid rgba(239,68,68,0.3)" : "1px solid #fca5a5",
              }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button onClick={closeModal} style={{
                padding: "9px 18px", border: `1px solid ${t.border}`,
                borderRadius: 10, fontSize: 13, cursor: "pointer",
                background: t.cardBg2, color: t.textSecondary, fontWeight: 600,
              }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                padding: "9px 22px", background: t.accent, color: "#fff",
                border: "none", borderRadius: 10, fontSize: 13,
                cursor: saving ? "wait" : "pointer", fontWeight: 700,
                opacity: saving ? 0.7 : 1,
                boxShadow: `0 4px 14px ${t.accentGlow}`,
              }}>
                {saving ? "Saving…" : modal === "add" ? "Add booking" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, span = 1, t }) {
  return (
    <div style={{ gridColumn: span > 1 ? `span ${span}` : undefined }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 700,
        color: t.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}