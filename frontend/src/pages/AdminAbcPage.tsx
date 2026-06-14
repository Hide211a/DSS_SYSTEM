import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { RecommendationBadge } from '../components/RecommendationBadge';

export function AdminAbcPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dss-abc'],
    queryFn: api.getDssAbc,
  });

  return (
    <div className="container">
      <Link to="/admin" style={{ color: 'var(--text-muted)' }}>
        ← DSS Панель
      </Link>
      <h1>ABC / XYZ матриця</h1>
      <p style={{ color: 'var(--text-muted)', maxWidth: 640 }}>
        <strong>ABC</strong> — за вкладом у оборот (Парето 80/15/5). <strong>XYZ</strong> — за стабільністю попиту
        (CV: X ≤ 0.5, Y ≤ 1.0, Z &gt; 1.0). Комбінація визначає пріоритет контролю запасів.
      </p>

      {isLoading ? (
        <div className="loading">Завантаження...</div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Товар</th>
                <th>ABC</th>
                <th>XYZ</th>
                <th>% обороту</th>
                <th>Запас</th>
                <th>DSS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.map((row) => (
                <tr key={row.id}>
                  <td className="mono">{row.sku}</td>
                  <td>{row.name}</td>
                  <td>
                    <span className={`badge badge-${row.abcClass.toLowerCase()}`}>{row.abcClass}</span>
                  </td>
                  <td>
                    <span className="badge badge-c">{row.xyzClass}</span>
                  </td>
                  <td>{row.revenueSharePercent.toFixed(1)}%</td>
                  <td>{row.currentStock ?? '—'}</td>
                  <td>
                    {row.recommendation ? (
                      <RecommendationBadge type={row.recommendation} />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <Link to={`/admin/product/${row.id}`}>→</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
