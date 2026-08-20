export type PublicHallPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  published_at: string | null;
  created_at: string;
  category: string;
  is_published: boolean;
};

export const EXACT_PUBLIC_HALLS = [
  { key: 'emerald', slug: 'izumrudnyj-zal', title: 'Изумрудный зал', capacity: 30, image: '/halls/izumrudnyj-zal.webp', sourceSlugs: ['banketnye-zaly'] },
  { key: 'ruby', slug: 'rubinovyj-zal', title: 'Рубиновый зал', capacity: 18, image: '/halls/rubin.webp', sourceSlugs: ['banketnye-zaly-rubin', 'banketnye-zaly'] },
  { key: 'chocolate', slug: 'shokoladnyj-zal', title: 'Шоколадный зал', capacity: 30, image: '/halls/shokoladnyj-zal.webp', sourceSlugs: ['banketnye-zaly'] },
] as const;

const LEGACY_HALL_SLUGS = new Set(['banketnye-zaly', 'banketnye-zaly-rubin']);
const FALLBACK_CREATED_AT = '2026-08-20T00:00:00.000Z';

export function isLegacyHallSlug(slug: string): boolean {
  return LEGACY_HALL_SLUGS.has(slug);
}

export function isExactPublicHallSlug(slug: string): boolean {
  return EXACT_PUBLIC_HALLS.some((hall) => hall.slug === slug);
}

export function materializePublicHallPost(
  slug: string,
  source: PublicHallPost | null,
): PublicHallPost | null {
  const hall = EXACT_PUBLIC_HALLS.find((item) => item.slug === slug);
  if (!hall) return null;

  return {
    id: `canonical-hall-${hall.key}`,
    slug: hall.slug,
    title: hall.title,
    excerpt: `${hall.title} для банкетов. Ориентировочная вместимость — ${hall.capacity} гостей; нестандартную рассадку подтвердит администратор.`,
    content: source?.content ?? null,
    image_url: hall.image,
    published_at: source?.published_at ?? null,
    created_at: source?.created_at ?? FALLBACK_CREATED_AT,
    category: 'halls',
    is_published: true,
  };
}

export function expandPublicHallPosts(posts: readonly PublicHallPost[]): PublicHallPost[] {
  const ordinaryPosts = posts.filter((post) => (
    !isLegacyHallSlug(post.slug) && !isExactPublicHallSlug(post.slug)
  ));

  const exactPosts = EXACT_PUBLIC_HALLS.map((hall) => {
    const existingCanonical = posts.find((post) => post.slug === hall.slug) ?? null;
    const preferredSource = hall.sourceSlugs
      .map((sourceSlug) => posts.find((post) => post.slug === sourceSlug) ?? null)
      .find((post): post is PublicHallPost => post !== null) ?? null;

    return materializePublicHallPost(hall.slug, existingCanonical ?? preferredSource)!;
  });

  return [...ordinaryPosts, ...exactPosts];
}
