import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppAuth } from '../hooks/useAppAuth';
import { CustomerRoute } from './CustomerRoute';

vi.mock('../hooks/useAppAuth', () => ({
  useAppAuth: vi.fn(),
}));

function renderCustomerRoute(initialPath = '/cart') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<CustomerRoute />}>
          <Route path="/cart" element={<div>Cart content</div>} />
          <Route path="/account" element={<div>Account content</div>} />
        </Route>
        <Route path="/account/login" element={<div>Login page</div>} />
        <Route path="/admin" element={<div>Admin panel</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CustomerRoute', () => {
  beforeEach(() => {
    vi.mocked(useAppAuth).mockReset();
  });

  it('renders child route for customer', () => {
    vi.mocked(useAppAuth).mockReturnValue({
      isCustomer: true,
      isAdmin: false,
      isAuthenticated: true,
      admin: {} as ReturnType<typeof useAppAuth>['admin'],
      customer: {} as ReturnType<typeof useAppAuth>['customer'],
    });

    renderCustomerRoute();
    expect(screen.getByText('Cart content')).toBeInTheDocument();
  });

  it('redirects guest to login', () => {
    vi.mocked(useAppAuth).mockReturnValue({
      isCustomer: false,
      isAdmin: false,
      isAuthenticated: false,
      admin: {} as ReturnType<typeof useAppAuth>['admin'],
      customer: {} as ReturnType<typeof useAppAuth>['customer'],
    });

    renderCustomerRoute();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('redirects admin away from customer routes', () => {
    vi.mocked(useAppAuth).mockReturnValue({
      isCustomer: false,
      isAdmin: true,
      isAuthenticated: true,
      admin: {} as ReturnType<typeof useAppAuth>['admin'],
      customer: {} as ReturnType<typeof useAppAuth>['customer'],
    });

    renderCustomerRoute('/account');
    expect(screen.getByText('Admin panel')).toBeInTheDocument();
  });
});
