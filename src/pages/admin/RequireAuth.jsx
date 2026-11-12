import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '../../lib/api.js';

export default function RequireAuth({ children }) {
  const location = useLocation();
  const token = getToken();

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}
