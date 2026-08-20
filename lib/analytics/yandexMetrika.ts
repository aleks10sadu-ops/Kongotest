export const YANDEX_METRIKA_COUNTER_ID = 111802696;

export type YandexGoal = 'delivery_order' | 'booking_submit' | 'phone_click';

declare global {
    interface Window {
        ym?: (counterId: number, method: string, goal: string, params?: Record<string, unknown>) => void;
    }
}

export function reachYandexGoal(goal: YandexGoal, params?: Record<string, unknown>): boolean {
    if (typeof window === 'undefined' || typeof window.ym !== 'function') return false;
    window.ym(YANDEX_METRIKA_COUNTER_ID, 'reachGoal', goal, params);
    return true;
}
