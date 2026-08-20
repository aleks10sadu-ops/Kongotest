import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MAIN_MENU_PAGES } from './paperMenu';

describe('paper main menu', () => {
    it('publishes exactly the requested PDF pages 1–13', () => {
        expect(MAIN_MENU_PAGES).toHaveLength(13);
        expect(MAIN_MENU_PAGES[0]).toBe('/menu-pages/main-1.webp');
        expect(MAIN_MENU_PAGES[12]).toBe('/menu-pages/main-13.webp');
        expect(MAIN_MENU_PAGES.every((src) => existsSync(join(process.cwd(), 'public', src)))).toBe(true);
    });
});
