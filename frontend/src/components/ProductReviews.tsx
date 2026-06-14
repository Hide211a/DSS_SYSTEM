import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAppAuth } from '../hooks/useAppAuth';

function Stars({ value, size = '1rem' }: { value: number; size?: string }) {
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value} з 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= Math.round(value) ? '#fbbf24' : 'var(--border)' }}>
          ★
        </span>
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="star-picker">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="star-picker-btn"
          style={{ color: n <= value ? '#fbbf24' : 'var(--border)' }}
          onClick={() => onChange(n)}
          aria-label={`${n} зірок`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const { isCustomer, isAuthenticated, customer } = useAppAuth();
  const user = customer.user;
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['product-reviews', productId, page],
    queryFn: () => api.getProductReviews(productId, page),
  });

  const mutation = useMutation({
    mutationFn: () => api.postProductReview(productId, { rating, comment: comment.trim() }),
    onSuccess: () => {
      setComment('');
      setFormError('');
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const myReview = data?.items.find((r) => r.userId === user?.id);

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment);
    }
  }, [myReview?.id, myReview?.rating, myReview?.comment]);

  return (
    <div className="product-reviews">
      {data?.summary && data.summary.reviewCount > 0 && (
        <div className="review-summary card" style={{ marginBottom: '1.25rem' }}>
          <Stars value={data.summary.avgRating} size="1.25rem" />
          <strong style={{ marginLeft: '0.5rem' }}>{data.summary.avgRating}</strong>
          <span style={{ color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
            ({data.summary.reviewCount} відгуків)
          </span>
        </div>
      )}

      {isCustomer ? (
        <form
          className="card"
          style={{ marginBottom: '1.5rem' }}
          onSubmit={(e) => {
            e.preventDefault();
            if (comment.trim().length < 3) {
              setFormError('Коментар мінімум 3 символи');
              return;
            }
            mutation.mutate();
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            {myReview ? 'Оновити ваш відгук' : 'Залишити відгук'}
          </h3>
          <div className="form-group">
            <label>Оцінка</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div className="form-group">
            <label>Коментар</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Поділіться враженнями від товару..."
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text)',
                resize: 'vertical',
              }}
            />
          </div>
          {formError && <div className="error-banner">{formError}</div>}
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Збереження...' : myReview ? 'Оновити відгук' : 'Надіслати відгук'}
          </button>
        </form>
      ) : !isAuthenticated ? (
        <div className="card" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <Link to="/account/login" state={{ from: `/product/${productId}` }}>
            Увійдіть
          </Link>{' '}
          або <Link to="/account/register">зареєструйтесь</Link>, щоб залишити відгук.
        </div>
      ) : null}

      {isLoading ? (
        <div className="loading">Завантаження відгуків...</div>
      ) : data?.items.length === 0 ? (
        <div className="empty-state">Відгуків ще немає — будьте першим!</div>
      ) : (
        <>
          <div className="review-list">
            {data?.items.map((r) => (
              <article key={r.id} className="card review-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <strong>{r.authorName}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(r.createdAt).toLocaleDateString('uk-UA')}
                  </span>
                </div>
                <Stars value={r.rating} />
                <p style={{ margin: '0.75rem 0 0', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  {r.comment}
                </p>
              </article>
            ))}
          </div>
          {data && data.totalPages > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ←
              </button>
              <span style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>
                {page} / {data.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function RatingBadge({ avgRating, reviewCount }: { avgRating: number; reviewCount: number }) {
  if (reviewCount === 0) return null;
  return (
    <span className="rating-badge">
      <Stars value={avgRating} size="0.85rem" />
      <span className="mono" style={{ marginLeft: '0.35rem', fontSize: '0.85rem' }}>
        {avgRating} ({reviewCount})
      </span>
    </span>
  );
}
