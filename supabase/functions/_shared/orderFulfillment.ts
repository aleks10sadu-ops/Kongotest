export const PICKUP_ADDRESS = 'Дмитров, Промышленная улица, 20Б';

type IikoFulfillmentOrder = {
  orderServiceType?: string;
  orderType?: { orderServiceType?: string };
};

export function iikoFulfillmentPresentation(order: IikoFulfillmentOrder) {
  const serviceType = order.orderServiceType || order.orderType?.orderServiceType;
  return serviceType === 'DeliveryByClient'
    ? {
        type: 'pickup' as const,
        emoji: '🛒',
        noun: 'самовывоз',
        pickupAddress: PICKUP_ADDRESS,
      }
    : {
        type: 'delivery' as const,
        emoji: '🚚',
        noun: 'доставка',
        pickupAddress: null,
      };
}

type ReminderInput = {
  completeBefore?: unknown;
  notifiedAt: string;
  now?: Date;
};

const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:[ T]|$)/;

function fulfillmentOpeningTime(value: unknown): number | null {
  const match = LOCAL_DATE.exec(String(value ?? ''));
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const calendarDate = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    calendarDate.getUTCFullYear() !== year
    || calendarDate.getUTCMonth() !== month - 1
    || calendarDate.getUTCDate() !== day
  ) {
    return null;
  }

  const openingHourUtc = calendarDate.getUTCDay() === 0 ? 10 : 9;
  return Date.UTC(year, month - 1, day, openingHourUtc);
}

export function confirmationReminderDue({ completeBefore, notifiedAt, now = new Date() }: ReminderInput): boolean {
  const notifiedTime = new Date(notifiedAt).getTime();
  if (!Number.isFinite(notifiedTime)) return false;

  const sevenMinutesAfterNotification = notifiedTime + 7 * 60 * 1000;
  const openingTime = fulfillmentOpeningTime(completeBefore);
  const dueTime = openingTime == null
    ? sevenMinutesAfterNotification
    : Math.max(sevenMinutesAfterNotification, openingTime);
  return now.getTime() >= dueTime;
}
