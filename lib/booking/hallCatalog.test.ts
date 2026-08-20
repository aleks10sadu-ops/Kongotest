import { describe, expect, it } from 'vitest';
import {
  bookingHallForLegacyEditor,
  isBookingHallEditable,
  normalizeBookingHalls,
} from './hallCatalog';
import type { Hall } from '../halls/halls-data';

const sharedCrmId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

const genericBanquetHall: Hall = {
  id: sharedCrmId,
  name: 'Банкетные залы',
  capacity: 30,
  description: 'Общий контент банкетных залов',
  image: '/halls/banquet.webp',
  dbId: 'generic-content-id',
};

const legacyExactHalls: Hall[] = [
  {
    id: 'legacy-chocolate',
    name: 'Шоколадный зал',
    capacity: 25,
    description: 'Старый Шоколад',
    image: '/halls/chocolate-old.webp',
  },
  {
    id: 'legacy-ruby',
    name: 'Рубиновый зал',
    capacity: 12,
    description: 'Старый Рубин',
    image: '/halls/ruby-old.webp',
  },
  {
    id: 'legacy-emerald',
    name: 'Изумрудный зал',
    capacity: 20,
    description: 'Старый Изумруд',
    image: '/halls/emerald-old.webp',
  },
];

describe('normalizeBookingHalls', () => {
  it('splits the generic CRM banquet hall into three exact public halls', () => {
    const halls = normalizeBookingHalls([{
      id: sharedCrmId,
      name: 'Банкетные залы',
      capacity: 30,
      description: 'Банкетный комплекс',
      image: '/halls/banquet.webp',
    }]);

    expect(halls.map(({ key, name, capacity, minimumOrder, crmHallId, image }) => ({
      key, name, capacity, minimumOrder, crmHallId, image,
    }))).toEqual([
      { key: 'emerald', name: 'Изумрудный зал', capacity: 30, minimumOrder: 70000, crmHallId: sharedCrmId, image: '/halls/izumrudnyj-zal.webp' },
      { key: 'ruby', name: 'Рубиновый зал', capacity: 18, minimumOrder: 45000, crmHallId: sharedCrmId, image: '/halls/rubin.webp' },
      { key: 'chocolate', name: 'Шоколадный зал', capacity: 30, minimumOrder: 70000, crmHallId: sharedCrmId, image: '/halls/shokoladnyj-zal.webp' },
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

  it.each([
    [genericBanquetHall, ...legacyExactHalls],
    [...legacyExactHalls].reverse().concat(genericBanquetHall),
  ])('deduplicates generic and legacy exact rows in deterministic exact-hall order', (...input) => {
    const halls = normalizeBookingHalls(input);

    expect(halls.map((hall) => hall.key)).toEqual(['emerald', 'ruby', 'chocolate']);
    expect(new Set(halls.map((hall) => hall.key)).size).toBe(3);
    expect(halls.map((hall) => hall.crmHallId)).toEqual([sharedCrmId, sharedCrmId, sharedCrmId]);
    expect(halls.map((hall) => hall.sourceHallId)).toEqual([sharedCrmId, sharedCrmId, sharedCrmId]);
  });

  it('applies the exact Ruby policy when only a legacy exact-name row exists', () => {
    const [ruby] = normalizeBookingHalls([legacyExactHalls[1]]);

    expect(ruby).toMatchObject({
      key: 'ruby',
      name: 'Рубиновый зал',
      capacity: 18,
      minimumOrder: 45000,
      defaultBookingType: 'banquet',
      crmHallId: null,
    });
    expect(ruby.allowedBookingTypes).toEqual(['preorder', 'banquet']);
    expect(ruby.banquetMenus).toEqual(['conga-7500', 'conga-6000', 'kucher-5000']);
  });

  it('keeps all exact virtual halls out of the legacy editor while ordinary halls remain editable', () => {
    const halls = normalizeBookingHalls([
      genericBanquetHall,
      {
        id: 'marine-id',
        name: 'Морской зал',
        capacity: 52,
        description: 'Морской контент',
        image: '/halls/morskoy.webp',
        dbId: 'marine-content-id',
      },
    ]);
    const exactHalls = halls.filter((hall) => ['emerald', 'ruby', 'chocolate'].includes(hall.key));
    const marine = halls.find((hall) => hall.key === 'marine');

    expect(exactHalls).toHaveLength(3);
    expect(exactHalls.every((hall) => !isBookingHallEditable(hall))).toBe(true);
    expect(exactHalls.map(bookingHallForLegacyEditor)).toEqual([null, null, null]);
    expect(isBookingHallEditable(marine)).toBe(true);
    expect(bookingHallForLegacyEditor(marine)).toEqual(expect.objectContaining({
      id: 'marine-id',
      name: 'Морской зал',
      dbId: 'marine-content-id',
    }));
  });
});
