import type { Metadata } from 'next';
import DishLandingPage from '../components/seo/DishLandingPage';
import { getFullMenu } from '@/lib/menu/getFullMenu';
import { buildMenuLandingJsonLd, filterMenuItemsByTerms } from '@/lib/seo/searchLandingPages';

const title = 'Шашлык в Дмитрове';
const description = 'Шашлык и блюда с мангала из меню доставки ресторана «Кучер & Conga» в Дмитрове: актуальные позиции, цены и наличие. Закажите онлайн с доставкой по городу.';
const path = '/shashlyk-dmitrov';
const orderHref = '/menu?category=shashlyk#delivery';

export const metadata: Metadata = {
    title: `${title} — заказать с доставкой | Кучер & Conga`,
    description,
    alternates: { canonical: path },
    openGraph: {
        title: `${title} — Кучер & Conga`,
        description,
        url: path,
        type: 'website',
        images: ['/hero-image.webp'],
    },
};

export const dynamic = 'force-static';
export const revalidate = 600;

export default async function ShashlykPage() {
    const menu = await getFullMenu();
    const items = filterMenuItemsByTerms(menu, ['шашлык', 'шашлычный', 'на углях'], 8);

    return (
        <DishLandingPage
            eyebrow="Шашлык и блюда с мангала с доставкой"
            title={title}
            description={description}
            orderHref={orderHref}
            items={items}
            jsonLd={buildMenuLandingJsonLd({ title, path, description, items })}
        />
    );
}
