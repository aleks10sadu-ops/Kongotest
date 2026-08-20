import { describe, expect, it } from 'vitest';
import { normalizeBookingHalls } from './hallCatalog';

const sharedCrmId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

describe('normalizeBookingHalls', () => {
  it('splits the generic CRM banquet hall into three exact public halls', () => {
    const halls = normalizeBookingHalls([{
      id: sharedCrmId,
      name: 'Банкетные залы',
      capacity: 30,
      description: 'Банкетный комплекс',
      image: '/halls/banquet.webp',
    }]);

    expect(halls.map(({ key, name, capacity, minimumOrder, crmHallId }) => ({
      key, name, capacity, minimumOrder, crmHallId,
    }))).toEqual([
      { key: 'emerald', name: 'Изумрудный зал', capacity: 30, minimumOrder: 70000, crmHallId: sharedCrmId },
      { key: 'ruby', name: 'Рубиновый зал', capacity: 18, minimumOrder: 45000, crmHallId: sharedCrmId },
      { key: 'chocolate', name: 'Шоколадный зал', capacity: 30, minimumOrder: 70000, crmHallId: sharedCrmId },
    ]);
  });

  it('uses distinct UI keys while keeping the same CRM id and allowed types', () => {
    const halls = normalizeBookingHalls([{
      id: sharedCrmId, name: 'Банкетные залы', capacity: 30,
      description: '', image: '/halls/banquet.webp',
    }]);
    expect(new Set(halls.map((hall) => hall.key)).size).toBe(3);
    expect(new Set(halls.map((hall) => hall.crmHallId))).toEqual(new Set([sharedCrmId]));
    expect(halls.every((hall) => hall.allowedBookingTypes.join(',') === 'preorder,banquet')).toBe(true);
    expect(halls.every((hall) => hall.defaultBookingType === 'banquet')).toBe(true);
  });

  it('moves the raw source id into sourceHallId', () => {
    const [hall] = normalizeBookingHalls([{
      id: sharedCrmId, name: 'Банкетные залы', capacity: 30,
      description: '', image: '/halls/banquet.webp',
    }]);

    expect(hall).toMatchObject({ sourceHallId: sharedCrmId, crmHallId: sharedCrmId });
    expect(hall).not.toHaveProperty('id');
  });

  it('allows only 6000/7500 in Conga and all menus in other halls', () => {
    const halls = normalizeBookingHalls([
      { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', name: 'Conga', capacity: 140, description: '', image: '/halls/conga.webp' },
      { id: 'marine-id', name: 'Морской зал', capacity: 52, description: '', image: '/halls/morskoy.webp' },
    ]);
    expect(halls.find((hall) => hall.key === 'conga')?.banquetMenus).toEqual(['conga-7500', 'conga-6000']);
    expect(halls.find((hall) => hall.key === 'marine')?.banquetMenus).toEqual(['conga-7500', 'conga-6000', 'kucher-5000']);
  });
});
