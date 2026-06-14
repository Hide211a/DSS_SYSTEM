import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api/client';
import { makeProduct } from '../test/fixtures';
import { CartProvider, useCart } from './CartContext';

vi.mock('../api/client', () => ({
  api: {
    stockCheck: vi.fn(),
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
  beforeEach(() => {
    vi.mocked(api.stockCheck).mockReset();
  });

  it('adds item and persists to localStorage', () => {
    const product = makeProduct();
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(product, 2);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.totalPrice).toBe(200);
    expect(JSON.parse(localStorage.getItem('cart')!)).toHaveLength(1);
  });

  it('caps quantity at available stock when adding twice', () => {
    const product = makeProduct({ stock: 3 });
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(product, 2);
      result.current.addItem(product, 2);
    });

    expect(result.current.items[0].quantity).toBe(3);
  });

  it('removes item and clears cart', () => {
    const product = makeProduct();
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(product);
    });
    act(() => {
      result.current.removeItem(product.id);
    });
    expect(result.current.items).toHaveLength(0);

    act(() => {
      result.current.addItem(product);
    });
    act(() => {
      result.current.clear();
    });

    expect(result.current.items).toHaveLength(0);
    expect(localStorage.getItem('cart')).toBe('[]');
  });

  it('syncStock removes unavailable products and adjusts quantities', async () => {
    const inCart = makeProduct({ id: 'p1', stock: 5 });
    const outOfStock = makeProduct({ id: 'p2', name: 'Gone', stock: 0, inStock: false });
    vi.mocked(api.stockCheck).mockResolvedValue([
      makeProduct({ id: 'p1', stock: 2 }),
      makeProduct({ id: 'p2', stock: 0, inStock: false }),
    ]);

    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(inCart, 4);
      result.current.addItem(outOfStock, 1);
    });

    let syncResult!: Awaited<ReturnType<typeof result.current.syncStock>>;
    await act(async () => {
      syncResult = await result.current.syncStock();
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    expect(syncResult.removed).toContain('Gone');
    expect(syncResult.adjusted[0]).toMatchObject({ productId: 'p1', from: 4, to: 2 });
    expect(result.current.items[0].quantity).toBe(2);
  });
});
