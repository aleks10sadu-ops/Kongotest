'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Phone, MapPin, Clock, Star, Utensils, Wine,
  ShoppingCart, Plus, Minus, X, Trash2, Menu,
  Home, Users
} from 'lucide-react';
import EnhancedMenuSection from './components/EnhancedMenuSection';

/* --- ДАННЫЕ --- */

const gallery = [
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=900&h=700&fit=crop',
  'https://images.unsplash.com/photo-1541542684-4a9c56a1f3d3?w=900&h=700&fit=crop',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=900&h=700&fit=crop',
  'https://images.unsplash.com/photo-1421622548261-c45bfe178854?w=900&h=700&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=700&fit=crop',
  'https://images.unsplash.com/photo-1498654200943-1088dd4438ae?w=900&h=700&fit=crop',
];

/* --- УТИЛИТЫ КОРЗИНЫ --- */
function useCart() {
  const [items, setItems] = useState([]); // [{ id, name, price, img, qty }]

  const add = useCallback((product) => {
    setItems(prev => {
      const idx = prev.findIndex(p => p.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: product.qty || copy[idx].qty + 1 };
        return copy;
      }
      return [...prev, { ...product, qty: product.qty || 1 }];
    });
  }, []);

  const dec = useCallback((id) => {
    setItems(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx < 0) return prev;
      const cur = prev[idx];
      if (cur.qty <= 1) return prev.filter(p => p.id !== id);
      const copy = [...prev];
      copy[idx] = { ...cur, qty: cur.qty - 1 };
      return copy;
    });
  }, []);

  const remove = useCallback((id) => {
    setItems(prev => prev.filter(p => p.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const total = useMemo(() => items.reduce((s, i) => s + i.qty * i.price, 0), [items]);

  return { items, add, dec, remove, clear, count, total };
}

/* --- СТРАНИЦА --- */
export default function Page() {
  const [guests, setGuests] = useState(2);
  const [cartOpen, setCartOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { items, add, dec, remove, clear, count, total } = useCart();

  // Доставка: локальный стейт формы
  const [dForm, setDForm] = useState({ name: '', phone: '', address: '', comment: '' });

  // Блокируем скролл body при открытых модалках (но не при меню)
  useEffect(() => {
    const opened = cartOpen || deliveryOpen;
    if (opened) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => (document.body.style.overflow = prev);
    }
  }, [cartOpen, deliveryOpen]);

  // Закрываем меню при скролле
  useEffect(() => {
    if (menuOpen) {
      const handleScroll = () => {
        setMenuOpen(false);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [menuOpen]);

  // Закрытие по ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setDeliveryOpen(false);
        setCartOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);


  // Прокрутка к секциям с учетом фиксированного header
  const scrollTo = (id) => {
    const el = document.querySelector(id);
    if (el) {
      const headerOffset = 80; // Высота фиксированного header
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Для карточки: есть ли в корзине
  const qtyInCart = (id) => items.find(i => i.id === id)?.qty ?? 0;

  // Отправка в Telegram API
  async function notifyTelegram(payload) {
    const res = await fetch('/api/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Telegram notify failed');
  }

  // Сабмит БРОНИ (из секции booking)
  async function submitBooking(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      type: 'booking',
      name: form.get('name') || '',
      phone: form.get('phone') || '',
      date: form.get('date') || '',
      time: form.get('time') || '',
      guests: form.get('guests') || '',
      comment: form.get('comment') || '',
      items,
      total,
    };
    await notifyTelegram(payload);
    alert('Заявка на бронирование отправлена! Мы свяжемся с вами.');
    e.currentTarget.reset();
  }

  // Сабмит ДОСТАВКИ (из модалки)
  async function submitDelivery(e) {
    e.preventDefault();
    const payload = {
      type: 'delivery',
      ...dForm,
      items,
      total,
    };
    await notifyTelegram(payload);
    setDeliveryOpen(false);
    setCartOpen(false);
    setDForm({ name: '', phone: '', address: '', comment: '' });
    alert('Заявка на доставку отправлена! Ожидайте звонка.');
  }

  return (
    <div className="bg-neutral-950 text-white">
      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-neutral-950/95 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => scrollTo('#top')} className="flex items-center">
            <img src="/kongo_logo_main.svg" alt="КОНГО" className="h-7 w-auto" />
          </button>
          
          {/* Кнопка меню (три полоски) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg border border-white/10 hover:border-white/40 hover:bg-white/5 transition"
            aria-label="Открыть меню"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Десктопная навигация - скрыта, все через меню */}
          <div className="hidden md:flex items-center gap-3">
            <a href="tel:+74992299222" className="flex items-center gap-2 text-sm hover:text-amber-400 transition">
              <Phone className="w-4 h-4" /> +7 (499) 229-92-22
            </a>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg border border-white/10 hover:border-white/40 hover:bg-white/5 transition"
              aria-label="Открыть меню"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button
              aria-label="Открыть корзину"
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-lg border border-white/10 hover:border-white/40 hover:bg-white/5 transition"
            >
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 text-[11px] leading-none bg-amber-400 text-black px-1.5 py-0.5 rounded-full font-bold">
                  {count}
                </span>
              )}
            </button>
          </div>

          {/* Мобильная корзина */}
          <button
            aria-label="Открыть корзину"
            onClick={() => setCartOpen(true)}
            className="md:hidden relative p-2 rounded-lg border border-white/10 hover:border-white/40 hover:bg-white/5 transition"
          >
            <ShoppingCart className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 text-[11px] leading-none bg-amber-400 text-black px-1.5 py-0.5 rounded-full font-bold">
                {count}
              </span>
            )}
          </button>
        </div>

        {/* Выпадающее меню */}
        {menuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <div 
              className="fixed top-[57px] right-4 md:right-8 bg-neutral-950 border border-white/20 rounded-xl z-50 shadow-2xl min-w-[280px] max-w-[320px] transition-all duration-300 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold uppercase tracking-wider text-amber-400">Навигация</h3>
              </div>
              <div className="p-3 max-h-[70vh] overflow-y-auto">
                <nav className="flex flex-col gap-1">
                  <button 
                    onClick={() => { scrollTo('#menu'); setMenuOpen(false); }} 
                    className="text-left px-4 py-3 rounded-lg hover:bg-white/10 hover:text-amber-400 transition text-sm uppercase tracking-wider border border-transparent hover:border-white/10"
                  >
                    Меню
                  </button>
                  <button 
                    onClick={() => { scrollTo('#about'); setMenuOpen(false); }} 
                    className="text-left px-4 py-3 rounded-lg hover:bg-white/10 hover:text-amber-400 transition text-sm uppercase tracking-wider border border-transparent hover:border-white/10"
                  >
                    О ресторане
                  </button>
                  <button 
                    onClick={() => { scrollTo('#gallery'); setMenuOpen(false); }} 
                    className="text-left px-4 py-3 rounded-lg hover:bg-white/10 hover:text-amber-400 transition text-sm uppercase tracking-wider border border-transparent hover:border-white/10"
                  >
                    Атмосфера
                  </button>
                  <a 
                    href="/gallery" 
                    onClick={() => setMenuOpen(false)}
                    className="text-left px-4 py-3 rounded-lg hover:bg-white/10 hover:text-amber-400 transition text-sm uppercase tracking-wider border border-transparent hover:border-white/10"
                  >
                    Фотогалерея
                  </a>
                  <a 
                    href="/halls" 
                    onClick={() => setMenuOpen(false)}
                    className="text-left px-4 py-3 rounded-lg hover:bg-white/10 hover:text-amber-400 transition text-sm uppercase tracking-wider border border-transparent hover:border-white/10"
                  >
                    Залы
                  </a>
                  <button 
                    onClick={() => { scrollTo('#reviews'); setMenuOpen(false); }} 
                    className="text-left px-4 py-3 rounded-lg hover:bg-white/10 hover:text-amber-400 transition text-sm uppercase tracking-wider border border-transparent hover:border-white/10"
                  >
                    Отзывы
                  </button>
                  <button 
                    onClick={() => { scrollTo('#booking'); setMenuOpen(false); }} 
                    className="text-left px-4 py-3 rounded-lg hover:bg-white/10 hover:text-amber-400 transition text-sm uppercase tracking-wider border border-transparent hover:border-white/10"
                  >
                    Бронь
                  </button>
                  <a 
                    href="/events" 
                    onClick={() => setMenuOpen(false)}
                    className="text-left px-4 py-3 rounded-lg hover:bg-white/10 hover:text-amber-400 transition text-sm uppercase tracking-wider border border-transparent hover:border-white/10"
                  >
                    События
                  </a>
                  <a 
                    href="/vacancies" 
                    onClick={() => setMenuOpen(false)}
                    className="text-left px-4 py-3 rounded-lg hover:bg-white/10 hover:text-amber-400 transition text-sm uppercase tracking-wider border border-transparent hover:border-white/10"
                  >
                    Вакансии
                  </a>
                  <a 
                    href="/blog" 
                    onClick={() => setMenuOpen(false)}
                    className="text-left px-4 py-3 rounded-lg hover:bg-white/10 hover:text-amber-400 transition text-sm uppercase tracking-wider border border-transparent hover:border-white/10"
                  >
                    Новостной блог
                  </a>
                  <a 
                    href="/rules" 
                    onClick={() => setMenuOpen(false)}
                    className="text-left px-4 py-3 rounded-lg hover:bg-white/10 hover:text-amber-400 transition text-sm uppercase tracking-wider border border-transparent hover:border-white/10"
                  >
                    Правила нахождения
                  </a>
                </nav>
              </div>
            </div>
          </>
        )}
      </header>


      {/* HERO */}
      <a id="top" />
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 z-10" />
        <img
          src="/hero-image.jpg"
          alt="Ресторан Кучер и Конга — атмосфера вечера"
          className="w-full h-[80vh] object-cover"
        />
        <div className="absolute inset-0 z-20 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
                <span className="text-white">Кучер</span>
                <span className="text-white mx-3">&</span>
                <span className="text-white">Conga</span>
              </h1>
              <div className="space-y-4 text-lg md:text-xl text-neutral-200 leading-relaxed">
                <p>
                  Кухня нашего Ресторана - это совершенно новый взгляд на продукт, постоянный поиск новых сочетаний и вкусов.
                </p>
                <p className="text-neutral-300">
                  В своей работе мы руководствуемся инновационным подходом в приготовлении продуктов с использованием новых техник и технологий.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={() => scrollTo('#booking')}
                  className="px-8 py-3 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition text-center w-full sm:w-[220px] h-[48px]"
                >
                  Забронировать стол
                </button>
                <button
                  onClick={() => scrollTo('#menu')}
                  className="px-8 py-3 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition text-center w-full sm:w-[220px] h-[48px]"
                >
                  Смотреть меню
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section id="about" className="py-16 border-t border-white/10 pt-20 md:pt-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl md:text-4xl font-bold uppercase tracking-wider">ПОЧЕМУ ВЫБИРАЮТ НАС</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
              <Utensils className="w-10 h-10 text-amber-400 mb-4" />
              <h3 className="mt-4 text-xl font-semibold">Изысканное меню</h3>
              <p className="mt-2 text-neutral-300">Наше меню сочетает в себе классические рецепты и современные гастрономические тенденции, предлагая блюда, которые восхищают своим вкусом и подачей</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
              <Home className="w-10 h-10 text-amber-400 mb-4" />
              <h3 className="mt-4 text-xl font-semibold">Атмосферный интерьер</h3>
              <p className="mt-2 text-neutral-300">Каждая деталь интерьера создаёт неповторимую атмосферу уюта и стиля, погружая вас в мир эстетического наслаждения и комфорта</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
              <Users className="w-10 h-10 text-amber-400 mb-4" />
              <h3 className="mt-4 text-xl font-semibold">Безупречное обслуживание</h3>
              <p className="mt-2 text-neutral-300">Наш персонал – это команда профессионалов, которые заботятся о каждом госте, обеспечивая высокий уровень сервиса и создавая приятные впечатления от посещения</p>
            </div>
          </div>
        </div>
      </section>

      {/* ПОЛНОЕ МЕНЮ */}
      <div className="pt-20 md:pt-0">
        <EnhancedMenuSection onAddToCart={add} />
      </div>


      {/* GALLERY */}
      <section id="gallery" className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl md:text-4xl font-bold uppercase tracking-wider">Атмосфера</h2>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3">
            {gallery.map((src, idx) => (
              <img key={idx} src={src} alt={`Галерея ${idx + 1}`} className="h-56 md:h-64 w-full object-cover rounded-xl border border-white/10" />
            ))}
          </div>
        </div>
      </section>

      {/* PHOTO GALLERY */}
      <section id="photo-gallery" className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl md:text-4xl font-bold uppercase tracking-wider">Фотогалерея</h2>
          <div className="mt-10 text-center text-neutral-400">
            <p>Фотографии будут добавлены позже</p>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl md:text-4xl font-bold uppercase tracking-wider">Отзывы гостей</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Анна', text: 'Отличная кухня и сервис. Обязательно вернёмся на дегустацию вин!' },
              { name: 'Игорь', text: 'Стейки топовые, уголь и прожарка как надо. Атмосфера — ❤' },
              { name: 'Мария', text: 'Красиво, вкусно, удобно добираться. Советую десерты и кофе.' },
            ].map((r, i) => (
              <div key={i} className="rounded-2xl bg-white/5 p-6 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/10" />
                  <div>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs text-neutral-400">Гость</div>
                  </div>
                </div>
                <p className="mt-4 text-neutral-300">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING FORM */}
      <section id="booking" className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl rounded-2xl bg-white/5 border border-white/10 p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-center">Забронировать стол</h2>
            <p className="mt-2 text-neutral-300 text-center">Оставьте контакты — администратор подтвердит бронь.</p>
            <form onSubmit={submitBooking} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="name" className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-amber-400" placeholder="Имя" required />
              <input name="phone" className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-amber-400" placeholder="Телефон" required />
              <input name="date" type="date" className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-amber-400" required />
              <input name="time" type="time" className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-amber-400" required />
              <div className="md:col-span-2 flex items-center gap-3">
                <label htmlFor="guests" className="text-sm text-neutral-300">Гостей:</label>
                <input
                  id="guests" name="guests" type="number" min={1} value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-amber-400"
                />
              </div>
              <textarea name="comment" className="md:col-span-2 bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-amber-400" rows={3} placeholder="Пожелания (необязательно)" />
              <button type="submit" className="md:col-span-2 px-8 py-3 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition">
                Отправить заявку
              </button>
            </form>

          </div>
        </div>
      </section>

      {/* CONTACTS */}
      <section className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
              <div className="uppercase text-xs tracking-widest text-neutral-400">Телефон</div>
              <a href="tel:+74992299222" className="mt-2 block text-lg hover:text-amber-400"><Phone className="inline w-4 h-4 mr-2" />+7 (499) 229-92-22</a>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
              <div className="uppercase text-xs tracking-widest text-neutral-400">Адрес</div>
              <div className="mt-2 text-lg"><MapPin className="inline w-4 h-4 mr-2" />г. Дмитров, ул. Промышленная 20 Б</div>
              <a href="https://yandex.kz/maps/-/CLvIEB9m" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-amber-400 hover:underline">Проложить маршрут</a>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
              <div className="uppercase text-xs tracking-widest text-neutral-400">Часы работы</div>
              <div className="mt-2 text-lg"><Clock className="inline w-4 h-4 mr-2" />Пн–Вс: 12:00 — 00:00</div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center">
              <img src="/kongo_logo_main.svg" alt="КОНГО" className="h-6 w-auto" />
            </div>
            <div className="text-sm text-neutral-400">© {new Date().getFullYear()} Ресторан «Кучер и Конга». Все права защищены.</div>
            <div className="text-sm text-neutral-400 flex items-center gap-6 flex-wrap">
              <a href="/privacy" className="hover:text-amber-400">Политика конфиденциальности</a>
              <a href="/terms" className="hover:text-amber-400">Пользовательское соглашение</a>
            </div>
          </div>
        </div>
      </footer>

      {/* --- CART DRAWER --- */}
      {cartOpen && <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setCartOpen(false)} aria-hidden />}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full sm:w-[420px] bg-neutral-950 border-l border-white/10 transform transition-transform duration-300 ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Корзина"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span className="font-semibold">Корзина</span>
            {count > 0 && <span className="text-sm text-neutral-400">({count})</span>}
          </div>
          <button onClick={() => setCartOpen(false)} aria-label="Закрыть" className="p-2 rounded hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="h-[calc(100%-230px)] overflow-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-neutral-400">Ваша корзина пуста. Добавьте блюда из меню.</div>
          ) : (
            items.map((i) => (
              <div key={i.id} className="flex gap-3 rounded-xl border border-white/10 p-3">
                <img src={i.img} alt={i.name} className="h-16 w-16 object-cover rounded-lg" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{i.name}</div>
                      <div className="text-sm text-neutral-400">{i.price.toLocaleString('ru-RU')} ₽</div>
                    </div>
                    <button onClick={() => remove(i.id)} className="p-1 rounded hover:bg-white/5" aria-label="Удалить позицию">
                      <Trash2 className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => dec(i.id)}
                        className="p-2 rounded-full border border-white/20 hover:border-white/60"
                        aria-label="Убавить"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={i.qty}
                        onChange={(e) => {
                          const newQty = parseInt(e.target.value) || 1;
                          if (newQty > 0) {
                            add({ ...i, qty: newQty });
                          }
                        }}
                        className="w-12 text-center bg-black/40 border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-amber-400 text-sm"
                      />
                      <button
                        onClick={() => add(i)}
                        className="p-2 rounded-full bg-amber-400 text-black hover:bg-amber-300"
                        aria-label="Добавить"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="font-semibold">{(i.qty * i.price).toLocaleString('ru-RU')} ₽</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4 space-y-3 bg-neutral-950">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Итого</span>
            <span className="text-xl font-bold">{total.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled={items.length === 0}
              onClick={() => setDeliveryOpen(true)}
              className="w-full px-6 py-3 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition disabled:opacity-50"
            >
              Доставка
            </button>
          </div>
          <p className="text-[12px] text-neutral-500">
            Оплата на месте/при получении. Администратор свяжется для подтверждения.
          </p>
        </div>
      </aside>

      {/* --- DELIVERY MODAL --- */}
      {deliveryOpen && <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setDeliveryOpen(false)} aria-hidden />}
      <div
        className={`fixed inset-x-0 top-1/2 -translate-y-1/2 z-50 mx-auto w-[94%] max-w-lg rounded-2xl bg-neutral-950 border border-white/10 p-6 transition ${
          deliveryOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        role="dialog"
        aria-label="Оформление доставки"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Оформление доставки</div>
          <button onClick={() => setDeliveryOpen(false)} className="p-2 rounded hover:bg-white/5" aria-label="Закрыть">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submitDelivery} className="grid grid-cols-1 gap-3">
          <input
            required placeholder="Имя"
            className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-amber-400"
            value={dForm.name}
            onChange={e => setDForm(o => ({ ...o, name: e.target.value }))}
          />
          <input
            required placeholder="Телефон"
            className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-amber-400"
            value={dForm.phone}
            onChange={e => setDForm(o => ({ ...o, phone: e.target.value }))}
          />
          <input
            required placeholder="Адрес доставки"
            className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-amber-400"
            value={dForm.address}
            onChange={e => setDForm(o => ({ ...o, address: e.target.value }))}
          />
          <textarea
            rows={3} placeholder="Комментарий (необязательно)"
            className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-amber-400"
            value={dForm.comment}
            onChange={e => setDForm(o => ({ ...o, comment: e.target.value }))}
          />
          <button
            type="submit"
            disabled={items.length === 0}
            className="mt-2 px-8 py-3 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition disabled:opacity-50"
          >
            Отправить заявку в Telegram
          </button>
          <div className="text-sm text-neutral-400">
            В заказе позиций: <b>{items.reduce((s,i)=>s+i.qty,0)}</b>, на сумму <b>{total.toLocaleString('ru-RU')} ₽</b>
          </div>
        </form>
      </div>
    </div>
  );
}
