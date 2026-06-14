import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { RecommendationBadge } from '../components/RecommendationBadge';

export function AdminExperimentPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dss-experiment'],
    queryFn: api.getDssExperiment,
  });

  if (isLoading) return <div className="container loading">Завантаження експерименту...</div>;
  if (!data) return <div className="container error-banner">Дані недоступні</div>;

  const { summary, comparison, needsAction } = data;

  return (
    <div className="container">
      <Link to="/admin" style={{ color: 'var(--text-muted)' }}>
        ← DSS Панель
      </Link>
      <h1>Експериментальне порівняння</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Розділ для пояснювальної записки: ефективність DSS порівняно з евристичним управлінням запасами.
      </p>
      <div className="auth-page-notice" style={{ marginTop: '1rem', marginBottom: 0 }}>
        <strong>Методологія:</strong> показник «Без DSS» — оцінкова евристика (40% надлишку / 25% ризику
        дефіциту від загальної кількості SKU), а не історична симуляція. Показник «З DSS» — реальні
        розрахунки системи на поточних даних продажів.
      </div>

      <div className="grid-kpi" style={{ margin: '1.5rem 0' }}>
        <div className="card">
          <div className="kpi-value">{summary.needsReplenishment}</div>
          <div className="kpi-label">Потребують поповнення</div>
        </div>
        <div className="card">
          <div className="kpi-value">{summary.healthy}</div>
          <div className="kpi-label">У нормі</div>
        </div>
        <div className="card">
          <div className="kpi-value">{summary.overstock}</div>
          <div className="kpi-label">Надлишок</div>
        </div>
        <div className="card">
          <div className="kpi-value">{summary.avgMape}%</div>
          <div className="kpi-label">Середній MAPE прогнозу</div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div className="card" style={{ borderColor: 'var(--border)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--text-muted)' }}>Без DSS (базова лінія)</h3>
          <p style={{ fontSize: '0.9rem' }}>{comparison.withoutDss.description}</p>
          <ul style={{ color: 'var(--text-muted)', paddingLeft: '1.2rem' }}>
            <li>Оцінка надлишку: ~{comparison.withoutDss.estimatedOverstockSkus} SKU</li>
            <li>Оцінка ризику дефіциту: ~{comparison.withoutDss.estimatedStockoutRisk} SKU</li>
          </ul>
        </div>
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--accent)' }}>З DSS (StockWise)</h3>
          <p style={{ fontSize: '0.9rem' }}>{comparison.withDss.description}</p>
          <ul style={{ color: 'var(--text-muted)', paddingLeft: '1.2rem' }}>
            <li>Надлишок (REDUCE): {comparison.withDss.overstockSkus} SKU</li>
            <li>Ризик OOS: {comparison.withDss.stockoutRiskSkus} SKU</li>
            <li>Рекомендовано ORDER: {comparison.withDss.orderSkus} SKU</li>
            <li>Рекомендовано одиниць: {summary.totalRecommendedUnits}</li>
          </ul>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Пріоритетні дії DSS</h3>
        <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Товар</th>
              <th>Запас</th>
              <th>ROP</th>
              <th>Рекомендація</th>
              <th>К-сть</th>
            </tr>
          </thead>
          <tbody>
            {needsAction.map((r) => (
              <tr key={r.productId}>
                <td className="mono">{r.sku}</td>
                <td>
                  <Link to={`/admin/product/${r.productId}`}>{r.name}</Link>
                </td>
                <td>{r.currentStock}</td>
                <td>{r.reorderPoint}</td>
                <td>
                  <RecommendationBadge type={r.recommendation} />
                </td>
                <td>{r.recommendedOrderQty}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
