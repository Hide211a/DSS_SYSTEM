import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Pagination } from '../components/Pagination';

export function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [restockId, setRestockId] = useState('');
  const [restockQty, setRestockQty] = useState(10);

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: api.getInventory,
  });

  const [movementsPage, setMovementsPage] = useState(1);

  const { data: movements } = useQuery({
    queryKey: ['movements', movementsPage],
    queryFn: () => api.getMovements(movementsPage),
  });

  const restockMutation = useMutation({
    mutationFn: () => api.restock(restockId, restockQty, 'Поповнення з DSS панелі'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['dss-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dss-products'] });
      setRestockId('');
    },
  });

  return (
    <div className="container">
      <Link to="/admin" style={{ color: 'var(--text-muted)' }}>
        ← DSS Панель
      </Link>
      <h1>Склад та рухи</h1>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>Поповнення запасу</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 200px', margin: 0 }}>
            <label>Товар</label>
            <select value={restockId} onChange={(e) => setRestockId(e.target.value)}>
              <option value="">Оберіть SKU</option>
              {inventory?.map((i) => (
                <option key={i.productId} value={i.productId}>
                  {i.product.sku} — {i.product.name} ({i.quantity} од.)
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ width: 120, margin: 0 }}>
            <label>Кількість</label>
            <input
              type="number"
              min={1}
              value={restockQty}
              onChange={(e) => setRestockQty(Number(e.target.value))}
            />
          </div>
          <button
            className="btn btn-primary"
            disabled={!restockId || restockMutation.isPending}
            onClick={() => restockMutation.mutate()}
          >
            Поповнити
          </button>
        </div>
        {restockMutation.isSuccess && (
          <p style={{ color: 'var(--accent)', marginTop: '0.75rem' }}>Запас оновлено</p>
        )}
      </div>

      {isLoading ? (
        <div className="loading">Завантаження...</div>
      ) : (
        <div className="card" style={{ marginBottom: '2rem', overflowX: 'auto' }}>
          <h3 style={{ marginTop: 0 }}>Поточні залишки</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Товар</th>
                <th>Склад</th>
                <th>Кількість</th>
                <th>DSS</th>
              </tr>
            </thead>
            <tbody>
              {inventory?.map((i) => (
                <tr key={i.id}>
                  <td className="mono">{i.product.sku}</td>
                  <td>{i.product.name}</td>
                  <td>{i.warehouse.name}</td>
                  <td>
                    <strong>{i.quantity}</strong>
                  </td>
                  <td>
                    <Link to={`/admin/product/${i.productId}`}>Аналіз</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card" style={{ overflowX: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>Останні рухи</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Тип</th>
              <th>SKU</th>
              <th>Кількість</th>
              <th>Референс</th>
            </tr>
          </thead>
          <tbody>
            {movements?.items.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.createdAt).toLocaleString('uk-UA')}</td>
                <td>{m.type}</td>
                <td className="mono">{m.product.sku}</td>
                <td style={{ color: m.quantity < 0 ? 'var(--danger)' : 'var(--accent)' }}>
                  {m.quantity > 0 ? '+' : ''}
                  {m.quantity}
                </td>
                <td className="mono" style={{ fontSize: '0.8rem' }}>
                  {m.reference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {movements && (
          <Pagination
            page={movements.page}
            totalPages={movements.totalPages}
            onPageChange={setMovementsPage}
          />
        )}
      </div>
    </div>
  );
}
