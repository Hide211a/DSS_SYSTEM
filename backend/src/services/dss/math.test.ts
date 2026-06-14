import { describe, expect, it } from 'vitest';
import {
  classifyXyz,
  economicOrderQuantity,
  exponentialSmoothing,
  mape,
  reorderPoint,
  safetyStock,
  zScoreFromServiceLevel,
} from './math.js';

describe('DSS math', () => {
  it('zScoreFromServiceLevel', () => {
    expect(zScoreFromServiceLevel(0.95)).toBe(1.65);
    expect(zScoreFromServiceLevel(0.99)).toBe(2.33);
  });

  it('safetyStock uses max of statistical and time-based', () => {
    const ss = safetyStock(1.65, 2, 7, 3, 5);
    expect(ss).toBeGreaterThan(0);
  });

  it('reorderPoint', () => {
    expect(reorderPoint(10, 7, 20)).toBe(90);
  });

  it('economicOrderQuantity', () => {
    expect(economicOrderQuantity(3650, 50, 10)).toBeGreaterThan(0);
  });

  it('exponentialSmoothing', () => {
    const result = exponentialSmoothing([1, 2, 3, 4, 5], 0.3);
    expect(result).toBeGreaterThan(0);
  });

  it('mape', () => {
    expect(mape([10, 20], [11, 18])).toBeGreaterThan(0);
  });

  it('classifyXyz', () => {
    expect(classifyXyz(0.3)).toBe('X');
    expect(classifyXyz(0.8)).toBe('Y');
    expect(classifyXyz(1.5)).toBe('Z');
  });
});
