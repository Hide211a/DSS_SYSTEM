import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  analyzeProduct,
  computeAbcClassification,
  getAllProductAnalyses,
  getDashboardData,
  runWhatIf,
} from '../services/dss/engine.js';
import { getRecentSnapshots, saveDssSnapshot } from '../services/dss/snapshots.js';
import { zScoreFromServiceLevel } from '../services/dss/math.js';
import { parsePagination, paginateArray } from '../lib/pagination.js';
import { invalidateDssCache } from '../services/dss/cache.js';
import type { AbcClass } from '../services/dss/types.js';

export const dssRouter = Router();

dssRouter.get('/dashboard', async (_req, res, next) => {
  try {
    const data = await getDashboardData(prisma);
    res.json({ kpis: data.kpis, topRisks: data.topRisks, cacheTtlSeconds: 60 });
  } catch (e) {
    next(e);
  }
});

dssRouter.post('/cache/invalidate', async (_req, res, next) => {
  try {
    invalidateDssCache();
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

dssRouter.get('/products/export', async (_req, res, next) => {
  try {
    const analyses = await getAllProductAnalyses(prisma);
    const header =
      'SKU,Назва,Запас,ROP,Страховий,EOQ,Днів,ABC,XYZ,Рекомендація,К-сть замовлення,Ризик,MAPE,Плановий попит';
    const rows = analyses.map((a) =>
      [
        a.sku,
        `"${a.name.replace(/"/g, '""')}"`,
        a.currentStock,
        a.reorderPoint,
        a.safetyStock,
        a.economicOrderQty,
        a.daysOfSupply,
        a.abcClass,
        a.xyzClass,
        a.recommendation,
        a.recommendedOrderQty,
        a.riskScore,
        a.forecastMape,
        a.planningDemand,
      ].join(',')
    );
    const csv = '\uFEFF' + [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="dss-report.csv"');
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

dssRouter.get('/products', async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query as Record<string, unknown>, 15);
    const analyses = await getAllProductAnalyses(prisma);
    res.json(paginateArray(analyses, pagination));
  } catch (e) {
    next(e);
  }
});

dssRouter.get('/abc', async (_req, res, next) => {
  try {
    const abc = await computeAbcClassification(prisma);
    const analyses = await getAllProductAnalyses(prisma);
    const byId = new Map(analyses.map((a) => [a.productId, a]));
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, sku: true, name: true },
    });
    const result = products.map((p) => {
      const meta = abc.get(p.id) ?? { class: 'C' as AbcClass, share: 0 };
      const dss = byId.get(p.id);
      return {
        ...p,
        abcClass: meta.class,
        revenueSharePercent: meta.share,
        xyzClass: dss?.xyzClass ?? 'Z',
        recommendation: dss?.recommendation,
        currentStock: dss?.currentStock,
      };
    });
    res.json(result.sort((a, b) => b.revenueSharePercent - a.revenueSharePercent));
  } catch (e) {
    next(e);
  }
});

dssRouter.get('/snapshots', async (_req, res, next) => {
  try {
    res.json(await getRecentSnapshots(prisma));
  } catch (e) {
    next(e);
  }
});

dssRouter.get('/experiment', async (_req, res, next) => {
  try {
    const analyses = await getAllProductAnalyses(prisma);
    const needsAction = analyses.filter(
      (a) => a.recommendation === 'ORDER' || a.recommendation === 'RISK_OOS'
    );
    const ok = analyses.filter((a) => a.recommendation === 'OK');
    const overstock = analyses.filter((a) => a.recommendation === 'REDUCE');

    res.json({
      summary: {
        totalSkus: analyses.length,
        needsReplenishment: needsAction.length,
        healthy: ok.length,
        overstock: overstock.length,
        totalRecommendedUnits: needsAction.reduce((s, a) => s + a.recommendedOrderQty, 0),
        avgMape:
          analyses.length > 0
            ? Math.round((analyses.reduce((s, a) => s + a.forecastMape, 0) / analyses.length) * 10) / 10
            : 0,
      },
      comparison: {
        withoutDss: {
          description: 'Без DSS: поповнення за фіксованим min/max або інтуїцією',
          estimatedOverstockSkus: Math.ceil(analyses.length * 0.4),
          estimatedStockoutRisk: Math.ceil(analyses.length * 0.25),
        },
        withDss: {
          description: 'З DSS: ROP + прогноз + ABC/XYZ + страховий запас',
          overstockSkus: overstock.length,
          stockoutRiskSkus: analyses.filter((a) => a.recommendation === 'RISK_OOS').length,
          orderSkus: analyses.filter((a) => a.recommendation === 'ORDER').length,
        },
      },
      needsAction: needsAction.slice(0, 15),
    });
  } catch (e) {
    next(e);
  }
});

dssRouter.get('/products/:id', async (req, res, next) => {
  try {
    const abc = await computeAbcClassification(prisma);
    const meta = abc.get(req.params.id) ?? { class: 'C' as AbcClass, share: 0 };
    const analysis = await analyzeProduct(prisma, req.params.id, meta.class, meta.share);
    if (!analysis) {
      res.status(404).json({ error: 'Товар не знайдено' });
      return;
    }
    res.json(analysis);
  } catch (e) {
    next(e);
  }
});

const whatIfSchema = z.object({
  leadTimeDays: z.number().int().positive().optional(),
  safetyStockDays: z.number().positive().optional(),
  serviceLevel: z.number().min(0.8).max(0.99).optional(),
  demandMultiplier: z.number().positive().optional(),
});

dssRouter.post('/products/:id/what-if', async (req, res, next) => {
  try {
    const input = whatIfSchema.parse(req.body);
    const result = await runWhatIf(prisma, req.params.id, input);
    if (!result) {
      res.status(404).json({ error: 'Товар не знайдено' });
      return;
    }
    await saveDssSnapshot(prisma, 'what-if', {
      productId: req.params.id,
      input,
      deltas: result.deltas,
    });
    res.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors });
      return;
    }
    next(e);
  }
});

dssRouter.patch('/products/:id/params', async (req, res, next) => {
  try {
    const paramsSchema = z.object({
      serviceLevel: z.number().min(0.8).max(0.99).optional(),
      safetyStockDays: z.number().positive().optional(),
      forecastHorizonDays: z.number().int().positive().optional(),
      leadTimeDays: z.number().int().positive().optional(),
    });
    const body = paramsSchema.parse(req.body);

    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { dssParams: true },
    });
    if (!product) {
      res.status(404).json({ error: 'Товар не знайдено' });
      return;
    }

    if (body.leadTimeDays) {
      await prisma.product.update({
        where: { id: req.params.id },
        data: { leadTimeDays: body.leadTimeDays },
      });
    }

    const serviceLevel = body.serviceLevel ?? product.dssParams?.serviceLevel ?? 0.95;

    await prisma.productDssParams.upsert({
      where: { productId: req.params.id },
      create: {
        productId: req.params.id,
        serviceLevel,
        safetyStockDays: body.safetyStockDays ?? 3,
        forecastHorizonDays: body.forecastHorizonDays ?? 30,
        zScore: zScoreFromServiceLevel(serviceLevel),
      },
      update: {
        ...(body.serviceLevel !== undefined
          ? { serviceLevel: body.serviceLevel, zScore: zScoreFromServiceLevel(body.serviceLevel) }
          : {}),
        ...(body.safetyStockDays !== undefined ? { safetyStockDays: body.safetyStockDays } : {}),
        ...(body.forecastHorizonDays !== undefined
          ? { forecastHorizonDays: body.forecastHorizonDays }
          : {}),
      },
    });

    invalidateDssCache();
    res.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.errors });
      return;
    }
    next(e);
  }
});
