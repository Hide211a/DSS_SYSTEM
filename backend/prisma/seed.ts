import { PrismaClient } from '@prisma/client';
import { productImageUrl } from './productImages.js';
import { PRODUCT_CATALOG, SEED_REVIEWS } from './productCatalog.js';
import { hashPassword } from '../src/services/customerAuth.js';

const prisma = new PrismaClient();

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const CATEGORIES = [
  { name: 'Електроніка', slug: 'electronics', description: 'Гаджети та аксесуари' },
  { name: 'Одяг', slug: 'clothing', description: 'Чоловічий та жіночий одяг' },
  { name: 'Дім і сад', slug: 'home-garden', description: 'Товари для дому' },
  { name: 'Спорт', slug: 'sports', description: 'Спортивні товари' },
];

const PRODUCTS = [
  { sku: 'ELEC-001', name: 'Бездротові навушники Pro', category: 'electronics', price: 2499, unitCost: 1200, leadTimeDays: 10, minOrderQty: 20, baseDemand: 8 },
  { sku: 'ELEC-002', name: 'Powerbank 20000 mAh', category: 'electronics', price: 899, unitCost: 400, leadTimeDays: 7, minOrderQty: 30, baseDemand: 15 },
  { sku: 'ELEC-003', name: 'USB-C хаб 7-in-1', category: 'electronics', price: 1299, unitCost: 550, leadTimeDays: 14, minOrderQty: 15, baseDemand: 5 },
  { sku: 'CLO-001', name: 'Футболка бавовняна', category: 'clothing', price: 599, unitCost: 220, leadTimeDays: 5, minOrderQty: 50, baseDemand: 20 },
  { sku: 'CLO-002', name: 'Джинси Slim Fit', category: 'clothing', price: 1899, unitCost: 800, leadTimeDays: 10, minOrderQty: 25, baseDemand: 10 },
  { sku: 'HOME-001', name: 'LED настільна лампа', category: 'home-garden', price: 749, unitCost: 320, leadTimeDays: 8, minOrderQty: 20, baseDemand: 6 },
  { sku: 'HOME-002', name: 'Органайзер для кухні', category: 'home-garden', price: 449, unitCost: 180, leadTimeDays: 5, minOrderQty: 40, baseDemand: 12 },
  { sku: 'SPORT-001', name: 'Килимок для йоги', category: 'sports', price: 699, unitCost: 250, leadTimeDays: 6, minOrderQty: 35, baseDemand: 14 },
  { sku: 'SPORT-002', name: 'Гантелі 2×5 кг', category: 'sports', price: 1599, unitCost: 700, leadTimeDays: 12, minOrderQty: 10, baseDemand: 4 },
  { sku: 'ELEC-004', name: 'Миша бездротова', category: 'electronics', price: 649, unitCost: 280, leadTimeDays: 7, minOrderQty: 25, baseDemand: 11 },
];

async function main() {
  console.log('Очищення БД...');
  await prisma.dssSnapshot.deleteMany();
  await prisma.dssCache.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.user.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.productDssParams.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.warehouse.deleteMany();

  const warehouse = await prisma.warehouse.create({
    data: { name: 'Центральний склад', code: 'WH-MAIN', location: 'Київ' },
  });

  const categories = new Map<string, string>();
  for (const c of CATEGORIES) {
    const cat = await prisma.category.create({ data: c });
    categories.set(c.slug, cat.id);
  }

  type ProductRec = { id: string; price: number; baseDemand: number; sku: string; soldTotal: number; stock: number };
  const productRecords: ProductRec[] = [];

  for (const p of PRODUCTS) {
    const openingStock = randomBetween(180, 350);
    const catalog = PRODUCT_CATALOG[p.sku];
    const product = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        description: catalog?.description ?? `${p.name} — якісний товар для інтернет-магазину.`,
        price: p.price,
        unitCost: p.unitCost,
        leadTimeDays: p.leadTimeDays,
        minOrderQty: p.minOrderQty,
        imageUrl: productImageUrl(p.sku),
        categoryId: categories.get(p.category)!,
        specs: catalog
          ? {
              create: catalog.specs.map((s, i) => ({
                name: s.name,
                value: s.value,
                sortOrder: i,
              })),
            }
          : undefined,
        dssParams: {
          create: { serviceLevel: 0.95, safetyStockDays: 3, forecastHorizonDays: 30, zScore: 1.65 },
        },
        inventory: { create: { warehouseId: warehouse.id, quantity: openingStock } },
      },
    });

    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        type: 'OPENING',
        quantity: openingStock,
        reference: 'SEED-OPEN',
        note: 'Початковий залишок',
        createdAt: addDays(new Date(), -400),
      },
    });

    productRecords.push({
      id: product.id,
      price: p.price,
      baseDemand: p.baseDemand,
      sku: p.sku,
      soldTotal: 0,
      stock: openingStock,
    });
  }

  console.log('Генерація історії продажів зі списанням зі складу...');
  const today = new Date();
  const startDate = addDays(today, -365);
  let orderCounter = 1;
  const stockByProduct = new Map(productRecords.map((p) => [p.id, p.stock]));

  for (let day = 0; day < 365; day++) {
    const date = addDays(startDate, day);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const seasonalBoost = 1 + 0.3 * Math.sin((day / 365) * Math.PI * 2);

    for (const product of productRecords) {
      let demandChance = product.baseDemand / 30;
      if (isWeekend) demandChance *= 1.25;
      demandChance *= seasonalBoost;

      if (Math.random() < demandChance) {
        const currentStock = stockByProduct.get(product.id) ?? 0;
        if (currentStock <= 0) continue;

        const qty = Math.min(randomBetween(1, 3), currentStock);
        const orderNumber = `ORD-HIST-${String(orderCounter++).padStart(6, '0')}`;

        await prisma.order.create({
          data: {
            orderNumber,
            status: 'COMPLETED',
            total: product.price * qty,
            customerName: 'Демо-клієнт',
            createdAt: date,
            items: {
              create: { productId: product.id, quantity: qty, unitPrice: product.price },
            },
          },
        });

        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            warehouseId: warehouse.id,
            type: 'SALE',
            quantity: -qty,
            reference: orderNumber,
            createdAt: date,
          },
        });

        stockByProduct.set(product.id, currentStock - qty);
        product.soldTotal += qty;
      }
    }
  }

  // Синхронізувати фактичні залишки в inventory
  for (const product of productRecords) {
    let finalStock = stockByProduct.get(product.id) ?? 0;
    // Для демо DSS: 3 товари з низьким залишком
    if (productRecords.indexOf(product) < 3) {
      finalStock = Math.min(finalStock, randomBetween(3, 12));
    }
    await prisma.inventoryItem.update({
      where: { productId: product.id },
      data: { quantity: Math.max(finalStock, 0) },
    });
  }

  console.log(
    `Створено: ${productRecords.length} товарів, ${orderCounter - 1} замовлень, склад синхронізовано з продажами`
  );

  console.log('Створення демо-акаунта клієнта...');
  const demoEmail = 'client@stockwise.demo';
  const demoUser = await prisma.user.create({
    data: {
      email: demoEmail,
      password: await hashPassword('client123'),
      name: 'Олена Кoval',
    },
  });

  const recentOrders = await prisma.order.findMany({
    where: { status: 'COMPLETED' },
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
  console.log(`Демо-клієнт: ${demoEmail} / client123 (${recentOrders.length} замовлень)`);

  console.log('Створення відгуків...');
  const userByEmail = new Map<string, string>();
  userByEmail.set(demoEmail, demoUser.id);

  for (const email of ['reviewer1@stockwise.demo', 'reviewer2@stockwise.demo']) {
    const name = email === 'reviewer1@stockwise.demo' ? 'Андрій' : 'Марія';
    const u = await prisma.user.create({
      data: { email, password: await hashPassword('client123'), name },
    });
    userByEmail.set(email, u.id);
  }

  const skuToId = new Map(productRecords.map((p) => [p.sku, p.id]));
  for (const r of SEED_REVIEWS) {
    const productId = skuToId.get(r.sku);
    const userId = userByEmail.get(r.authorEmail);
    if (!productId || !userId) continue;
    await prisma.review.create({
      data: {
        productId,
        userId,
        rating: r.rating,
        comment: r.comment,
        createdAt: addDays(new Date(), -randomBetween(1, 60)),
      },
    });
  }
  console.log(`Додано ${SEED_REVIEWS.length} відгуків`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
