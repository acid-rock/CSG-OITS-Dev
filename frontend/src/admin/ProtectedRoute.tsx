import { Navigate, Outlet } from 'react-router-dom';
import '../index.css';

// Note: sb_access_token is httpOnly — it cannot be read by document.cookie (by design).
// We track auth state with a localStorage flag set on login and cleared on logout.
// The backend requireAuth middleware is the real security boundary on every protected request.
const ProtectedRoute = () => {
  try {
    const isAuthenticated =
      localStorage.getItem('admin_authenticated') === '1';

    if (!isAuthenticated) {
      return <Navigate to='/admin/login' replace />;
    }

    return <Outlet />;
  } catch {
    return <Navigate to='/admin/login' replace />;
  }
};

export default ProtectedRoute;
