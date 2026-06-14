import type { PrismaClient } from '@prisma/client';

export function availableStock(quantity: number, reservedQty: number): number {
  return Math.max(0, quantity - reservedQty);
}

export async function reserveStock(
  prisma: PrismaClient,
  productId: string,
  qty: number
): Promise<void> {
  const inv = await prisma.inventoryItem.findUnique({ where: { productId } });
  if (!inv) throw new Error('Складський запис не знайдено');
  const available = availableStock(inv.quantity, inv.reservedQty);
  if (available < qty) {
    throw new Error(`Недостатньо доступного запасу (доступно: ${available})`);
  }
  await prisma.inventoryItem.update({
    where: { productId },
    data: { reservedQty: { increment: qty } },
  });
}

export async function releaseReservation(
  prisma: PrismaClient,
  productId: string,
  qty: number
): Promise<void> {
  const inv = await prisma.inventoryItem.findUnique({ where: { productId } });
  if (!inv) return;
  const release = Math.min(qty, inv.reservedQty);
  if (release > 0) {
    await prisma.inventoryItem.update({
      where: { productId },
      data: { reservedQty: { decrement: release } },
    });
  }
}

export async function fulfillReservation(
  prisma: PrismaClient,
  productId: string,
  warehouseId: string,
  qty: number,
  reference: string,
  note: string
): Promise<void> {
  await prisma.inventoryItem.update({
    where: { productId },
    data: {
      quantity: { decrement: qty },
      reservedQty: { decrement: qty },
    },
  });
  await prisma.stockMovement.create({
    data: {
      productId,
      warehouseId,
      type: 'SALE',
      quantity: -qty,
      reference,
      note,
    },
  });
}
