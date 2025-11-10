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
      <body className="antialiased bg-slate-50">
        {children}
      </body>
    </html>
  );
}
