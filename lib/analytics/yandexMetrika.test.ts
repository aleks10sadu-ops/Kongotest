import { afterEach, describe, expect, it, vi } from 'vitest';
import { reachYandexGoal } from './yandexMetrika';

describe('Yandex Metrika goals', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('queues a configured goal with useful parameters', () => {
        const ym = vi.fn();
        vi.stubGlobal('window', { ym });

        expect(reachYandexGoal('delivery_order', { total: 2500 })).toBe(true);
        expect(ym).toHaveBeenCalledWith(111802696, 'reachGoal', 'delivery_order', { total: 2500 });
    });

    it('stays safe before the counter is available', () => {
        vi.stubGlobal('window', {});
        expect(reachYandexGoal('phone_click')).toBe(false);
    });
});
