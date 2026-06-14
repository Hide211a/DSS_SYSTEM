import { describe, it, expect } from 'vitest';
import {
  computeForecast,
  computeForecastMape,
} from './engine.js';
import type { DailyDemand } from './types.js';

describe('DSS engine', () => {
  const history: DailyDemand[] = Array.from({ length: 30 }, (_, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    quantity: i < 20 ? 2 : 5,
  }));

  it('computeForecast returns positive daily forecast for non-zero history', () => {
    const result = computeForecast(history, 7);
    expect(result.dailyForecast).toBeGreaterThan(0);
    expect(result.projected).toHaveLength(7);
  });

  it('computeForecast applies demand multiplier', () => {
    const base = computeForecast(history, 7, 'exponential_smoothing', 1);
    const boosted = computeForecast(history, 7, 'exponential_smoothing', 2);
    expect(boosted.dailyForecast).toBeGreaterThan(base.dailyForecast);
  });

  it('computeForecastMape returns number for sufficient history', () => {
    const mape = computeForecastMape(history);
    expect(typeof mape).toBe('number');
    expect(mape).toBeGreaterThanOrEqual(0);
  });
});
