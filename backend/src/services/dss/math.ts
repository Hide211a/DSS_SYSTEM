/** Z-score for common service levels (inventory safety stock). */
export function zScoreFromServiceLevel(serviceLevel: number): number {
  const table: Record<string, number> = {
    '0.90': 1.28,
    '0.95': 1.65,
    '0.97': 1.88,
    '0.99': 2.33,
  };
  const key = serviceLevel.toFixed(2);
  return table[key] ?? 1.65;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function movingAverage(series: number[], window: number): number {
  if (series.length === 0) return 0;
  const slice = series.slice(-window);
  return mean(slice);
}

export function exponentialSmoothing(series: number[], alpha = 0.3): number {
  if (series.length === 0) return 0;
  let smoothed = series[0];
  for (let i = 1; i < series.length; i++) {
    smoothed = alpha * series[i] + (1 - alpha) * smoothed;
  }
  return smoothed;
}

export function safetyStock(
  z: number,
  demandStdDev: number,
  leadTimeDays: number,
  safetyStockDays: number,
  avgDailyDemand: number
): number {
  const statistical = z * demandStdDev * Math.sqrt(leadTimeDays);
  const timeBased = avgDailyDemand * safetyStockDays;
  return Math.ceil(Math.max(statistical, timeBased));
}

export function reorderPoint(avgDailyDemand: number, leadTimeDays: number, safety: number): number {
  return Math.ceil(avgDailyDemand * leadTimeDays + safety);
}

export function economicOrderQuantity(
  annualDemand: number,
  orderCost = 50,
  holdingCostPerUnit = 1
): number {
  if (holdingCostPerUnit <= 0) return 0;
  const eoq = Math.sqrt((2 * annualDemand * orderCost) / holdingCostPerUnit);
  return Math.max(Math.ceil(eoq), 1);
}

export function daysOfSupply(currentStock: number, avgDailyDemand: number): number {
  if (avgDailyDemand <= 0) return currentStock > 0 ? 999 : 0;
  return Math.round((currentStock / avgDailyDemand) * 10) / 10;
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Mean Absolute Percentage Error for forecast validation (holdout). */
export function mape(actual: number[], predicted: number[]): number {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] > 0) {
      sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
      count++;
    }
  }
  return count === 0 ? 0 : Math.round((sum / count) * 10000) / 100;
}

export function coefficientOfVariation(values: number[]): number {
  const m = mean(values);
  if (m === 0) return 0;
  return stdDev(values) / m;
}

export function classifyXyz(cv: number): 'X' | 'Y' | 'Z' {
  if (cv <= 0.5) return 'X';
  if (cv <= 1.0) return 'Y';
  return 'Z';
}
