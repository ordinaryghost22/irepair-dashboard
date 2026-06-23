import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type="success") => {
    setToast({ message, type, id:Date.now() });
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
  const err = toast.type==="error";
  return (
    <>
      <style>{"@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}"}</style>
      <div key={toast.id} style={{
        position:"fixed", bottom:28, right:28, zIndex:9999,
        display:"flex", alignItems:"center", gap:10,
        padding:"14px 22px", borderRadius:14,
        background: err ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#22c55e,#16a34a)",
        color:"#fff", fontSize:14, fontWeight:600,
        boxShadow: err ? "0 8px 32px rgba(239,68,68,0.4)" : "0 8px 32px rgba(34,197,94,0.4)",
        animation:"slideUp .3s ease",
      }}>
        <span style={{ fontSize:16 }}>{err ? "✕" : "✓"}</span>
        {toast.message}
      </div>
    </>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
};
