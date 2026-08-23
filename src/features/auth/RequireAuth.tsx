import { Navigate, Outlet } from "react-router";
import { useSession } from "./sessionContext";

/** Route guard: waits for the first session read, then admits or redirects. */
export default function RequireAuth() {
  const { session, loading } = useSession();
  if (loading) {
    return (
      <p className="pt-16 text-center font-mono text-sm text-ink-soft">…</p>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}
