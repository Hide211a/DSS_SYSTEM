import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { parsePagination } from '../lib/pagination.js';
import { invalidateDssCache } from '../services/dss/cache.js';
import { saveDssSnapshot } from '../services/dss/snapshots.js';

export const purchaseOrdersRouter = Router();

const createSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
});

purchaseOrdersRouter.get('/', async (req, res, next) => {
  try {
    const { page, pageSize } = parsePagination(req.query as Record<string, unknown>, 15);
    const status = req.query.status as string | undefined;

    const where = status ? { status } : {};

    const [total, items] = await Promise.all([
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.findMany({
        where,
        include: { product: { select: { id: true, sku: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    next(e);
  }
});

purchaseOrdersRouter.post('/', async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const product = await prisma.product.findUnique({ where: { id: body.productId } });
    if (!product) {
      res.status(404).json({ error: 'Товар не знайдено' });
      return;
    }

    const poNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        productId: body.productId,
        quantity: body.quantity,
        unitCost: product.unitCost,
        status: 'SENT',
        note: body.note ?? 'Заявка з DSS',
      },
      include: { product: { select: { id: true, sku: true, name: true } } },
    });

    await saveDssSnapshot(prisma, 'purchase-order', { poNumber, ...body });

    res.status(201).json(po);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors });
      return;
    }
    next(e);
  }
});

purchaseOrdersRouter.post('/:id/receive', async (req, res, next) => {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: { product: { include: { inventory: true } } },
    });
    if (!po) {
      res.status(404).json({ error: 'Заявку не знайдено' });
      return;
    }
    if (po.status === 'RECEIVED') {
      res.status(400).json({ error: 'Заявка вже отримана' });
      return;
    }
    if (po.status === 'CANCELLED') {
      res.status(400).json({ error: 'Заявка скасована' });
      return;
    }

    const inventory = po.product.inventory;
    if (!inventory) {
      res.status(400).json({ error: 'Немає складського запису' });
      return;
    }

    await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { productId: po.productId },
        data: { quantity: { increment: po.quantity } },
      }),
      prisma.stockMovement.create({
        data: {
          productId: po.productId,
          warehouseId: inventory.warehouseId,
          type: 'RESTOCK',
          quantity: po.quantity,
          reference: po.poNumber,
          note: 'Отримання за заявкою на закупівлю',
        },
      }),
      prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { status: 'RECEIVED', receivedAt: new Date() },
      }),
    ]);

    invalidateDssCache();

    const updated = await prisma.purchaseOrder.findUnique({
      where: { id: po.id },
      include: { product: { select: { id: true, sku: true, name: true } } },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

purchaseOrdersRouter.patch('/:id/cancel', async (req, res, next) => {
  try {
    const po = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
      include: { product: { select: { id: true, sku: true, name: true } } },
    });
    res.json(po);
  } catch (e) {
    next(e);
  }
});
