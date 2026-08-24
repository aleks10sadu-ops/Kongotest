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

describe('telegram delivery fallback formatting', () => {
  it('formats pickup without a courier address', () => {
    const message = buildMessage({
      type: 'delivery',
      fulfillmentType: 'pickup',
      name: 'Анна',
      phone: '+79161112233',
      address: '',
      items: [{ name: 'Пицца', qty: 1, price: 1000 }],
      total: 1000,
      deliveryTime: 'custom',
      deliveryTimeCustom: '2026-07-17T19:30:00',
      paymentMethod: 'card',
    });

    expect(message).toContain('Заявка: Самовывоз');
    expect(message).toContain('Дмитров, Промышленная улица, 20Б');
    expect(message).toContain('17 июля 2026 г. в 19:30');
    expect(message).not.toContain('<b>Адрес доставки:</b>');
  });

  it('keeps a legacy payload formatted as delivery', () => {
    const message = buildMessage({
      type: 'delivery',
      name: 'Анна',
      phone: '+79161112233',
      address: 'Профессиональная, 1',
      items: [],
      total: 0,
      deliveryTime: 'asap',
      paymentMethod: 'card',
    });

    expect(message).toContain('Заявка: Доставка');
    expect(message).toContain('<b>Адрес доставки:</b> Профессиональная, 1');
  });
});
