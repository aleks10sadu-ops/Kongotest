import type { BanquetPackageId } from './banquetPackages';
import type { BookingType, HallGroup } from './rules';
import type { Hall } from '../halls/halls-data';

export type BookingHall = Omit<Hall, 'id'> & {
  key: string;
  crmHallId: string | null;
  sourceHallId: string;
  group: HallGroup;
  defaultBookingType?: 'banquet';
  allowedBookingTypes: readonly BookingType[];
  minimumOrder: number | null;
  banquetMenus: readonly BanquetPackageId[];
  detailSlug: string | null;
};

const EXACT_BANQUET_HALLS = [
  { key: 'emerald', name: 'Изумрудный зал', capacity: 30, minimumOrder: 70000, detailSlug: 'izumrudnyj-zal' },
  { key: 'ruby', name: 'Рубиновый зал', capacity: 18, minimumOrder: 45000, detailSlug: 'rubinovyj-zal' },
  { key: 'chocolate', name: 'Шоколадный зал', capacity: 30, minimumOrder: 70000, detailSlug: 'shokoladnyj-zal' },
] as const;

const ALL_MENUS = ['conga-7500', 'conga-6000', 'kucher-5000'] as const satisfies readonly BanquetPackageId[];
const CONGA_MENUS = ['conga-7500', 'conga-6000'] as const satisfies readonly BanquetPackageId[];
const STANDARD_BOOKING_TYPES = ['onsite', 'preorder', 'banquet'] as const satisfies readonly BookingType[];
const BANQUET_BOOKING_TYPES = ['preorder', 'banquet'] as const satisfies readonly BookingType[];

const HALL_KEY_BY_NAME: Record<string, string> = {
  Conga: 'conga',
  'Морской зал': 'marine',
  'Барный зал': 'bar',
  'Веранда (Кучер)': 'veranda-kucher',
  'Летняя веранда': 'summer-veranda',
  'Беседки (Кучер)': 'gazebos-kucher',
  'Изумрудный зал': 'emerald',
  'Рубиновый зал': 'ruby',
  'Шоколадный зал': 'chocolate',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function bookingHallKeyForName(name: string): string | null {
  return HALL_KEY_BY_NAME[name] ?? null;
}

export function isExactBanquetHall(hall: BookingHall | null | undefined): boolean {
  return hall?.key === 'emerald' || hall?.key === 'ruby' || hall?.key === 'chocolate';
}

export function bookingHallByKey(halls: readonly BookingHall[], key: string | null): BookingHall | null {
  return halls.find((hall) => hall.key === key) ?? null;
}

export function banquetFilterForHall(hall: BookingHall | null): 'conga' | 'all' | null {
  if (!hall) return null;
  return hall.key === 'conga' ? 'conga' : 'all';
}

function hallGroupForKey(key: string): HallGroup {
  if (key === 'conga') return 'conga';
  if (key === 'gazebos-kucher' || key === 'emerald' || key === 'ruby' || key === 'chocolate') return 'other';
  return 'kucher';
}

function crmHallIdFor(sourceHallId: string): string | null {
  return UUID_PATTERN.test(sourceHallId) ? sourceHallId : null;
}

function standardBookingHall(hall: Hall, key: string): BookingHall {
  const { id: sourceHallId, ...hallDetails } = hall;
  return {
    ...hallDetails,
    key,
    sourceHallId,
    crmHallId: crmHallIdFor(sourceHallId),
    group: hallGroupForKey(key),
    allowedBookingTypes: STANDARD_BOOKING_TYPES,
    minimumOrder: null,
    banquetMenus: key === 'conga' ? CONGA_MENUS : ALL_MENUS,
    detailSlug: null,
  };
}

export function normalizeBookingHalls(halls: readonly Hall[]): BookingHall[] {
  return halls.flatMap((hall) => {
    if (hall.name.trim().toLowerCase() === 'банкетные залы') {
      const { id: sourceHallId, ...hallDetails } = hall;
      const crmHallId = crmHallIdFor(sourceHallId);
      return EXACT_BANQUET_HALLS.map((exactHall) => ({
        ...hallDetails,
        ...exactHall,
        sourceHallId,
        crmHallId,
        group: 'other' as const,
        defaultBookingType: 'banquet' as const,
        allowedBookingTypes: BANQUET_BOOKING_TYPES,
        banquetMenus: ALL_MENUS,
      }));
    }

    const key = bookingHallKeyForName(hall.name);
    return key ? [standardBookingHall(hall, key)] : [];
  });
}
