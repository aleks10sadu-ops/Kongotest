import {
  normalizeBanquetSelection,
  type BanquetPackageId,
  type BanquetSaladId,
} from './banquetPackages';
import { bookingHallByKey, isExactBanquetHall, type BookingHall } from './hallCatalog';
import type { BookingType } from './rules';

export type BookingSource = 'hall' | 'banquet-menu' | 'event' | 'promotion' | 'home';
export type BookingContextWarning = 'onsite-disabled' | 'incompatible-menu';

export type BookingContextInput = {
  source?: BookingSource;
  hallKey?: string | null;
  bookingType?: BookingType | null;
  banquetPackageId?: BanquetPackageId | null;
  saladIds?: readonly BanquetSaladId[];
  ref?: string | null;
};

export type ParsedBookingContext = {
  source: BookingSource | null;
  hallKey: string | null;
  bookingType: BookingType | null;
  banquetPackageId: BanquetPackageId | null;
  saladIds: BanquetSaladId[];
  ref: string | null;
  warnings: BookingContextWarning[];
};

const BOOKING_SOURCES: readonly BookingSource[] = ['hall', 'banquet-menu', 'event', 'promotion', 'home'];
const BOOKING_TYPES: readonly BookingType[] = ['onsite', 'preorder', 'banquet'];
const SAFE_REF_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function bookingSource(value: string | null | undefined): BookingSource | null {
  return BOOKING_SOURCES.includes(value as BookingSource) ? value as BookingSource : null;
}

function bookingType(value: string | null | undefined): BookingType | null {
  return BOOKING_TYPES.includes(value as BookingType) ? value as BookingType : null;
}

function safeRef(value: string | null | undefined): string | null {
  return value && SAFE_REF_PATTERN.test(value) ? value : null;
}

export function buildBookingHref(input: BookingContextInput): string {
  const params = new URLSearchParams();
  const source = bookingSource(input.source);
  const bookingTypeValue = bookingType(input.bookingType);
  const normalizedMenu = normalizeBanquetSelection(input.banquetPackageId, input.saladIds ?? []);

  if (source) params.set('source', source);
  if (input.hallKey) params.set('hall', input.hallKey);
  if (normalizedMenu.packageId) {
    params.set('bookingType', 'banquet');
    params.set('banquetMenu', normalizedMenu.packageId);
    normalizedMenu.saladIds.forEach((saladId) => params.append('salad', saladId));
  } else if (bookingTypeValue) {
    params.set('bookingType', bookingTypeValue);
  }
  const ref = safeRef(input.ref);
  if (ref) params.set('ref', ref);

  const query = params.toString();
  return query ? `/booking?${query}` : '/booking';
}

export function parseBookingContext(
  params: URLSearchParams,
  halls: readonly BookingHall[],
): ParsedBookingContext {
  const source = bookingSource(params.get('source'));
  const hall = bookingHallByKey(halls, params.get('hall'));
  const normalizedMenu = normalizeBanquetSelection(params.get('banquetMenu'), params.getAll('salad'));
  const warnings: BookingContextWarning[] = [];
  let selectedBookingType = bookingType(params.get('bookingType'));
  let banquetPackageId = normalizedMenu.packageId;
  let saladIds = normalizedMenu.saladIds;

  if (banquetPackageId) selectedBookingType = 'banquet';

  if (hall && isExactBanquetHall(hall) && selectedBookingType === 'onsite') {
    selectedBookingType = 'banquet';
    warnings.push('onsite-disabled');
  }

  if (hall && banquetPackageId && !hall.banquetMenus.includes(banquetPackageId)) {
    banquetPackageId = null;
    saladIds = [];
    warnings.push('incompatible-menu');
  }

  return {
    source,
    hallKey: hall?.key ?? null,
    bookingType: selectedBookingType,
    banquetPackageId,
    saladIds,
    ref: safeRef(params.get('ref')),
    warnings,
  };
}

export function bookingSourceLabel(source: BookingSource | null): string | null {
  return source === 'hall' ? 'страница зала'
    : source === 'banquet-menu' ? 'банкетное меню'
    : source === 'event' ? 'страница события'
    : source === 'promotion' ? 'страница акции'
    : source === 'home' ? 'главная страница'
    : null;
}
