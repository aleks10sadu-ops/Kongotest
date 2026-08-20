import { describe, expect, it } from 'vitest';
import { buildMessage } from './route';

describe('telegram booking API message boundary', () => {
  it('passes a separate event ref into the escaped Telegram source line', () => {
    const message = buildMessage({
      type: 'booking',
      name: 'Анна Иванова',
      firstName: 'Анна',
      lastName: 'Иванова',
      phone: '+7 999 111-22-33',
      date: '2026-08-20',
      time: '19:00',
      adults: 2,
      children: 0,
      bookingType: 'onsite',
      hallName: null,
      cartItems: [],
      cartFoodSum: 0,
      source: 'страница события',
      sourceRef: '<jazz&vecher>',
    });

    expect(message).toContain('Источник: страница события — &lt;jazz&amp;vecher&gt;');
    expect(message.match(/^Источник:/gm)).toHaveLength(1);
  });
});
