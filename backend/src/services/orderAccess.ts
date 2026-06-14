import type { Order } from '@prisma/client';

export class OrderAccessError extends Error {
  constructor(message = 'Немає доступу до цього замовлення') {
    super(message);
    this.name = 'OrderAccessError';
  }
}

type OrderAccessTarget = Pick<Order, 'userId' | 'customerEmail'>;

export function assertOrderAccess(
  order: OrderAccessTarget,
  customerId: string | null | undefined,
  guestEmail?: string | null
): void {
  if (order.userId) {
    if (!customerId || order.userId !== customerId) {
      throw new OrderAccessError();
    }
    return;
  }

  const normalizedGuest = guestEmail?.trim().toLowerCase();
  const orderEmail = order.customerEmail?.trim().toLowerCase();
  if (normalizedGuest && orderEmail && normalizedGuest === orderEmail) {
    return;
  }

  throw new OrderAccessError();
}
