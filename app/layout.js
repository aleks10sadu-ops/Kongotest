// app/layout.js
export const metadata = {
  title: 'Kucher&Conga',
  description: 'Изысканная кухня: традиции, утончённый вкус и безупречная атмосфера.',
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
