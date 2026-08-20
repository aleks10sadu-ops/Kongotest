type MenuByType = Record<string, { categories?: unknown[] } | undefined>;

const ALWAYS_AVAILABLE_TYPES = new Set(['bar', 'wine', 'banquet']);
const DATA_BACKED_TYPES = new Set(['main', 'business', 'kids', 'promotions']);

function readHashValue(hash: string): string {
    const raw = hash.replace(/^#/, '').trim().toLowerCase();
    try {
        return decodeURIComponent(raw);
    } catch {
        return raw;
    }
}

export function resolveMenuDeepLink(hash: string, menuByType: MenuByType, fallback: string): string {
    const requested = readHashValue(hash);
    if (ALWAYS_AVAILABLE_TYPES.has(requested)) return requested;
    if (DATA_BACKED_TYPES.has(requested) && (menuByType[requested]?.categories?.length ?? 0) > 0) return requested;
    return fallback;
}
