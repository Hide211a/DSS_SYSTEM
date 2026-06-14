import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { useAuth } from '../context/AuthContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { DEMO_ADMIN } from '../lib/demoCredentials';

export function LoginPage() {
  const { login } = useAuth();
  const { logout: customerLogout } = useCustomerAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>(DEMO_ADMIN.username);
  const [password, setPassword] = useState<string>(DEMO_ADMIN.password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      customerLogout();
      await login(username, password);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка входу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout
      variant="admin"
      title="Вхід у DSS"
      subtitle="Доступ до панелі управління запасами, аналітики та рекомендацій."
      demo={
        <>
          <strong>Демо-доступ:</strong>{' '}
          <span className="mono">{DEMO_ADMIN.username}</span> /{' '}
          <span className="mono">{DEMO_ADMIN.password}</span>
        </>
      }
    >
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="admin-username">Логін</label>
          <input
            id="admin-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="Введіть логін"
          />
        </div>
        <div className="form-group">
          <label htmlFor="admin-password">Пароль</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className="btn btn-primary auth-page-submit" disabled={loading}>
          {loading ? 'Вхід...' : 'Увійти в панель'}
        </button>
      </form>
    </AuthPageLayout>
  );
}
