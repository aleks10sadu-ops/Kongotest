import type { Metadata } from 'next';
import DishLandingPage from '../../components/seo/DishLandingPage';
import { getFullMenu } from '@/lib/menu/getFullMenu';
import { buildMenuLandingJsonLd, filterMenuItemsByTerms } from '@/lib/seo/searchLandingPages';

const title = 'Шашлык в Дмитрове';
const description = 'Шашлык и блюда на углях из меню доставки ресторана «Кучер & Conga» в Дмитрове. Актуальные цены и наличие обновляются из меню.';
const orderHref = '/menu?search=%D1%88%D0%B0%D1%88%D0%BB%D1%8B%D0%BA#delivery';

export const metadata: Metadata = {
    title: `${title} — доставка | Кучер & Conga`,
    description,
    alternates: { canonical: '/menu/shashlyk' },
};

export const revalidate = 600;

export default async function ShashlykPage() {
    const menu = await getFullMenu();
    const items = filterMenuItemsByTerms(menu, ['шашлык', 'шашлычный', 'на углях'], 8);
    return <DishLandingPage eyebrow="Мангал и доставка" title={title} description={description} orderHref={orderHref} items={items} jsonLd={buildMenuLandingJsonLd({ title, path: '/menu/shashlyk', description, items })} />;
}
