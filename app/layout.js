// app/layout.js
export const metadata = {
  title: 'Кучер и Конга',
  description: 'Изысканная кухня: традиции, утончённый вкус и безупречная атмосфера.',
  icons: {
    icon: '/icon.svg',
  },
};

import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        {/* Preconnect только для самых важных источников (не более 4) */}
        <link rel="preconnect" href="https://maps.yastatic.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://maps.yastatic.net" />
        <link rel="preconnect" href="https://avatars.mds.yandex.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://avatars.mds.yandex.net" />
        <link rel="dns-prefetch" href="https://yastatic.net" />
        <link rel="dns-prefetch" href="https://mc.yandex.ru" />
        {/* Обработка ошибок загрузки чанков */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(e) {
                  if (e.message && e.message.includes('Failed to load chunk')) {
                    console.log('Chunk loading error detected, reloading page...');
                    window.location.reload();
                  }
                });
                
                // Обработка ошибок из Turbopack
                if (window.__NEXT_DATA__) {
                  const originalError = window.onerror;
                  window.onerror = function(msg, url, line, col, error) {
                    if (msg && (msg.includes('Failed to load chunk') || msg.includes('chunk'))) {
                      console.log('Chunk error detected, reloading...');
                      setTimeout(() => window.location.reload(), 100);
                      return true;
                    }
                    if (originalError) {
                      return originalError.apply(this, arguments);
                    }
                    return false;
                  };
                }
              }
            `,
          }}
        />
      </head>
      <body className="antialiased bg-slate-50">
        {children}
      </body>
    </html>
  );
}
