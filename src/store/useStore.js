import { create } from "zustand";
import { useNotifStore } from "./useNotifStore";
import { devtools } from "zustand/middleware";

const API = import.meta.env.VITE_API_URL || "https://irepair-backend-production.up.railway.app";

let fetchingRef = false;
let prevPending = null;

// ── Auth helper ───────────────────────────────────────────────────────────────
const apiCall = async (path, options = {}) => {
  const token = localStorage.getItem("irepair_token");
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
};

export const useStore = create(devtools((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  bookings:  [],
  slots:     [],
  leads:     [],
  chats:     [],
  loading:   true,
  newBadge:  0,
  isPaused:  false,
  lastFetch: null,
  auditLog:  (() => {
    try { return JSON.parse(localStorage.getItem("irepair_audit") || "[]"); } catch { return []; }
  })(),

  // ── Derived ────────────────────────────────────────────────────────────────
  get pendingCount() { return get().bookings.filter(b => b.Status === "Pending").length; },
  get availableSlots() { return get().slots.filter(s => s.Status === "Available").length; },

  // ── Fetch all from FastAPI ─────────────────────────────────────────────────
  fetchAll: async (silent = false, showToast = null) => {
    if (fetchingRef) return;
    fetchingRef = true;
    if (!silent) set({ loading: true });
    try {
      
      const safeB = Array.isArray(b) ? b : [];
      const pendingNow = safeB.filter(x => x.Status === "Pending").length;

      if (prevPending !== null && pendingNow > prevPending && showToast) {
        const diff = pendingNow - prevPending;
        set({ newBadge: diff });
        showToast(`${diff} new booking${diff > 1 ? "s" : ""} received!`);
        useNotifStore.getState().push(
          "New Booking",
          `${diff} new pending booking${diff > 1 ? "s" : ""} received`,
          "booking",
          "/bookings"
        );
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("iRepair — New Booking", {
            body: `${diff} new pending booking${diff > 1 ? "s" : ""}`,
          });
        }
      }
      prevPending = pendingNow;

      set({
        bookings:  safeB.length > 0 ? safeB : get().bookings,
        slots:     Array.isArray(s) && s.length > 0 ? s : get().slots,
        leads:     Array.isArray(l) && l.length > 0 ? l : get().leads,
        lastFetch: new Date(),
      });
    } catch (err) {
      console.error("Store fetch error:", err);
    } finally {
      fetchingRef = false;
      if (!silent) set({ loading: false });
    }
  },

  // ── Confirm booking ────────────────────────────────────────────────────────
  confirmBooking: async (bookingId, name, showToast) => {
    set(state => ({
      bookings: state.bookings.map(b =>
        b["Booking ID"] === bookingId ? { ...b, Status: "Confirmed" } : b
      ),
    }));
    try {
      await apiCall(`/bookings/${encodeURIComponent(bookingId)}/status`, {
        method: "PUT",
        body: JSON.stringify({ Status: "Confirmed" }),
      });
      get().addAudit("Confirmed", bookingId, name);
      if (showToast) showToast("Booking confirmed!");
      setTimeout(() => get().fetchAll(true, showToast), 2000);
    } catch (err) {
      console.error("Confirm error:", err);
      if (showToast) showToast("Failed to confirm booking", "error");
      get().fetchAll(true, showToast);
    }
  },

  // ── Reject booking ─────────────────────────────────────────────────────────
  rejectBooking: async (bookingId, name, showToast) => {
    set(state => ({
      bookings: state.bookings.map(b =>
        b["Booking ID"] === bookingId ? { ...b, Status: "Rejected" } : b
      ),
    }));
    try {
      await apiCall(`/bookings/${encodeURIComponent(bookingId)}/status`, {
        method: "PUT",
        body: JSON.stringify({ Status: "Rejected" }),
      });
      get().addAudit("Rejected", bookingId, name);
      if (showToast) showToast("Booking rejected.", "error");
      setTimeout(() => get().fetchAll(true, showToast), 2000);
    } catch (err) {
      console.error("Reject error:", err);
      if (showToast) showToast("Failed to reject booking", "error");
      get().fetchAll(true, showToast);
    }
  },

  // ── Payment status ─────────────────────────────────────────────────────────
  updateBookingPayment: async (bookingId, paymentStatus) => {
    set(state => ({
      bookings: state.bookings.map(b =>
        b["Booking ID"] === bookingId ? { ...b, "Payment Status": paymentStatus } : b
      ),
    }));
    try {
      await apiCall(`/bookings/${encodeURIComponent(bookingId)}/payment`, {
        method: "PUT",
        body: JSON.stringify({ "Payment Status": paymentStatus }),
      });
    } catch (err) {
      console.error("Payment update error:", err);
    }
  },

  // ── Add booking ────────────────────────────────────────────────────────────
  addBooking: async (booking) => {
    const row = {
      "Booking ID":     booking.id,
      "Name":           booking.name,
      "Phone":          booking.phone,
      "Device":         booking.device,
      "Service":        booking.issue,
      "Issue":          booking.issue,
      "Date":           booking.date,
      "Time":           booking.time,
      "Payment Status": booking.paymentStatus || "Unpaid",
      "Notes":          booking.notes || "",
      "Status":         "Confirmed",
    };
    set(state => ({ bookings: [row, ...state.bookings] }));
    try {
      await apiCall("/bookings", {
        method: "POST",
        body: JSON.stringify(row),
      });
    } catch (err) {
      console.error("Add booking error:", err);
    }
  },

  // ── Update booking ─────────────────────────────────────────────────────────
  updateBooking: async (bookingId, updates) => {
    set(state => ({
      bookings: state.bookings.map(b =>
        b["Booking ID"] === bookingId ? { ...b, ...updates } : b
      ),
    }));
    try {
      await apiCall(`/bookings/${encodeURIComponent(bookingId)}`, {
        method: "PUT",
        body: JSON.stringify({
          "Name":           updates.name,
          "Phone":          updates.phone,
          "Device":         updates.device,
          "Issue":          updates.issue,
          "Date":           updates.date,
          "Time":           updates.time,
          "Payment Status": updates.paymentStatus,
          "Notes":          updates.notes,
        }),
      });
    } catch (err) {
      console.error("Update booking error:", err);
    }
  },

  // ── Delete booking ─────────────────────────────────────────────────────────
  deleteBooking: async (bookingId) => {
    set(state => ({
      bookings: state.bookings.filter(b => b["Booking ID"] !== bookingId),
    }));
    try {
      await apiCall(`/bookings/${encodeURIComponent(bookingId)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Delete booking error:", err);
    }
  },

  // ── Update booking status ──────────────────────────────────────────────────
  updateBookingStatus: async (bookingId, status) => {
    set(state => ({
      bookings: state.bookings.map(b =>
        b["Booking ID"] === bookingId ? { ...b, Status: status } : b
      ),
    }));
    try {
      await apiCall(`/bookings/${encodeURIComponent(bookingId)}/status`, {
        method: "PUT",
        body: JSON.stringify({ Status: status }),
      });
    } catch (err) {
      console.error("Status update error:", err);
    }
  },

  // ── Audit log ──────────────────────────────────────────────────────────────
  addAudit: (action, bookingId, name) => {
    const entry = { action, bookingId, name, time: new Date().toLocaleString() };
    set(state => {
      const next = [entry, ...state.auditLog].slice(0, 200);
      localStorage.setItem("irepair_audit", JSON.stringify(next));
      return { auditLog: next };
    });
  },

  // ── UI actions ─────────────────────────────────────────────────────────────
  clearBadge:  () => set({ newBadge: 0 }),
  setIsPaused: (v) => set({ isPaused: v }),

}), { name: "iRepairStore" }));