import { describe, expect, it } from 'vitest';

import { isPointInPolygon } from '../../lib/utils/geo';
import { checkDeliveryZoneForCoords, deliveryZones } from './deliveryZones';

describe('актуальная бесплатная зона доставки', () => {
    const freeZone = deliveryZones[0];
    const polygon = freeZone.coordinates[0];

    it('использует полный замкнутый контур из GeoJSON', () => {
        expect(freeZone.name).toBe('Бесплатная доставка');
        expect(polygon).toHaveLength(73);
        expect(polygon[0]).toEqual([56.408108, 37.495565]);
        expect(polygon.at(-1)).toEqual(polygon[0]);
    });

    it('правильно отличает точку внутри зоны от точки снаружи', () => {
        expect(isPointInPolygon([56.39, 37.53], polygon)).toBe(true);
        expect(isPointInPolygon([56.42, 37.53], polygon)).toBe(false);
        expect(checkDeliveryZoneForCoords([56.39, 37.53])?.id).toBe(1);
    });
});
