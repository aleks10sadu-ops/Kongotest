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
import ShashlykPage, { dynamic as shashlykDynamic, metadata as shashlykMetadata } from './menu/shashlyk/page';
import KhinkaliPage, { dynamic as khinkaliDynamic, metadata as khinkaliMetadata } from './menu/khinkali/page';

describe('local-search landing pages', () => {
    it('renders a canonical delivery page with factual order conditions', () => {
        const html = renderToStaticMarkup(React.createElement(DeliveryPage));

        expect(deliveryMetadata.alternates).toMatchObject({ canonical: '/delivery' });
        expect(html).toMatch(/<h1[^>]*>Доставка еды в Дмитрове<\/h1>/);
        expect(html).toContain('Пн–Чт: 12:00–21:45');
        expect(html).toContain('href="/menu#delivery"');
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
        ['шашлык', ShashlykPage, shashlykMetadata, '/menu/shashlyk', 'Шашлык в Дмитрове', 'Шашлык из свинины', '/menu?search=%D1%88%D0%B0%D1%88%D0%BB%D1%8B%D0%BA#delivery'],
        ['хинкали', KhinkaliPage, khinkaliMetadata, '/menu/khinkali', 'Хинкали в Дмитрове', 'Хинкали', '/menu?search=%D1%85%D0%B8%D0%BD%D0%BA%D0%B0%D0%BB%D0%B8#delivery'],
    ])('renders live menu items on the %s landing page', async (_name, Page, metadata, canonical, heading, dish, orderHref) => {
        const html = renderToStaticMarkup(await Page());

        expect(metadata.alternates).toMatchObject({ canonical });
        expect(html).toContain(`<h1 class="font-display text-[clamp(2.4rem,6vw,4.4rem)] font-black leading-[1.04]">${heading}</h1>`);
        expect(html).toContain(dish);
        expect(html).toContain('application/ld+json');
        expect(html).toContain(`href="${orderHref}"`);
    });

    it('pre-renders dish landings and refreshes them through ISR', () => {
        expect(shashlykDynamic).toBe('force-static');
        expect(khinkaliDynamic).toBe('force-static');
    });
});
