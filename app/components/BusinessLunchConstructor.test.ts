import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import BusinessLunchConstructor from './BusinessLunchConstructor';

describe('BusinessLunchConstructor set cards', () => {
  it('shows only the concise set composition instead of the photo disclaimer', () => {
    const html = renderToStaticMarkup(
      React.createElement(BusinessLunchConstructor, {
        sets: [
          {
            id: 'set-1',
            name: 'Бизнес ланчи СЕТ № 1',
            price: 580,
            description:
              'Комплексный бизнес-ланч: салат, первое блюдо и второе блюдо. Фотографии блюд носят иллюстративный характер. Внешний вид и сервировка могут незначительно отличаться.',
            modifierGroups: [],
          },
        ],
        onAddToCart: () => undefined,
      }),
    );

    expect(html).toContain('В сет входит: Салат, Первое и Второе');
    expect(html).not.toContain('Фотографии блюд');
  });
});
