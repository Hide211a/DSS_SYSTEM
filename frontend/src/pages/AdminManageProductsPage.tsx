import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Pagination } from '../components/Pagination';
import { formatCurrency } from '../lib/format';
import type { AdminProduct } from '../types';

const emptyForm = {
  sku: '',
  name: '',
  description: '',
  price: 0,
  unitCost: 0,
  categoryId: '',
  leadTimeDays: 7,
  minOrderQty: 10,
  imageUrl: '',
  initialStock: 50,
};

export function AdminManageProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () => api.getAdminProducts({ page, search: search || undefined }),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? api.updateAdminProduct(editing.id, {
            sku: form.sku,
            name: form.name,
            description: form.description,
            price: Number(form.price),
            unitCost: Number(form.unitCost),
            categoryId: form.categoryId,
            leadTimeDays: Number(form.leadTimeDays),
            minOrderQty: Number(form.minOrderQty),
            imageUrl: form.imageUrl,
          })
        : api.createAdminProduct({
            ...form,
            price: Number(form.price),
            unitCost: Number(form.unitCost),
            leadTimeDays: Number(form.leadTimeDays),
            minOrderQty: Number(form.minOrderQty),
            initialStock: Number(form.initialStock),
          }),
    onSuccess: () => {
      setMessage(editing ? 'Товар оновлено' : 'Товар створено');
      setEditing(null);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAdminProduct(id),
    onSuccess: () => {
      setMessage('Товар деактивовано');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  const startEdit = (p: AdminProduct) => {
    setEditing(p);
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description,
      price: p.price,
      unitCost: p.unitCost,
      categoryId: p.categoryId,
      leadTimeDays: p.leadTimeDays,
      minOrderQty: p.minOrderQty,
      imageUrl: p.imageUrl ?? '',
      initialStock: 0,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  return (
    <div className="container">
      <Link to="/admin" style={{ color: 'var(--text-muted)' }}>
        ← DSS Панель
      </Link>
      <h1>Управління товарами</h1>

      {message && (
        <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--accent)' }}>
          {message}
          <button type="button" className="btn btn-secondary" style={{ marginLeft: 8 }} onClick={() => setMessage('')}>
            OK
          </button>
        </div>
      )}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginTop: 0 }}>{editing ? `Редагування: ${editing.sku}` : 'Новий товар'}</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          <div className="form-group">
            <label>SKU</label>
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Назва</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <Field label="Ціна" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
          <Field label="Собівартість" type="number" value={form.unitCost} onChange={(v) => setForm({ ...form, unitCost: v })} />
          <Field label="Lead time" type="number" value={form.leadTimeDays} onChange={(v) => setForm({ ...form, leadTimeDays: v })} />
          <Field label="Min order" type="number" value={form.minOrderQty} onChange={(v) => setForm({ ...form, minOrderQty: v })} />
          {!editing && (
            <Field label="Початковий запас" type="number" value={form.initialStock} onChange={(v) => setForm({ ...form, initialStock: v })} />
          )}
          <div className="form-group">
            <label>Категорія</label>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Оберіть...</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Опис</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text)' }}
          />
        </div>
        <div className="form-group">
          <label>URL зображення</label>
          <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {editing ? 'Зберегти' : 'Створити'}
          </button>
          {editing && (
            <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
              Скасувати
            </button>
          )}
        </div>
        {saveMutation.isError && (
          <div className="error-banner" style={{ marginTop: '1rem' }}>
            {saveMutation.error instanceof Error ? saveMutation.error.message : 'Помилка'}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder="Пошук SKU / назва..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ flex: 1, minWidth: 200, padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)' }}
        />
      </div>

      {isLoading ? (
        <div className="loading">Завантаження...</div>
      ) : (
        <>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Назва</th>
                  <th>Ціна</th>
                  <th>Запас</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.sku}</td>
                    <td>{p.name}</td>
                    <td>{formatCurrency(p.price)}</td>
                    <td>{p.stock ?? 0}</td>
                    <td>{p.isActive ? 'Активний' : 'Вимкнено'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => startEdit(p)}>
                        Ред.
                      </button>{' '}
                      <Link to={`/admin/product/${p.id}`}>DSS</Link>{' '}
                      {p.isActive && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ marginLeft: 4 }}
                          onClick={() => {
                            if (confirm(`Деактивувати ${p.name}?`)) deleteMutation.mutate(p.id);
                          }}
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && (
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string | number;
  onChange: (v: number) => void;
  type?: string;
}) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
