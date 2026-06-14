export type AbcClass = 'A' | 'B' | 'C';
export type XyzClass = 'X' | 'Y' | 'Z';
export type RecommendationType = 'ORDER' | 'REDUCE' | 'OK' | 'RISK_OOS';

export interface DailyDemand {
  date: string;
  quantity: number;
}

export interface ForecastResult {
  method: 'moving_average' | 'exponential_smoothing';
  horizonDays: number;
  dailyForecast: number;
  totalForecast: number;
  history: DailyDemand[];
  projected: { date: string; quantity: number }[];
}

export interface ProductDssAnalysis {
  productId: string;
  sku: string;
  name: string;
  currentStock: number;
  unitCost: number;
  price: number;
  leadTimeDays: number;
  abcClass: AbcClass;
  abcSharePercent: number;
  xyzClass: XyzClass;
  demandCv: number;
  avgDailyDemand: number;
  planningDemand: number;
  demandStdDev: number;
  forecast: ForecastResult;
  forecastMape: number;
  safetyStock: number;
  reorderPoint: number;
  economicOrderQty: number;
  daysOfSupply: number;
  stockValue: number;
  recommendation: RecommendationType;
  recommendedOrderQty: number;
  riskScore: number;
  explanation: string[];
  factors: Record<string, number | string>;
}

export interface DashboardKpis {
  totalSkus: number;
  totalStockValue: number;
  avgDaysOfSupply: number;
  atRiskCount: number;
  orderRecommendedCount: number;
  overstockCount: number;
  abcDistribution: { A: number; B: number; C: number };
  xyzDistribution: { X: number; Y: number; Z: number };
}

export interface DashboardData {
  kpis: DashboardKpis;
  analyses: ProductDssAnalysis[];
  topRisks: ProductDssAnalysis[];
}

export interface WhatIfInput {
  leadTimeDays?: number;
  safetyStockDays?: number;
  serviceLevel?: number;
  demandMultiplier?: number;
}

export interface WhatIfResult {
  baseline: ProductDssAnalysis;
  scenario: ProductDssAnalysis;
  deltas: {
    reorderPoint: number;
    safetyStock: number;
    recommendedOrderQty: number;
    daysOfSupply: number;
    recommendationChanged: boolean;
  };
}
