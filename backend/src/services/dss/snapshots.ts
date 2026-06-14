import type { PrismaClient } from '@prisma/client';

export async function saveDssSnapshot(
  prisma: PrismaClient,
  type: string,
  payload: unknown
) {
  await prisma.dssSnapshot.create({
    data: {
      payload: JSON.stringify({ type, at: new Date().toISOString(), data: payload }),
    },
  });
}

export async function getRecentSnapshots(prisma: PrismaClient, limit = 20) {
  const rows = await prisma.dssSnapshot.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map((r) => {
    try {
      return { id: r.id, createdAt: r.createdAt, ...JSON.parse(r.payload) };
    } catch {
      return { id: r.id, createdAt: r.createdAt, raw: r.payload };
    }
  });
}
