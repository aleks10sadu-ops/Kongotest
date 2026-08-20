import { describe, expect, it } from 'vitest';
import { readMenuSearch, resolveMenuDeepLink } from './deepLink';

const menu = {
    main: { categories: [{ id: 'soups' }] },
    business: { categories: [{ id: 'lunch-set' }] },
    kids: { categories: [{ id: 'kids-main' }] },
};

describe('menu deep links', () => {
    it.each([
        ['#main', 'main'],
        ['#delivery', 'delivery'],
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

    it('keeps the delivery deep link available while the live menu refreshes', () => {
        expect(resolveMenuDeepLink('#delivery', {}, 'main')).toBe('delivery');
    });

    it('reads a targeted dish search only for the delivery section', () => {
        expect(readMenuSearch('?search=%D1%88%D0%B0%D1%88%D0%BB%D1%8B%D0%BA', 'delivery')).toBe('шашлык');
        expect(readMenuSearch('?search=%D1%85%D0%B8%D0%BD%D0%BA%D0%B0%D0%BB%D0%B8', 'main')).toBe('');
    });
});
