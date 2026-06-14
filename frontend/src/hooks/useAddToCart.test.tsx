import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCart } from '../context/CartContext';
import { makeProduct } from '../test/fixtures';
import { useAppAuth } from './useAppAuth';
import { useAddToCart } from './useAddToCart';

vi.mock('./useAppAuth', () => ({
  useAppAuth: vi.fn(),
}));

vi.mock('../context/CartContext', () => ({
  useCart: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={['/catalog']}>{children}</MemoryRouter>;
}

describe('useAddToCart', () => {
  const addItem = vi.fn();

  beforeEach(() => {
    addItem.mockReset();
    vi.mocked(useCart).mockReturnValue({ addItem } as ReturnType<typeof useCart>);
  });

  it('adds item for customer', () => {
    vi.mocked(useAppAuth).mockReturnValue({
      isCustomer: true,
      isAdmin: false,
      isAuthenticated: true,
      admin: {} as ReturnType<typeof useAppAuth>['admin'],
      customer: {} as ReturnType<typeof useAppAuth>['customer'],
    });

    const { result } = renderHook(() => useAddToCart(), { wrapper });
    const product = makeProduct();
    let added = false;

    act(() => {
      added = result.current.addToCart(product, 1);
    });

    expect(added).toBe(true);
    expect(addItem).toHaveBeenCalledWith(product, 1);
    expect(result.current.canPurchase).toBe(true);
  });

  it('blocks admin from purchasing', () => {
    vi.mocked(useAppAuth).mockReturnValue({
      isCustomer: false,
      isAdmin: true,
      isAuthenticated: true,
      admin: {} as ReturnType<typeof useAppAuth>['admin'],
      customer: {} as ReturnType<typeof useAppAuth>['customer'],
    });

    const { result } = renderHook(() => useAddToCart(), { wrapper });

    act(() => {
      expect(result.current.addToCart(makeProduct())).toBe(false);
    });

    expect(addItem).not.toHaveBeenCalled();
    expect(result.current.canPurchase).toBe(false);
  });

  it('redirects guest to login instead of adding', () => {
    vi.mocked(useAppAuth).mockReturnValue({
      isCustomer: false,
      isAdmin: false,
      isAuthenticated: false,
      admin: {} as ReturnType<typeof useAppAuth>['admin'],
      customer: {} as ReturnType<typeof useAppAuth>['customer'],
    });

    const { result } = renderHook(() => useAddToCart(), { wrapper });

    act(() => {
      expect(result.current.addToCart(makeProduct())).toBe(false);
    });

    expect(addItem).not.toHaveBeenCalled();
  });
});
