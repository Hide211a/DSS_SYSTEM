import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';
import { createToken } from './auth.js';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function linkGuestOrdersByEmail(
  prisma: PrismaClient,
  userId: string,
  email: string
): Promise<number> {
  const result = await prisma.order.updateMany({
    where: { customerEmail: email.toLowerCase(), userId: null },
    data: { userId },
  });
  return result.count;
}

export async function registerCustomer(
  prisma: PrismaClient,
  email: string,
  password: string,
  name?: string
) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new Error('Користувач з таким email вже існує');
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: await hashPassword(password),
      name: name?.trim() || null,
    },
  });

  await linkGuestOrdersByEmail(prisma, user.id, normalizedEmail);

  const token = createToken(user.id, 'customer');
  return {
    token,
    role: 'customer' as const,
    user: { id: user.id, email: user.email, name: user.name },
  };
}

export async function loginCustomer(prisma: PrismaClient, email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !(await verifyPassword(password, user.password))) {
    throw new Error('Невірний email або пароль');
  }

  await linkGuestOrdersByEmail(prisma, user.id, normalizedEmail);

  const token = createToken(user.id, 'customer');
  return {
    token,
    role: 'customer' as const,
    user: { id: user.id, email: user.email, name: user.name },
  };
}
