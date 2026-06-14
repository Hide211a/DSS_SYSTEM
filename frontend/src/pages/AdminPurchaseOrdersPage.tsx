import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Pagination } from '../components/Pagination';
import { formatCurrency } from '../lib/format';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Чернетка',
  SENT: 'Надіслано',
  RECEIVED: 'Отримано',
  CANCELLED: 'Скасовано',
};

export function AdminPurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', page, statusFilter],
    queryFn: () => api.getPurchaseOrders({ page, status: statusFilter || undefined }),
  });

  const receiveMutation = useMutation({
    mutationFn: (id: string) => api.receivePurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dss-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dss-products'] });
    },
  });

  return (
    <div className="container">
      <Link to="/admin" style={{ color: 'var(--text-muted)' }}>
        ← DSS Панель
      </Link>
      <h1>Заявки на закупівлю (Purchase Orders)</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Створюються з DSS-рекомендацій. Після отримання товару запас поповнюється автоматично.
      </p>

      <select
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value);
          setPage(1);
        }}
        style={{
          marginBottom: '1rem',
          padding: '0.5rem 1rem',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          color: 'var(--text)',
        }}
      >
        <option value="">Усі статуси</option>
        <option value="SENT">Надіслані</option>
        <option value="RECEIVED">Отримані</option>
        <option value="CANCELLED">Скасовані</option>
      </select>

      {isLoading ? (
        <div className="loading">Завантаження...</div>
      ) : (
        <>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO №</th>
                  <th>SKU</th>
                  <th>Товар</th>
                  <th>К-сть</th>
                  <th>Собівартість</th>
                  <th>Сума</th>
                  <th>Статус</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((po) => (
                  <tr key={po.id}>
                    <td className="mono">{po.poNumber}</td>
                    <td className="mono">{po.product.sku}</td>
                    <td>{po.product.name}</td>
                    <td>{po.quantity}</td>
                    <td>{formatCurrency(po.unitCost)}</td>
                    <td>{formatCurrency(po.unitCost * po.quantity)}</td>
                    <td>
                      <span className="badge badge-c">{STATUS_LABEL[po.status] ?? po.status}</span>
                    </td>
                    <td>
                      {po.status === 'SENT' && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={receiveMutation.isPending}
                          onClick={() => receiveMutation.mutate(po.id)}
                        >
                          Отримати
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.items.length === 0 && (
              <p style={{ color: 'var(--text-muted)', padding: '1rem' }}>
                Заявок ще немає. Створіть з картки DSS товару.
              </p>
            )}
          </div>
          {data && (
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
