import type { Metadata } from 'next';
import Link from 'next/link';
import ForestFooter from '../components/forest/ForestFooter';
import ForestHeader from '../components/forest/ForestHeader';
import { SITE, SITE_URL } from '../components/forest/site';

export const metadata: Metadata = {
    title: 'Доставка еды в Дмитрове — Кучер & Conga',
    description: 'Доставка еды из ресторана «Кучер & Conga» по Дмитрову: горячие блюда, мангал, шашлык и хинкали. Актуальное меню, цены и оформление заказа на сайте.',
    alternates: { canonical: '/delivery' },
    openGraph: { title: 'Доставка еды в Дмитрове — Кучер & Conga', description: 'Актуальное меню доставки ресторана по Дмитрову.', url: '/delivery', type: 'website', images: ['/hero-image.webp'] },
};

const deliveryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Доставка еды в Дмитрове',
    serviceType: 'Доставка еды из ресторана',
    url: `${SITE_URL}/delivery`,
    areaServed: { '@type': 'City', name: 'Дмитров' },
    provider: { '@type': 'Restaurant', '@id': `${SITE_URL}/#restaurant`, name: SITE.name },
};

export default function DeliveryPage() {
    return (
        <>
            <ForestHeader />
            <main className="min-h-screen bg-forest-ink font-body text-cream">
                <section className="relative overflow-hidden">
                    <img src="/hero-image.webp" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-forest-ink/90" />
                    <div className="relative mx-auto max-w-[1120px] px-5 pb-16 pt-20 md:px-8 md:pb-24 md:pt-28">
                        <p className="text-[13px] uppercase tracking-[0.18em] text-brass">Ресторан Кучер &amp; Conga</p>
                        <h1 className="mt-2 font-display text-[clamp(2.4rem,6vw,4.4rem)] font-black leading-[1.04]">Доставка еды в Дмитрове</h1>
                        <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-cream/85 md:text-lg">Выберите блюда из актуального меню доставки, соберите корзину и оформите заказ прямо на сайте.</p>
                        <Link href="/menu#delivery" className="mt-7 inline-flex rounded-lg bg-terracotta px-7 py-3.5 font-semibold text-[#FBF3EA] hover:bg-terracotta-dark">Заказать доставку</Link>
                    </div>
                </section>
                <section className="mx-auto grid max-w-[1120px] gap-5 px-5 py-14 md:grid-cols-2 md:px-8 md:py-20">
                    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
                        <h2 className="font-display text-2xl font-bold">Время приёма заказов</h2>
                        <p className="mt-4 text-cream/80">Пн–Чт: 12:00–21:45</p>
                        <p className="mt-2 text-cream/80">Пт–Сб: 12:00–23:00</p>
                        <p className="mt-2 text-cream/80">Вс: 13:00–21:45</p>
                    </article>
                    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
                        <h2 className="font-display text-2xl font-bold">Стоимость и зоны</h2>
                        <p className="mt-4 leading-relaxed text-cream/80">В центральной зоне доставка бесплатна при заказе от 1000 ₽ или от двух бизнес-ланчей. Для остальных адресов стоимость и минимальная сумма показываются при оформлении.</p>
                    </article>
                </section>
            </main>
            <ForestFooter />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(deliveryJsonLd) }} />
        </>
    );
}
