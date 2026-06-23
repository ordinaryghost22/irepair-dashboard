import { create } from "zustand";
import { useNotifStore } from "./useNotifStore";
import { devtools } from "zustand/middleware";

const BASE_URL = "http://localhost:5678/webhook";

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

  // ── Derived (computed inline, fast) ────────────────────────────────────────
  get pendingCount() { return get().bookings.filter(b => b.Status === "Pending").length; },
  get availableSlots() { return get().slots.filter(s => s.Status === "Available").length; },

  // ── Fetch ──────────────────────────────────────────────────────────────────
  fetchAll: async (silent = false, showToast = null) => {
    if (fetchingRef) return;
    fetchingRef = true;
    if (!silent) set({ loading: true });
    try {
      const [b, s, l, wl] = await Promise.all([
        fetch(`${BASE_URL}/get-bookings`).then(r => r.json()).catch(() => []),
        fetch(`${BASE_URL}/get-slots`).then(r => r.json()).catch(() => []),
        fetch(`${BASE_URL}/get-leads`).then(r => r.json()).catch(() => []),
        fetch(`${BASE_URL}/get-waitlist`).then(r => r.json()).catch(() => []),
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
        bookings: safeB.length > 0 ? safeB : get().bookings,
        slots:    Array.isArray(s) && s.length > 0 ? s : get().slots,
        leads:    Array.isArray(l) && l.length > 0 ? l : get().leads,
        waitlist: Array.isArray(wl) && wl.length > 0 ? wl : get().waitlist,
        lastFetch: new Date(),
      });
    } catch (err) {
      console.error("Store fetch error:", err);
    } finally {
      fetchingRef = false;
      if (!silent) set({ loading: false });
    }
  },

  // ── Optimistic confirm ─────────────────────────────────────────────────────
  confirmBooking: async (bookingId, name, showToast) => {
    // Instant UI update
    set(state => ({
      bookings: state.bookings.map(b =>
        b["Booking ID"] === bookingId ? { ...b, Status: "Confirmed" } : b
      ),
    }));
    try {
      await fetch(`${BASE_URL}/action-confirm?action=confirm&bookingId=${bookingId}`);
      get().addAudit("Confirmed", bookingId, name);
      if (showToast) showToast("Booking confirmed!");
      setTimeout(() => get().fetchAll(true, showToast), 2000);
    } catch {
      // Revert on failure
      if (showToast) showToast("Failed to confirm booking", "error");
      get().fetchAll(true, showToast);
    }
  },

  // ── Optimistic reject ──────────────────────────────────────────────────────
  rejectBooking: async (bookingId, name, showToast) => {
    set(state => ({
      bookings: state.bookings.map(b =>
        b["Booking ID"] === bookingId ? { ...b, Status: "Rejected" } : b
      ),
    }));
    try {
      await fetch(`${BASE_URL}/action-reject?action=reject&bookingId=${bookingId}`);
      get().addAudit("Rejected", bookingId, name);
      if (showToast) showToast("Booking rejected.", "error");
      setTimeout(() => get().fetchAll(true, showToast), 2000);
    } catch {
      if (showToast) showToast("Failed to reject booking", "error");
      get().fetchAll(true, showToast);
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
  clearBadge: () => set({ newBadge: 0 }),
  setIsPaused: (v) => set({ isPaused: v }),
}), { name: "iRepairStore" }));
