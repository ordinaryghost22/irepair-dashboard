import { create } from "zustand";
import { useNotifStore } from "./useNotifStore";
import { devtools } from "zustand/middleware";

const API = "https://irepair-backend-production.up.railway.app";

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
    const detail = err.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg || JSON.stringify(d)).join(", ")
          : `API error ${res.status}`;
    // Include status so callers can detect 404/401 even when detail is generic
    const error = new Error(msg);
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export const useStore = create(devtools((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  bookings:  [],
  slots:     [],
  leads:     [],
  invoices:  [],
  cashLedger: [],
  waitlist:  [],
  chats:     [],
  loading:   true,
  newBadge:  0,
  isPaused:  false,
  lastFetch: null,

  // ── Derived ────────────────────────────────────────────────────────────────
  get pendingCount() { return get().bookings.filter(b => b.Status === "Pending").length; },
  get availableSlots() { return get().slots.filter(s => s.Status === "Available").length; },

  // ── Fetch all from FastAPI ─────────────────────────────────────────────────
  fetchAll: async (silent = false, showToast = null) => {
    if (fetchingRef) return;
    fetchingRef = true;
    if (!silent) set({ loading: true });
    try {
      const [b, s, l, inv, cash] = await Promise.all([
        apiCall("/bookings").catch(e => { console.error("Bookings error:", e); return []; }),
        apiCall("/slots").catch(e => { console.error("Slots error:", e); return []; }),
        apiCall("/leads").catch(e => { console.error("Leads error:", e); return []; }),
        apiCall("/invoices").catch(e => { console.error("Invoices error:", e); return []; }),
        apiCall("/cash-ledger/").catch(e => { console.error("Cash ledger error:", e); return []; }),
      ]);

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
        bookings:   safeB.length > 0 ? safeB : get().bookings,
        slots:      Array.isArray(s) && s.length > 0 ? s : get().slots,
        leads:      Array.isArray(l) && l.length > 0 ? l : get().leads,
        invoices:   Array.isArray(inv) ? inv : get().invoices,
        cashLedger: Array.isArray(cash) ? cash : get().cashLedger,
        lastFetch:  new Date(),
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
        body: JSON.stringify({ payment_status: paymentStatus }),
      });
    } catch (err) {
      console.error("Payment update error:", err);
    }
  },

  // ── Add booking ────────────────────────────────────────────────────────────
  addBooking: async (booking) => {
    try {
      const saved = await apiCall("/bookings", {
        method: "POST",
        body: JSON.stringify({
          name: booking.name,
          phone: booking.phone,
          device: booking.device,
          service: booking.issue,
          issue: booking.issue,
          date: booking.date,
          time: booking.time,
          payment_status: booking.paymentStatus || "Unpaid",
          notes: booking.notes || null,
          status: "Confirmed",
        }),
      });
      const row = {
        "Booking ID":     saved?.["Booking ID"] || booking.id,
        "Name":           booking.name,
        "Phone":          saved?.Phone || booking.phone,
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
      return saved;
    } catch (err) {
      console.error("Add booking error:", err);
      throw err;
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

  // ── Cash ledger ────────────────────────────────────────────────────────────
  fetchCashLedger: async () => {
    try {
      const data = await apiCall("/cash-ledger/");
      set({ cashLedger: Array.isArray(data) ? data : [] });
      return data;
    } catch (err) {
      console.error("Cash ledger fetch error:", err);
      throw err;
    }
  },

  addCashLedgerEntry: async ({ amount, entry_type, reason }) => {
    const saved = await apiCall("/cash-ledger/", {
      method: "POST",
      body: JSON.stringify({
        amount: Number(amount),
        entry_type,
        reason,
      }),
    });
    if (!saved || typeof saved !== "object") {
      throw new Error("Invalid response from cash ledger API");
    }
    set((state) => ({
      cashLedger: [saved, ...(Array.isArray(state.cashLedger) ? state.cashLedger : [])],
    }));
    // Re-sync from server so list stays consistent if another tab/device wrote too
    try {
      const fresh = await apiCall("/cash-ledger/");
      if (Array.isArray(fresh)) set({ cashLedger: fresh });
    } catch (e) {
      console.warn("Cash ledger re-fetch after save failed:", e);
    }
    return saved;
  },

  // ── UI actions ─────────────────────────────────────────────────────────────
  clearBadge:  () => set({ newBadge: 0 }),
  setIsPaused: (v) => set({ isPaused: v }),

}), { name: "iRepairStore" }));