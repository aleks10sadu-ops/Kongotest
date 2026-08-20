import { describe, it, expect } from 'vitest';
import { composeReservationComment } from './composeReservation';

describe('composeReservationComment', () => {
  it('includes adults/children/type/hall and preorder items+sum', () => {
    const s = composeReservationComment({
      adults: 10,
      children: 2,
      bookingType: 'preorder',
      hallName: 'Conga',
      cartItems: [
        { name: 'Цезарь', qty: 2, price: 450 },
        { name: 'Борщ', qty: 1, price: 380 },
      ],
      cartFoodSum: 1280,
      comment: 'У окна',
    });
    expect(s).toMatch(/Взрослых: 10/);
    expect(s).toMatch(/Детей: 2/);
    expect(s).toMatch(/предзаказ/i);
    expect(s).toMatch(/Conga/);
    expect(s).toMatch(/Цезарь × 2/);
    expect(s).toMatch(/1280/);
    expect(s).toMatch(/У окна/);
  });

  it('renders structured banquet context without package wording', () => {
    const s = composeReservationComment({
      adults: 12,
      children: 4,
      bookingType: 'banquet',
      hallName: 'Изумрудный зал',
      cartItems: [],
      cartFoodSum: 0,
      banquetMenuName: 'Conga — банкетное меню 6000 ₽/чел',
      banquetSaladNames: ['Цезарь с креветками', 'Кучер', 'Оливье с говядиной'],
      calculatedAmount: 72000,
      minimumOrder: 70000,
      source: 'страница зала',
    });
    expect(s).toContain('Тип: Банкетное меню');
    expect(s).toContain('Зал: Изумрудный зал');
    expect(s).toContain('Банкетное меню: Conga — банкетное меню 6000 ₽/чел');
    expect(s).toContain('Салаты: Цезарь с креветками, Кучер, Оливье с говядиной');
    expect(s).toContain('Расчётная сумма: 72 000 ₽');
    expect(s).toContain('Минимальная сумма зала: 70 000 ₽');
    expect(s).toContain('Источник: страница зала');
    expect(s).not.toMatch(/банкетный пакет/i);
  });

  it('keeps an event ref on the single CRM source line and preserves no-ref labels', () => {
    const event = composeReservationComment({
      adults: 2,
      children: 0,
      bookingType: 'onsite',
      hallName: null,
      cartItems: [],
      cartFoodSum: 0,
      source: 'страница события',
      sourceRef: 'jazz-vecher',
    });
    const generic = composeReservationComment({
      adults: 2,
      children: 0,
      bookingType: 'onsite',
      hallName: null,
      cartItems: [],
      cartFoodSum: 0,
      source: 'главная страница',
    });

    expect(event).toContain('Источник: страница события — jazz-vecher');
    expect(event.match(/^Источник:/gm)).toHaveLength(1);
    expect(generic).toContain('Источник: главная страница');
    expect(generic).not.toContain(' — ');
  });
});
