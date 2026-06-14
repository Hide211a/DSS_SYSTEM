import type { ProductDssAnalysis, RecommendationType } from '../types';

export interface DssConclusionContent {
  analysis: string[];
  decision: string;
  actions: string[];
  priority: 'high' | 'medium' | 'low';
  accent: 'primary' | 'danger' | 'warning' | 'ok';
}

export function buildDssConclusion(analysis: ProductDssAnalysis): DssConclusionContent {
  const {
    recommendation,
    currentStock,
    reorderPoint,
    daysOfSupply,
    leadTimeDays,
    recommendedOrderQty,
    planningDemand,
    abcClass,
    xyzClass,
    riskScore,
    economicOrderQty,
  } = analysis;

  const stockVsRop =
    currentStock <= reorderPoint
      ? `нижче точки замовлення (${currentStock} < ${reorderPoint} од.)`
      : `вище точки замовлення (${currentStock} ≥ ${reorderPoint} од.)`;

  const coverageText =
    planningDemand > 0
      ? `запасу вистачить приблизно на ${daysOfSupply} дн. при плановому попиті ${planningDemand} од./день`
      : currentStock > 0
        ? `попит майже відсутній, але на складі ${currentStock} од.`
        : `товар відсутній на складі`;

  const classText = `Класифікація: ABC-${abcClass}, XYZ-${xyzClass}. Ризик-скор: ${riskScore}/100.`;

  const builders: Record<RecommendationType, () => DssConclusionContent> = {
    ORDER: () => ({
      priority: 'medium',
      accent: 'primary',
      analysis: [
        `Поточний залишок ${stockVsRop}.`,
        `З урахуванням терміну поставки ${leadTimeDays} дн., ${coverageText}.`,
        classText,
      ],
      decision: `Система рекомендує поповнити запас на ${recommendedOrderQty} од. (з урахуванням EOQ ${economicOrderQty} од. та мінімальної партії).`,
      actions: [
        'Створіть заявку на закупівлю (PO) або поповніть склад напряму.',
        'Після отримання товару перевірте, чи залишок перевищує ROP.',
        'За потреби скоригуйте параметри моделі через what-if перед збереженням.',
      ],
    }),
    RISK_OOS: () => ({
      priority: 'high',
      accent: 'danger',
      analysis: [
        currentStock <= 0
          ? 'Товар відсутній на складі — ризик втрати продажів (out-of-stock).'
          : `Залишок критично низький: ${stockVsRop}.`,
        `При lead time ${leadTimeDays} дн. ${coverageText} — поставка може не встигнути за попитом.`,
        classText,
      ],
      decision: `Терміново замовити ${recommendedOrderQty} од. Пріоритет — уникнути дефіциту.`,
      actions: [
        'Негайно оформіть заявку на закупівлю або термінове поповнення.',
        'Перевірте альтернативних постачальників, якщо lead time занадто довгий.',
        'Після поповнення відстежте SKU на dashboard до стабілізації запасу.',
      ],
    }),
    REDUCE: () => ({
      priority: 'medium',
      accent: 'warning',
      analysis: [
        `На складі ${currentStock} од., ${coverageText}.`,
        `Це значно більше, ніж потрібно (ROP = ${reorderPoint} од.).`,
        classText,
      ],
      decision: 'Нове замовлення не потрібне. Є ризик надлишкового запасу та замороження коштів.',
      actions: [
        'Не оформлюйте закупівлю, поки запас не знизиться до ROP.',
        'Розгляньте акцію, знижку або перерозподіл товару.',
        'Перегляньте min order qty та параметри страхового запасу для цього SKU.',
      ],
    }),
    OK: () => ({
      priority: 'low',
      accent: 'ok',
      analysis: [
        `Запас у нормі: ${currentStock} од., ${stockVsRop}.`,
        `${coverageText.charAt(0).toUpperCase()}${coverageText.slice(1)}.`,
        classText,
      ],
      decision: 'Додаткових дій не потрібно. Запас відповідає цільовим параметрам DSS.',
      actions: [
        'Продовжуйте моніторинг через dashboard.',
        `Наступна перевірка — коли залишок наблизиться до ROP (${reorderPoint} од.).`,
        'What-if сценарії використовуйте лише при зміні умов поставки або попиту.',
      ],
    }),
  };

  return builders[recommendation]();
}
