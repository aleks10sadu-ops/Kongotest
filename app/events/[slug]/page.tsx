import { CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { loadContentPostServer } from '@/lib/content/loadContentPosts.server';
import { buildBookingHref } from '@/lib/booking/bookingContext';
import ForestPostView, { ForestPostNotFound } from '../../components/forest/ForestPostView';

// ISR: пост рендерится на сервере — браузер посетителя не ходит в Supabase (замедлен в РФ).
export const dynamic = 'force-static';
export const revalidate = 300;

export const eventBookingHref = (slug: string): string => buildBookingHref({ source: 'event', ref: slug });

export default async function EventPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await loadContentPostServer('events', slug);

    if (!post) {
        return <ForestPostNotFound backHref="/events" backLabel="Ко всем событиям" title="Событие не найдено" />;
    }

    return (
        <ForestPostView
            post={post}
            backHref="/events"
            backLabel="Ко всем событиям"
            kicker={{ label: 'Событие', icon: <CalendarDays className="h-4 w-4" /> }}
        >
            <Link
                href={eventBookingHref(slug)}
                className="inline-flex items-center rounded-lg bg-terracotta px-6 py-3 font-semibold text-[#FBF3EA] transition-colors hover:bg-terracotta-dark"
            >
                Забронировать на это событие
            </Link>
        </ForestPostView>
    );
}
