import { describe, expect, it } from 'vitest';
import {
  expandPublicHallPosts,
  materializePublicHallPost,
  type PublicHallPost,
} from './publicHallPosts';

const post = (overrides: Partial<PublicHallPost>): PublicHallPost => ({
  id: 'post-id',
  slug: 'hall',
  title: 'Зал',
  excerpt: null,
  content: null,
  image_url: null,
  published_at: null,
  created_at: '2026-08-20T00:00:00.000Z',
  category: 'halls',
  is_published: true,
  ...overrides,
});

describe('public hall posts', () => {
  it('replaces legacy banquet posts with three canonical public halls', () => {
    const posts = expandPublicHallPosts([
      post({ id: 'generic', slug: 'banketnye-zaly', title: 'Банкетные залы', image_url: '/halls/banquet.webp' }),
      post({ id: 'ruby-old', slug: 'banketnye-zaly-rubin', title: 'Рубиновый зал' }),
      post({ id: 'conga', slug: 'conga', title: 'Conga' }),
    ]);

    expect(posts.map((item) => item.slug)).toEqual([
      'conga',
      'izumrudnyj-zal',
      'rubinovyj-zal',
      'shokoladnyj-zal',
    ]);
    expect(posts.find((item) => item.slug === 'rubinovyj-zal')).toEqual(expect.objectContaining({
      title: 'Рубиновый зал',
      image_url: '/halls/rubin.webp',
    }));
  });

  it('materializes exact halls even when content storage is unavailable', () => {
    expect(materializePublicHallPost('izumrudnyj-zal', null)).toEqual(expect.objectContaining({
      title: 'Изумрудный зал',
      excerpt: expect.stringContaining('30'),
      image_url: '/halls/izumrudnyj-zal.webp',
    }));
  });

  it('is idempotent and keeps ordinary halls exactly once', () => {
    const expanded = expandPublicHallPosts([
      post({ id: 'conga', slug: 'conga', title: 'Conga' }),
      post({ id: 'generic', slug: 'banketnye-zaly', title: 'Банкетные залы' }),
    ]);

    expect(expandPublicHallPosts(expanded).map((item) => item.slug)).toEqual(
      expanded.map((item) => item.slug),
    );
  });
});
