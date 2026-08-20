import { describe, it, expect } from 'vitest';
import {
  BANQUET_MENU_BOOKING_CTA,
  banquetSaladNames,
  getBanquetPackage,
  isBanquetPackageAllowed,
  isBanquetSelectionComplete,
  normalizeBanquetSelection,
} from './banquetPackages';

it('uses the exact banquet-menu booking call to action', () => {
  expect(BANQUET_MENU_BOOKING_CTA)
    .toBe('Выбрать банкетное меню и перейти к бронированию');
});

describe('isBanquetPackageAllowed', () => {
  it('conga filter allows conga-7500', () => {
    expect(isBanquetPackageAllowed('conga', 'conga-7500')).toBe(true);
  });

  it('conga filter blocks kucher-5000', () => {
    expect(isBanquetPackageAllowed('conga', 'kucher-5000')).toBe(false);
  });

  it('all filter allows conga-7500', () => {
    expect(isBanquetPackageAllowed('all', 'conga-7500')).toBe(true);
  });

  it('all filter allows kucher-5000', () => {
    expect(isBanquetPackageAllowed('all', 'kucher-5000')).toBe(true);
  });

  it('null filter returns false regardless of package', () => {
    expect(isBanquetPackageAllowed(null, 'conga-7500')).toBe(false);
  });

  it('null packageId returns false', () => {
    expect(isBanquetPackageAllowed('all', null)).toBe(false);
  });

  it('undefined packageId returns false', () => {
    expect(isBanquetPackageAllowed('conga', undefined)).toBe(false);
  });

  it('unknown packageId returns false', () => {
    expect(isBanquetPackageAllowed('all', 'nonexistent-pkg')).toBe(false);
  });
});

it('normalizes salad ids, removes duplicates, and limits the required count', () => {
  expect(normalizeBanquetSelection('conga-6000', [
    'caesar-shrimp',
    'caesar-shrimp',
    'kucher',
    'olivier-beef',
    'duck-fruit-chutney',
  ])).toEqual({
    packageId: 'conga-6000',
    saladIds: ['caesar-shrimp', 'kucher', 'olivier-beef'],
  });
});

it('rejects unknown salads and salads unavailable in the selected menu', () => {
  expect(normalizeBanquetSelection('kucher-5000', [
    'duck-fruit-chutney',
    'unknown',
    'olivier-beef',
  ])).toEqual({ packageId: 'kucher-5000', saladIds: ['olivier-beef'] });
});

it('requires the exact salad count and resolves ids to public names', () => {
  expect(isBanquetSelectionComplete('conga-7500', [
    'caesar-shrimp', 'kucher', 'olivier-beef', 'duck-fruit-chutney',
  ])).toBe(true);
  expect(isBanquetSelectionComplete('conga-7500', ['caesar-shrimp'])).toBe(false);
  expect(banquetSaladNames('conga-6000', ['caesar-shrimp', 'kucher'])).toEqual([
    'Цезарь с креветками',
    'Кучер',
  ]);
  expect(getBanquetPackage('conga-6000')?.pricePerPerson).toBe(6000);
});
