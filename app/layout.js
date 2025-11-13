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
      </head>
      <body className="antialiased bg-slate-50">
        {children}
      </body>
    </html>
  );
}
