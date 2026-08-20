import { describe, expect, it } from 'vitest';
import type { MenuCategory } from '@/types/index';
import {
    buildMenuLandingJsonLd,
    filterMenuItemsByTerms,
} from './searchLandingPages';

const menu = {
    main: {
        categories: [
            {
                id: 'grill',
                name: 'Мангал',
                items: [
                    { id: 'shashlik', name: 'Шашлык из свинины', description: 'На углях', price: 690 },
                    { id: 'steak', name: 'Стейк', description: 'Говядина', price: 1200 },
                ],
            },
            {
                id: 'georgian',
                name: 'Грузинская кухня',
                items: [
                    { id: 'khinkali', name: 'Хинкали', description: 'Три штуки', price: 480 },
                    { id: 'shashlik', name: 'Шашлык из свинины', description: 'Дубль', price: 690 },
                ],
            },
        ] as MenuCategory[],
    },
};

describe('filterMenuItemsByTerms', () => {
    it('returns matching live menu items without duplicating a product', () => {
        expect(filterMenuItemsByTerms(menu, ['ШАШЛЫК'])).toEqual([
            expect.objectContaining({ id: 'shashlik', name: 'Шашлык из свинины', price: 690 }),
        ]);
    });

    it('does not include unrelated dishes and respects the result limit', () => {
        const result = filterMenuItemsByTerms(menu, ['хинкали', 'стейк'], 1);

        expect(result).toHaveLength(1);
        expect(['Хинкали', 'Стейк']).toContain(result[0].name);
    });
});

describe('buildMenuLandingJsonLd', () => {
    it('describes the canonical category page and its visible dishes', () => {
        const schema = buildMenuLandingJsonLd({
            title: 'Шашлык в Дмитрове',
            path: '/menu/shashlyk',
            description: 'Шашлык из ресторана с доставкой.',
            items: filterMenuItemsByTerms(menu, ['шашлык']),
        });

        expect(schema).toMatchObject({
            '@type': 'CollectionPage',
            name: 'Шашлык в Дмитрове',
            url: 'https://kucherandconga.ru/menu/shashlyk',
            mainEntity: {
                '@type': 'ItemList',
                numberOfItems: 1,
                itemListElement: [
                    expect.objectContaining({
                        position: 1,
                        item: expect.objectContaining({
                            '@type': 'MenuItem',
                            name: 'Шашлык из свинины',
                            offers: expect.objectContaining({ price: 690, priceCurrency: 'RUB' }),
                        }),
                    }),
                ],
            },
        });
    });
});
