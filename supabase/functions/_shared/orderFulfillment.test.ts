import { describe, expect, it } from 'vitest';
import { confirmationReminderDue, iikoFulfillmentPresentation } from './orderFulfillment';

describe('iikoFulfillmentPresentation', () => {
  it('identifies client pickup', () => {
    expect(iikoFulfillmentPresentation({ orderServiceType: 'DeliveryByClient' })).toEqual({
      type: 'pickup',
      emoji: '🛒',
      noun: 'самовывоз',
      pickupAddress: 'Дмитров, Промышленная улица, 20Б',
    });
  });

  it('also reads the service type nested in older iiko event shapes', () => {
    expect(iikoFulfillmentPresentation({ orderType: { orderServiceType: 'DeliveryByClient' } }))
      .toMatchObject({ type: 'pickup' });
  });

  it('defaults unknown and old events to courier delivery', () => {
    expect(iikoFulfillmentPresentation({})).toMatchObject({
      type: 'delivery',
      emoji: '🚚',
      noun: 'доставка',
    });
  });
});

describe('confirmationReminderDue', () => {
  it('keeps the main card immediate but delays a future Monday reminder until 12:00 Moscow', () => {
    const input = {
      completeBefore: '2026-07-13 19:30:00.000',
      notifiedAt: '2026-07-12T15:00:00.000Z',
    };

    expect(confirmationReminderDue({ ...input, now: new Date('2026-07-13T08:59:59.000Z') })).toBe(false);
    expect(confirmationReminderDue({ ...input, now: new Date('2026-07-13T09:00:00.000Z') })).toBe(true);
  });

  it('opens Sunday reminders at 13:00 Moscow', () => {
    const input = {
      completeBefore: '2026-07-19 19:30:00.000',
      notifiedAt: '2026-07-18T15:00:00.000Z',
    };

    expect(confirmationReminderDue({ ...input, now: new Date('2026-07-19T09:59:59.000Z') })).toBe(false);
    expect(confirmationReminderDue({ ...input, now: new Date('2026-07-19T10:00:00.000Z') })).toBe(true);
  });

  it('retains seven minutes for ASAP and for orders created after opening', () => {
    expect(confirmationReminderDue({
      completeBefore: null,
      notifiedAt: '2026-07-13T09:00:00.000Z',
      now: new Date('2026-07-13T09:07:00.000Z'),
    })).toBe(true);
    expect(confirmationReminderDue({
      completeBefore: '2026-07-13 19:30:00.000',
      notifiedAt: '2026-07-13T10:00:00.000Z',
      now: new Date('2026-07-13T10:06:59.000Z'),
    })).toBe(false);
  });
});
