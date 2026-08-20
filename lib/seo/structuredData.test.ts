import { describe, expect, it } from 'vitest';
import * as structuredData from './structuredData';

describe('structured data builders', () => {
    it('builds absolute, ordered breadcrumb items', () => {
        const build = (structuredData as Record<string, unknown>).buildBreadcrumbJsonLd;
        expect(typeof build).toBe('function');

        const schema = (build as Function)([
            { name: 'Главная', path: '/' },
            { name: 'Залы', path: '/halls' },
        ]);

        expect(schema).toEqual({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://kucherandconga.ru/' },
                { '@type': 'ListItem', position: 2, name: 'Залы', item: 'https://kucherandconga.ru/halls' },
            ],
        });
    });

    it('turns visible questions and answers into FAQPage data', () => {
        const build = (structuredData as Record<string, unknown>).buildFaqJsonLd;
        expect(typeof build).toBe('function');

        const schema = (build as Function)([
            { question: 'Как забронировать стол?', answer: 'Оставьте заявку на странице бронирования.' },
        ]);

        expect(schema.mainEntity).toEqual([
            {
                '@type': 'Question',
                name: 'Как забронировать стол?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Оставьте заявку на странице бронирования.',
                },
            },
        ]);
    });

    it('connects a hall page to the restaurant entity', () => {
        const build = (structuredData as Record<string, unknown>).buildHallJsonLd;
        expect(typeof build).toBe('function');

        const schema = (build as Function)(
            {
                title: 'Рубиновый зал',
                excerpt: 'Отдельный зал для камерных банкетов.',
                image_url: '/halls/rubin.webp',
            },
            'rubin',
        );

        expect(schema).toEqual(
            expect.objectContaining({
                '@type': 'Place',
                name: 'Рубиновый зал',
                url: 'https://kucherandconga.ru/halls/rubin',
                containedInPlace: { '@id': 'https://kucherandconga.ru/#restaurant' },
            }),
        );
    });
});
