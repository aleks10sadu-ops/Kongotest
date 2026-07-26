import { describe, expect, it } from 'vitest';
import { mergeHalls } from './halls-data';

describe('mergeHalls', () => {
    it('keeps CRM ids while applying public hall names and local content', () => {
        const halls = mergeHalls(
            [
                { id: 'bar-id', name: 'Барный (Кучер)', capacity: 36 },
                { id: 'summer-id', name: 'Летка', capacity: 50 },
            ],
            [
                {
                    id: 'bar-post',
                    title: 'Барный зал',
                    content: 'Описание барного зала',
                    image_url: '/halls/bar.webp',
                    metadata: { gallery: [] },
                },
                {
                    id: 'summer-post',
                    title: 'Летняя веранда',
                    content: 'Описание летней веранды',
                    image_url: '/halls/letka.webp',
                    metadata: { gallery: [] },
                },
            ],
        );

        expect(halls).toEqual([
            expect.objectContaining({
                id: 'bar-id',
                name: 'Барный зал',
                description: 'Описание барного зала',
                image: '/halls/bar.webp',
                dbId: 'bar-post',
            }),
            expect.objectContaining({
                id: 'summer-id',
                name: 'Летняя веранда',
                description: 'Описание летней веранды',
                image: '/halls/letka.webp',
                dbId: 'summer-post',
            }),
        ]);
    });

    it('uses optimized local fallbacks when content storage is unavailable', () => {
        const [hall] = mergeHalls([{ id: 'marine-id', name: 'Морской (Кучер)', capacity: 52 }], []);

        expect(hall).toEqual(expect.objectContaining({
            id: 'marine-id',
            name: 'Морской зал',
            image: '/halls/morskoy.webp',
        }));
    });
});
