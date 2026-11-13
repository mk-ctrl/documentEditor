import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

export function FullPageSpinner() {
  return (
    <div className="center-state" aria-busy="true">
      <div className="spinner" />
    </div>
  );
}

/** Wraps private routes: waits for the session, then redirects to /login if signed out. */
export default function RequireAuth({ children }) {
  const { loading, user } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
