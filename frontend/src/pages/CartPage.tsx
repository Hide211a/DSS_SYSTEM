import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../lib/format';

export function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, totalItems, syncStock } = useCart();
  const [syncing, setSyncing] = useState(true);
  const [syncNote, setSyncNote] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSyncing(true);
      const result = await syncStock();
      if (cancelled) return;
      if (result.removed.length > 0) {
        setSyncNote(`Прибрано з кошика (немає в наявності): ${result.removed.join(', ')}`);
      } else if (result.adjusted.length > 0) {
        setSyncNote(
          `Кількість оновлено за актуальним складом: ${result.adjusted.map((a) => `${a.name} (${a.from}→${a.to})`).join(', ')}`
        );
      } else {
        setSyncNote('');
      }
      setSyncing(false);
    })();
    return () => {
      cancelled = true;
    };
    // Синхронізація лише при відкритті сторінки кошика
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (syncing) {
    return <div className="container loading">Оновлення залишків...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container empty-state">
        <h2>Кошик порожній</h2>
        {syncNote && <p style={{ color: 'var(--warning)' }}>{syncNote}</p>}
        <Link to="/catalog" className="btn btn-primary" style={{ marginTop: '1rem', textDecoration: 'none' }}>
          До каталогу
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Кошик ({totalItems})</h1>
      {syncNote && (
        <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--warning)', fontSize: '0.9rem' }}>
          {syncNote}
        </div>
      )}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Товар</th>
              <th>Ціна</th>
              <th>На складі</th>
              <th>Кількість</th>
              <th>Сума</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.product.id}>
                <td>
                  <Link to={`/product/${item.product.id}`}>{item.product.name}</Link>
                  <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.product.sku}
                  </div>
                </td>
                <td>{formatCurrency(item.product.price)}</td>
                <td>{item.product.stock}</td>
                <td>
                  <input
                    type="number"
                    min={1}
                    max={item.product.stock}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.product.id, Number(e.target.value))}
                    style={{ width: 64, padding: '0.35rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text)' }}
                  />
                </td>
                <td>{formatCurrency(item.product.price * item.quantity)}</td>
                <td>
                  <button className="btn btn-secondary" onClick={() => removeItem(item.product.id)}>
                    Видалити
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <strong style={{ fontSize: '1.25rem' }}>Разом: {formatCurrency(totalPrice)}</strong>
        <Link to="/checkout" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          Оформити замовлення
        </Link>
      </div>
    </div>
  );
}
