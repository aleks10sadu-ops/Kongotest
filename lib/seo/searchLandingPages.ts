import { SITE, SITE_URL } from '@/app/components/forest/site';
import type { MenuCategory, MenuItem } from '@/types/index';

type MenuByType = Record<string, { categories?: MenuCategory[] } | undefined>;

const normalizeSearchText = (value: unknown) => String(value ?? '')
    .toLocaleLowerCase('ru-RU')
    .replaceAll('ё', 'е')
    .trim();

export function filterMenuItemsByTerms(
    menu: MenuByType,
    terms: readonly string[],
    limit = 8,
): MenuItem[] {
    if (limit <= 0) return [];

    const normalizedTerms = terms.map(normalizeSearchText).filter(Boolean);
    if (normalizedTerms.length === 0) return [];

    const seen = new Set<string>();
    const matches: MenuItem[] = [];

    for (const menuType of Object.values(menu)) {
        for (const category of menuType?.categories ?? []) {
            for (const item of category.items ?? []) {
                const haystack = normalizeSearchText([
                    category.name,
                    item.name,
                    item.description,
                ].filter(Boolean).join(' '));
                if (!normalizedTerms.some((term) => haystack.includes(term))) continue;

                const key = String(item.id);
                if (seen.has(key)) continue;
                seen.add(key);
                matches.push(item);

                if (matches.length >= limit) return matches;
            }
        }
    }

    return matches;
}

export function buildMenuLandingJsonLd({
    title,
    path,
    description,
    items,
}: {
    title: string;
    path: string;
    description: string;
    items: readonly MenuItem[];
}) {
    const url = new URL(path, `${SITE_URL}/`).toString();

    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description,
        url,
        inLanguage: 'ru-RU',
        about: { '@id': `${SITE_URL}/#restaurant` },
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: items.length,
            itemListElement: items.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                    '@type': 'MenuItem',
                    name: item.name,
                    description: item.description || undefined,
                    image: item.image
                        ? new URL(item.image, `${SITE_URL}/`).toString()
                        : undefined,
                    ...(typeof item.price === 'number'
                        ? {
                            offers: {
                                '@type': 'Offer',
                                price: item.price,
                                priceCurrency: 'RUB',
                                seller: { '@type': 'Restaurant', name: SITE.name },
                            },
                        }
                        : {}),
                },
            })),
        },
    };
}
