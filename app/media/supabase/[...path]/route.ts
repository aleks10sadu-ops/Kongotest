import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const ALLOWED_BUCKETS = new Set(['dish-images', 'content-images']);

type RouteContext = { params: Promise<{ path: string[] }> };

function upstreamUrl(path: string[]): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base || path.length < 2 || !ALLOWED_BUCKETS.has(path[0])) return null;
  if (path.some((segment) => !segment || segment === '.' || segment === '..')) return null;

  const encodedPath = path.map(encodeURIComponent).join('/');
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/${encodedPath}`;
}

async function serve(request: NextRequest, context: RouteContext, head = false) {
  const { path } = await context.params;
  const source = upstreamUrl(path);
  if (!source) return new Response('Not found', { status: 404 });

  const upstream = await fetch(source, {
    method: head ? 'HEAD' : 'GET',
    next: { revalidate: 86_400 },
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);

  if (!upstream) return new Response('Image source unavailable', { status: 502 });
  if (!upstream.ok) return new Response('Image not found', { status: upstream.status });

  const headers = new Headers({
    'Cache-Control': 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800',
    'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
  });
  for (const name of ['content-length', 'etag', 'last-modified']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(head ? null : upstream.body, { status: 200, headers });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return serve(request, context);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return serve(request, context, true);
}

