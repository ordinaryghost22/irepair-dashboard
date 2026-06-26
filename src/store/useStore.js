import { create } from "zustand";
import { useNotifStore } from "./useNotifStore";
import { devtools } from "zustand/middleware";
import { supabase } from "../lib/supabase";

let fetchingRef = false;
let prevPending = null;

export const useStore = create(devtools((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  bookings:  [],
  slots:     [],
  leads:     [],
  waitlist:  [],
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

  // ── Fetch all from Supabase ────────────────────────────────────────────────
  fetchAll: async (silent = false, showToast = null) => {
    if (fetchingRef) return;
    fetchingRef = true;
    if (!silent) set({ loading: true });
    try {
      const [
        { data: b, error: bErr },
        { data: s, error: sErr },
        { data: l, error: lErr },
        { data: wl, error: wlErr },
      ] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("slots").select("*").order("Date"),
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("waitlist").select("*").order("created_at", { ascending: false }),
      ]);

      if (bErr) console.error("Bookings error:", bErr);
      if (sErr) console.error("Slots error:", sErr);
      if (lErr) console.error("Leads error:", lErr);
      if (wlErr) console.error("Waitlist error:", wlErr);

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
        waitlist:  Array.isArray(wl) && wl.length > 0 ? wl : get().waitlist,
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
      const { error } = await supabase
        .from("bookings")
        .update({ Status: "Confirmed" })
        .eq("Booking ID", bookingId);
      if (error) throw error;
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
      const { error } = await supabase
        .from("bookings")
        .update({ Status: "Rejected" })
        .eq("Booking ID", bookingId);
      if (error) throw error;
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
    const { error } = await supabase
      .from("bookings")
      .update({ "Payment Status": paymentStatus })
      .eq("Booking ID", bookingId);
    if (error) console.error("Payment update error:", error);
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
    const { error } = await supabase.from("bookings").insert(row);
    if (error) console.error("Add booking error:", error);
  },

  // ── Update booking ─────────────────────────────────────────────────────────
  updateBooking: async (bookingId, updates) => {
    set(state => ({
      bookings: state.bookings.map(b =>
        b["Booking ID"] === bookingId ? { ...b, ...updates } : b
      ),
    }));
    const { error } = await supabase
      .from("bookings")
      .update({
        "Name":           updates.name,
        "Phone":          updates.phone,
        "Device":         updates.device,
        "Issue":          updates.issue,
        "Date":           updates.date,
        "Time":           updates.time,
        "Payment Status": updates.paymentStatus,
        "Notes":          updates.notes,
      })
      .eq("Booking ID", bookingId);
    if (error) console.error("Update booking error:", error);
  },

  // ── Delete booking ─────────────────────────────────────────────────────────
  deleteBooking: async (bookingId) => {
    set(state => ({
      bookings: state.bookings.filter(b => b["Booking ID"] !== bookingId),
    }));
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("Booking ID", bookingId);
    if (error) console.error("Delete booking error:", error);
  },
updateBookingStatus: async (bookingId, status) => {
  set(state => ({
    bookings: state.bookings.map(b =>
      b["Booking ID"] === bookingId ? { ...b, Status: status } : b
    ),
  }));
  const { error } = await supabase
    .from("bookings")
    .update({ Status: status })
    .eq("Booking ID", bookingId);
  if (error) console.error("Status update error:", error);
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