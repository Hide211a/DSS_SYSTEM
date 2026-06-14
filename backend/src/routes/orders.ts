import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { parsePagination } from '../lib/pagination.js';
import { availableStock } from '../services/inventory.js';
import {
  cancelPendingOrder,
  completeOrderPayment,
  orderInclude,
  reserveStock,
} from '../services/orders.js';
import { assertOrderAccess, OrderAccessError } from '../services/orderAccess.js';
import { optionalCustomer, requireCustomer } from '../middleware/auth.js';
import { invalidateDssCache } from '../services/dss/cache.js';

export const ordersRouter = Router();

const orderSchema = z.object({
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

function handleOrderAccessError(e: unknown, res: import('express').Response): boolean {
  if (e instanceof OrderAccessError) {
    res.status(403).json({ error: e.message });
    return true;
  }
  return false;
}

/** Створити замовлення (PENDING) + резервування запасу */
ordersRouter.post('/', optionalCustomer, async (req, res, next) => {
  try {
    const body = orderSchema.parse(req.body);
    const customerId = req.customerId ?? null;
    let customerEmail = body.customerEmail ? body.customerEmail.toLowerCase() : null;
    let customerName = body.customerName || null;

    if (customerId) {
      const user = await prisma.user.findUnique({ where: { id: customerId } });
      if (user) {
        customerEmail = user.email;
        if (!customerName && user.name) customerName = user.name;
      }
    }

    const productIds = body.items.map((i) => i.productId);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { inventory: true },
    });

    if (products.length !== productIds.length) {
      res.status(400).json({ error: 'Деякі товари недоступні' });
      return;
    }

    for (const item of body.items) {
      const product = products.find((p) => p.id === item.productId)!;
      const inv = product.inventory;
      const available = availableStock(inv?.quantity ?? 0, inv?.reservedQty ?? 0);
      if (available < item.quantity) {
        res.status(400).json({
          error: `Недостатньо товару «${product.name}» (доступно: ${available})`,
        });
        return;
      }
    }

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    let total = 0;

    const order = await prisma.$transaction(async (tx) => {
      for (const item of body.items) {
        await reserveStock(tx as typeof prisma, item.productId, item.quantity);
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          status: 'PENDING',
          total: 0,
          customerName,
          customerEmail,
          userId: customerId,
          items: {
            create: body.items.map((item) => {
              const product = products.find((p) => p.id === item.productId)!;
              const lineTotal = product.price * item.quantity;
              total += lineTotal;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: product.price,
              };
            }),
          },
        },
        include: orderInclude,
      });

      return tx.order.update({
        where: { id: created.id },
        data: { total },
        include: orderInclude,
      });
    });

    res.status(201).json(order);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors });
      return;
    }
    next(e);
  }
});

/** Mock-оплата: PENDING → COMPLETED */
ordersRouter.post('/:orderNumber/pay', optionalCustomer, async (req, res, next) => {
  try {
    const orderNumber = String(req.params.orderNumber);
    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });
    if (!order) {
      res.status(404).json({ error: 'Замовлення не знайдено' });
      return;
    }

    assertOrderAccess(order, req.customerId, req.body?.customerEmail as string | undefined);

    const method = (req.body?.paymentMethod as string) || 'MOCK_CARD';
    const paid = await completeOrderPayment(prisma, orderNumber, method);
    res.json(paid);
  } catch (e) {
    if (handleOrderAccessError(e, res)) return;
    if (e instanceof Error && e.message.includes('не знайдено')) {
      res.status(404).json({ error: e.message });
      return;
    }
    next(e);
  }
});

ordersRouter.post('/:orderNumber/cancel', optionalCustomer, async (req, res, next) => {
  try {
    const orderNumber = String(req.params.orderNumber);
    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });
    if (!order) {
      res.status(404).json({ error: 'Замовлення не знайдено' });
      return;
    }

    assertOrderAccess(order, req.customerId, req.body?.customerEmail as string | undefined);

    const cancelled = await cancelPendingOrder(prisma, orderNumber);
    invalidateDssCache();
    res.json(cancelled);
  } catch (e) {
    if (handleOrderAccessError(e, res)) return;
    if (e instanceof Error) {
      res.status(400).json({ error: e.message });
      return;
    }
    next(e);
  }
});

ordersRouter.get('/my', requireCustomer, async (req, res, next) => {
  try {
    const { page, pageSize } = parsePagination(req.query as Record<string, unknown>, 10);
    const customerId = req.customerId!;

    const where = { userId: customerId };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({
      items: orders,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    next(e);
  }
});

ordersRouter.get('/number/:orderNumber', optionalCustomer, async (req, res, next) => {
  try {
    const orderNumber = String(req.params.orderNumber);
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: orderInclude,
    });
    if (!order) {
      res.status(404).json({ error: 'Замовлення не знайдено' });
      return;
    }

    const guestEmail = typeof req.query.email === 'string' ? req.query.email : undefined;
    assertOrderAccess(order, req.customerId, guestEmail);

    res.json(order);
  } catch (e) {
    if (handleOrderAccessError(e, res)) return;
    next(e);
  }
});
