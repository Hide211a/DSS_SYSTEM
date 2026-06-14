import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { parsePagination } from '../lib/pagination.js';
import { saveDssSnapshot } from '../services/dss/snapshots.js';
import { invalidateDssCache } from '../services/dss/cache.js';

export const adminRouter = Router();

const productBaseSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  price: z.number().positive(),
  unitCost: z.number().positive(),
  categoryId: z.string(),
  leadTimeDays: z.number().int().positive().optional(),
  minOrderQty: z.number().int().positive().optional(),
  imageUrl: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

const createProductSchema = productBaseSchema.extend({
  initialStock: z.number().int().nonnegative().optional(),
});

adminRouter.get('/products', async (req, res, next) => {
  try {
    const { page, pageSize } = parsePagination(req.query as Record<string, unknown>, 15);
    const search = String(req.query.search ?? '').trim();

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { sku: { contains: search } },
          ],
        }
      : {};

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { category: true, inventory: true },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({
      items: products.map((p) => ({
        ...p,
        stock: p.inventory?.quantity ?? 0,
      })),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.post('/products', async (req, res, next) => {
  try {
    const body = createProductSchema.parse(req.body);

    const existing = await prisma.product.findUnique({ where: { sku: body.sku } });
    if (existing) {
      res.status(400).json({ error: 'SKU вже існує' });
      return;
    }

    const warehouse = await prisma.warehouse.findFirst();
    if (!warehouse) {
      res.status(500).json({ error: 'Склад не налаштовано' });
      return;
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          sku: body.sku,
          name: body.name,
          description: body.description,
          price: body.price,
          unitCost: body.unitCost,
          categoryId: body.categoryId,
          leadTimeDays: body.leadTimeDays ?? 7,
          minOrderQty: body.minOrderQty ?? 10,
          imageUrl: body.imageUrl || null,
          dssParams: { create: {} },
          inventory: {
            create: {
              warehouseId: warehouse.id,
              quantity: body.initialStock ?? 0,
            },
          },
        },
        include: { category: true, inventory: true },
      });

      if ((body.initialStock ?? 0) > 0) {
        await tx.stockMovement.create({
          data: {
            productId: created.id,
            warehouseId: warehouse.id,
            type: 'RESTOCK',
            quantity: body.initialStock!,
            reference: 'ADMIN-CREATE',
            note: 'Початковий залишок при створенні товару',
          },
        });
      }

      return created;
    });

    invalidateDssCache();
    res.status(201).json(product);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors });
      return;
    }
    next(e);
  }
});

adminRouter.patch('/products/:id', async (req, res, next) => {
  try {
    const body = productBaseSchema.partial().parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) {
      res.status(404).json({ error: 'Товар не знайдено' });
      return;
    }

    if (body.sku && body.sku !== product.sku) {
      const dup = await prisma.product.findUnique({ where: { sku: body.sku } });
      if (dup) {
        res.status(400).json({ error: 'SKU вже зайнятий' });
        return;
      }
    }

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(body.sku !== undefined ? { sku: body.sku } : {}),
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.price !== undefined ? { price: body.price } : {}),
        ...(body.unitCost !== undefined ? { unitCost: body.unitCost } : {}),
        ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
        ...(body.leadTimeDays !== undefined ? { leadTimeDays: body.leadTimeDays } : {}),
        ...(body.minOrderQty !== undefined ? { minOrderQty: body.minOrderQty } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl || null } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
      include: { category: true, inventory: true },
    });

    invalidateDssCache();
    res.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors });
      return;
    }
    next(e);
  }
});

adminRouter.delete('/products/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) {
      res.status(404).json({ error: 'Товар не знайдено' });
      return;
    }

    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    invalidateDssCache();
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

adminRouter.get('/inventory', async (_req, res, next) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      include: {
        product: { include: { category: true } },
        warehouse: true,
      },
      orderBy: { product: { name: 'asc' } },
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

const restockSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
});

adminRouter.post('/restock', async (req, res, next) => {
  try {
    const body = restockSchema.parse(req.body);
    const inventory = await prisma.inventoryItem.findUnique({
      where: { productId: body.productId },
    });
    if (!inventory) {
      res.status(404).json({ error: 'Складський запис не знайдено' });
      return;
    }

    await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { productId: body.productId },
        data: { quantity: { increment: body.quantity } },
      }),
      prisma.stockMovement.create({
        data: {
          productId: body.productId,
          warehouseId: inventory.warehouseId,
          type: 'RESTOCK',
          quantity: body.quantity,
          reference: `RESTOCK-${Date.now()}`,
          note: body.note ?? 'Поповнення запасу (адмін)',
        },
      }),
    ]);

    await saveDssSnapshot(prisma, 'restock', {
      productId: body.productId,
      quantity: body.quantity,
      note: body.note,
    });
    invalidateDssCache();

    res.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors });
      return;
    }
    next(e);
  }
});

adminRouter.get('/movements', async (req, res, next) => {
  try {
    const { page, pageSize } = parsePagination(req.query as Record<string, unknown>, 25);

    const [total, movements] = await Promise.all([
      prisma.stockMovement.count(),
      prisma.stockMovement.findMany({
        include: { product: true, warehouse: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({
      items: movements,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.get('/stats/sales', async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'COMPLETED' },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    });

    const byMonth = new Map<string, { revenue: number; orders: number }>();
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 7);
      const cur = byMonth.get(key) ?? { revenue: 0, orders: 0 };
      cur.revenue += o.total;
      cur.orders += 1;
      byMonth.set(key, cur);
    }

    res.json(
      Array.from(byMonth.entries()).map(([month, data]) => ({
        month,
        ...data,
      }))
    );
  } catch (e) {
    next(e);
  }
});
