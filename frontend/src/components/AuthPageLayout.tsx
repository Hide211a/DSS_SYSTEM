import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

type AuthVariant = 'admin' | 'customer';

interface AuthPageLayoutProps {
  variant: AuthVariant;
  title: string;
  subtitle: string;
  backTo?: string;
  notice?: ReactNode;
  demo?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

const ADMIN_FEATURES = [
  { icon: '📊', text: 'ABC-аналіз та прогноз попиту' },
  { icon: '📦', text: 'Управління запасами в реальному часі' },
  { icon: '🛒', text: 'Замовлення постачальникам (PO)' },
];

const CUSTOMER_FEATURES = [
  { icon: '🛍️', text: 'Кошик та швидке оформлення' },
  { icon: '📋', text: 'Історія замовлень у профілі' },
  { icon: '✨', text: 'Персональні рекомендації' },
];

export function AuthPageLayout({
  variant,
  title,
  subtitle,
  backTo = '/',
  notice,
  demo,
  footer,
  children,
}: AuthPageLayoutProps) {
  const features = variant === 'admin' ? ADMIN_FEATURES : CUSTOMER_FEATURES;
  const brandTitle = variant === 'admin' ? 'StockWise DSS' : 'StockWise';
  const brandTagline =
    variant === 'admin'
      ? 'Система підтримки рішень для управління складом та аналітики продажів.'
      : 'Ваш акаунт для зручних покупок, відстеження замовлень і персональних пропозицій.';

  return (
    <div className={`auth-page auth-page--${variant}`}>
      <div className="auth-page-grid">
        <aside className={`auth-page-brand auth-page-brand--${variant}`} aria-hidden="true">
          <div className="auth-page-brand-bg" />
          <div className="auth-page-brand-content">
            <Link to="/" className="auth-page-logo">
              <span className="auth-page-logo-mark">SW</span>
              <span>{brandTitle}</span>
            </Link>
            <p className="auth-page-brand-tagline">{brandTagline}</p>
            <ul className="auth-page-features">
              {features.map((f) => (
                <li key={f.text}>
                  <span className="auth-page-feature-icon">{f.icon}</span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="auth-page-form-wrap">
          <div className="auth-page-form-inner">
            {backTo && (
              <Link to={backTo} className="auth-page-back">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M10 12L6 8l4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                На головну
              </Link>
            )}

            <div className="auth-page-card">
              <div className="auth-page-header">
                <span className={`auth-page-eyebrow auth-page-eyebrow--${variant}`}>
                  {variant === 'admin' ? 'Адміністратор' : 'Клієнтський акаунт'}
                </span>
                <h1 className="auth-page-title">{title}</h1>
                <p className="auth-page-subtitle">{subtitle}</p>
              </div>

              {notice && <div className="auth-page-notice">{notice}</div>}

              {children}

              {demo && <div className="auth-page-demo">{demo}</div>}
              {footer && <div className="auth-page-footer">{footer}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
