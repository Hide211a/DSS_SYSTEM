import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { useAddToCart } from '../hooks/useAddToCart';

export function CatalogPage() {
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [search, setSearch] = useState('');
  const { addToCart, isAuthenticated } = useAddToCart();

  useEffect(() => {
    setCategory(searchParams.get('category') ?? '');
  }, [searchParams]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', category, search],
    queryFn: () => api.getProducts({ category: category || undefined, search: search || undefined }),
  });

  return (
    <div className="container">
      <h1>Каталог товарів</h1>
      {!isAuthenticated && (
        <div className="card" style={{ marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          Для покупок потрібен акаунт:{' '}
          <Link to="/account/login">увійти</Link> або <Link to="/account/register">зареєструватись</Link>.
        </div>
      )}

      <div className="catalog-toolbar">
        <input
          type="search"
          placeholder="Пошук за назвою або SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="catalog-search"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="catalog-select"
        >
          <option value="">Усі категорії</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="loading">Завантаження...</div>
      ) : !products?.length ? (
        <div className="empty-state">Товарів не знайдено</div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={addToCart} />
          ))}
        </div>
      )}
    </div>
  );
}
