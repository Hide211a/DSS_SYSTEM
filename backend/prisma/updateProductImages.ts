import { PrismaClient } from '@prisma/client';
import { productImageUrl } from './productImages.js';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, sku: true } });
  for (const p of products) {
    await prisma.product.update({
      where: { id: p.id },
      data: { imageUrl: productImageUrl(p.sku) },
    });
  }
  console.log(`Оновлено фото для ${products.length} товарів`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
