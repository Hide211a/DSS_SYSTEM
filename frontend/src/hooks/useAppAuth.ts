import { useAuth } from '../context/AuthContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

/** Unified session: DSS admin or customer account counts as signed in for the shop UI. */
export function useAppAuth() {
  const admin = useAuth();
  const customer = useCustomerAuth();

  const isCustomer = customer.isAuthenticated;
  const isAdmin = admin.isAuthenticated && !isCustomer;
  const isAuthenticated = isCustomer || isAdmin;

  return {
    isAdmin,
    isCustomer,
    isAuthenticated,
    admin,
    customer,
  };
}
