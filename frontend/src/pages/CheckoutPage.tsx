import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../lib/format';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export function CheckoutPage() {
  const { items, totalPrice, clear, syncStock } = useCart();
  const { user, isAuthenticated } = useCustomerAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [ready, setReady] = useState(false);
  const [stockWarning, setStockWarning] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await syncStock();
      if (cancelled) return;
      if (result.removed.length) {
        setStockWarning(`Деякі товари недоступні і були прибрані: ${result.removed.join(', ')}`);
      } else if (result.adjusted.length) {
        setStockWarning(`Оновлено кількість: ${result.adjusted.map((a) => a.name).join(', ')}`);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      const synced = await syncStock();
      if (synced.items.length === 0) {
        throw new Error('Кошик порожній після оновлення залишків');
      }
      return api.createOrder({
        customerName: name || undefined,
        customerEmail: email || undefined,
        items: synced.items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      });
    },
    onSuccess: (data) => {
      clear();
      navigate(`/payment/${data.orderNumber}`);
    },
  });

  if (!ready) {
    return <div className="container loading">Перевірка залишків перед оплатою...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container empty-state">
        <p>Немає товарів для оформлення</p>
        {stockWarning && <p style={{ color: 'var(--warning)' }}>{stockWarning}</p>}
        <Link to="/catalog">До каталогу</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <h1>Оформлення замовлення</h1>
      {isAuthenticated && (
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Оформлення від імені <strong>{user?.email}</strong>
        </p>
      )}
      {stockWarning && <div className="error-banner">{stockWarning}</div>}
      {mutation.isError && (
        <div className="error-banner">
          {mutation.error instanceof Error ? mutation.error.message : 'Помилка'}
        </div>
      )}
      <div className="card">
        <ul style={{ margin: '0 0 1rem', paddingLeft: '1.2rem', color: 'var(--text-muted)' }}>
          {items.map((i) => (
            <li key={i.product.id}>
              {i.product.name} × {i.quantity} — {formatCurrency(i.product.price * i.quantity)}
            </li>
          ))}
        </ul>
        <div className="form-group">
          <label>Ім&apos;я (необов&apos;язково)</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Email {isAuthenticated ? '' : '(для «Мої замовлення»)'}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isAuthenticated}
          />
        </div>
        <p>
          <strong>Сума: {formatCurrency(totalPrice)}</strong> ({items.length} поз.)
        </p>
        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Обробка...' : 'Перейти до оплати'}
        </button>
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: '0.5rem' }}
          onClick={() => navigate('/cart')}
        >
          Назад
        </button>
      </div>
    </div>
  );
}
