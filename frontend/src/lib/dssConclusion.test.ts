import { describe, expect, it } from 'vitest';
import { buildDssConclusion } from './dssConclusion';
import { makeDssAnalysis } from '../test/fixtures';

describe('buildDssConclusion', () => {
  it('returns ORDER conclusion with primary accent', () => {
    const result = buildDssConclusion(makeDssAnalysis({ recommendation: 'ORDER' }));
    expect(result.accent).toBe('primary');
    expect(result.decision).toContain('поповнити запас');
    expect(result.actions[0]).toContain('закупівлю');
  });

  it('returns RISK_OOS conclusion with high priority', () => {
    const result = buildDssConclusion(
      makeDssAnalysis({ recommendation: 'RISK_OOS', currentStock: 0, reorderPoint: 5 })
    );
    expect(result.priority).toBe('high');
    expect(result.accent).toBe('danger');
    expect(result.analysis[0]).toContain('відсутній');
  });

  it('returns REDUCE conclusion when stock is excessive', () => {
    const result = buildDssConclusion(
      makeDssAnalysis({ recommendation: 'REDUCE', currentStock: 50, reorderPoint: 10 })
    );
    expect(result.accent).toBe('warning');
    expect(result.decision).toContain('Нове замовлення не потрібне');
  });

  it('returns OK conclusion with low priority', () => {
    const result = buildDssConclusion(
      makeDssAnalysis({ recommendation: 'OK', currentStock: 12, reorderPoint: 8 })
    );
    expect(result.priority).toBe('low');
    expect(result.accent).toBe('ok');
    expect(result.decision).toContain('Додаткових дій не потрібно');
  });
});
