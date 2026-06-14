import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export function AccountPage() {
  const { user, isAuthenticated, logout, refreshProfile } = useCustomerAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState(user?.name ?? '');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: api.getCustomerProfile,
    enabled: isAuthenticated,
  });

  const updateMutation = useMutation({
    mutationFn: (newName: string) => api.updateCustomerProfile(newName),
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
    },
  });

  const display = profile ?? user;

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <h1>Мій акаунт</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Керуйте профілем і переглядайте замовлення в одному місці.
      </p>

      {isLoading ? (
        <div className="loading">Завантаження...</div>
      ) : (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label>Email</label>
            <input value={display?.email ?? ''} disabled />
          </div>
          <div className="form-group">
            <label>Ім&apos;я</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {profile && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Замовлень: <strong>{profile.ordersCount}</strong>
            </p>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={updateMutation.isPending || !name.trim()}
            onClick={() => updateMutation.mutate(name.trim())}
          >
            {updateMutation.isPending ? 'Збереження...' : 'Зберегти ім&apos;я'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link to="/orders" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
          Мої замовлення
        </Link>
        <Link to="/catalog" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
          До каталогу
        </Link>
        <button type="button" className="btn btn-secondary" onClick={logout}>
          Вийти
        </button>
      </div>
    </div>
  );
}
