import { describe, expect, it } from 'vitest';
import {
  chunkForIiko,
  confirmationReminderDue,
  iikoFulfillmentPresentation,
  mergeIikoOrderCandidates,
  recentUnclaimedOrderIds,
  statusTrackingPage,
} from './orderFulfillment';

describe('iikoFulfillmentPresentation', () => {
  it('identifies client pickup', () => {
    expect(iikoFulfillmentPresentation({ orderServiceType: 'DeliveryByClient' })).toEqual({
      type: 'pickup',
      emoji: '🛍',
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

describe('poller discovery boundaries', () => {
  it('chunks iiko by-id requests at no more than 200 IDs', () => {
    const ids = Array.from({ length: 401 }, (_, index) => `order-${index + 1}`);

    expect(chunkForIiko(ids)).toEqual([
      ids.slice(0, 200),
      ids.slice(200, 400),
      ids.slice(400),
    ]);
  });

  it('selects unique recent successful order IDs that have no dedup claim', () => {
    expect(recentUnclaimedOrderIds(
      [
        { detail: ' future-order ' },
        { detail: 'claimed-order' },
        { detail: 'future-order' },
        { detail: null },
      ],
      new Set(['claimed-order']),
    )).toEqual(['future-order']);
  });

  it('feeds date and creation-time discoveries through one duplicate-free candidate list', () => {
    const byDate = [{ id: 'same', source: 'date' }, { id: 'date-only', source: 'date' }];
    const byCreation = [{ id: 'same', source: 'log' }, { id: 'future-only', source: 'log' }];

    expect(mergeIikoOrderCandidates(byDate, byCreation)).toEqual([
      { id: 'same', source: 'date' },
      { id: 'date-only', source: 'date' },
      { id: 'future-only', source: 'log' },
    ]);
  });

  it('bounds every status page to at most 200 rows', () => {
    expect(statusTrackingPage(450, 2)).toEqual({
      pageIndex: 2,
      pageCount: 3,
      from: 400,
      to: 449,
    });
    expect(statusTrackingPage(0, 2)).toBeNull();
  });

  it('rotates deterministically through every live status page and wraps', () => {
    expect(statusTrackingPage(450, 0)?.pageIndex).toBe(0);
    expect(statusTrackingPage(450, 1)?.pageIndex).toBe(1);
    expect(statusTrackingPage(450, 2)?.pageIndex).toBe(2);
    expect(statusTrackingPage(450, 3)?.pageIndex).toBe(0);
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
