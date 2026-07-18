import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <ToastDisplay toast={toast} />}
    </ToastContext.Provider>
  );
}

function ToastDisplay({ toast }) {
  const err = toast.type === "error";
  return (
    <div
      key={toast.id}
      className="toast-enter"
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 20px",
        borderRadius: 12,
        background: "var(--bg-card)",
        color: "var(--text-primary)",
        fontSize: 14,
        fontWeight: 600,
        border: "1px solid var(--border-subtle)",
        borderTop: "1px solid var(--border-top-highlight)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: err ? "rgba(255,255,255,0.45)" : "var(--accent)",
          boxShadow: err ? "none" : "0 0 10px var(--accent-glow)",
          flexShrink: 0,
        }}
      />
      {toast.message}
    </div>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
};
