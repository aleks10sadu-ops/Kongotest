import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HallsClient from './HallsClient';

describe('HallsClient search intent', () => {
    it('uses the local banquet-hall query in the visible heading', () => {
        const html = renderToStaticMarkup(
            React.createElement(HallsClient, { initialPosts: [] }),
        );

        expect(html).toMatch(/<h1[^>]*>Банкетные залы в Дмитрове<\/h1>/);
    });
});
