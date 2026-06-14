import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireCustomer } from '../middleware/auth.js';
import { loginCustomer, registerCustomer } from '../services/customerAuth.js';

export const customerRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

customerRouter.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const result = await registerCustomer(prisma, body.email, body.password, body.name);
    res.status(201).json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors });
      return;
    }
    if (e instanceof Error && e.message.includes('вже існує')) {
      res.status(409).json({ error: e.message });
      return;
    }
    next(e);
  }
});

customerRouter.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await loginCustomer(prisma, body.email, body.password);
    res.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors });
      return;
    }
    if (e instanceof Error) {
      res.status(401).json({ error: e.message });
      return;
    }
    next(e);
  }
});

customerRouter.get('/me', requireCustomer, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.customerId! },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });
    if (!user) {
      res.status(404).json({ error: 'Користувача не знайдено' });
      return;
    }
    res.json({
      ...user,
      ordersCount: user._count.orders,
      _count: undefined,
    });
  } catch (e) {
    next(e);
  }
});

customerRouter.patch('/me', requireCustomer, async (req, res, next) => {
  try {
    const schema = z.object({ name: z.string().min(1).max(100) });
    const body = schema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.customerId! },
      data: { name: body.name.trim() },
      select: { id: true, email: true, name: true },
    });
    res.json(user);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors });
      return;
    }
    next(e);
  }
});
