// Server-side Supabase helpers
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const getSupabaseEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase env vars NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set');
  }

  return { url, anonKey };
};

// Клиент для route handlers / API-роутов и server components (использует anon key и куки)
export function createSupabaseRouteClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        try {
          const cookieStore = cookies();
          // В Next.js 16 cookies() возвращает объект с методом getAll()
          if (cookieStore && typeof cookieStore.getAll === 'function') {
            return cookieStore.getAll();
          }
          // Если getAll() недоступен, возвращаем пустой массив
          // (это нормально для server components без аутентификации)
          return [];
        } catch (e) {
          // Если cookies() не может быть вызван, возвращаем пустой массив
          return [];
        }
      },
      set(name, value, options) {
        try {
          const cookieStore = cookies();
          if (cookieStore && typeof cookieStore.set === 'function') {
            cookieStore.set(name, value, options);
          }
        } catch (e) {
          // Игнорируем ошибки установки cookies в некоторых контекстах
          // (например, в статических генерациях)
        }
      },
      remove(name, options) {
        try {
          const cookieStore = cookies();
          if (cookieStore && typeof cookieStore.set === 'function') {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          }
        } catch (e) {
          // Игнорируем ошибки удаления cookies
        }
      },
    },
  });
}

// Admin client using service role key – NEVER expose to browser
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  return createServerClient(url, serviceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      set() {},
      remove() {},
    },
  });
}

