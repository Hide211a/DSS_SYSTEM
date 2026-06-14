import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { DemandChart } from '../components/DemandChart';
import { DssConclusion } from '../components/DssConclusion';
import { RecommendationBadge } from '../components/RecommendationBadge';
import { formatCurrency } from '../lib/format';
import type { WhatIfResult } from '../types';

export function DssProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [whatIf, setWhatIf] = useState<WhatIfResult | null>(null);
  const [leadTime, setLeadTime] = useState(7);
  const [safetyDays, setSafetyDays] = useState(3);
  const [serviceLevel, setServiceLevel] = useState(0.95);
  const [demandMult, setDemandMult] = useState(1);
  const [saved, setSaved] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dss-product', id],
    queryFn: () => api.getDssProduct(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (!data) return;
    setLeadTime(data.leadTimeDays);
    setSafetyDays(Number(data.factors.safetyStockDays) || 3);
    setServiceLevel(Number(data.factors.serviceLevel) || 0.95);
    setDemandMult(1);
    setWhatIf(null);
  }, [data]);

  const whatIfMutation = useMutation({
    mutationFn: () =>
      api.whatIf(id!, {
        leadTimeDays: leadTime,
        safetyStockDays: safetyDays,
        serviceLevel,
        demandMultiplier: demandMult,
      }),
    onSuccess: setWhatIf,
  });

  const saveParamsMutation = useMutation({
    mutationFn: () =>
      api.updateDssParams(id!, {
        leadTimeDays: leadTime,
        safetyStockDays: safetyDays,
        serviceLevel,
      }),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['dss-product', id] });
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const restockMutation = useMutation({
    mutationFn: (qty: number) => api.restock(id!, qty, 'Поповнення за рекомендацією DSS'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dss-product', id] });
      queryClient.invalidateQueries({ queryKey: ['dss-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      navigate('/admin/inventory');
    },
  });

  const poMutation = useMutation({
    mutationFn: (qty: number) =>
      api.createPurchaseOrder({
        productId: id!,
        quantity: qty,
        note: 'Заявка з DSS-рекомендації',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      navigate('/admin/purchase-orders');
    },
  });

  if (isLoading) return <div className="container loading">Аналіз DSS...</div>;
  if (error || !data) return <div className="container error-banner">Дані недоступні</div>;

  const display = whatIf?.scenario ?? data;

  return (
    <div className="container">
      <Link to="/admin/products" style={{ color: 'var(--text-muted)' }}>
        ← Усі SKU
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', margin: '1rem 0 2rem' }}>
        <div>
          <span className="mono" style={{ color: 'var(--text-muted)' }}>
            {data.sku}
          </span>
          <h1 style={{ margin: '0.25rem 0' }}>{data.name}</h1>
          <RecommendationBadge type={display.recommendation} />
          {display.recommendedOrderQty > 0 && (
            <span style={{ marginLeft: '0.75rem', color: 'var(--primary)' }}>
              Рекомендовано замовити: <strong>{display.recommendedOrderQty}</strong> од.
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className={`badge badge-${data.abcClass.toLowerCase()}`}>
            ABC {data.abcClass}
          </span>
          <span className="badge badge-c">XYZ {data.xyzClass}</span>
        </div>
      </div>

      <div className="grid-kpi" style={{ marginBottom: '2rem' }}>
        <Metric label="Поточний запас" value={String(display.currentStock)} />
        <Metric label="Плановий попит/день" value={String(display.planningDemand)} />
        <Metric label="Історичний μ/день" value={String(display.avgDailyDemand)} />
        <Metric label="MAPE прогнозу" value={`${display.forecastMape}%`} />
        <Metric label="Страховий запас" value={String(display.safetyStock)} />
        <Metric label="Точка замовлення (ROP)" value={String(display.reorderPoint)} />
        <Metric label="EOQ" value={String(display.economicOrderQty)} />
        <Metric label="Днів покриття" value={String(display.daysOfSupply)} />
        <Metric label="Вартість запасу" value={formatCurrency(display.stockValue)} />
        <Metric label="Ризик-скор" value={`${display.riskScore}/100`} />
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>Прогноз попиту (експоненційне згладжування)</h3>
        <DemandChart history={display.forecast.history} projected={display.forecast.projected} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Прогноз: {display.forecast.dailyForecast} од./день · горизонт {display.forecast.horizonDays} дн.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Пояснення рішення DSS</h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
            {(whatIf ? display.explanation : data.explanation).map((line, i) => (
              <li key={i} style={{ marginBottom: '0.5rem' }}>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>What-if сценарій</h3>
          <div className="form-group">
            <label>Lead time (днів): {leadTime}</label>
            <input
              type="range"
              min={1}
              max={30}
              value={leadTime}
              onChange={(e) => setLeadTime(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Страховий запас (днів): {safetyDays}</label>
            <input
              type="range"
              min={1}
              max={14}
              step={0.5}
              value={safetyDays}
              onChange={(e) => setSafetyDays(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Рівень сервісу: {(serviceLevel * 100).toFixed(0)}%</label>
            <input
              type="range"
              min={0.9}
              max={0.99}
              step={0.01}
              value={serviceLevel}
              onChange={(e) => setServiceLevel(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Множник попиту: ×{demandMult}</label>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={demandMult}
              onChange={(e) => setDemandMult(Number(e.target.value))}
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '0.5rem' }}
            disabled={whatIfMutation.isPending}
            onClick={() => whatIfMutation.mutate()}
          >
            Запустити сценарій
          </button>
          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            disabled={saveParamsMutation.isPending}
            onClick={() => saveParamsMutation.mutate()}
          >
            {saved ? 'Збережено ✓' : 'Зберегти параметри в БД'}
          </button>
          {whatIf && (
            <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
              <strong>Порівняння з базовим сценарієм:</strong>
              <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)' }}>
                <li>ROP: {whatIf.baseline.reorderPoint} → {whatIf.scenario.reorderPoint} ({whatIf.deltas.reorderPoint >= 0 ? '+' : ''}{whatIf.deltas.reorderPoint})</li>
                <li>Страховий: {whatIf.deltas.safetyStock >= 0 ? '+' : ''}{whatIf.deltas.safetyStock}</li>
                <li>Замовлення: {whatIf.deltas.recommendedOrderQty >= 0 ? '+' : ''}{whatIf.deltas.recommendedOrderQty} од.</li>
                {whatIf.deltas.recommendationChanged && (
                  <li style={{ color: 'var(--warning)' }}>
                    Рекомендація змінилась: {whatIf.baseline.recommendation} → {whatIf.scenario.recommendation}
                  </li>
                )}
              </ul>
              <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }} onClick={() => setWhatIf(null)}>
                Скинути до базового
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Параметри моделі</h3>
        <table className="data-table">
          <tbody>
            {Object.entries(display.factors).map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td className="mono">{String(v)}</td>
              </tr>
            ))}
            <tr>
              <td>σ попиту</td>
              <td className="mono">{display.demandStdDev}</td>
            </tr>
            <tr>
              <td>Lead time</td>
              <td className="mono">{display.leadTimeDays} дн.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <DssConclusion
        analysis={display}
        isScenario={!!whatIf}
        actions={
          (display.recommendation === 'ORDER' || display.recommendation === 'RISK_OOS') &&
          display.recommendedOrderQty > 0 ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                disabled={restockMutation.isPending}
                onClick={() => restockMutation.mutate(display.recommendedOrderQty)}
              >
                Поповнити склад ({display.recommendedOrderQty} од.)
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={poMutation.isPending}
                onClick={() => poMutation.mutate(display.recommendedOrderQty)}
              >
                Заявка на закупівлю
              </button>
            </>
          ) : undefined
        }
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="kpi-value" style={{ fontSize: '1.35rem' }}>
        {value}
      </div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}
