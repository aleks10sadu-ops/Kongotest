import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const { getFullMenuMock } = vi.hoisted(() => ({
    getFullMenuMock: vi.fn(async () => ({
        main: {
            categories: [
                {
                    id: 'grill',
                    name: 'Мангал',
                    items: [
                        { id: 'shashlik', name: 'Шашлык из свинины', description: 'На углях', price: 690 },
                        { id: 'khinkali', name: 'Хинкали', description: 'Три штуки', price: 480 },
                    ],
                },
            ],
        },
    })),
}));

vi.mock('@/lib/menu/getFullMenu', () => ({ getFullMenu: getFullMenuMock }));

import DeliveryPage, { metadata as deliveryMetadata } from './delivery/page';
import BusinessLunchPage, { metadata as businessLunchMetadata } from './business-lunch/page';

describe('local-search landing pages', () => {
    it('renders a canonical delivery page with factual order conditions', () => {
        const html = renderToStaticMarkup(React.createElement(DeliveryPage));

        expect(deliveryMetadata.alternates).toMatchObject({ canonical: '/delivery' });
        expect(html).toMatch(/<h1[^>]*>Доставка еды в Дмитрове<\/h1>/);
        expect(html).toContain('Пн–Чт: 12:00–21:45');
        expect(html).toContain('href="/menu#delivery"');
        expect(html).toContain('href="/khinkali-dmitrov"');
        expect(html).toContain('href="/shashlyk-dmitrov"');
        expect(html).toContain('application/ld+json');
    });

    it('renders a canonical business-lunch page that leads to the constructor', () => {
        const html = renderToStaticMarkup(React.createElement(BusinessLunchPage));

        expect(businessLunchMetadata.alternates).toMatchObject({ canonical: '/business-lunch' });
        expect(html).toMatch(/<h1[^>]*>Бизнес-ланч в Дмитрове<\/h1>/);
        expect(html).toContain('по будням с 12:00 до 16:00');
        expect(html).toContain('href="/menu#business"');
    });

    it.each([
        {
            name: 'шашлык',
            load: () => import('./shashlyk-dmitrov/page'),
            canonical: '/shashlyk-dmitrov',
            heading: 'Шашлык в Дмитрове',
            dish: 'Шашлык из свинины',
            orderHref: '/menu?category=shashlyk#delivery',
        },
        {
            name: 'хинкали',
            load: () => import('./khinkali-dmitrov/page'),
            canonical: '/khinkali-dmitrov',
            heading: 'Хинкали в Дмитрове',
            dish: 'Хинкали',
            orderHref: '/menu?category=khinkali#delivery',
        },
    ])('renders live menu items on the $name landing page', async ({ load, canonical, heading, dish, orderHref }) => {
        const pageModule = await load().catch(() => null);

        expect(pageModule).not.toBeNull();
        if (!pageModule) return;

        const html = renderToStaticMarkup(await pageModule.default());

        expect(pageModule.metadata.alternates).toMatchObject({ canonical });
        expect(html).toMatch(new RegExp(`<h1[^>]*>${heading}</h1>`));
        expect(html).toContain(dish);
        expect(html).toContain('application/ld+json');
        expect(html).toContain(`href="${orderHref}"`);
        expect(pageModule.dynamic).toBe('force-static');
    });

});
