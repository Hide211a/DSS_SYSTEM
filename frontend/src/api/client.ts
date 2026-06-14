import { getAuthToken } from '../context/AuthContext';
import { getCustomerToken } from '../context/CustomerAuthContext';
import { getApiBase } from '../lib/apiBase';

const BASE = getApiBase();

type AuthMode = 'admin' | 'customer' | 'customerIfPresent' | 'none';

type RequestOptions = RequestInit & { auth?: AuthMode };

function resolveToken(auth: AuthMode): string | null {
  if (auth === 'admin') return getAuthToken();
  if (auth === 'customer') return getCustomerToken();
  if (auth === 'customerIfPresent') return getCustomerToken();
  return null;
}

function defaultAuth(path: string): AuthMode {
  if (path.startsWith('/admin') || path.startsWith('/dss')) return 'admin';
  if (path.startsWith('/customer')) return 'customer';
  if (path.startsWith('/orders')) return 'customerIfPresent';
  return 'none';
}

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const auth = options?.auth ?? defaultAuth(path);
  const token = resolveToken(auth);
  const { auth: _auth, ...fetchOptions } = options ?? {};

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  });

  if (res.status === 401) {
    if (auth === 'admin' || path.startsWith('/admin') || path.startsWith('/dss')) {
      sessionStorage.removeItem('dss_admin_token');
      if (!path.startsWith('/auth/')) {
        window.location.href = '/login';
      }
    } else if (auth === 'customer' || auth === 'customerIfPresent') {
      localStorage.removeItem('stockwise_customer_token');
      localStorage.removeItem('stockwise_customer_user');
      if (auth === 'customer') {
        window.location.href = '/account/login';
      }
    }
    throw new Error('Сесія закінчилась. Увійдіть знову.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(typeof err.error === 'string' ? err.error : 'Помилка запиту');
  }
  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; role: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      auth: 'none',
    }),

  customerLogin: (email: string, password: string) =>
    request<{ token: string; role: string; user: import('../types').CustomerUser }>(
      '/customer/login',
      { method: 'POST', body: JSON.stringify({ email, password }), auth: 'none' }
    ),

  customerRegister: (email: string, password: string, name?: string) =>
    request<{ token: string; role: string; user: import('../types').CustomerUser }>(
      '/customer/register',
      { method: 'POST', body: JSON.stringify({ email, password, name }), auth: 'none' }
    ),

  getCustomerProfile: () =>
    request<import('../types').CustomerProfile>('/customer/me', { auth: 'customer' }),

  updateCustomerProfile: (name: string) =>
    request<import('../types').CustomerUser>('/customer/me', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
      auth: 'customer',
    }),

  getCategories: () => request<import('../types').Category[]>('/categories'),
  getProducts: (params?: { category?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return request<import('../types').Product[]>(`/products${qs ? `?${qs}` : ''}`);
  },
  getProduct: (id: string) => request<import('../types').Product>(`/products/${id}`),

  getProductReviews: (productId: string, page = 1) => {
    const q = new URLSearchParams({ page: String(page) });
    return request<import('../types').ProductReviewsResponse>(
      `/products/${productId}/reviews?${q}`
    );
  },

  postProductReview: (productId: string, body: { rating: number; comment: string }) =>
    request<{ review: import('../types').ProductReview; summary: import('../types').ReviewSummary }>(
      `/products/${productId}/reviews`,
      { method: 'POST', body: JSON.stringify(body), auth: 'customer' }
    ),

  stockCheck: (productIds: string[]) =>
    request<import('../types').Product[]>('/products/stock-check', {
      method: 'POST',
      body: JSON.stringify({ productIds }),
    }),

  createOrder: (body: {
    customerName?: string;
    customerEmail?: string;
    items: { productId: string; quantity: number }[];
  }) =>
    request<import('../types').Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: 'customerIfPresent',
    }),

  getMyOrders: (page = 1) => {
    const q = new URLSearchParams({ page: String(page) });
    return request<import('../types').Paginated<import('../types').Order>>(`/orders/my?${q}`, {
      auth: 'customer',
    });
  },
  getOrderByNumber: (orderNumber: string, email?: string) => {
    const q = email ? `?email=${encodeURIComponent(email)}` : '';
    return request<import('../types').Order>(
      `/orders/number/${encodeURIComponent(orderNumber)}${q}`,
      { auth: 'customerIfPresent' }
    );
  },

  payOrder: (orderNumber: string, paymentMethod = 'MOCK_CARD') =>
    request<import('../types').Order>(
      `/orders/${encodeURIComponent(orderNumber)}/pay`,
      { method: 'POST', body: JSON.stringify({ paymentMethod }), auth: 'customerIfPresent' }
    ),

  cancelOrder: (orderNumber: string) =>
    request<import('../types').Order>(`/orders/${encodeURIComponent(orderNumber)}/cancel`, {
      method: 'POST',
      auth: 'customerIfPresent',
    }),

  getPurchaseOrders: (params?: { page?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    return request<import('../types').Paginated<import('../types').PurchaseOrder>>(
      `/admin/purchase-orders${qs ? `?${qs}` : ''}`
    );
  },
  createPurchaseOrder: (body: { productId: string; quantity: number; note?: string }) =>
    request<import('../types').PurchaseOrder>('/admin/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  receivePurchaseOrder: (id: string) =>
    request<import('../types').PurchaseOrder>(`/admin/purchase-orders/${id}/receive`, {
      method: 'POST',
    }),

  getDssDashboard: () => request<import('../types').DssDashboard>('/dss/dashboard'),
  getDssProducts: (page = 1, pageSize = 15) => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return request<import('../types').Paginated<import('../types').ProductDssAnalysis>>(
      `/dss/products?${q}`
    );
  },
  getDssProduct: (id: string) =>
    request<import('../types').ProductDssAnalysis>(`/dss/products/${id}`),
  getDssAbc: () => request<import('../types').AbcItem[]>('/dss/abc'),
  getDssExperiment: () => request<import('../types').DssExperiment>('/dss/experiment'),
  exportDssCsv: async () => {
    const token = getAuthToken();
    const res = await fetch(`${BASE}/dss/products/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Не вдалося експортувати');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dss-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  },
  whatIf: (id: string, body: Record<string, number>) =>
    request<import('../types').WhatIfResult>(`/dss/products/${id}/what-if`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateDssParams: (
    id: string,
    body: {
      serviceLevel?: number;
      safetyStockDays?: number;
      forecastHorizonDays?: number;
      leadTimeDays?: number;
    }
  ) =>
    request(`/dss/products/${id}/params`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  getAdminProducts: (params?: { page?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return request<import('../types').Paginated<import('../types').AdminProduct>>(
      `/admin/products${qs ? `?${qs}` : ''}`
    );
  },
  createAdminProduct: (body: Record<string, unknown>) =>
    request<import('../types').AdminProduct>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateAdminProduct: (id: string, body: Record<string, unknown>) =>
    request<import('../types').AdminProduct>(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteAdminProduct: (id: string) =>
    request<{ success: boolean }>(`/admin/products/${id}`, { method: 'DELETE' }),

  getInventory: () => request<import('../types').InventoryItem[]>('/admin/inventory'),
  restock: (productId: string, quantity: number, note?: string) =>
    request('/admin/restock', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, note }),
    }),
  getMovements: (page = 1, pageSize = 25) => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return request<import('../types').Paginated<import('../types').StockMovement>>(
      `/admin/movements?${q}`
    );
  },
  getSalesStats: () =>
    request<{ month: string; revenue: number; orders: number }[]>('/admin/stats/sales'),
};
