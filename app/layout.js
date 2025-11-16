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
                let reloadAttempts = 0;
                const maxReloadAttempts = 2;
                
                // Обработка ошибок загрузки ресурсов (404 для chunk файлов)
                window.addEventListener('error', function(e) {
                  const target = e.target;
                  const isChunkError = target && (
                    (target.tagName === 'SCRIPT' && target.src && target.src.includes('/_next/static/chunks/')) ||
                    (target.tagName === 'LINK' && target.href && target.href.includes('/_next/static/chunks/'))
                  );
                  
                  if (isChunkError && e.target.status === 404) {
                    console.warn('Chunk file 404 error detected:', e.target.src || e.target.href);
                    if (reloadAttempts < maxReloadAttempts) {
                      reloadAttempts++;
                      console.log('Attempting to reload page... (attempt ' + reloadAttempts + ')');
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    } else {
                      console.error('Max reload attempts reached. Please clear cache and reload manually.');
                    }
                    e.preventDefault();
                    return false;
                  }
                  
                  // Обработка ошибок загрузки через сообщения
                  if (e.message && (
                    e.message.includes('Failed to load chunk') ||
                    e.message.includes('Loading chunk') ||
                    e.message.includes('ChunkLoadError')
                  )) {
                    console.warn('Chunk loading error:', e.message);
                    if (reloadAttempts < maxReloadAttempts) {
                      reloadAttempts++;
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    }
                  }
                }, true);
                
                // Обработка ошибок через window.onerror
                const originalError = window.onerror;
                window.onerror = function(msg, url, line, col, error) {
                  const isChunkRelated = url && (
                    url.includes('/_next/static/chunks/') ||
                    url.includes('chunk') ||
                    (msg && (msg.includes('Failed to load chunk') || msg.includes('ChunkLoadError')))
                  );
                  
                  if (isChunkRelated) {
                    console.warn('Chunk error detected:', msg, url);
                    if (reloadAttempts < maxReloadAttempts) {
                      reloadAttempts++;
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                      return true;
                    }
                  }
                  
                  if (originalError) {
                    return originalError.apply(this, arguments);
                  }
                  return false;
                };
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
