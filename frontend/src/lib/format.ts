export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 0,
  }).format(value);
}

export function recommendationLabel(type: string): string {
  const map: Record<string, string> = {
    ORDER: 'Замовити',
    RISK_OOS: 'Ризик дефіциту',
    REDUCE: 'Зменшити запас',
    OK: 'Норма',
    REVIEW: 'Переглянути',
  };
  return map[type] ?? type;
}

export function recommendationBadgeClass(type: string): string {
  const map: Record<string, string> = {
    ORDER: 'badge-order',
    RISK_OOS: 'badge-risk',
    REDUCE: 'badge-reduce',
    OK: 'badge-ok',
  };
  return map[type] ?? 'badge-ok';
}
