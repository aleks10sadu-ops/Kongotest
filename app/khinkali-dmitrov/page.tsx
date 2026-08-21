import type { Metadata } from 'next';
import DishLandingPage from '../components/seo/DishLandingPage';
import { getFullMenu } from '@/lib/menu/getFullMenu';
import { buildMenuLandingJsonLd, filterMenuItemsByTerms } from '@/lib/seo/searchLandingPages';

const title = 'Хинкали в Дмитрове';
const description = 'Хинкали из меню доставки ресторана «Кучер & Conga» в Дмитрове: актуальные позиции, цены и наличие. Закажите онлайн с доставкой по городу.';
const path = '/khinkali-dmitrov';
const orderHref = '/menu?category=khinkali#delivery';

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

export default async function KhinkaliPage() {
    const menu = await getFullMenu();
    const items = filterMenuItemsByTerms(menu, ['хинкали'], 8);

    return (
        <DishLandingPage
            eyebrow="Хинкали из ресторана с доставкой"
            title={title}
            description={description}
            orderHref={orderHref}
            items={items}
            jsonLd={buildMenuLandingJsonLd({ title, path, description, items })}
        />
    );
}
