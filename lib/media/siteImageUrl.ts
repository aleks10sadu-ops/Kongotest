const PUBLIC_STORAGE_PREFIX = '/storage/v1/object/public/';
const SITE_PROXY_PREFIX = '/media/supabase/';

/**
 * Supabase Storage can be unavailable to visitors on some Russian networks.
 * Keep the canonical URL in the database, but render it through our own domain.
 */
export function toSiteImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith(SITE_PROXY_PREFIX)) return value;

  try {
    const url = new URL(value);
    const configuredOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!configuredOrigin || url.origin !== new URL(configuredOrigin).origin) return value;
    if (!url.pathname.startsWith(PUBLIC_STORAGE_PREFIX)) return value;

    const objectPath = url.pathname.slice(PUBLIC_STORAGE_PREFIX.length);
    return objectPath ? `${SITE_PROXY_PREFIX}${objectPath}` : value;
  } catch {
    return value;
  }
}

