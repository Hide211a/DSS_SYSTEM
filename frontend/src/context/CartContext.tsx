import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../api/client';
import type { CartItem, Product } from '../types';

export interface StockSyncResult {
  updated: boolean;
  removed: string[];
  adjusted: { productId: string; name: string; from: number; to: number }[];
  items: CartItem[];
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  syncStock: () => Promise<StockSyncResult>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function cartItemsChanged(prev: CartItem[], next: CartItem[]): boolean {
  if (prev.length !== next.length) return true;
  for (let i = 0; i < prev.length; i++) {
    const a = prev[i];
    const b = next[i];
    if (
      a.product.id !== b.product.id ||
      a.quantity !== b.quantity ||
      a.product.stock !== b.product.stock ||
      a.product.inStock !== b.product.inStock ||
      a.product.price !== b.product.price
    ) {
      return true;
    }
  }
  return false;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    localStorage.setItem('cart', JSON.stringify(next));
  }, []);

  const addItem = useCallback((product: Product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      let next: CartItem[];
      if (existing) {
        next = prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + qty, product.stock), product }
            : i
        );
      } else {
        next = [...prev, { product, quantity: Math.min(qty, product.stock) }];
      }
      localStorage.setItem('cart', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeItem = useCallback(
    (productId: string) => {
      persist(items.filter((i) => i.product.id !== productId));
    },
    [items, persist]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        persist(items.filter((i) => i.product.id !== productId));
        return;
      }
      persist(
        items.map((i) =>
          i.product.id === productId
            ? { ...i, quantity: Math.min(quantity, i.product.stock) }
            : i
        )
      );
    },
    [items, persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  const syncStock = useCallback(async (): Promise<StockSyncResult> => {
    const current = itemsRef.current;
    if (current.length === 0) {
      return { updated: false, removed: [], adjusted: [], items: [] };
    }

    const fresh = await api.stockCheck(current.map((i) => i.product.id));
    const byId = new Map(fresh.map((p) => [p.id, p]));

    const removed: string[] = [];
    const adjusted: StockSyncResult['adjusted'] = [];
    const next: CartItem[] = [];

    for (const item of current) {
      const product = byId.get(item.product.id);
      if (!product || !product.inStock) {
        removed.push(item.product.name);
        continue;
      }

      let quantity = item.quantity;
      if (quantity > product.stock) {
        adjusted.push({
          productId: product.id,
          name: product.name,
          from: quantity,
          to: product.stock,
        });
        quantity = product.stock;
      }

      if (quantity > 0) {
        next.push({ product, quantity });
      }
    }

    const updated =
      removed.length > 0 || adjusted.length > 0 || next.length !== current.length;

    if (cartItemsChanged(current, next)) {
      persist(next);
    }

    return {
      updated,
      removed,
      adjusted,
      items: next,
    };
  }, [persist]);

  const totalItems = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const totalPrice = useMemo(
    () => items.reduce((s, i) => s + i.product.price * i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      syncStock,
      totalItems,
      totalPrice,
    }),
    [items, addItem, removeItem, updateQuantity, clear, syncStock, totalItems, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
