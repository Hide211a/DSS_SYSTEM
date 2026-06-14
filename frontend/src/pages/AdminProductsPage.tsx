import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Pagination } from '../components/Pagination';
import { RecommendationBadge } from '../components/RecommendationBadge';
import { formatCurrency } from '../lib/format';

export function AdminProductsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['dss-products', page],
    queryFn: () => api.getDssProducts(page),
  });

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/admin" style={{ color: 'var(--text-muted)' }}>
            ← DSS Панель
          </Link>
          <h1 style={{ margin: '0.5rem 0 0' }}>Аналіз усіх SKU</h1>
        </div>
        <Link to="/admin/catalog" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
          Управління товарами
        </Link>
      </div>

      {isLoading ? (
        <div className="loading">Завантаження...</div>
      ) : (
        <>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Назва</th>
                  <th>Запас</th>
                  <th>План μ/день</th>
                  <th>MAPE</th>
                  <th>Страховий</th>
                  <th>ROP</th>
                  <th>EOQ</th>
                  <th>Днів</th>
                  <th>Вартість</th>
                  <th>ABC/XYZ</th>
                  <th>Ризик</th>
                  <th>Дія</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((r) => (
                  <tr key={r.productId}>
                    <td className="mono">{r.sku}</td>
                    <td>{r.name}</td>
                    <td>{r.currentStock}</td>
                    <td>{r.planningDemand}</td>
                    <td>{r.forecastMape}%</td>
                    <td>{r.safetyStock}</td>
                    <td>{r.reorderPoint}</td>
                    <td>{r.economicOrderQty}</td>
                    <td>{r.daysOfSupply}</td>
                    <td>{formatCurrency(r.stockValue)}</td>
                    <td>
                      <span className={`badge badge-${r.abcClass.toLowerCase()}`}>{r.abcClass}</span>
                      <span className="badge badge-c" style={{ marginLeft: 6 }}>{r.xyzClass}</span>
                    </td>
                    <td>
                      <div style={{ width: 48, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                        <div
                          style={{
                            width: `${r.riskScore}%`,
                            height: '100%',
                            background: r.riskScore > 50 ? 'var(--danger)' : 'var(--warning)',
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <RecommendationBadge type={r.recommendation} />
                      {r.recommendedOrderQty > 0 && (
                        <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
                          +{r.recommendedOrderQty} од.
                        </div>
                      )}
                    </td>
                    <td>
                      <Link to={`/admin/product/${r.productId}`}>→</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && (
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
