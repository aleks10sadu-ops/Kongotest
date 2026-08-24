import { describe, expect, it } from 'vitest';
import { evaluateOrderRules } from './orderRules';

const msk = (iso: string) => new Date(`${iso}+03:00`);
const dish = { id: 'dish', qty: 1, price: 1000 };

describe('evaluateOrderRules', () => {
  it('treats a missing discriminator as delivery and requires its address', () => {
    expect(evaluateOrderRules({
      fulfillmentType: undefined,
      address: '',
      items: [dish],
      zone: null,
      deliveryTime: 'asap',
      now: msk('2026-07-13T12:30:00'),
    })).toMatchObject({ ok: false, status: 400, error: 'address_required' });
  });

  it('rejects unknown fulfillment types', () => {
    expect(evaluateOrderRules({
      fulfillmentType: 'table',
      address: '',
      items: [dish],
      zone: null,
      deliveryTime: 'asap',
      now: msk('2026-07-13T12:30:00'),
    })).toMatchObject({ ok: false, status: 400, error: 'invalid_fulfillment_type' });
  });

  it('rejects an unknown timing mode even when a timestamp is present', () => {
    expect(evaluateOrderRules({
      fulfillmentType: 'pickup',
      address: '',
      items: [dish],
      zone: null,
      deliveryTime: 'later' as never,
      deliveryTimeCustom: '2026-07-13T13:00:00',
      now: msk('2026-07-12T12:00:00'),
    })).toMatchObject({ ok: false, status: 400, error: 'invalid_order_time_mode' });
  });

  it('allows pickup from 1000 RUB without an address', () => {
    expect(evaluateOrderRules({
      fulfillmentType: 'pickup',
      address: '',
      items: [dish],
      zone: null,
      deliveryTime: 'asap',
      now: msk('2026-07-13T12:30:00'),
    })).toMatchObject({ ok: true, fulfillmentType: 'pickup', completeBefore: null });
  });

  it('allows pickup with two business lunches below 1000 RUB', () => {
    const lunches = [{ id: 'bl-1', qty: 2, price: 400, isBusinessLunch: true }];
    expect(evaluateOrderRules({
      fulfillmentType: 'pickup',
      address: '',
      items: lunches,
      zone: null,
      deliveryTime: 'asap',
      now: msk('2026-07-13T12:30:00'),
    })).toMatchObject({ ok: true, fulfillmentType: 'pickup' });
  });

  it('rejects pickup below both minimum thresholds', () => {
    expect(evaluateOrderRules({
      fulfillmentType: 'pickup',
      address: '',
      items: [{ ...dish, price: 999 }],
      zone: null,
      deliveryTime: 'asap',
      now: msk('2026-07-13T12:30:00'),
    })).toMatchObject({
      ok: false,
      status: 422,
      error: 'MIN_ORDER',
      message: 'Минимальный заказ на самовывоз — 1 000 ₽ или от 2 бизнес-ланчей.',
    });
  });

  it('checks business lunches against the scheduled moment', () => {
    const lunches = [{ id: 'bl-1', qty: 2, price: 400, isBusinessLunch: true }];
    expect(evaluateOrderRules({
      fulfillmentType: 'pickup',
      address: '',
      items: lunches,
      zone: null,
      deliveryTime: 'custom',
      deliveryTimeCustom: '2026-07-13T15:30:00',
      now: msk('2026-07-12T18:00:00'),
    })).toMatchObject({ ok: true, completeBefore: '2026-07-13 15:30:00.000' });
    expect(evaluateOrderRules({
      fulfillmentType: 'pickup',
      address: '',
      items: lunches,
      zone: null,
      deliveryTime: 'custom',
      deliveryTimeCustom: '2026-07-13T16:00:00',
      now: msk('2026-07-12T18:00:00'),
    })).toMatchObject({ ok: false, status: 409, error: 'business_lunch_closed' });
  });
});
