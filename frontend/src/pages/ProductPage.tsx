import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ProductReviews, RatingBadge } from '../components/ProductReviews';
import { useAddToCart } from '../hooks/useAddToCart';
import { useAppAuth } from '../hooks/useAppAuth';
import { formatCurrency } from '../lib/format';

type Tab = 'description' | 'specs' | 'reviews';

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAppAuth();
  const { addToCart, isAuthenticated, canPurchase } = useAddToCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState<Tab>('description');

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.getProduct(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="container loading">Завантаження...</div>;
  if (error || !product)
    return <div className="container error-banner">Товар не знайдено</div>;

  const handleAdd = () => {
    if (addToCart(product, qty)) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'description', label: 'Опис' },
    { id: 'specs', label: 'Характеристики' },
    { id: 'reviews', label: `Відгуки (${product.reviewSummary?.reviewCount ?? 0})` },
  ];

  return (
    <div className="container">
      <Link to="/catalog" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        ← Назад до каталогу
      </Link>

      <div className="product-detail">
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.name} className="product-detail-image" />
        )}
        <div>
          <span className="mono" style={{ color: 'var(--text-muted)' }}>
            {product.sku} · {product.category.name}
          </span>
          <h1 style={{ margin: '0.5rem 0 0.75rem' }}>{product.name}</h1>
          {product.reviewSummary && (
            <div style={{ marginBottom: '0.75rem' }}>
              <RatingBadge
                avgRating={product.reviewSummary.avgRating}
                reviewCount={product.reviewSummary.reviewCount}
              />
            </div>
          )}
          <p className="product-detail-price">{formatCurrency(product.price)}</p>
          <p>
            Статус:{' '}
            <strong style={{ color: product.inStock ? 'var(--accent)' : 'var(--danger)' }}>
              {product.inStock ? `${product.stock} од. на складі` : 'Немає в наявності'}
            </strong>
          </p>

          {!isAdmin && !isAuthenticated && (
            <div className="card" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
              Щоб купити цей товар,{' '}
              <Link to="/account/login" state={{ from: `/product/${product.id}` }}>
                увійдіть в акаунт
              </Link>{' '}
              або <Link to="/account/register">зареєструйтесь</Link>.
            </div>
          )}

          {isAdmin ? (
            <div style={{ marginTop: '1.5rem' }}>
              <Link
                to={`/admin/product/${product.id}`}
                className="btn btn-primary"
                style={{ textDecoration: 'none' }}
              >
                Аналіз запасів у DSS →
              </Link>
              <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 0 }}>
                Рекомендації, прогноз попиту та параметри поповнення для цього SKU.
              </p>
            </div>
          ) : (
            product.inStock &&
            canPurchase && (
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  marginTop: '1.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  type="number"
                  min={1}
                  max={product.stock}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="product-qty-input"
                />
                <button className="btn btn-primary" onClick={handleAdd}>
                  {added ? 'Додано ✓' : 'Додати в кошик'}
                </button>
                <Link to="/cart" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                  Перейти в кошик
                </Link>
              </div>
            )
          )}
        </div>
      </div>

      <div className="product-tabs" style={{ marginTop: '2.5rem' }}>
        <div className="product-tabs-nav">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`product-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="product-tab-panel card">
          {tab === 'description' && (
            <div>
              <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>Опис товару</h2>
              <p className="product-detail-desc" style={{ margin: 0 }}>
                {product.description}
              </p>
            </div>
          )}

          {tab === 'specs' && (
            <div>
              <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>Характеристики</h2>
              {product.specs && product.specs.length > 0 ? (
                <table className="data-table spec-table">
                  <tbody>
                    {product.specs.map((s) => (
                      <tr key={s.id}>
                        <th style={{ width: '40%' }}>{s.name}</th>
                        <td>{s.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Характеристики уточнюються.</p>
              )}
            </div>
          )}

          {tab === 'reviews' && id && <ProductReviews productId={id} />}
        </div>
      </div>
    </div>
  );
}
