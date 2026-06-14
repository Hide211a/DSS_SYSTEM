import type { PrismaClient } from '@prisma/client';
import type {
  DashboardData,
  DashboardKpis,
  DailyDemand,
  ForecastResult,
  ProductDssAnalysis,
  RecommendationType,
  WhatIfInput,
  WhatIfResult,
  AbcClass
} from './types.js';
import {
  addDays,
  classifyXyz,
  coefficientOfVariation,
  daysOfSupply,
  economicOrderQuantity,
  exponentialSmoothing,
  formatDate,
  mean,
  mape,
  movingAverage,
  reorderPoint,
  safetyStock,
  stdDev,
  zScoreFromServiceLevel,
} from './math.js';

const PLANNING_BLEND_FORECAST = 0.65;

const HISTORY_DAYS = 90;
const MA_WINDOW = 14;


export async function buildDailyDemandSeries(
  prisma: PrismaClient,
  productId: string,
  days = HISTORY_DAYS
): Promise<DailyDemand[]> {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = addDays(end, -days + 1);
  start.setHours(0, 0, 0, 0);

  const orderItems = await prisma.orderItem.findMany({
    where: {
      productId,
      order: {
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
    },
    include: { order: true },
  });

  const byDate = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    byDate.set(formatDate(d), 0);
  }

  for (const item of orderItems) {
    const key = formatDate(item.order.createdAt);
    if (byDate.has(key)) {
      byDate.set(key, (byDate.get(key) ?? 0) + item.quantity);
    }
  }

  return Array.from(byDate.entries()).map(([date, quantity]) => ({ date, quantity }));
}

export function computeForecast(
  history: DailyDemand[],
  horizonDays: number,
  method: 'moving_average' | 'exponential_smoothing' = 'exponential_smoothing',
  demandMultiplier = 1
): ForecastResult {
  const quantities = history.map((h) => h.quantity);
  const rawForecast =
    method === 'moving_average'
      ? movingAverage(quantities, MA_WINDOW)
      : exponentialSmoothing(quantities, 0.35);
  const dailyForecast = rawForecast * demandMultiplier;

  const lastDate = history.length > 0 ? new Date(history[history.length - 1].date) : new Date();
  const projected = Array.from({ length: horizonDays }, (_, i) => {
    const date = addDays(lastDate, i + 1);
    return { date: formatDate(date), quantity: Math.round(dailyForecast * 10) / 10 };
  });

  return {
    method,
    horizonDays,
    dailyForecast: Math.round(dailyForecast * 100) / 100,
    totalForecast: Math.round(dailyForecast * horizonDays * 100) / 100,
    history,
    projected,
  };
}

/** Holdout MAPE: train on first 75 days, test on last 15. */
export function computeForecastMape(history: DailyDemand[]): number {
  if (history.length < 30) return 0;
  const quantities = history.map((h) => h.quantity);
  const split = Math.floor(quantities.length * 0.83);
  const train = quantities.slice(0, split);
  const test = quantities.slice(split);
  const predicted: number[] = [];
  for (let i = 0; i < test.length; i++) {
    const series = [...train, ...test.slice(0, i)];
    predicted.push(exponentialSmoothing(series, 0.35));
  }
  return mape(test, predicted);
}

function classifyRecommendation(
  currentStock: number,
  reorderPt: number,
  daysSupply: number,
  leadTimeDays: number,
  avgDailyDemand: number
): { type: RecommendationType; orderQty: number; riskScore: number; explanation: string[] } {
  const explanation: string[] = [];
  let type: RecommendationType = 'OK';
  let orderQty = 0;
  let riskScore = 10;

  if (currentStock <= 0) {
    type = 'RISK_OOS';
    riskScore = 95;
    orderQty = Math.max(reorderPt, 1);
    explanation.push('Запас відсутній — високий ризик дефіциту (out-of-stock).');
  } else if (currentStock <= reorderPt) {
    type = 'ORDER';
    orderQty = Math.max(reorderPt - currentStock, 1);
    riskScore = 70;
    explanation.push(
      `Поточний запас (${currentStock}) нижче точки замовлення (${reorderPt}). Рекомендовано поповнення.`
    );
  } else if (daysSupply < leadTimeDays) {
    type = 'RISK_OOS';
    riskScore = 55;
    orderQty = Math.max(Math.ceil(avgDailyDemand * leadTimeDays) - currentStock, 0);
    explanation.push(
      `Запасу вистачить на ${daysSupply} дн., що менше терміну поставки (${leadTimeDays} дн.).`
    );
  } else if (daysSupply > leadTimeDays * 4 && avgDailyDemand > 0) {
    type = 'REDUCE';
    riskScore = 25;
    explanation.push(
      `Надлишковий запас: ${daysSupply} днів покриття — можливе замороження коштів.`
    );
  } else {
    explanation.push('Запас у межах цільових параметрів.');
    riskScore = 15;
  }

  return { type, orderQty, riskScore, explanation };
}

export async function analyzeProduct(
  prisma: PrismaClient,
  productId: string,
  abcClass: AbcClass,
  abcSharePercent: number,
  overrides?: WhatIfInput
): Promise<ProductDssAnalysis | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      inventory: true,
      dssParams: true,
    },
  });
  if (!product) return null;

  const history = await buildDailyDemandSeries(prisma, productId);
  const quantities = history.map((h) => h.quantity);
  const avgDailyDemand = mean(quantities);
  const demandStdDev = stdDev(quantities);

  const demandMultiplier = overrides?.demandMultiplier ?? 1;

  const serviceLevel = overrides?.serviceLevel ?? product.dssParams?.serviceLevel ?? 0.95;
  const safetyStockDays = overrides?.safetyStockDays ?? product.dssParams?.safetyStockDays ?? 3;
  const horizon = product.dssParams?.forecastHorizonDays ?? 30;
  const z =
    overrides?.serviceLevel !== undefined
      ? zScoreFromServiceLevel(serviceLevel)
      : zScoreFromServiceLevel(product.dssParams?.serviceLevel ?? 0.95);

  const leadTimeDays = overrides?.leadTimeDays ?? product.leadTimeDays;
  const currentStock = product.inventory?.quantity ?? 0;

  const historicalMean = mean(quantities);
  const forecast = computeForecast(history, horizon, 'exponential_smoothing', demandMultiplier);
  const adjustedHistoricalMean = historicalMean * demandMultiplier;
  const planningDemand =
    PLANNING_BLEND_FORECAST * forecast.dailyForecast +
    (1 - PLANNING_BLEND_FORECAST) * adjustedHistoricalMean;
  const forecastMape = computeForecastMape(history);
  const demandCv = coefficientOfVariation(quantities);
  const xyzClass = classifyXyz(demandCv);

  const safety = safetyStock(z, demandStdDev, leadTimeDays, safetyStockDays, planningDemand);
  const reorderPt = reorderPoint(planningDemand, leadTimeDays, safety);
  const annualDemand = planningDemand * 365;
  const holdingCost = product.unitCost * 0.2;
  const eoq = economicOrderQuantity(annualDemand, 50, holdingCost || 1);
  const supplyDays = daysOfSupply(currentStock, planningDemand);

  const rec = classifyRecommendation(
    currentStock,
    reorderPt,
    supplyDays,
    leadTimeDays,
    planningDemand
  );

  let recommendedOrderQty = Math.max(rec.orderQty, product.minOrderQty);
  if (rec.type === 'ORDER' || rec.type === 'RISK_OOS') {
    recommendedOrderQty = Math.max(recommendedOrderQty, eoq, product.minOrderQty);
  }

  const explanation = [
    ...rec.explanation,
    `Історичний μ (90 дн.): ${avgDailyDemand.toFixed(2)} од./день.`,
    `Прогноз (ES): ${forecast.dailyForecast} од./день; MAPE holdout: ${forecastMape}%.`,
    `Планувальний попит: ${planningDemand.toFixed(2)} = ${PLANNING_BLEND_FORECAST * 100}%×прогноз + ${(1 - PLANNING_BLEND_FORECAST) * 100}%×μ.`,
    `Страховий запас: ${safety} од. (Z=${z}, σ=${demandStdDev.toFixed(2)}).`,
    `ROP: ${reorderPt} = плановий попит×LT + страховий запас.`,
    `ABC: ${abcClass} (${abcSharePercent.toFixed(1)}%), XYZ: ${xyzClass} (CV=${demandCv.toFixed(2)}).`,
  ];

  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    currentStock,
    unitCost: product.unitCost,
    price: product.price,
    leadTimeDays,
    abcClass,
    abcSharePercent,
    xyzClass,
    demandCv: Math.round(demandCv * 100) / 100,
    avgDailyDemand: Math.round(avgDailyDemand * 100) / 100,
    planningDemand: Math.round(planningDemand * 100) / 100,
    demandStdDev: Math.round(demandStdDev * 100) / 100,
    forecast,
    forecastMape,
    safetyStock: safety,
    reorderPoint: reorderPt,
    economicOrderQty: eoq,
    daysOfSupply: supplyDays,
    stockValue: currentStock * product.unitCost,
    recommendation: rec.type,
    recommendedOrderQty,
    riskScore: rec.riskScore,
    explanation,
    factors: {
      serviceLevel,
      safetyStockDays,
      zScore: z,
      leadTimeDays,
      minOrderQty: product.minOrderQty,
    },
  };
}

export async function computeAbcClassification(prisma: PrismaClient) {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      orderItems: {
        where: { order: { status: 'COMPLETED' } },
      },
    },
  });

  const revenueByProduct = products.map((p) => {
    const revenue = p.orderItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    return { productId: p.id, revenue };
  });

  const total = revenueByProduct.reduce((s, x) => s + x.revenue, 0) || 1;
  const sorted = [...revenueByProduct].sort((a, b) => b.revenue - a.revenue);

  let cumulative = 0;
  const result = new Map<string, { class: AbcClass; share: number }>();

  for (const item of sorted) {
    cumulative += item.revenue;
    const share = (item.revenue / total) * 100;
    const cumPercent = (cumulative / total) * 100;
    let abcClass: AbcClass = 'C';
    if (cumPercent <= 80) abcClass = 'A';
    else if (cumPercent <= 95) abcClass = 'B';
    result.set(item.productId, { class: abcClass, share });
  }

  return result;
}

async function computeAllAnalyses(prisma: PrismaClient): Promise<ProductDssAnalysis[]> {
  const abc = await computeAbcClassification(prisma);
  const products = await prisma.product.findMany({ where: { isActive: true } });
  const analyses: ProductDssAnalysis[] = [];

  for (const p of products) {
    const meta = abc.get(p.id) ?? { class: 'C' as AbcClass, share: 0 };
    const analysis = await analyzeProduct(prisma, p.id, meta.class, meta.share);
    if (analysis) analyses.push(analysis);
  }

  return analyses.sort((a, b) => b.riskScore - a.riskScore);
}

export async function getAllProductAnalyses(prisma: PrismaClient): Promise<ProductDssAnalysis[]> {
  const { getCachedAnalyses } = await import('./cache.js');
  const { analyses } = await getCachedAnalyses(prisma, () => computeAllAnalyses(prisma));
  return analyses;
}

export function buildKpisFromAnalyses(analyses: ProductDssAnalysis[]): DashboardKpis {
  const totalStockValue = analyses.reduce((s, a) => s + a.stockValue, 0);
  const avgDays =
    analyses.length > 0 ? analyses.reduce((s, a) => s + a.daysOfSupply, 0) / analyses.length : 0;

  const abcDistribution = { A: 0, B: 0, C: 0 };
  const xyzDistribution = { X: 0, Y: 0, Z: 0 };
  for (const a of analyses) {
    abcDistribution[a.abcClass]++;
    xyzDistribution[a.xyzClass]++;
  }

  return {
    totalSkus: analyses.length,
    totalStockValue: Math.round(totalStockValue * 100) / 100,
    avgDaysOfSupply: Math.round(avgDays * 10) / 10,
    atRiskCount: analyses.filter((a) => a.recommendation === 'RISK_OOS').length,
    orderRecommendedCount: analyses.filter((a) => a.recommendation === 'ORDER').length,
    overstockCount: analyses.filter((a) => a.recommendation === 'REDUCE').length,
    abcDistribution,
    xyzDistribution,
  };
}

export async function getDashboardData(prisma: PrismaClient): Promise<DashboardData> {
  const analyses = await getAllProductAnalyses(prisma);
  return {
    kpis: buildKpisFromAnalyses(analyses),
    analyses,
    topRisks: analyses.slice(0, 10),
  };
}

export async function runWhatIf(
  prisma: PrismaClient,
  productId: string,
  input: WhatIfInput
): Promise<WhatIfResult | null> {
  const abc = await computeAbcClassification(prisma);
  const meta = abc.get(productId) ?? { class: 'C' as AbcClass, share: 0 };
  const baseline = await analyzeProduct(prisma, productId, meta.class, meta.share);
  if (!baseline) return null;
  const scenario = await analyzeProduct(prisma, productId, meta.class, meta.share, input);
  if (!scenario) return null;

  return {
    baseline,
    scenario,
    deltas: {
      reorderPoint: scenario.reorderPoint - baseline.reorderPoint,
      safetyStock: scenario.safetyStock - baseline.safetyStock,
      recommendedOrderQty: scenario.recommendedOrderQty - baseline.recommendedOrderQty,
      daysOfSupply: scenario.daysOfSupply - baseline.daysOfSupply,
      recommendationChanged: scenario.recommendation !== baseline.recommendation,
    },
  };
}
