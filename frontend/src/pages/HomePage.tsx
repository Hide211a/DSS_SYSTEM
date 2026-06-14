import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { useAddToCart } from '../hooks/useAddToCart';

export function HomePage() {
  const { addToCart, isAuthenticated } = useAddToCart();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
  });

  const featured = products?.slice(0, 8) ?? [];

  return (
    <div>
      <section className="shop-hero">
        <div className="container shop-hero-inner">
          <div className="shop-hero-content">
            <span className="shop-hero-badge">Новий сезон · знижки до 15%</span>
            <h1>Техніка, одяг і товари для дому — все в одному місці</h1>
            <p>
              StockWise — сучасний інтернет-магазин з швидкою доставкою, зручною оплатою та
              актуальними залишками на складі.
            </p>
            <div className="shop-hero-actions">
              <Link to="/catalog" className="btn btn-primary shop-hero-cta">
                Переглянути каталог
              </Link>
              {!isAuthenticated && (
                <Link to="/account/register" className="btn btn-secondary shop-hero-cta">
                  Створити акаунт
                </Link>
              )}
            </div>
            {!isAuthenticated && (
              <p className="shop-hero-note">
                Щоб додати товар у кошик, потрібно{' '}
                <Link to="/account/login">увійти</Link> або{' '}
                <Link to="/account/register">зареєструватись</Link>.
              </p>
            )}
          </div>
          <div className="shop-hero-visual">
            {featured[0]?.imageUrl && (
              <img src={featured[0].imageUrl} alt={featured[0].name} className="shop-hero-image" />
            )}
          </div>
        </div>
      </section>

      {categories && categories.length > 0 && (
        <section className="container shop-section">
          <h2 className="shop-section-title">Категорії</h2>
          <div className="shop-categories">
            {categories.map((c) => (
              <Link key={c.id} to={`/catalog?category=${c.slug}`} className="shop-category-chip">
                <span>{c.name}</span>
                {c._count?.products != null && (
                  <span className="shop-category-count">{c._count.products}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container shop-section">
        <div className="shop-section-header">
          <h2 className="shop-section-title">Популярні товари</h2>
          <Link to="/catalog" className="shop-section-link">
            Увесь каталог →
          </Link>
        </div>
        {isLoading ? (
          <div className="loading">Завантаження...</div>
        ) : (
          <div className="product-grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={addToCart} />
            ))}
          </div>
        )}
      </section>

      <section className="container shop-section">
        <div className="shop-perks">
          {[
            { title: 'Швидка доставка', desc: 'Відправка замовлень протягом 1–2 робочих днів.' },
            { title: 'Безпечна оплата', desc: 'Mock-оплата карткою для демо-замовлень.' },
            { title: 'Актуальний склад', desc: 'Кількість на сайті відповідає реальним залишкам.' },
          ].map((item) => (
            <div key={item.title} className="card shop-perk">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
