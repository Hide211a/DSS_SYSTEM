import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppAuth } from '../hooks/useAppAuth';

const LOGIN_MESSAGES: Record<string, string> = {
  '/cart': 'Увійдіть в акаунт, щоб переглянути кошик',
  '/checkout': 'Увійдіть в акаунт, щоб оформити замовлення',
};

export function CustomerRoute() {
  const { isCustomer, isAdmin } = useAppAuth();
  const location = useLocation();

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  if (!isCustomer) {
    const message = LOGIN_MESSAGES[location.pathname];
    return (
      <Navigate
        to="/account/login"
        replace
        state={{ from: location.pathname, ...(message ? { message } : {}) }}
      />
    );
  }
  return <Outlet />;
}
