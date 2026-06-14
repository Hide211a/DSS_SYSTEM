import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/services/customerAuth.js';

const prisma = new PrismaClient();

async function main() {
  const demoEmail = 'client@stockwise.demo';
  const existing = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (existing) {
    console.log('Демо-клієнт вже існує');
    return;
  }

  const demoUser = await prisma.user.create({
    data: {
      email: demoEmail,
      password: await hashPassword('client123'),
      name: 'Олена Koval',
    },
  });

  const recentOrders = await prisma.order.findMany({
    where: { status: 'COMPLETED', userId: null },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  for (const order of recentOrders) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        customerEmail: demoEmail,
        customerName: demoUser.name,
        userId: demoUser.id,
      },
    });
  }

  console.log(`Створено ${demoEmail} / client123, прив'язано ${recentOrders.length} замовлень`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
