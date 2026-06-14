import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getApiBase } from '../lib/apiBase';

export interface CustomerUser {
  id: string;
  email: string;
  name: string | null;
}

interface CustomerAuthContextValue {
  token: string | null;
  user: CustomerUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

const STORAGE_KEY = 'stockwise_customer_token';
const USER_KEY = 'stockwise_customer_user';

function loadUser(): CustomerUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState<CustomerUser | null>(() => loadUser());

  const persist = useCallback((nextToken: string, nextUser: CustomerUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${getApiBase()}/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Помилка входу');
    persist(data.token, data.user);
  }, [persist]);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const res = await fetch(`${getApiBase()}/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Помилка реєстрації');
    persist(data.token, data.user);
  }, [persist]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const refreshProfile = useCallback(async () => {
    const t = localStorage.getItem(STORAGE_KEY);
    if (!t) return;
    const res = await fetch(`${getApiBase()}/customer/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setUser({ id: data.id, email: data.email, name: data.name });
    localStorage.setItem(USER_KEY, JSON.stringify({ id: data.id, email: data.email, name: data.name }));
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: !!token,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [token, user, login, register, logout, refreshProfile]
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}

export function getCustomerToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}
