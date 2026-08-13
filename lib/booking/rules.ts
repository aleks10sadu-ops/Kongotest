export type BookingType = 'onsite' | 'preorder' | 'banquet';
export type HallGroup = 'conga' | 'kucher' | 'other';

export interface BookingRuleInput {
  adults: number;
  children: number;
  eventDate: string; // 'YYYY-MM-DD'
  eventTime: string; // 'HH:mm'
  now: Date;
  hallGroup: HallGroup | null;
  type: BookingType | null;
  cartFoodSum: number; // ₽
}

export interface TypeAvailability {
  type: BookingType;
  allowed: boolean;
  reason?: string;
}

export interface BookingValidation {
  availableTypes: TypeAvailability[];
  canSubmit: boolean;
  blocking: string[];
  info: string[];
}

const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;
const ADULTS_BANQUET_MIN = 6;
const ADULTS_NO_ONSITE = 9;
const ADULTS_BANQUET_ONLY = 12;
const BANQUET_LEAD_DAYS = 2;
const BOOKING_CLOSED_FROM = '2026-12-18';
const BOOKING_CLOSED_TO = '2027-01-04';
// Минимум предзаказа НА КАЖДОГО ВЗРОСЛОГО (₽). Итоговый минимум = значение × число взрослых.
const PREORDER_MIN: Record<HallGroup, number | null> = { conga: 4000, kucher: 3000, other: null };

const PREORDER_HINT =
  'Предзаказ отправляется администраторам на рассмотрение через набор блюд в корзину на сайте — наберите позиции, и заявка с их составом уйдёт на согласование.';
const ADMIN_CONTACT_PREPAY = 'Для банкета нужна предоплата 10 000 ₽ — свяжется администратор.';
const ADMIN_CONTACT_HALL = 'Для этого зала свяжется администратор.';

export function isBookingDateClosed(eventDate: string): boolean {
  return eventDate >= BOOKING_CLOSED_FROM && eventDate <= BOOKING_CLOSED_TO;
}

export function bookingTimeWindowForDate(eventDate: string): { start: string; end: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return null;
  const [year, month, day] = eventDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return { start: date.getDay() === 0 ? '13:00' : '12:00', end: '22:00' };
}

export function isBookingTimeAllowed(eventDate: string, eventTime: string): boolean {
  const window = bookingTimeWindowForDate(eventDate);
  return Boolean(window && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(eventTime) && eventTime >= window.start && eventTime <= window.end);
}

export function classifyHall(hallName: string | null | undefined): HallGroup | null {
  if (!hallName) return null;
  const n = hallName.toLowerCase();
  if (n.includes('conga')) return 'conga';
  if (n.includes('банкет') || n.includes('беседк')) return 'other';
  return 'kucher';
}

export function preorderMinimum(group: HallGroup): number | null {
  return PREORDER_MIN[group];
}

export function banquetPackagesForHall(group: HallGroup | null): 'conga' | 'all' | null {
  if (!group) return null;
  return group === 'conga' ? 'conga' : 'all';
}

function eventDateParts(eventDate: string): { y: number; mo: number; day: number } {
  const [y, mo, day] = eventDate.split('-').map(Number);
  return { y, mo: mo - 1, day };
}

function daysUntilEvent(now: Date, eventDate: string): number {
  const msk = new Date(now.getTime() + MSK_OFFSET_MS);
  const todayUTC = Date.UTC(msk.getUTCFullYear(), msk.getUTCMonth(), msk.getUTCDate());
  const { y, mo, day } = eventDateParts(eventDate);
  const evUTC = Date.UTC(y, mo, day);
  return Math.round((evUTC - todayUTC) / 86400000);
}

function banquetDateEligible(now: Date, eventDate: string): boolean {
  return daysUntilEvent(now, eventDate) >= BANQUET_LEAD_DAYS;
}

export function evaluateBooking(input: BookingRuleInput): BookingValidation {
  const { adults, eventDate, now, hallGroup, type, cartFoodSum } = input;

  // Доступность предзаказа зависит от числа гостей, банкета — ещё и от даты.
  const onsiteAllowed = adults < ADULTS_NO_ONSITE;
  const preorderAllowed = adults < ADULTS_BANQUET_ONLY;
  const banquetAllowed =
    adults >= ADULTS_BANQUET_MIN && (!eventDate || banquetDateEligible(now, eventDate));

  const onsiteReason = onsiteAllowed
    ? undefined
    : adults >= ADULTS_BANQUET_ONLY
      ? 'От 12 гостей — только банкет'
      : 'От 9 гостей — предзаказ или банкет';
  const preorderReason = preorderAllowed ? undefined : 'От 12 гостей — только банкет';
  const banquetReason = banquetAllowed
    ? undefined
    : adults < ADULTS_BANQUET_MIN
      ? 'Банкет — от 6 гостей'
      : `Банкет оформляется минимум за ${BANQUET_LEAD_DAYS} дня`;

  const availableTypes: TypeAvailability[] = [
    { type: 'onsite', allowed: onsiteAllowed, reason: onsiteReason },
    { type: 'preorder', allowed: preorderAllowed, reason: preorderReason },
    { type: 'banquet', allowed: banquetAllowed, reason: banquetReason },
  ];

  const blocking: string[] = [];
  const info: string[] = [];

  if (!type) {
    return { availableTypes, canSubmit: false, blocking, info };
  }

  const selected = availableTypes.find((t) => t.type === type)!;
  if (!selected.allowed) {
    if (selected.reason) blocking.push(selected.reason);
    return { availableTypes, canSubmit: false, blocking, info };
  }

  let canSubmit = true;

  if (type === 'onsite') {
    // правил-доменных блокировок нет
  } else if (type === 'preorder') {
    info.push(PREORDER_HINT);
    if (!hallGroup) {
      blocking.push('Выберите зал.');
      canSubmit = false;
    } else if (cartFoodSum <= 0) {
      blocking.push('Наберите блюда в корзину для предзаказа.');
      canSubmit = false;
    } else {
      const perAdult = preorderMinimum(hallGroup);
      if (perAdult != null) {
        // Минимум предзаказа считается на КАЖДОГО взрослого (дети не учитываются).
        const required = perAdult * Math.max(1, adults);
        if (cartFoodSum < required) {
          blocking.push(
            `Минимум предзаказа для этого зала — ${perAdult} ₽ на каждого взрослого. ` +
            `Для ${adults} взр. это ${required} ₽. Доберите ещё ${required - cartFoodSum} ₽.`,
          );
          canSubmit = false;
        }
      } else {
        info.push(ADMIN_CONTACT_HALL);
      }
    }
    if (canSubmit) {
      info.push(
        `Для подтверждения предзаказа необходимо внести предоплату ${cartFoodSum < 10000 ? '5 000' : '10 000'} ₽ — для этого с вами свяжется администратор.`,
      );
    }
  } else if (type === 'banquet') {
    info.push(ADMIN_CONTACT_PREPAY);
    if (!hallGroup) {
      blocking.push('Выберите зал для банкета.');
      canSubmit = false;
    }
  }

  return { availableTypes, canSubmit, blocking, info };
}
