import { expect, it } from 'vitest';
import { eventBookingHref } from './page';

it('builds a safe event booking context', () => {
    expect(eventBookingHref('jazz-vecher')).toBe('/booking?source=event&ref=jazz-vecher');
    expect(eventBookingHref('../../phone')).toBe('/booking?source=event');
});
