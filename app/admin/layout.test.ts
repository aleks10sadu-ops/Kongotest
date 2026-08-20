import { describe, expect, it } from 'vitest';
import { metadata } from './layout';

describe('admin metadata', () => {
    it('keeps private screens out of search indexes', () => {
        expect(metadata.robots).toEqual({ index: false, follow: false, nocache: true });
    });
});
