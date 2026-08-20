import { expect, it, vi } from 'vitest';

vi.mock('react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('react')>()),
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

import * as hallPage from './page';
import { materializePublicHallPost } from '@/lib/halls/publicHallPosts';

it.each([
    ['izumrudnyj-zal', 'Изумрудный зал', 'emerald'],
    ['rubinovyj-zal', 'Рубиновый зал', 'ruby'],
    ['shokoladnyj-zal', 'Шоколадный зал', 'chocolate'],
])('creates canonical metadata and a banquet booking CTA for %s', (slug, title, hallKey) => {
    const post = materializePublicHallPost(slug, null);
    expect(post).not.toBeNull();

    const metadata = hallPage.createHallMetadata(post!, slug);
    expect(metadata).toEqual(expect.objectContaining({
        title: `${title} — банкетный зал · Кучер & Conga`,
        alternates: { canonical: `/halls/${slug}` },
    }));
    expect(hallPage.hallBookingHref(post!.title, slug)).toBe(
        `/booking?source=hall&hall=${hallKey}&bookingType=banquet`,
    );
});
