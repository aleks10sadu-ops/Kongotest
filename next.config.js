/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'mmyfglktqvojwpycreko.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    qualities: [75, 80, 85, 90],
    minimumCacheTTL: 60,
  },
  // Оптимизация производительности
  compress: true,
  poweredByHeader: false,
  // Оптимизация для внешних ресурсов и кеширования
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
        ],
      },
      // Кеширование для статических ресурсов
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Кеширование для статических чанков Next.js (с хешем в имени)
      {
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Кеширование для статических файлов Next.js (CSS, JS с хешем)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Настройка для современных браузеров (ES6+)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Указываем корень проекта для устранения предупреждения о множественных lockfiles
  outputFileTracingRoot: path.join(__dirname),
  // Настройки для обработки ошибок загрузки чанков
  onDemandEntries: {
    // Период времени в мс, в течение которого страница остается в памяти
    maxInactiveAge: 25 * 1000,
    // Количество страниц, которые должны быть сохранены одновременно
    pagesBufferLength: 2,
  },
  // Отключаем строгую проверку типов для production сборки (может помочь с chunk ошибками)
  typescript: {
    ignoreBuildErrors: false,
  },
  // Настройки для улучшения стабильности сборки
  experimental: {
    // Улучшенная обработка ошибок
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig
