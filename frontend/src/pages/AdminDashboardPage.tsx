import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../api/client';
import { RecommendationBadge } from '../components/RecommendationBadge';
import { formatCurrency } from '../lib/format';

const ABC_COLORS = { A: '#8b5cf6', B: '#06b6d4', C: '#64748b' };

export function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dss-dashboard'],
    queryFn: api.getDssDashboard,
  });

  const { data: sales } = useQuery({
    queryKey: ['sales-stats'],
    queryFn: api.getSalesStats,
  });

  if (isLoading) return <div className="container loading">Завантаження DSS...</div>;
  if (error || !data) return <div className="container error-banner">Не вдалося завантажити дані</div>;

  const { kpis, topRisks } = data;
  const abcChart = [
    { name: 'Клас A', value: kpis.abcDistribution.A, fill: ABC_COLORS.A },
    { name: 'Клас B', value: kpis.abcDistribution.B, fill: ABC_COLORS.B },
    { name: 'Клас C', value: kpis.abcDistribution.C, fill: ABC_COLORS.C },
  ];

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>DSS Панель управління запасами</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
            Система підтримки прийняття рішень · реальний час
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={() => api.exportDssCsv()}>
            Експорт CSV
          </button>
          <Link to="/admin/experiment" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Експеримент
          </Link>
          <Link to="/admin/abc" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            ABC/XYZ
          </Link>
          <Link to="/admin/catalog" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Товари
          </Link>
          <Link to="/admin/inventory" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Склад
          </Link>
          <Link to="/admin/purchase-orders" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Закупівлі
          </Link>
          <Link to="/admin/products" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Усі SKU
          </Link>
        </div>
      </div>

      <div className="grid-kpi" style={{ marginBottom: '2rem' }}>
        <KpiCard label="SKU на обліку" value={String(kpis.totalSkus)} />
        <KpiCard label="Вартість запасів" value={formatCurrency(kpis.totalStockValue)} />
        <KpiCard label="Сер. днів покриття" value={String(kpis.avgDaysOfSupply)} />
        <KpiCard label="Ризик дефіциту" value={String(kpis.atRiskCount)} highlight={kpis.atRiskCount > 0} />
        <KpiCard label="Рекоменд. замовлення" value={String(kpis.orderRecommendedCount)} />
        <KpiCard label="Надлишковий запас" value={String(kpis.overstockCount)} />
        <KpiCard label="XYZ: нестабільні (Z)" value={String(kpis.xyzDistribution?.Z ?? 0)} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Розподіл ABC</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={abcChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {abcChart.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Оборот по місяцях</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sales?.slice(-8) ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3548" />
              <XAxis dataKey="month" stroke="#8b9bb4" fontSize={10} tickFormatter={(m) => m.slice(5)} />
              <YAxis stroke="#8b9bb4" fontSize={10} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="revenue" name="Дохід" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Топ ризиків (пріоритет DSS)</h2>
        <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Товар</th>
              <th>Запас</th>
              <th>ROP</th>
              <th>Днів</th>
              <th>ABC</th>
              <th>Рекомендація</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {topRisks.map((r) => (
              <tr key={r.productId}>
                <td className="mono">{r.sku}</td>
                <td>{r.name}</td>
                <td>{r.currentStock}</td>
                <td>{r.reorderPoint}</td>
                <td>{r.daysOfSupply}</td>
                <td>
                  <span className={`badge badge-${r.abcClass.toLowerCase()}`}>{r.abcClass}</span>
                </td>
                <td>
                  <RecommendationBadge type={r.recommendation} />
                </td>
                <td>
                  <Link to={`/admin/product/${r.productId}`}>Деталі →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="card" style={highlight ? { borderColor: 'var(--danger)' } : undefined}>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}
