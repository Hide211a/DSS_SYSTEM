import { PrismaClient } from '@prisma/client';
import { PRODUCT_CATALOG, SEED_REVIEWS } from './productCatalog.js';
import { hashPassword } from '../src/services/customerAuth.js';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, sku: true } });
  const bySku = new Map(products.map((p) => [p.sku, p.id]));

  for (const [sku, catalog] of Object.entries(PRODUCT_CATALOG)) {
    const productId = bySku.get(sku);
    if (!productId) continue;

    await prisma.product.update({
      where: { id: productId },
      data: { description: catalog.description },
    });

    await prisma.productSpec.deleteMany({ where: { productId } });
    await prisma.productSpec.createMany({
      data: catalog.specs.map((s, i) => ({
        productId,
        name: s.name,
        value: s.value,
        sortOrder: i,
      })),
    });
  }
  console.log(`Оновлено описи та характеристики для ${Object.keys(PRODUCT_CATALOG).length} товарів`);

  const userByEmail = new Map<string, string>();
  for (const email of ['client@stockwise.demo', 'reviewer1@stockwise.demo', 'reviewer2@stockwise.demo']) {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const name =
        email === 'client@stockwise.demo'
          ? 'Олена Koval'
          : email === 'reviewer1@stockwise.demo'
            ? 'Андрій'
            : 'Марія';
      user = await prisma.user.create({
        data: { email, password: await hashPassword('client123'), name },
      });
    }
    userByEmail.set(email, user.id);
  }

  let added = 0;
  for (const r of SEED_REVIEWS) {
    const productId = bySku.get(r.sku);
    const userId = userByEmail.get(r.authorEmail);
    if (!productId || !userId) continue;

    await prisma.review.upsert({
      where: { productId_userId: { productId, userId } },
      create: { productId, userId, rating: r.rating, comment: r.comment },
      update: { rating: r.rating, comment: r.comment },
    });
    added++;
  }
  console.log(`Синхронізовано ${added} відгуків`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
