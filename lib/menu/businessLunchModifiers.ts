import type { ModifierGroup } from '@/types/index';

export type BusinessLunchModifier = {
  group: string;
  option: string;
  groupId?: string;
  optionId?: string;
};

// Название блюда-модификатора служит управляемой из iiko пометкой. Границы
// нужны, чтобы не принять за пометку случайную часть более длинного слова.
// Необязательная первая «б» покрывает фактическую опечатку iiko «бБЕЗ ГАРНИРА».
const NO_GARNISH_MARKER = /(?:^|[^а-яё])б?без\s+гарнира(?:$|[^а-яё])/i;

export function hasNoGarnishMarker(name: string): boolean {
  return NO_GARNISH_MARKER.test(name);
}

export function isGarnishGroup(name: string): boolean {
  return name.toLocaleLowerCase('ru-RU').includes('гарнир');
}

/**
 * Гарнир отключается, когда выбранное блюдо из любой другой группы содержит
 * пометку «Без гарнира». Сама группа гарнира не может включить это правило.
 */
export function selectedDishHasNoGarnish(
  groups: ModifierGroup[],
  choices: Record<string, string>,
): boolean {
  return groups.some((group) => {
    if (isGarnishGroup(group.name)) return false;
    const selectedId = choices[group.id];
    const selectedOption = group.options.find((option) => option.id === selectedId);
    return selectedOption ? hasNoGarnishMarker(selectedOption.name) : false;
  });
}

/**
 * Серверная страховка: отмеченный бизнес-ланч никогда не отправляет гарнир в
 * iiko, даже если устаревшая корзина или изменённый запрос всё ещё его содержит.
 */
export function withoutGarnishForMarkedLunch<T extends BusinessLunchModifier>(
  modifiers: T[] | undefined,
  isBusinessLunch: boolean,
): T[] {
  const source = modifiers || [];
  if (!isBusinessLunch) return source;

  const marked = source.some(
    (modifier) => !isGarnishGroup(modifier.group) && hasNoGarnishMarker(modifier.option),
  );

  return marked ? source.filter((modifier) => !isGarnishGroup(modifier.group)) : source;
}
