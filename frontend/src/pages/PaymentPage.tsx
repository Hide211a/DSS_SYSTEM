import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { formatCurrency } from '../lib/format';
import { saveOrderToHistory } from '../lib/orderHistory';
import { orderStatusClass, orderStatusLabel } from '../lib/orderStatus';

export function PaymentPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState('4111 1111 1111 1111');

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => api.getOrderByNumber(orderNumber!),
    enabled: !!orderNumber,
  });

  const payMutation = useMutation({
    mutationFn: () => api.payOrder(orderNumber!, 'MOCK_CARD'),
    onSuccess: (data) => {
      saveOrderToHistory(data.orderNumber, data.customerEmail ?? undefined);
      navigate(`/orders?paid=${data.orderNumber}`);
    },
  });

  if (isLoading) return <div className="container loading">Завантаження...</div>;
  if (error || !order) return <div className="container error-banner">Замовлення не знайдено</div>;

  if (order.status === 'COMPLETED') {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
        <h1 style={{ color: 'var(--accent)' }}>Замовлення вже оплачено</h1>
        <p className="mono">{order.orderNumber}</p>
        <Link to="/orders" className="btn btn-primary" style={{ marginTop: '1rem', textDecoration: 'none' }}>
          Мої замовлення
        </Link>
      </div>
    );
  }

  if (order.status === 'CANCELLED') {
    return (
      <div className="container error-banner">
        Замовлення скасовано. <Link to="/catalog">Повернутись до каталогу</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <Link to="/cart" style={{ color: 'var(--text-muted)' }}>
        ← Назад
      </Link>
      <h1>Mock-оплата</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Демо-платіжна сторінка. Реальні кошти не списуються.
      </p>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span className="mono">{order.orderNumber}</span>
          <span className={`badge ${orderStatusClass(order.status)}`}>
            {orderStatusLabel(order.status)}
          </span>
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-muted)' }}>
          {order.items.map((i) => (
            <li key={i.id}>
              {i.product.name} × {i.quantity} — {formatCurrency(i.unitPrice * i.quantity)}
            </li>
          ))}
        </ul>
        <p style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '1rem' }}>
          До сплати: {formatCurrency(order.total)}
        </p>
      </div>

      <div className="card">
        <div className="form-group">
          <label>Номер картки (будь-який)</label>
          <input value={card} onChange={(e) => setCard(e.target.value)} className="mono" />
        </div>
        {payMutation.isError && (
          <div className="error-banner">
            {payMutation.error instanceof Error ? payMutation.error.message : 'Помилка оплати'}
          </div>
        )}
        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={payMutation.isPending}
          onClick={() => payMutation.mutate()}
        >
          {payMutation.isPending ? 'Обробка...' : `Оплатити ${formatCurrency(order.total)}`}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: '0.5rem' }}
          onClick={async () => {
            await api.cancelOrder(order.orderNumber);
            navigate('/cart');
          }}
        >
          Скасувати замовлення
        </button>
      </div>
    </div>
  );
}
