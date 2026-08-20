import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/font/google', () => ({
    Vollkorn: () => ({ variable: '--font-display' }),
    Golos_Text: () => ({ variable: '--font-body' }),
}));

import RootLayout, { metadata } from './layout';

function findJsonLd(node: React.ReactNode): string[] {
    if (!React.isValidElement(node)) return [];

    const element = node as React.ReactElement<{
        children?: React.ReactNode;
        type?: string;
        dangerouslySetInnerHTML?: { __html: string };
    }>;
    const own =
        element.type === 'script' && element.props.type === 'application/ld+json'
            ? [element.props.dangerouslySetInnerHTML?.__html || '']
            : [];

    return own.concat(React.Children.toArray(element.props.children).flatMap(findJsonLd));
}

describe('root SEO metadata', () => {
    it('publishes a connected restaurant entity with hours and official profiles', () => {
        const tree = RootLayout({ children: React.createElement('main') });
        const schemas = findJsonLd(tree).map((value) => JSON.parse(value));
        const graph = schemas.flatMap((schema) => schema['@graph'] || []);
        const restaurant = graph.find((item) => item['@id']?.endsWith('/#restaurant'));
        const website = graph.find((item) => item['@type'] === 'WebSite');

        expect(restaurant).toEqual(
            expect.objectContaining({
                '@type': 'Restaurant',
                acceptsReservations: true,
                hasMenu: expect.stringMatching(/\/menu$/),
                openingHoursSpecification: expect.any(Array),
                sameAs: expect.arrayContaining([
                    expect.stringContaining('yandex.ru/maps/org/'),
                    expect.stringContaining('vk.com/'),
                ]),
            }),
        );
        expect(website).toEqual(expect.objectContaining({ publisher: { '@id': restaurant['@id'] } }));
    });

    it('sets complete social preview metadata', () => {
        expect(metadata.openGraph).toEqual(expect.objectContaining({ locale: 'ru_RU', type: 'website' }));
        expect(metadata.twitter).toEqual(expect.objectContaining({ card: 'summary_large_image' }));
    });
});
