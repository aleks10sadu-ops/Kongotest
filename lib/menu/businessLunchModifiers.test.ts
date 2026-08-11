import { describe, expect, it } from 'vitest';
import {
  hasNoGarnishMarker,
  isGarnishGroup,
  selectedDishHasNoGarnish,
  withoutGarnishForMarkedLunch,
} from './businessLunchModifiers';
import type { ModifierGroup } from '@/types/index';

describe('business lunch no-garnish marker', () => {
  it.each([
    'Котлета БЕЗ ГАРНИРА',
    'Котлета без гарнира',
    'Котлета Без гарнира',
    'Котлета Без Гарнира',
    'Котлета (БЕЗ ГАРНИРА)',
    'Свинина по белорусски (бБЕЗ ГАРНИРА)',
    'Котлета  без   гарнира ',
  ])('recognizes %s', (name) => {
    expect(hasNoGarnishMarker(name)).toBe(true);
  });

  it('does not match unrelated text', () => {
    expect(hasNoGarnishMarker('Гарнир на выбор')).toBe(false);
    expect(hasNoGarnishMarker('Небез гарнира')).toBe(false);
  });

  it('recognizes garnish group names', () => {
    expect(isGarnishGroup('Гарнир')).toBe(true);
    expect(isGarnishGroup('ВЫБОР ГАРНИРА')).toBe(true);
    expect(isGarnishGroup('ГАРНИРЫ')).toBe(true);
    expect(isGarnishGroup('Второе блюдо')).toBe(false);
  });
});

describe('selectedDishHasNoGarnish', () => {
  const groups: ModifierGroup[] = [
    {
      id: 'main',
      name: 'Второе блюдо',
      min: 0,
      max: 1,
      options: [
        { id: 'cutlet', name: 'Котлета (БЕЗ ГАРНИРА)', price: 0 },
        { id: 'chicken', name: 'Курица', price: 0 },
      ],
    },
    {
      id: 'side',
      name: 'Выбор гарнира',
      min: 0,
      max: 1,
      options: [{ id: 'none', name: 'Без гарнира', price: 0 }],
    },
  ];

  it('uses a marker on the selected dish', () => {
    expect(selectedDishHasNoGarnish(groups, { main: 'cutlet', side: 'none' })).toBe(true);
    expect(selectedDishHasNoGarnish(groups, { main: 'chicken', side: 'none' })).toBe(false);
  });

  it('does not let a fallback option in the garnish group trigger the rule', () => {
    expect(selectedDishHasNoGarnish(groups, { side: 'none' })).toBe(false);
  });
});

describe('withoutGarnishForMarkedLunch', () => {
  const modifiers = [
    { group: 'Второе блюдо', option: 'Котлета (без гарнира)', groupId: 'main', optionId: 'cutlet' },
    { group: 'Гарнир', option: 'Пюре', groupId: 'side', optionId: 'mash' },
    { group: 'Напиток', option: 'Морс', groupId: 'drink', optionId: 'juice' },
  ];

  it('removes the garnish from a marked business lunch', () => {
    expect(withoutGarnishForMarkedLunch(modifiers, true)).toEqual([
      modifiers[0],
      modifiers[2],
    ]);
  });

  it('leaves ordinary lunches and non-lunch items unchanged', () => {
    const ordinary = modifiers.map((modifier) =>
      modifier.group === 'Второе блюдо' ? { ...modifier, option: 'Котлета' } : modifier,
    );
    expect(withoutGarnishForMarkedLunch(ordinary, true)).toEqual(ordinary);
    expect(withoutGarnishForMarkedLunch(modifiers, false)).toEqual(modifiers);
  });
});
