import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminRoute({ children }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (user === null) {
    return <div className="py-32 text-center font-body text-ink-muted">Loading admin…</div>;
  }
  if (user === false) {
    return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  }
  if (user.role !== "admin") {
    return <Navigate to="/account" replace />;
  }
  return children;
}
