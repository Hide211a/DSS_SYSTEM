import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthPageLayout } from '../components/AuthPageLayout';
import { useAuth } from '../context/AuthContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export function CustomerRegisterPage() {
  const { register } = useCustomerAuth();
  const { logout: adminLogout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      adminLogout();
      await register(email, password, name || undefined);
      navigate('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout
      variant="customer"
      title="Створити акаунт"
      subtitle="Зареєструйтесь за хвилину — попередні замовлення за вашим email будуть привʼязані автоматично."
      footer={
        <>
          Вже є акаунт? <Link to="/account/login">Увійти</Link>
        </>
      }
    >
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="register-name">Ім&apos;я (необов&apos;язково)</label>
          <input
            id="register-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше імʼя"
            autoComplete="name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="register-password">Пароль (мін. 6 символів)</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn btn-primary auth-page-submit" disabled={loading}>
          {loading ? 'Реєстрація...' : 'Створити акаунт'}
        </button>
      </form>
    </AuthPageLayout>
  );
}
