import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { parsePagination } from '../lib/pagination.js';
import { requireCustomer } from '../middleware/auth.js';
import { availableStock } from '../services/inventory.js';

export const productsRouter = Router();

function mapProductBase(p: {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  leadTimeDays: number;
  category: { id: string; name: string; slug: string };
  inventory: { quantity: number; reservedQty: number } | null;
}) {
  const qty = p.inventory?.quantity ?? 0;
  const reserved = p.inventory?.reservedQty ?? 0;
  const stock = availableStock(qty, reserved);
  return {
    ...p,
    stock,
    reservedQty: reserved,
    totalQty: qty,
    inStock: stock > 0,
  };
}

async function getReviewSummary(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: true,
  });
  const avg = agg._avg.rating ?? 0;
  return {
    avgRating: Math.round(avg * 10) / 10,
    reviewCount: agg._count,
  };
}

productsRouter.get('/', async (req, res, next) => {
  try {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(category ? { category: { slug: category } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { sku: { contains: search } },
                { description: { contains: search } },
              ],
            }
          : {}),
      },
      include: { category: true, inventory: true },
      orderBy: { name: 'asc' },
    });

    res.json(products.map(mapProductBase));
  } catch (e) {
    next(e);
  }
});

productsRouter.post('/stock-check', async (req, res, next) => {
  try {
    const schema = z.object({ productIds: z.array(z.string()).min(1) });
    const { productIds } = schema.parse(req.body);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { category: true, inventory: true },
    });

    res.json(products.map(mapProductBase));
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors });
      return;
    }
    next(e);
  }
});

productsRouter.get('/:id/reviews', async (req, res, next) => {
  try {
    const productId = String(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
      select: { id: true },
    });
    if (!product) {
      res.status(404).json({ error: 'Товар не знайдено' });
      return;
    }

    const { page, pageSize } = parsePagination(req.query as Record<string, unknown>, 10);
    const where = { productId: product.id };

    const [total, items, summary] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      getReviewSummary(product.id),
    ]);

    res.json({
      summary,
      items: items.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        authorName: r.user.name || r.user.email.split('@')[0],
        userId: r.user.id,
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

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(2000),
});

productsRouter.post('/:id/reviews', requireCustomer, async (req, res, next) => {
  try {
    const productId = String(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
      select: { id: true },
    });
    if (!product) {
      res.status(404).json({ error: 'Товар не знайдено' });
      return;
    }

    const body = reviewSchema.parse(req.body);
    const userId = req.customerId!;

    const review = await prisma.review.upsert({
      where: { productId_userId: { productId: product.id, userId } },
      create: {
        productId: product.id,
        userId,
        rating: body.rating,
        comment: body.comment.trim(),
      },
      update: {
        rating: body.rating,
        comment: body.comment.trim(),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const summary = await getReviewSummary(product.id);

    res.status(201).json({
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        authorName: review.user.name || review.user.email.split('@')[0],
        userId: review.user.id,
      },
      summary,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors });
      return;
    }
    next(e);
  }
});

productsRouter.get('/:id', async (req, res, next) => {
  try {
    const productId = String(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        inventory: true,
        specs: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!product || !product.isActive) {
      res.status(404).json({ error: 'Товар не знайдено' });
      return;
    }

    const summary = await getReviewSummary(product.id);
    const { specs, ...rest } = product;

    res.json({
      ...mapProductBase(rest),
      specs: specs.map((s) => ({ id: s.id, name: s.name, value: s.value })),
      reviewSummary: summary,
    });
  } catch (e) {
    next(e);
  }
});
