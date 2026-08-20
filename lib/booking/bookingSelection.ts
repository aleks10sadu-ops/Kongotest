import type { BookingContextWarning, ParsedBookingContext } from './bookingContext';
import type { BanquetPackageId, BanquetSaladId } from './banquetPackages';
import { bookingHallByKey, type BookingHall } from './hallCatalog';
import type { BookingType } from './rules';

export type BookingSelection = {
  mode: 'admin' | 'self';
  hallKey: string | null;
  bookingType: BookingType;
  adults: number;
  banquetPackageId: BanquetPackageId | null;
  saladIds: BanquetSaladId[];
  notice: BookingContextWarning | null;
};

const EMPTY_SELECTION: BookingSelection = {
  mode: 'admin',
  hallKey: null,
  bookingType: 'onsite',
  adults: 2,
  banquetPackageId: null,
  saladIds: [],
  notice: null,
};

function contextIsEmpty(context: ParsedBookingContext): boolean {
  return context.source === null
    && context.hallKey === null
    && context.bookingType === null
    && context.banquetPackageId === null
    && context.saladIds.length === 0
    && context.ref === null
    && context.warnings.length === 0;
}

function bookingTypeForHall(type: BookingType, hall: BookingHall | null): BookingType {
  if (!hall || hall.allowedBookingTypes.includes(type)) return type;
  return hall.defaultBookingType ?? hall.allowedBookingTypes[0] ?? 'onsite';
}

export function createInitialBookingSelection(
  context: ParsedBookingContext,
  halls: readonly BookingHall[],
): BookingSelection {
  if (contextIsEmpty(context)) return { ...EMPTY_SELECTION, saladIds: [] };

  const hall = bookingHallByKey(halls, context.hallKey);
  const requestedType = context.banquetPackageId
    ? 'banquet'
    : context.bookingType ?? hall?.defaultBookingType ?? 'onsite';

  return {
    mode: 'self',
    hallKey: hall?.key ?? null,
    bookingType: bookingTypeForHall(requestedType, hall),
    adults: requestedType === 'banquet' ? 6 : 2,
    banquetPackageId: context.banquetPackageId,
    saladIds: [...context.saladIds],
    notice: context.warnings[0] ?? null,
  };
}

export function changeBookingHall(
  selection: BookingSelection,
  nextHallKey: string | null,
  halls: readonly BookingHall[],
): BookingSelection {
  const hall = bookingHallByKey(halls, nextHallKey);
  const menuIsCompatible = !hall
    || selection.banquetPackageId === null
    || hall.banquetMenus.includes(selection.banquetPackageId);

  return {
    ...selection,
    hallKey: hall?.key ?? null,
    bookingType: bookingTypeForHall(selection.bookingType, hall),
    banquetPackageId: menuIsCompatible ? selection.banquetPackageId : null,
    saladIds: menuIsCompatible ? [...selection.saladIds] : [],
    notice: menuIsCompatible ? null : 'incompatible-menu',
  };
}
