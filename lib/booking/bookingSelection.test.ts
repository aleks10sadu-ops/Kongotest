import { describe, expect, it } from 'vitest';
import { normalizeBookingHalls } from './hallCatalog';
import {
  changeBookingHall,
  createInitialBookingSelection,
  type BookingSelection,
} from './bookingSelection';

const halls = normalizeBookingHalls([
  { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', name: 'Conga', capacity: 140, description: '', image: '/halls/conga.webp' },
  { id: 'marine-id', name: 'Морской зал', capacity: 52, description: '', image: '/halls/morskoy.webp' },
  { id: 'c3d4e5f6-a7b8-9012-cdef-123456789012', name: 'Банкетные залы', capacity: 30, description: '', image: '/halls/banquet.webp' },
]);

describe('booking selection transitions', () => {
  it('initializes hall links in self-service banquet mode once', () => {
    expect(createInitialBookingSelection({
      source: 'hall', hallKey: 'emerald', bookingType: 'banquet',
      banquetPackageId: null, saladIds: [], ref: null, warnings: [],
    }, halls)).toEqual(expect.objectContaining({
      mode: 'self', hallKey: 'emerald', bookingType: 'banquet', adults: 6,
    }));
  });

  it('restores a menu and salads without inventing a hall', () => {
    expect(createInitialBookingSelection({
      source: 'banquet-menu', hallKey: null, bookingType: 'banquet',
      banquetPackageId: 'conga-6000',
      saladIds: ['caesar-shrimp', 'kucher', 'olivier-beef'],
      ref: null, warnings: [],
    }, halls)).toEqual(expect.objectContaining({
      mode: 'self', hallKey: null, bookingType: 'banquet', adults: 6,
      banquetPackageId: 'conga-6000',
      saladIds: ['caesar-shrimp', 'kucher', 'olivier-beef'],
    }));
  });

  it('preserves a compatible menu and clears only Conga-incompatible selection', () => {
    const selected: BookingSelection = {
      mode: 'self', hallKey: 'ruby', bookingType: 'banquet', adults: 10,
      banquetPackageId: 'kucher-5000',
      saladIds: ['caesar-shrimp', 'kucher', 'olivier-beef'], notice: null,
    };

    expect(changeBookingHall(selected, 'marine', halls)).toEqual(expect.objectContaining({
      hallKey: 'marine', banquetPackageId: 'kucher-5000', notice: null,
    }));
    expect(changeBookingHall(selected, 'conga', halls)).toEqual(expect.objectContaining({
      hallKey: 'conga', banquetPackageId: null, saladIds: [], notice: 'incompatible-menu',
    }));
  });

  it('uses empty admin defaults only when every context field is empty', () => {
    expect(createInitialBookingSelection({
      source: null, hallKey: null, bookingType: null, banquetPackageId: null,
      saladIds: [], ref: null, warnings: [],
    }, halls)).toEqual({
      mode: 'admin', hallKey: null, bookingType: 'onsite', adults: 2,
      banquetPackageId: null, saladIds: [], notice: null,
    });
  });

  it('switches an unsupported type to the exact banquet hall default', () => {
    const selected: BookingSelection = {
      mode: 'self', hallKey: 'marine', bookingType: 'onsite', adults: 8,
      banquetPackageId: null, saladIds: [], notice: null,
    };

    expect(changeBookingHall(selected, 'emerald', halls)).toEqual(expect.objectContaining({
      hallKey: 'emerald', bookingType: 'banquet', adults: 8,
    }));
  });
});
