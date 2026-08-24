export const PICKUP_ADDRESS = 'Дмитров, Промышленная улица, 20Б';
export const IIKO_BY_ID_CHUNK_SIZE = 200;
export const SITE_ORDER_DISCOVERY_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type IikoFulfillmentOrder = {
  orderServiceType?: string;
  orderType?: { orderServiceType?: string };
};

export function iikoFulfillmentPresentation(order: IikoFulfillmentOrder) {
  const serviceType = order.orderServiceType || order.orderType?.orderServiceType;
  return serviceType === 'DeliveryByClient'
    ? {
        type: 'pickup' as const,
        emoji: '\u{1F6CD}',
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

export function chunkForIiko<T>(values: T[]): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += IIKO_BY_ID_CHUNK_SIZE) {
    chunks.push(values.slice(index, index + IIKO_BY_ID_CHUNK_SIZE));
  }
  return chunks;
}

export async function collectSupabasePages<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  pageSize = IIKO_BY_ID_CHUNK_SIZE,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export function formatIikoCompleteBefore(value: unknown): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(value ?? ''));
  return match ? `${match[4]}:${match[5]} (${match[3]}.${match[2]})` : null;
}

export function recentUnclaimedOrderIds(
  rows: Array<{ detail?: unknown }>,
  claimedIds: ReadonlySet<string>,
): string[] {
  const ids: string[] = [];
  const unique = new Set<string>();
  for (const row of rows) {
    const id = typeof row.detail === 'string' ? row.detail.trim() : '';
    if (!id || claimedIds.has(id) || unique.has(id)) continue;
    unique.add(id);
    ids.push(id);
  }
  return ids;
}

export function mergeIikoOrderCandidates<T extends { id: unknown }>(...sources: T[][]): T[] {
  const merged: T[] = [];
  const ids = new Set<string>();
  for (const source of sources) {
    for (const candidate of source) {
      const id = String(candidate.id ?? '').trim();
      if (!id || ids.has(id)) continue;
      ids.add(id);
      merged.push(candidate);
    }
  }
  return merged;
}

export function statusTrackingPage(totalCount: number, epochMinute: number): {
  pageIndex: number;
  pageCount: number;
  from: number;
  to: number;
} | null {
  const rowCount = Math.max(0, Math.floor(totalCount));
  if (!rowCount) return null;

  const pageCount = Math.ceil(rowCount / IIKO_BY_ID_CHUNK_SIZE);
  const minute = Math.floor(epochMinute);
  const pageIndex = ((minute % pageCount) + pageCount) % pageCount;
  const from = pageIndex * IIKO_BY_ID_CHUNK_SIZE;
  return {
    pageIndex,
    pageCount,
    from,
    to: Math.min(from + IIKO_BY_ID_CHUNK_SIZE - 1, rowCount - 1),
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
