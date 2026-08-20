import { describe, expect, it } from 'vitest';
import { normalizeBookingHalls } from './hallCatalog';
import { buildBookingHref, parseBookingContext } from './bookingContext';

const halls = normalizeBookingHalls([
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'Conga',
    capacity: 140,
    description: '',
    image: '/halls/conga.webp',
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    name: 'Банкетные залы',
    capacity: 30,
    description: '',
    image: '/halls/banquet.webp',
  },
]);

describe('booking URL context', () => {
  it('builds a deterministic URL for a selected banquet menu and salads', () => {
    expect(buildBookingHref({
      source: 'banquet-menu',
      bookingType: 'banquet',
      banquetPackageId: 'kucher-5000',
      saladIds: ['caesar-shrimp', 'kucher', 'olivier-beef'],
    })).toContain('source=banquet-menu&bookingType=banquet&banquetMenu=kucher-5000');
  });

  it('builds and parses a deterministic banquet-menu URL', () => {
    const href = buildBookingHref({
      source: 'banquet-menu',
      bookingType: 'banquet',
      banquetPackageId: 'conga-6000',
      saladIds: ['caesar-shrimp', 'kucher', 'olivier-beef'],
    });

    expect(href).toBe('/booking?source=banquet-menu&bookingType=banquet&banquetMenu=conga-6000&salad=caesar-shrimp&salad=kucher&salad=olivier-beef');
    expect(parseBookingContext(new URLSearchParams(href.split('?')[1]), halls)).toEqual({
      source: 'banquet-menu',
      hallKey: null,
      bookingType: 'banquet',
      banquetPackageId: 'conga-6000',
      saladIds: ['caesar-shrimp', 'kucher', 'olivier-beef'],
      ref: null,
      warnings: [],
    });
  });

  it('ignores hostile and obsolete parameters', () => {
    expect(parseBookingContext(new URLSearchParams(
      'source=hall&hall=missing&bookingType=onsite&banquetMenu=unknown&salad=unknown&ref=../../phone',
    ), halls)).toEqual({
      source: 'hall',
      hallKey: null,
      bookingType: 'onsite',
      banquetPackageId: null,
      saladIds: [],
      ref: null,
      warnings: [],
    });
  });

  it('drops an unsafe ref while preserving its valid source', () => {
    expect(buildBookingHref({ source: 'event', ref: '../../phone' })).toBe('/booking?source=event');
  });

  it('normalizes disabled onsite booking in exact banquet halls', () => {
    expect(parseBookingContext(
      new URLSearchParams('source=hall&hall=emerald&bookingType=onsite'),
      halls,
    )).toEqual(expect.objectContaining({
      hallKey: 'emerald',
      bookingType: 'banquet',
      warnings: ['onsite-disabled'],
    }));
  });

  it('preserves the disabled-onsite warning when a compatible menu also forces banquet', () => {
    expect(parseBookingContext(new URLSearchParams(
      'hall=emerald&bookingType=onsite&banquetMenu=conga-6000&salad=caesar-shrimp',
    ), halls)).toEqual(expect.objectContaining({
      bookingType: 'banquet',
      warnings: ['onsite-disabled'],
    }));
  });

  it('clears banquet menus incompatible with the selected hall', () => {
    expect(parseBookingContext(new URLSearchParams(
      'source=banquet-menu&hall=conga&bookingType=banquet&banquetMenu=kucher-5000&salad=caesar-shrimp',
    ), halls)).toEqual(expect.objectContaining({
      hallKey: 'conga',
      banquetPackageId: null,
      saladIds: [],
      warnings: ['incompatible-menu'],
    }));
  });
});
