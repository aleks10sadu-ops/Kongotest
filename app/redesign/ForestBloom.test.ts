import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SectionsMenuLinks } from './ForestBloom';

describe('ForestBloom sections menu', () => {
    it('renders a link to the FAQ page', () => {
        const html = renderToStaticMarkup(
            React.createElement(SectionsMenuLinks, { onNavigate: () => undefined }),
        );

        expect(html).toContain('href="/faq"');
        expect(html).toContain('Вопросы и ответы');
    });
});
