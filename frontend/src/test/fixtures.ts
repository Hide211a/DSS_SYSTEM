import type { Product, ProductDssAnalysis } from '../types';

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    sku: 'SKU-1',
    name: 'Test Product',
    description: 'Test description',
    price: 100,
    category: { id: 'c1', name: 'Category', slug: 'category' },
    stock: 5,
    inStock: true,
    ...overrides,
  };
}

export function makeDssAnalysis(
  overrides: Partial<ProductDssAnalysis> = {}
): ProductDssAnalysis {
  return {
    productId: 'p1',
    sku: 'SKU-1',
    name: 'Test Product',
    currentStock: 10,
    unitCost: 50,
    price: 100,
    leadTimeDays: 7,
    abcClass: 'A',
    abcSharePercent: 30,
    xyzClass: 'X',
    demandCv: 0.2,
    avgDailyDemand: 2,
    planningDemand: 2,
    demandStdDev: 0.5,
    forecastMape: 5,
    forecast: {
      method: 'exponential_smoothing',
      horizonDays: 7,
      dailyForecast: 2,
      totalForecast: 14,
      history: [],
      projected: [],
    },
    safetyStock: 3,
    reorderPoint: 8,
    economicOrderQty: 20,
    daysOfSupply: 5,
    stockValue: 500,
    recommendation: 'ORDER',
    recommendedOrderQty: 15,
    riskScore: 40,
    explanation: [],
    factors: {},
    ...overrides,
  };
}
