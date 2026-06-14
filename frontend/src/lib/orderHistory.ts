const ORDERS_KEY = 'my_order_numbers';
const EMAIL_KEY = 'customer_email';

export function saveOrderToHistory(orderNumber: string, email?: string) {
  try {
    const existing: string[] = JSON.parse(localStorage.getItem(ORDERS_KEY) ?? '[]');
    if (!existing.includes(orderNumber)) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify([orderNumber, ...existing].slice(0, 50)));
    }
    if (email) {
      localStorage.setItem(EMAIL_KEY, email.toLowerCase());
    }
  } catch {
    /* ignore */
  }
}

export function getSavedOrderNumbers(): string[] {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function getSavedEmail(): string {
  return localStorage.getItem(EMAIL_KEY) ?? '';
}
