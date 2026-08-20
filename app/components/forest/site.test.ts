import { describe, expect, it } from 'vitest';
import { NAV } from './site';

describe('public navigation', () => {
    it('links to the factual FAQ page for visitors and crawlers', () => {
        expect(NAV).toContainEqual({ href: '/faq', label: 'Вопросы и ответы' });
    });
});
