import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Pagination } from '../components/Pagination';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { formatCurrency } from '../lib/format';
import { orderStatusClass, orderStatusLabel } from '../lib/orderStatus';

export function MyOrdersPage() {
  const { isAuthenticated, user } = useCustomerAuth();
  const [searchParams] = useSearchParams();
  const paidNotice = searchParams.get('paid');
  const [page, setPage] = useState(1);
  const [orderNumber, setOrderNumber] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupNumber, setLookupNumber] = useState('');
  const [lookupEmailUsed, setLookupEmailUsed] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-orders', page],
    queryFn: () => api.getMyOrders(page),
    enabled: isAuthenticated,
  });

  const {
    data: singleOrder,
    isLoading: loadingOne,
    error: errorOne,
  } = useQuery({
    queryKey: ['order-number', lookupNumber, lookupEmailUsed],
    queryFn: () => api.getOrderByNumber(lookupNumber, lookupEmailUsed || undefined),
    enabled: lookupNumber.length > 5 && (isAuthenticated || lookupEmailUsed.includes('@')),
  });

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupNumber(orderNumber.trim().toUpperCase());
    setLookupEmailUsed(isAuthenticated ? '' : lookupEmail.trim().toLowerCase());
  };

  return (
    <div className="container">
      <h1>Мої замовлення</h1>
      {isAuthenticated ? (
        <p style={{ color: 'var(--text-muted)' }}>
          Ви увійшли як <strong>{user?.email}</strong>. Показано ваші замовлення.
        </p>
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>
          <Link to="/account/login">Увійдіть в акаунт</Link>, щоб бачити всі замовлення, або знайдіть
          одне замовлення за номером і email.
        </p>
      )}

      {paidNotice && (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--accent)' }}>
          Оплату підтверджено: <strong className="mono">{paidNotice}</strong>
        </div>
      )}

      {!isAuthenticated && (
        <form className="card" onSubmit={handleLookup} style={{ marginBottom: '2rem', maxWidth: 480 }}>
          <h3 style={{ marginTop: 0 }}>Знайти замовлення</h3>
          <div className="form-group">
            <label>Номер замовлення</label>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ORD-..."
              className="mono"
              required
            />
          </div>
          <div className="form-group">
            <label>Email з замовлення</label>
            <input
              type="email"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Перевірити
          </button>
        </form>
      )}

      {lookupNumber && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0 }}>Замовлення {lookupNumber}</h3>
          {loadingOne && <p>Завантаження...</p>}
          {errorOne && <div className="error-banner">Замовлення не знайдено або немає доступу</div>}
          {singleOrder && <OrderCard order={singleOrder} />}
        </div>
      )}

      {isAuthenticated && (
        <>
          {isLoading && <div className="loading">Завантаження...</div>}
          {error && (
            <div className="error-banner">
              {error instanceof Error ? error.message : 'Помилка'}
              <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={() => refetch()}>
                Повторити
              </button>
            </div>
          )}
          {data && data.items.length === 0 && (
            <div className="empty-state">Замовлень не знайдено</div>
          )}
          {data?.items.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          {data && (
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      <Link to="/catalog" style={{ display: 'inline-block', marginTop: '1.5rem' }}>
        ← Продовжити покупки
      </Link>
    </div>
  );
}

function OrderCard({ order }: { order: import('../types').Order }) {
  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <strong className="mono">{order.orderNumber}</strong>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {new Date(order.createdAt).toLocaleString('uk-UA')}
          </div>
          <span className={`badge ${orderStatusClass(order.status)}`} style={{ marginTop: '0.35rem' }}>
            {orderStatusLabel(order.status)}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <strong>{formatCurrency(order.total)}</strong>
          {order.status === 'PENDING' && (
            <div style={{ marginTop: '0.5rem' }}>
              <Link to={`/payment/${order.orderNumber}`} className="btn btn-primary" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
                Оплатити
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className="table-scroll" style={{ marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Товар</th>
              <th>К-сть</th>
              <th>Ціна</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link to={`/product/${item.product.id}`}>{item.product.name}</Link>
                  <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.product.sku}
                  </div>
                </td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.unitPrice * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
