export function orderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Очікує оплати',
    PAID: 'Оплачено',
    COMPLETED: 'Виконано',
    CANCELLED: 'Скасовано',
  };
  return map[status] ?? status;
}

export function orderStatusClass(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'badge-reduce',
    PAID: 'badge-order',
    COMPLETED: 'badge-ok',
    CANCELLED: 'badge-c',
  };
  return map[status] ?? 'badge-c';
}
