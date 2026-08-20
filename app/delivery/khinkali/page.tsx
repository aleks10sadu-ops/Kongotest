import type { Metadata } from 'next';
import DishLandingPage from '../../components/seo/DishLandingPage';
import { getFullMenu } from '@/lib/menu/getFullMenu';
import { buildMenuLandingJsonLd, filterMenuItemsByTerms } from '@/lib/seo/searchLandingPages';

const title = 'Хинкали в Дмитрове';
const description = 'Хинкали из меню доставки ресторана «Кучер & Conga» в Дмитрове. Смотрите актуальные позиции, цены и наличие перед заказом.';
const orderHref = '/menu?search=%D1%85%D0%B8%D0%BD%D0%BA%D0%B0%D0%BB%D0%B8#delivery';

export const metadata: Metadata = {
    title: `${title} — доставка | Кучер & Conga`,
    description,
    alternates: { canonical: '/delivery/khinkali' },
};

export const dynamic = 'force-static';
export const revalidate = 600;

export default async function KhinkaliPage() {
    const menu = await getFullMenu();
    const items = filterMenuItemsByTerms(menu, ['хинкали'], 8);
    return <DishLandingPage eyebrow="Грузинская кухня и доставка" title={title} description={description} orderHref={orderHref} items={items} jsonLd={buildMenuLandingJsonLd({ title, path: '/delivery/khinkali', description, items })} />;
}
