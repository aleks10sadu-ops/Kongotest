import { describe, expect, it } from 'vitest';
import { resolveMenuDeepLink } from './deepLink';

const menu = {
    main: { categories: [{ id: 'soups' }] },
    business: { categories: [{ id: 'lunch-set' }] },
    kids: { categories: [{ id: 'kids-main' }] },
};

describe('menu deep links', () => {
    it.each([
        ['#main', 'main'],
        ['#business', 'business'],
        ['#bar', 'bar'],
        ['#wine', 'wine'],
        ['#kids', 'kids'],
        ['#banquet', 'banquet'],
    ])('opens %s in its matching menu section', (hash, expected) => {
        expect(resolveMenuDeepLink(hash, menu, 'main')).toBe(expected);
    });

    it('falls back when the requested section does not exist', () => {
        expect(resolveMenuDeepLink('#missing', menu, 'main')).toBe('main');
    });
});
