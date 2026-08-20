import type { Metadata } from 'next';
import ForestScene from './redesign/ForestBloom';

export const metadata: Metadata = {
    title: 'Кучер & Conga — ресторан в Дмитрове. Здесь лес растёт с потолка',
    description:
        'Авторская кухня, шашлычные сеты и банкеты в Дмитрове. Зал Conga с подвешенным лесом и лампами-грибами, веранда у леса, доставка по городу.',
    alternates: { canonical: '/' },
    openGraph: {
        title: 'Кучер & Conga — ресторан в Дмитрове',
        description: 'Авторская кухня, зал Conga с подвешенным лесом, веранда, банкеты и доставка по Дмитрову.',
        url: '/',
        type: 'website',
        images: ['/hero-image.webp'],
    },
};

export default function Page() {
    return <ForestScene />;
}
