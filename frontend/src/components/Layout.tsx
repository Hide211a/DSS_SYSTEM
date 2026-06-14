import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAppAuth } from '../hooks/useAppAuth';

export function Layout() {
  const { totalItems } = useCart();
  const { isAdmin, isCustomer, admin, customer } = useAppAuth();
  const location = useLocation();
  const onAdminPage = location.pathname.startsWith('/admin');
  const isAuthPage = ['/login', '/account/login', '/account/register'].includes(location.pathname);

  return (
    <div className={`layout-shell${isAuthPage ? ' layout-shell--auth' : ''}`}>
      {!isAuthPage && (
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'rgba(20, 26, 36, 0.85)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 0',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                }}
              >
                S
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>StockWise</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  DSS · E-commerce
                </div>
              </div>
            </div>
          </Link>

          <nav style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <NavLink to="/" end style={navStyle}>
              Магазин
            </NavLink>
            <NavLink to="/catalog" style={navStyle}>
              Каталог
            </NavLink>
            <NavLink to="/about" style={navStyle}>
              Про нас
            </NavLink>
            <NavLink to="/orders" style={navStyle}>
              Мої замовлення
            </NavLink>
            {!isCustomer && (
              <NavLink to={isAdmin ? '/admin' : '/login'} style={navStyle}>
                DSS Панель
              </NavLink>
            )}
            {isCustomer ? (
              <>
                <NavLink to="/account" style={navStyle}>
                  {customer.user?.name || 'Акаунт'}
                </NavLink>
                <button type="button" className="btn btn-secondary" onClick={customer.logout}>
                  Вийти
                </button>
              </>
            ) : !isAdmin ? (
              <NavLink to="/account/login" style={navStyle}>
                Увійти
              </NavLink>
            ) : null}
            {isAdmin && (
              <button type="button" className="btn btn-secondary" onClick={admin.logout}>
                DSS вихід
              </button>
            )}
            {!onAdminPage && (
              <Link to="/cart" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                Кошик {totalItems > 0 && <span className="mono">({totalItems})</span>}
              </Link>
            )}
          </nav>
        </div>
      </header>
      )}
      <main className={isAuthPage ? 'main--auth' : undefined}>
        <Outlet />
      </main>
      {!isAuthPage && (
        <footer
          style={{
            borderTop: '1px solid var(--border)',
            padding: '1.5rem 0',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
          }}
        >
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span>Дипломний проєкт: Система підтримки прийняття рішень для управління товарними запасами</span>
            <Link to="/about" style={{ color: 'var(--text-muted)' }}>
              Про нас
            </Link>
          </div>
        </footer>
      )}
    </div>
  );
}

function navStyle({ isActive }: { isActive: boolean }) {
  return {
    color: isActive ? 'var(--text)' : 'var(--text-muted)',
    fontWeight: isActive ? 600 : 400,
    textDecoration: 'none',
  } as const;
}
