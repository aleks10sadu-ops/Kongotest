'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Phone, MapPin, Clock, Star, Utensils, Wine,
  ShoppingCart, Plus, Minus, X, Trash2
} from 'lucide-react';

/* --- ДАННЫЕ --- */
const hits = [
  { id: 'ribeye', name: 'Стейк Рибай', desc: 'мраморная говядина, соус демигласс', price: 8900, img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&h=700&fit=crop' },
  { id: 'seafood-pasta', name: 'Паста с морепродуктами', desc: 'креветки, мидии, томаты конкассе', price: 5200, img: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=900&h=700&fit=crop' },
  { id: 'tiramisu', name: 'Тирамису', desc: 'маскарпоне, эспрессо, какао', price: 2400, img: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=900&h=700&fit=crop' },
];

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
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...prev, { ...product, qty: 1 }];
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
  const { items, add, dec, remove, clear, count, total } = useCart();

  // Доставка: локальный стейт формы
  const [dForm, setDForm] = useState({ name: '', phone: '', address: '', comment: '' });

  // Блокируем скролл body при открытых модалках
  useEffect(() => {
    const opened = cartOpen || deliveryOpen;
    if (opened) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => (document.body.style.overflow = prev);
    }
  }, [cartOpen, deliveryOpen]);

  // Закрытие по ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setDeliveryOpen(false);
        setCartOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Прокрутка к секциям
  const scrollTo = (id) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => scrollTo('#top')} className="text-xl tracking-widest font-bold">КОНГО</button>
          <nav className="hidden md:flex items-center gap-8 text-sm uppercase tracking-wider">
            <button onClick={() => scrollTo('#menu')} className="hover:text-amber-400">Меню</button>
            <button onClick={() => scrollTo('#about')} className="hover:text-amber-400">О ресторане</button>
            <button onClick={() => scrollTo('#gallery')} className="hover:text-amber-400">Атмосфера</button>
            <button onClick={() => scrollTo('#reviews')} className="hover:text-amber-400">Отзывы</button>
            <button onClick={() => scrollTo('#booking')} className="hover:text-amber-400">Бронь</button>
          </nav>
          <div className="flex items-center gap-4">
            <a href="tel:+74990000000" className="hidden md:flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4" /> +7 (499) 000-00-00
            </a>
            <button
              aria-label="Открыть корзину"
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-lg border border-white/10 hover:border-white/40 transition"
            >
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 text-[11px] leading-none bg-amber-400 text-black px-1.5 py-0.5 rounded-full font-bold">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <a id="top" />
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 z-10" />
        <img
          src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=2000&h=1200&fit=crop"
          alt="Ресторан Конго — атмосфера вечера"
          className="w-full h-[80vh] object-cover"
        />
        <div className="absolute inset-0 z-20 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
                АТМОСФЕРА<br />Большого вкуса
              </h1>
              <p className="mt-5 text-lg text-neutral-200">
                Ужин при свечах, авторская кухня и тщательно подобранная винная карта.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={() => scrollTo('#booking')}
                  className="px-8 py-3 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition"
                >
                  Забронировать стол
                </button>
                <button
                  onClick={() => scrollTo('#menu')}
                  className="px-8 py-3 rounded-full border border-white/20 hover:border-white/60 transition"
                >
                  Смотреть меню
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section id="about" className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl md:text-4xl font-bold uppercase tracking-wider">Почему КОНГО</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
              <Utensils className="w-8 h-8 text-amber-400" />
              <h3 className="mt-4 text-xl font-semibold">Авторская кухня</h3>
              <p className="mt-2 text-neutral-300">Локальные продукты, огонь и дым, точная подача.</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
              <Wine className="w-8 h-8 text-amber-400" />
              <h3 className="mt-4 text-xl font-semibold">Винная карта</h3>
              <p className="mt-2 text-neutral-300">Классика Старого Света и яркие нью-вейвы.</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
              <Clock className="w-8 h-8 text-amber-400" />
              <h3 className="mt-4 text-xl font-semibold">Удобная локация</h3>
              <p className="mt-2 text-neutral-300">10 минут от центра. Парковка и поздние часы.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HITS + КОНТРОЛЫ КОРЗИНЫ */}
      <section id="menu" className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl md:text-4xl font-bold uppercase tracking-wider">Хит-меню</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {hits.map(i => {
              const qty = qtyInCart(i.id);
              return (
                <div key={i.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <img src={i.img} alt={i.name} className="h-60 w-full object-cover transition group-hover:scale-105" />
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-amber-400">
                      <Star className="w-4 h-4" /><span className="text-xs uppercase tracking-widest">Рекомендация шефа</span>
                    </div>
                    <h3 className="mt-2 text-xl font-semibold">{i.name}</h3>
                    <p className="mt-1 text-neutral-300">{i.desc}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold">{i.price.toLocaleString('ru-RU')} ₸</span>

                      {/* Контрол добавления */}
                      {qty === 0 ? (
                        <button
                          onClick={() => add(i)}
                          className="px-4 py-2 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition"
                        >
                          Добавить
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => dec(i.id)}
                            className="p-2 rounded-full border border-white/20 hover:border-white/60"
                            aria-label="Убавить"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{qty}</span>
                          <button
                            onClick={() => add(i)}
                            className="p-2 rounded-full bg-amber-400 text-black hover:bg-amber-300"
                            aria-label="Добавить"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Быстрая ссылка в корзину */}
                    {qty > 0 && (
                      <button
                        onClick={() => setCartOpen(true)}
                        className="mt-3 text-amber-400 text-sm hover:underline"
                      >
                        Перейти в корзину
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 hover:border-white/60 transition"
            >
              <ShoppingCart className="w-4 h-4" /> Открыть корзину
            </button>
            <button
              onClick={() => scrollTo('#booking')}
              className="inline-block px-6 py-3 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition"
            >
              Забронировать стол
            </button>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3л md:text-4xl font-bold uppercase tracking-wider">Атмосфера</h2>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3">
            {gallery.map((src, idx) => (
              <img key={idx} src={src} alt={`Галерея ${idx + 1}`} className="h-56 md:h-64 w-full object-cover rounded-xl border border-white/10" />
            ))}
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

            {items.length > 0 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setCartOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 hover:border-white/60 transition"
                >
                  <ShoppingCart className="w-4 h-4" /> Перейти к корзине ({count})
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CONTACTS */}
      <section className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
              <div className="uppercase text-xs tracking-widest text-neutral-400">Телефон</div>
              <a href="tel:+74990000000" className="mt-2 block text-lg hover:text-amber-400"><Phone className="inline w-4 h-4 mr-2" />+7 (499) 000-00-00</a>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
              <div className="uppercase text-xs tracking-widest text-neutral-400">Адрес</div>
              <div className="mt-2 text-lg"><MapPin className="inline w-4 h-4 mr-2" />г. Москва, ул. Конго, 1</div>
              <a href="https://yandex.ru/maps" className="mt-3 inline-block text-amber-400 hover:underline">Проложить маршрут</a>
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
            <div className="text-xl tracking-widest font-bold">КОНГО</div>
            <div className="text-sm text-neutral-400">© {new Date().getFullYear()} Ресторан «Конго». Все права защищены.</div>
            <div className="text-sm text-neutral-400 flex items-center gap-6">
              <a href="#" className="hover:text-amber-400">Политика конфиденциальности</a>
              <a href="#" className="hover:text-amber-400">Пользовательское соглашение</a>
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
                      <div className="text-sm text-neutral-400">{i.price.toLocaleString('ru-RU')} ₸</div>
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
                      <span className="w-8 text-center">{i.qty}</span>
                      <button
                        onClick={() => add(i)}
                        className="p-2 rounded-full bg-amber-400 text-black hover:bg-amber-300"
                        aria-label="Добавить"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="font-semibold">{(i.qty * i.price).toLocaleString('ru-RU')} ₸</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4 space-y-3 bg-neutral-950">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Итого</span>
            <span className="text-xl font-bold">{total.toLocaleString('ru-RU')} ₸</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled={items.length === 0}
              onClick={() => { setCartOpen(false); scrollTo('#booking'); }}
              className="flex-1 px-6 py-3 rounded-full bg-amber-400 text-black font-semibold hover:bg-amber-300 transition disabled:opacity-50"
            >
              Бронь
            </button>
            <button
              disabled={items.length === 0}
              onClick={() => setDeliveryOpen(true)}
              className="flex-1 px-6 py-3 rounded-full border border-white/20 hover:border-white/60 transition disabled:opacity-50"
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
        <form
          onSubmit={submitDelivery}
          className="grid grid-cols-1 gap-3"
        >
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
            В заказе позиций: <b>{items.reduce((s,i)=>s+i.qty,0)}</b>, на сумму <b>{total.toLocaleString('ru-RU')} ₸</b>
          </div>
        </form>
      </div>
    </div>
  );
                                            }    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
    category: 'Основные блюда',
  },
  {
    id: 5,
    name: 'Тирамису',
    description: 'Классический итальянский десерт с маскарпоне',
    price: 450,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop',
    category: 'Десерты',
  },
  {
    id: 6,
    name: 'Томленая щека быка',
    description: 'с овощами и пряными травами',
    price: 1850,
    image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=300&fit=crop',
    category: 'Основные блюда',
  },
];

const tables = [
  { id: 1, number: 1, seats: 2, status: 'available' },
  { id: 2, number: 2, seats: 4, status: 'available' },
  { id: 3, number: 3, seats: 4, status: 'booked' },
  { id: 4, number: 4, seats: 6, status: 'available' },
  { id: 5, number: 5, seats: 2, status: 'booked' },
  { id: 6, number: 6, seats: 8, status: 'available' },
];

export default function RestaurantWebsite() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);

  const addToCart = (item) => {
    const existing = cart.find((i) => i.id === item.id);
    if (existing) {
      setCart(cart.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-md fixed w-full top-0 z-50">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-orange-600">Kucher&amp;Conga</div>

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8">
              <button onClick={() => setActiveSection('home')} className="text-gray-700 hover:text-orange-600 transition">Главная</button>
              <button onClick={() => setActiveSection('menu')} className="text-gray-700 hover:text-orange-600 transition">Меню</button>
              <button onClick={() => setActiveSection('booking')} className="text-gray-700 hover:text-orange-600 transition">Бронирование</button>
              <button onClick={() => setActiveSection('delivery')} className="text-gray-700 hover:text-orange-600 transition">Доставка</button>
              <button onClick={() => setActiveSection('contact')} className="text-gray-700 hover:text-orange-600 transition">Контакты</button>
            </div>

            <div className="flex items-center space-x-4">
              <button type="button" className="relative p-2 hover:bg-gray-100 rounded-full transition">
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                className="md:hidden p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Открыть меню"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-2">
              <button onClick={() => { setActiveSection('home'); setIsMenuOpen(false); }} className="block w-full text-left py-2 px-4 hover:bg-gray-100 rounded">Главная</button>
              <button onClick={() => { setActiveSection('menu'); setIsMenuOpen(false); }} className="block w-full text-left py-2 px-4 hover:bg-gray-100 rounded">Меню</button>
              <button onClick={() => { setActiveSection('booking'); setIsMenuOpen(false); }} className="block w-full text-left py-2 px-4 hover:bg-gray-100 rounded">Бронирование</button>
              <button onClick={() => { setActiveSection('delivery'); setIsMenuOpen(false); }} className="block w-full text-left py-2 px-4 hover:bg-gray-100 rounded">Доставка</button>
              <button onClick={() => { setActiveSection('contact'); setIsMenuOpen(false); }} className="block w-full text-left py-2 px-4 hover:bg-gray-100 rounded">Контакты</button>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        {/* Hero Section */}
        {activeSection === 'home' && (
          <section className="relative h-[600px] bg-gradient-to-r from-orange-600 to-orange-500">
            <div className="absolute inset-0 bg-black opacity-50" />
            <div className="relative container mx-auto px-4 h-full flex items-center">
              <div className="text-white max-w-2xl">
                <h1 className="text-5xl md:text-6xl font-bold mb-4">Добро пожаловать в Kucher&amp;Conga</h1>
                <p className="text-xl mb-8">Традиции, утончённый вкус и безупречная атмосфера</p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setActiveSection('menu')}
                    className="bg-white text-orange-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
                  >
                    Смотреть меню
                  </button>
                  <button
                    onClick={() => setActiveSection('booking')}
                    className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-orange-600 transition"
                  >
                    Забронировать стол
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Menu Section */}
        {activeSection === 'menu' && (
          <section className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Наше меню</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {menuItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                  <div className="p-6">
                    <div className="text-sm text-orange-600 mb-2">{item.category}</div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800">{item.name}</h3>
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-gray-800">{item.price} ₽</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition"
                      >
                        В корзину
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Booking Section */}
        {activeSection === 'booking' && (
          <section className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Бронирование столика</h2>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                <h3 className="text-2xl font-bold mb-6">Доступные столики</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {tables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => table.status === 'available' && setSelectedTable(table)}
                      disabled={table.status === 'booked'}
                      className={`p-6 rounded-lg border-2 transition ${
                        table.status === 'booked'
                          ? 'bg-gray-200 border-gray-300 cursor-not-allowed'
                          : selectedTable?.id === table.id
                          ? 'bg-orange-100 border-orange-600'
                          : 'bg-white border-gray-300 hover:border-orange-600'
                      }`}
                    >
                      <div className="text-lg font-bold">Стол {table.number}</div>
                      <div className="text-sm text-gray-600">{table.seats} мест</div>
                      <div className={`text-sm mt-2 ${table.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                        {table.status === 'available' ? 'Свободен' : 'Забронирован'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedTable && (
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <h3 className="text-2xl font-bold mb-6">Детали бронирования</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Выбранный стол</label>
                      <input
                        type="text"
                        value={`Стол ${selectedTable.number} (${selectedTable.seats} мест)`}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Дата</label>
                      <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Время</label>
                      <input type="time" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Имя</label>
                      <input type="text" placeholder="Ваше имя" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Телефон</label>
                      <input type="tel" placeholder="+7 (999) 999-99-99" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Бронирование отправлено!');
                      }}
                      className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
                    >
                      Забронировать
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Delivery Section */}
        {activeSection === 'delivery' && (
          <section className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Оформление доставки</h2>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6">Ваш заказ</h3>
                {cart.length === 0 ? (
                  <p className="text-gray-600">Корзина пуста. Добавьте блюда из меню.</p>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center border-b pb-4">
                          <div>
                            <div className="font-semibold">{item.name}</div>
                            <div className="text-sm text-gray-600">Количество: {item.quantity}</div>
                          </div>
                          <div className="font-bold">{item.price * item.quantity} ₽</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-xl font-bold border-t pt-4">
                      <span>Итого:</span>
                      <span>{cartTotal} ₽</span>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6">Данные доставки</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Имя</label>
                    <input type="text" placeholder="Ваше имя" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Телефон</label>
                    <input type="tel" placeholder="+7 (999) 999-99-99" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Адрес доставки</label>
                    <input type="text" placeholder="Улица, дом, квартира" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Комментарий к заказу</label>
                    <textarea placeholder="Особые пожелания" rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none" />
                  </div>
                  <button
                    type="submit"
                    disabled={cart.length === 0}
                    className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Оформить заказ на {cartTotal} ₽
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* Contact Section */}
        {activeSection === 'contact' && (
          <section className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Контакты</h2>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6">Свяжитесь с нами</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <MapPin className="w-6 h-6 text-orange-600 mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Адрес</div>
                      <div className="text-gray-600">г. Дмитров, ул. Промышленная 20Б</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Phone className="w-6 h-6 text-orange-600 mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Телефон</div>
                      <div className="text-gray-600">+7 (499) 229-92-22</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Clock className="w-6 h-6 text-orange-600 mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Часы работы</div>
                      <div className="text-gray-600">Пн-Вс: 10:00 - 23:00</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-6">Напишите нам</h3>
                <form className="space-y-4">
                  <input type="text" placeholder="Имя" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none" />
                  <input type="email" placeholder="Email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none" />
                  <textarea placeholder="Сообщение" rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-600 focus:outline-none" />
                  <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition">
                    Отправить
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer — только Kucher&Conga */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-orange-600 mb-4">Kucher&amp;Conga</h3>
              <p className="text-gray-400">Изысканная кухня с 2010 года. Традиции, утончённый вкус и безупречная атмосфера.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Навигация</h4>
              <div className="space-y-2 text-gray-400">
                <div>О нас</div>
                <div>Меню</div>
                <div>Бронирование</div>
                <div>Доставка</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Контакты</h4>
              <div className="space-y-2 text-gray-400">
                <div>+7 (499) 229-92-22</div>
                <div>info@kucherandconga.ru</div>
                <div>г. Дмитров, ул. Промышленная 20Б</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            © 2025 Kucher&amp;Conga. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
  }
