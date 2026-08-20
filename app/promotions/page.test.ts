import { expect, it } from 'vitest';
import { promotionBookingHref } from './page';

it('marks the promotion booking source', () => {
    expect(promotionBookingHref()).toBe('/booking?source=promotion&ref=promotions');
});
