import type { BookingType } from './rules';
import { visibleModifiers } from './modifiers';

export interface TelegramBookingInput {
  firstName: string;
  lastName: string;
  phone: string;
  date: string;
  time: string;
  adults: number;
  children: number;
  bookingType: BookingType;
  hallName: string | null;
  cartItems: { name: string; qty: number; price: number; modifiers?: { group: string; option: string }[] }[];
  cartFoodSum: number;
  banquetMenuName?: string | null;
  banquetSaladNames?: readonly string[];
  calculatedAmount?: number | null;
  minimumOrder?: number | null;
  source?: string | null;
  sourceRef?: string | null;
  comment?: string;
  mode?: 'admin' | 'self';
}

const TYPE_LABEL: Record<BookingType, string> = {
  onsite: 'Заказ по факту',
  preorder: 'Предзаказ',
  banquet: 'Банкетное меню',
};

/** Escape user-supplied strings for HTML parse_mode in Telegram. */
function escapeHtml(value: string | number): string {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const amountFormatter = new Intl.NumberFormat('ru-RU');

function formatAmount(amount: number): string {
  return amountFormatter.format(amount).replace(/\u00a0/g, ' ');
}

export function formatBookingTelegram(i: TelegramBookingInput): string {
  const lines: string[] = [];
  lines.push('🍽 Новая заявка на бронь');
  lines.push(`Гость: ${escapeHtml(i.lastName)} ${escapeHtml(i.firstName)}`.trim());
  lines.push(`Телефон: ${escapeHtml(i.phone)}`);
  lines.push(`Когда: ${escapeHtml(i.date)} ${escapeHtml(i.time)}`);
  lines.push(`Взрослых: ${escapeHtml(i.adults)}`);
  lines.push(`Детей: ${escapeHtml(i.children)}`);
  if (i.hallName) lines.push(`Зал: ${escapeHtml(i.hallName)}`);
  if (i.mode === 'admin') {
    lines.push('Режим: Связаться с администратором');
  } else {
    lines.push(`Тип: ${TYPE_LABEL[i.bookingType]}`);
  }
  if (i.mode !== 'admin' && i.bookingType === 'preorder' && i.cartItems.length > 0) {
    lines.push('Предзаказ:');
    for (const it of i.cartItems) {
      lines.push(`  • ${escapeHtml(it.name)} × ${escapeHtml(it.qty)} — ${escapeHtml(it.price * it.qty)} ₽`);
      for (const m of visibleModifiers(it.modifiers)) {
        lines.push(`      – ${escapeHtml(m.group)}: ${escapeHtml(m.option)}`);
      }
    }
    lines.push(`Сумма: ${escapeHtml(i.cartFoodSum)} ₽`);
  }
  if (i.mode !== 'admin' && i.bookingType === 'banquet' && i.banquetMenuName) {
    lines.push(`Банкетное меню: ${escapeHtml(i.banquetMenuName)}`);
  }
  if (i.mode !== 'admin' && i.bookingType === 'banquet' && i.banquetSaladNames?.length) {
    lines.push(`Салаты: ${i.banquetSaladNames.map(escapeHtml).join(', ')}`);
  }
  if (i.mode !== 'admin' && i.calculatedAmount != null) {
    lines.push(`Расчётная сумма: ${formatAmount(i.calculatedAmount)} ₽`);
  }
  if (i.mode !== 'admin' && i.minimumOrder != null) {
    lines.push(`Минимальная сумма зала: ${formatAmount(i.minimumOrder)} ₽`);
  }
  if (i.source) {
    const ref = i.sourceRef ? ` — ${escapeHtml(i.sourceRef)}` : '';
    lines.push(`Источник: ${escapeHtml(i.source)}${ref}`);
  }
  if (i.comment && i.comment.trim()) lines.push(`Комментарий: ${escapeHtml(i.comment.trim())}`);
  return lines.join('\n');
}
