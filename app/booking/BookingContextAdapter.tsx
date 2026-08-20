'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { BookingHall } from '@/lib/booking/hallCatalog';
import { parseBookingContext } from '@/lib/booking/bookingContext';
import BookingForm from './BookingForm';

export default function BookingContextAdapter({ bookingHalls }: { bookingHalls: BookingHall[] }) {
    const searchParams = useSearchParams();
    const initialContext = useMemo(
        () => parseBookingContext(new URLSearchParams(searchParams.toString()), bookingHalls),
        [searchParams, bookingHalls],
    );

    return <BookingForm bookingHalls={bookingHalls} initialContext={initialContext} />;
}
