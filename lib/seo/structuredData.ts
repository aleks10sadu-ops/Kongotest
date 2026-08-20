import { SITE, SITE_URL } from '@/app/components/forest/site';

const RESTAURANT_ID = `${SITE_URL}/#restaurant`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export interface BreadcrumbItem {
    name: string;
    path: string;
}

export interface FaqItem {
    question: string;
    answer: string;
}

export interface HallSchemaInput {
    title: string;
    excerpt?: string | null;
    image_url?: string | null;
}

export function buildRestaurantGraph() {
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Restaurant',
                '@id': RESTAURANT_ID,
                name: SITE.name,
                alternateName: 'Кучер и Конга',
                description:
                    'Ресторан авторской кухни в Дмитрове: мангал, доставка, бронирование столов и банкеты.',
                url: SITE_URL,
                logo: `${SITE_URL}/kongo_logo_main.svg`,
                image: `${SITE_URL}/hero-image.webp`,
                telephone: SITE.phones[0].tel,
                priceRange: '₽₽',
                servesCuisine: ['Авторская', 'Европейская', 'Русская', 'Мангал'],
                acceptsReservations: true,
                hasMenu: `${SITE_URL}/menu`,
                hasMap: SITE.yandexOrg,
                sameAs: [SITE.yandexOrg, ...SITE.socials.map((social) => social.href)],
                address: {
                    '@type': 'PostalAddress',
                    streetAddress: 'Промышленная улица, 20Б',
                    addressLocality: SITE.city,
                    addressRegion: 'Московская область',
                    postalCode: '141801',
                    addressCountry: 'RU',
                },
                openingHoursSpecification: [
                    {
                        '@type': 'OpeningHoursSpecification',
                        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                        opens: '12:00',
                        closes: '23:00',
                    },
                    {
                        '@type': 'OpeningHoursSpecification',
                        dayOfWeek: ['Friday', 'Saturday'],
                        opens: '12:00',
                        closes: '01:00',
                    },
                    {
                        '@type': 'OpeningHoursSpecification',
                        dayOfWeek: 'Sunday',
                        opens: '13:00',
                        closes: '23:00',
                    },
                ],
                potentialAction: {
                    '@type': 'ReserveAction',
                    target: {
                        '@type': 'EntryPoint',
                        urlTemplate: `${SITE_URL}/booking`,
                        inLanguage: 'ru-RU',
                    },
                },
            },
            {
                '@type': 'WebSite',
                '@id': WEBSITE_ID,
                name: SITE.name,
                url: SITE_URL,
                inLanguage: 'ru-RU',
                publisher: { '@id': RESTAURANT_ID },
            },
        ],
    };
}

export function serializeJsonLd(value: unknown): string {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function buildBreadcrumbJsonLd(items: readonly BreadcrumbItem[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: new URL(item.path, `${SITE_URL}/`).toString(),
        })),
    };
}

export function buildFaqJsonLd(items: readonly FaqItem[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    };
}

export function buildHallJsonLd(hall: HallSchemaInput, slug: string) {
    const url = `${SITE_URL}/halls/${encodeURIComponent(slug)}`;

    return {
        '@context': 'https://schema.org',
        '@type': 'Place',
        '@id': `${url}/#place`,
        name: hall.title,
        description: hall.excerpt || `Зал «${hall.title}» ресторана ${SITE.name} в Дмитрове.`,
        url,
        image: hall.image_url ? new URL(hall.image_url, `${SITE_URL}/`).toString() : undefined,
        containedInPlace: { '@id': RESTAURANT_ID },
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Промышленная улица, 20Б',
            addressLocality: SITE.city,
            addressRegion: 'Московская область',
            postalCode: '141801',
            addressCountry: 'RU',
        },
    };
}
