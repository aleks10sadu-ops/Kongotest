import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createSiteDelivery: vi.fn(),
  createSiteOrder: vi.fn(),
  resolveStreetFromAddress: vi.fn(),
  stripHouse: vi.fn(),
  getStopListProductIds: vi.fn(),
  checkDeliveryZoneForCoords: vi.fn(),
  findZoneByName: vi.fn(),
  logOrderAttempt: vi.fn(),
}));

vi.mock('@/lib/iiko/orders', () => ({
  createSiteDelivery: mocks.createSiteDelivery,
  createSiteOrder: mocks.createSiteOrder,
}));
vi.mock('@/lib/iiko/streets', () => ({
  resolveStreetFromAddress: mocks.resolveStreetFromAddress,
  stripHouse: mocks.stripHouse,
}));
vi.mock('@/lib/iiko/stopList', () => ({ getStopListProductIds: mocks.getStopListProductIds }));
vi.mock('@/app/data/deliveryZones', () => ({
  checkDeliveryZoneForCoords: mocks.checkDeliveryZoneForCoords,
  findZoneByName: mocks.findZoneByName,
}));
vi.mock('@/lib/delivery/orderLog', () => ({ logOrderAttempt: mocks.logOrderAttempt }));

import { POST } from './route';

const makeReq = (body: unknown) => new Request('http://localhost/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

describe('POST /api/orders fulfillment boundary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-12T15:00:00Z'));
    vi.clearAllMocks();
    mocks.createSiteOrder.mockResolvedValue({ orderId: 'order-1' });
    mocks.getStopListProductIds.mockResolvedValue(new Set());
    mocks.logOrderAttempt.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates scheduled pickup from server totals without courier address or zone work', async () => {
    const response = await POST(makeReq({
      fulfillmentType: 'pickup',
      name: 'Анна',
      phone: '8 916 111-22-33',
      address: '',
      coordinates: [56.34, 37.52],
      zoneName: 'Зона 600₽',
      items: [{
        id: 'bl-1',
        name: 'Бизнес-ланч',
        qty: 2,
        price: 400,
        productId: 'dish-guid',
        isBusinessLunch: true,
      }],
      subtotal: 1,
      deliveryPrice: 600,
      total: 99999,
      deliveryTime: 'custom',
      deliveryTimeCustom: '2026-07-13T15:30:00',
    }) as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, orderId: 'order-1' });
    expect(mocks.createSiteOrder).toHaveBeenCalledWith(expect.objectContaining({
      fulfillmentType: 'pickup',
      phone: '+79161112233',
      completeBefore: '2026-07-13 15:30:00.000',
      comment: expect.stringContaining('Итого: 800 ₽'),
    }));
    expect(mocks.createSiteOrder.mock.calls[0][0].comment).not.toContain('99999');
    expect(mocks.createSiteOrder.mock.calls[0][0]).not.toHaveProperty('address');
    expect(mocks.checkDeliveryZoneForCoords).not.toHaveBeenCalled();
    expect(mocks.findZoneByName).not.toHaveBeenCalled();
    expect(mocks.resolveStreetFromAddress).not.toHaveBeenCalled();
    expect(mocks.logOrderAttempt).toHaveBeenLastCalledWith(expect.objectContaining({
      outcome: 'iiko_ok',
      address: 'Самовывоз: Дмитров, Промышленная улица, 20Б',
      subtotal: 800,
      total: 800,
    }));
  });

  it('returns HTTP 400 for an unknown fulfillment type before external calls', async () => {
    const response = await POST(makeReq({
      fulfillmentType: 'table',
      name: 'Анна',
      phone: '+79161112233',
      address: 'Дмитров, Промышленная улица, 20Б',
      items: [{ id: 'dish', name: 'Блюдо', qty: 1, price: 1000, productId: 'dish-guid' }],
      deliveryTime: 'custom',
      deliveryTimeCustom: '2026-07-13T15:30:00',
    }) as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: 'invalid_fulfillment_type',
    });
    expect(mocks.getStopListProductIds).not.toHaveBeenCalled();
    expect(mocks.createSiteOrder).not.toHaveBeenCalled();
  });
});
