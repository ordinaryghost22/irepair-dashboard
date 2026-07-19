import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastProvider }    from "./context/ToastContext";
import { ThemeProvider }    from "./context/ThemeContext";
import { SecurityProvider } from "./context/SecurityContext";
import { useInit }          from "./hooks/useInit";
import Layout      from "./components/Layout";
import Login       from "./pages/Login";
import Dashboard   from "./pages/Dashboard";
import Bookings    from "./pages/Bookings";
import Invoices    from "./pages/Invoices";
import Slots       from "./pages/Slots";
import Leads       from "./pages/Leads";
import Waitlist    from "./pages/Waitlist";
import Chats       from "./pages/Chats";
import AuditLog    from "./pages/AuditLog";
import Analytics   from "./pages/Analytics";
import CashLedger  from "./pages/CashLedger";
import Security    from "./pages/Security";
import Settings    from "./pages/Settings";
import OwnerBot from "./components/OwnerBot";
import PublicBooking from "./pages/PublicBooking";

function PrivateRoute({ children }) {
  return localStorage.getItem("auth") ? children : <Navigate to="/login" />;
}

function AppInit({ children }) {
  useInit();
  return children;
}

function OwnerBotGate() {
  const { pathname } = useLocation();
  if (pathname === "/login" || pathname === "/book") return null;
  return <OwnerBot />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <SecurityProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/book"  element={<PublicBooking />} />
              <Route path="/*" element={
                <PrivateRoute>
                  <AppInit>
                    <Layout>
                      <Routes>
                        <Route path="/"          element={<Dashboard />}  />
                        <Route path="/bookings"  element={<Bookings />}   />
                        <Route path="/invoices"  element={<Invoices />}   />
                        <Route path="/cash"      element={<CashLedger />} />
                        <Route path="/slots"     element={<Slots />}      />
                        <Route path="/leads"     element={<Leads />}      />
                        <Route path="/waitlist"  element={<Waitlist />}   />
                        <Route path="/chats"     element={<Chats />}      />
                        <Route path="/analytics" element={<Analytics />}  />
                        <Route path="/audit"     element={<AuditLog />}   />
                        <Route path="/security"  element={<Security />}   />
                        <Route path="/settings"  element={<Settings />}   />
                      </Routes>
                    </Layout>
                  </AppInit>
                </PrivateRoute>
              } />
            </Routes>
            <OwnerBotGate />
          </SecurityProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
