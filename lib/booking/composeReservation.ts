import type { BookingType } from './rules';

export interface ComposeInput {
  adults: number;
  children: number;
  bookingType: BookingType;
  hallName: string | null;
  cartItems: { name: string; qty: number; price: number }[];
  cartFoodSum: number;
  banquetMenuName?: string | null;
  banquetSaladNames?: readonly string[];
  calculatedAmount?: number | null;
  minimumOrder?: number | null;
  source?: string | null;
  sourceRef?: string | null;
  comment?: string;
}

const TYPE_LABEL: Record<BookingType, string> = {
  onsite: 'Заказ по факту',
  preorder: 'Предзаказ',
  banquet: 'Банкетное меню',
};

const amountFormatter = new Intl.NumberFormat('ru-RU');

function formatAmount(amount: number): string {
  return amountFormatter.format(amount).replace(/\u00a0/g, ' ');
}

export function composeReservationComment(input: ComposeInput): string {
  const lines: string[] = [];
  lines.push(`Тип: ${TYPE_LABEL[input.bookingType]}`);
  lines.push(`Взрослых: ${input.adults}; Детей: ${input.children}`);
  if (input.hallName) lines.push(`Зал: ${input.hallName}`);

  if (input.bookingType === 'preorder' && input.cartItems.length > 0) {
    lines.push('Предзаказ:');
    for (const it of input.cartItems) {
      lines.push(`  • ${it.name} × ${it.qty} — ${it.price * it.qty} ₽`);
    }
    lines.push(`Сумма предзаказа: ${input.cartFoodSum} ₽`);
  }
  if (input.bookingType === 'banquet' && input.banquetMenuName) {
    lines.push(`Банкетное меню: ${input.banquetMenuName}`);
  }
  if (input.bookingType === 'banquet' && input.banquetSaladNames?.length) {
    lines.push(`Салаты: ${input.banquetSaladNames.join(', ')}`);
  }
  if (input.calculatedAmount != null) lines.push(`Расчётная сумма: ${formatAmount(input.calculatedAmount)} ₽`);
  if (input.minimumOrder != null) lines.push(`Минимальная сумма зала: ${formatAmount(input.minimumOrder)} ₽`);
  if (input.source) {
    lines.push(`Источник: ${input.source}${input.sourceRef ? ` — ${input.sourceRef}` : ''}`);
  }
  if (input.comment && input.comment.trim()) {
    lines.push(`Комментарий: ${input.comment.trim()}`);
  }
  return lines.join('\n');
}
