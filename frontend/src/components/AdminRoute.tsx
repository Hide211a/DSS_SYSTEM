import { Navigate, Outlet } from 'react-router-dom';
import { useAppAuth } from '../hooks/useAppAuth';

export function AdminRoute() {
  const { isAdmin, isCustomer } = useAppAuth();
  if (isCustomer) {
    return <Navigate to="/catalog" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/login" replace state={{ from: 'admin' }} />;
  }
  return <Outlet />;
}
