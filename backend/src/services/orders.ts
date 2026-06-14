import type { PrismaClient } from '@prisma/client';
import { invalidateDssCache } from './dss/cache.js';
import {
  fulfillReservation,
  releaseReservation,
  reserveStock,
} from './inventory.js';

const orderInclude = {
  items: {
    include: {
      product: { select: { id: true, sku: true, name: true, imageUrl: true } },
    },
  },
} as const;

export async function completeOrderPayment(
  prisma: PrismaClient,
  orderNumber: string,
  paymentMethod = 'MOCK_CARD'
) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: { include: { product: { include: { inventory: true } } } } },
  });

  if (!order) throw new Error('Замовлення не знайдено');
  if (order.status === 'COMPLETED') {
    return prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
  }
  if (order.status === 'CANCELLED') {
    throw new Error('Замовлення скасовано');
  }

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const inv = item.product.inventory;
      if (!inv) throw new Error(`Склад не налаштовано для ${item.product.name}`);
      await fulfillReservation(
        tx as unknown as PrismaClient,
        item.productId,
        inv.warehouseId,
        item.quantity,
        order.orderNumber,
        'Продаж після оплати'
      );
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'COMPLETED',
        paymentMethod,
        paidAt: new Date(),
      },
    });
  });

  invalidateDssCache();

  return prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
}

export async function cancelPendingOrder(prisma: PrismaClient, orderNumber: string) {
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } });
  if (!order) throw new Error('Замовлення не знайдено');
  if (order.status !== 'PENDING') throw new Error('Скасувати можна лише очікуюче замовлення');

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await releaseReservation(tx as unknown as PrismaClient, item.productId, item.quantity);
    }
    await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
  });

  return prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
}

export { reserveStock, orderInclude };
