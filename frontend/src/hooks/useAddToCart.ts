import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAppAuth } from './useAppAuth';
import type { Product } from '../types';

export function useAddToCart() {
  const { addItem } = useCart();
  const { isAuthenticated, isAdmin, isCustomer } = useAppAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const canPurchase = isCustomer && !isAdmin;

  const addToCart = useCallback(
    (product: Product, qty = 1) => {
      if (!canPurchase) {
        if (!isAuthenticated) {
          navigate('/account/login', {
            state: {
              from: location.pathname,
              message: 'Увійдіть в акаунт, щоб додати товар у кошик',
            },
          });
        }
        return false;
      }
      addItem(product, qty);
      return true;
    },
    [canPurchase, isAuthenticated, addItem, navigate, location.pathname]
  );

  return { addToCart, isAuthenticated, canPurchase };
}
