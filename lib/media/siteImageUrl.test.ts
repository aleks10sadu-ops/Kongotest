import { beforeAll, describe, expect, it } from 'vitest';
import { toSiteImageUrl } from './siteImageUrl';

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
});

describe('toSiteImageUrl', () => {
  it('rewrites public objects from the configured Supabase project', () => {
    expect(
      toSiteImageUrl(
        'https://project.supabase.co/storage/v1/object/public/content-images/business_lunch_week/week.jpg',
      ),
    ).toBe('/media/supabase/content-images/business_lunch_week/week.jpg');
  });

  it('keeps local, external and already proxied images unchanged', () => {
    expect(toSiteImageUrl('/hero.webp')).toBe('/hero.webp');
    expect(toSiteImageUrl('https://images.example.com/dish.jpg')).toBe(
      'https://images.example.com/dish.jpg',
    );
    expect(toSiteImageUrl('/media/supabase/dish-images/iiko/a.webp')).toBe(
      '/media/supabase/dish-images/iiko/a.webp',
    );
  });

  it('does not proxy another Supabase project', () => {
    expect(
      toSiteImageUrl(
        'https://other.supabase.co/storage/v1/object/public/content-images/a.jpg',
      ),
    ).toBe('https://other.supabase.co/storage/v1/object/public/content-images/a.jpg');
  });
});

