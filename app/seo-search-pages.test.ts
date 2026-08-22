import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import DeliveryPage, { metadata as deliveryMetadata } from './delivery/page';
import BusinessLunchPage, { metadata as businessLunchMetadata } from './business-lunch/page';

describe('local-search landing pages', () => {
    it('renders a canonical delivery page with factual order conditions', () => {
        const html = renderToStaticMarkup(React.createElement(DeliveryPage));

        expect(deliveryMetadata.alternates).toMatchObject({ canonical: '/delivery' });
        expect(html).toMatch(/<h1[^>]*>Доставка еды в Дмитрове<\/h1>/);
        expect(html).toContain('Пн–Чт: 12:00–21:45');
        expect(html).toContain('href="/menu#delivery"');
        expect(html).toContain('Хинкали в Дмитрове');
        expect(html).toContain('Шашлык в Дмитрове');
        expect(html).toContain('href="/menu?category=khinkali#delivery"');
        expect(html).toContain('href="/menu?category=shashlyk#delivery"');
        expect(html).not.toContain('href="/khinkali-dmitrov"');
        expect(html).not.toContain('href="/shashlyk-dmitrov"');
        expect(html).toContain('application/ld+json');
    });

    it('renders a canonical business-lunch page that leads to the constructor', () => {
        const html = renderToStaticMarkup(React.createElement(BusinessLunchPage));

        expect(businessLunchMetadata.alternates).toMatchObject({ canonical: '/business-lunch' });
        expect(html).toMatch(/<h1[^>]*>Бизнес-ланч в Дмитрове<\/h1>/);
        expect(html).toContain('по будням с 12:00 до 16:00');
        expect(html).toContain('href="/menu#business"');
    });

});
