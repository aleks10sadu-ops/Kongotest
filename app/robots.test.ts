import { describe, expect, it } from 'vitest';
import robots from './robots';

describe('robots', () => {
    it('allows AI search crawlers while blocking the training crawler', () => {
        const rules = robots().rules;

        expect(rules).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ userAgent: 'OAI-SearchBot', allow: '/' }),
                expect.objectContaining({ userAgent: 'PerplexityBot', allow: '/' }),
                expect.objectContaining({ userAgent: 'GPTBot', disallow: '/' }),
            ]),
        );
    });
});
