import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/format';
import { useAppAuth } from '../hooks/useAppAuth';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAdd?: (product: Product) => void;
  showAddButton?: boolean;
}

export function ProductCard({ product, onAdd, showAddButton = true }: ProductCardProps) {
  const { isAdmin } = useAppAuth();

  return (
    <article className="card product-card">
      <Link to={`/product/${product.id}`} className="product-card-link">
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.name} className="product-card-image" />
        )}
        <div className="mono product-card-meta">
          {product.sku} · {product.category.name}
        </div>
        <h3 className="product-card-title">{product.name}</h3>
      </Link>
      <p className="product-card-desc">{product.description}</p>
      <div className="product-card-footer">
        <div>
          <strong className="product-card-price">{formatCurrency(product.price)}</strong>
          <div
            className="product-card-stock"
            style={{ color: product.inStock ? 'var(--accent)' : 'var(--danger)' }}
          >
            {product.inStock ? `В наявності: ${product.stock}` : 'Немає в наявності'}
          </div>
        </div>
        {isAdmin ? (
          <Link
            to={`/admin/product/${product.id}`}
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            DSS →
          </Link>
        ) : (
          showAddButton &&
          onAdd && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!product.inStock}
              onClick={() => onAdd(product)}
            >
              {product.inStock ? 'У кошик' : 'Немає'}
            </button>
          )
        )}
      </div>
    </article>
  );
}
