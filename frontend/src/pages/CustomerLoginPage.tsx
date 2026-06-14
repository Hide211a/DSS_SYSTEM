import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { useAuth } from '../context/AuthContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { DEMO_CUSTOMER } from '../lib/demoCredentials';

export function CustomerLoginPage() {
  const { login } = useCustomerAuth();
  const { logout: adminLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/catalog';
  const loginMessage = (location.state as { message?: string } | null)?.message;
  const [email, setEmail] = useState<string>(DEMO_CUSTOMER.email);
  const [password, setPassword] = useState<string>(DEMO_CUSTOMER.password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      adminLogout();
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout
      variant="customer"
      title="Вітаємо знову"
      subtitle="Увійдіть, щоб додавати товари в кошик і переглядати історію замовлень."
      notice={loginMessage}
      demo={
        <>
          <strong>Демо-акаунт:</strong>{' '}
          <span className="mono">{DEMO_CUSTOMER.email}</span> /{' '}
          <span className="mono">{DEMO_CUSTOMER.password}</span>
        </>
      }
      footer={
        <>
          Немає акаунта? <Link to="/account/register">Зареєструватись</Link>
        </>
      }
    >
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="customer-email">Email</label>
          <input
            id="customer-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="customer-password">Пароль</label>
          <input
            id="customer-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn btn-primary auth-page-submit" disabled={loading}>
          {loading ? 'Вхід...' : 'Увійти'}
        </button>
      </form>
    </AuthPageLayout>
  );
}
