const API_URL = "https://irepair-backend-production.up.railway.app";

// Store token in localStorage
const getToken = () => localStorage.getItem("irepair_token");
const setToken = (token) => localStorage.setItem("irepair_token", token);

// Base fetch with auth
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// Auth
export async function login(username, password) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(data.access_token);
  return data;
}

// Bookings
export const getBookings = () => apiFetch("/bookings/");
export const getBookingHistory = (bookingId) =>
  apiFetch(`/bookings/${encodeURIComponent(bookingId)}/history`);
export const createBooking = (booking) => apiFetch("/bookings/", { method: "POST", body: JSON.stringify(booking) });
export const updateBooking = (id, data) => apiFetch(`/bookings/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteBooking = (id) => apiFetch(`/bookings/${id}`, { method: "DELETE" });

// Slots
export const getSlots = () => apiFetch("/slots/");
export const updateSlot = (id, data) => apiFetch(`/slots/${id}`, { method: "PUT", body: JSON.stringify(data) });

// Leads
export const getLeads = () => apiFetch("/leads/");
export const createLead = (lead) => apiFetch("/leads/", { method: "POST", body: JSON.stringify(lead) });

// Chat
export const getChatSessions = (limit = 100) =>
  apiFetch(`/chat/sessions?limit=${encodeURIComponent(limit)}`);
export const ownerChat = (messages) => apiFetch("/chat/owner", { method: "POST", body: JSON.stringify({ messages }) });
export const customerChat = (message) => apiFetch("/chat/customer", { method: "POST", body: JSON.stringify({ message }) });