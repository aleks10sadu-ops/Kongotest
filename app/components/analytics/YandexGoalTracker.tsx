'use client';

import { useEffect } from 'react';
import { reachYandexGoal } from '@/lib/analytics/yandexMetrika';

export default function YandexGoalTracker() {
    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="tel:"]') : null;
            if (target) reachYandexGoal('phone_click', { phone: target.getAttribute('href') });
        };

        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, []);

    return null;
}
