import Link from 'next/link';
import ForestFooter from '../forest/ForestFooter';
import ForestHeader from '../forest/ForestHeader';
import type { MenuItem } from '@/types/index';

type Props = {
    eyebrow: string;
    title: string;
    description: string;
    orderHref: string;
    items: readonly MenuItem[];
    jsonLd: object;
};

export default function DishLandingPage({ eyebrow, title, description, orderHref, items, jsonLd }: Props) {
    return (
        <>
            <ForestHeader />
            <main className="min-h-screen bg-forest-ink font-body text-cream">
                <section className="border-b border-white/5 bg-gradient-to-b from-forest via-forest-ink to-forest-ink">
                    <div className="mx-auto max-w-[1120px] px-5 pb-14 pt-16 md:px-8 md:pb-20 md:pt-24">
                        <p className="text-[13px] uppercase tracking-[0.18em] text-brass">{eyebrow}</p>
                        <h1 className="font-display text-[clamp(2.4rem,6vw,4.4rem)] font-black leading-[1.04]">{title}</h1>
                        <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-cream/80 md:text-lg">{description}</p>
                        <Link href={orderHref} className="mt-7 inline-flex rounded-lg bg-terracotta px-6 py-3.5 font-semibold text-[#FBF3EA] hover:bg-terracotta-dark">
                            Открыть в меню доставки
                        </Link>
                    </div>
                </section>

                <section className="mx-auto max-w-[1120px] px-5 py-14 md:px-8 md:py-20">
                    <h2 className="font-display text-3xl font-bold">Позиции в меню доставки</h2>
                    {items.length > 0 ? (
                        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {items.map((item) => (
                                <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                                    <h3 className="font-display text-xl font-bold">{item.name}</h3>
                                    {item.description ? <p className="mt-2 text-sm leading-relaxed text-cream/65">{item.description}</p> : null}
                                    {typeof item.price === 'number' ? <p className="mt-4 text-lg font-bold text-brass">{item.price.toLocaleString('ru-RU')} ₽</p> : null}
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-cream/70">
                            Актуальные позиции и наличие покажем в разделе доставки.
                        </p>
                    )}
                </section>
            </main>
            <ForestFooter />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </>
    );
}
