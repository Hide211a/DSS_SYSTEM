import type { PrismaClient } from '@prisma/client';
import type { ProductDssAnalysis } from './types.js';

const CACHE_KEY = 'global';
const TTL_MS = Number(process.env.DSS_CACHE_TTL_MS) || 60_000;

interface MemoryEntry {
  analyses: ProductDssAnalysis[];
  expiresAt: number;
}

let memoryCache: MemoryEntry | null = null;

export function invalidateDssCache() {
  memoryCache = null;
}

export async function getCachedAnalyses(
  prisma: PrismaClient,
  loader: () => Promise<ProductDssAnalysis[]>
): Promise<{ analyses: ProductDssAnalysis[]; fromCache: boolean; cacheAgeMs: number }> {
  const now = Date.now();

  if (memoryCache && memoryCache.expiresAt > now) {
    return {
      analyses: memoryCache.analyses,
      fromCache: true,
      cacheAgeMs: 0,
    };
  }

  try {
    const row = await prisma.dssCache.findUnique({ where: { id: CACHE_KEY } });
    if (row && now - row.updatedAt.getTime() < TTL_MS) {
      const analyses = JSON.parse(row.payload) as ProductDssAnalysis[];
      memoryCache = { analyses, expiresAt: now + TTL_MS };
      return {
        analyses,
        fromCache: true,
        cacheAgeMs: now - row.updatedAt.getTime(),
      };
    }
  } catch {
    /* table may not exist yet */
  }

  const analyses = await loader();
  memoryCache = { analyses, expiresAt: now + TTL_MS };

  try {
    await prisma.dssCache.upsert({
      where: { id: CACHE_KEY },
      create: {
        id: CACHE_KEY,
        payload: JSON.stringify(analyses),
        version: 1,
      },
      update: {
        payload: JSON.stringify(analyses),
        version: { increment: 1 },
      },
    });
  } catch {
    /* ignore persist errors */
  }

  return { analyses, fromCache: false, cacheAgeMs: 0 };
}
