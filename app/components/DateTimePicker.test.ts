import { describe, expect, it } from 'vitest';

type CalendarDateState = {
  selectedDate: string;
  visibleMonth: string;
};

type CalendarDateStateReducer = (
  state: CalendarDateState,
  action: { type: 'navigate'; months: number },
) => CalendarDateState;

type Restrictions = { dates: string[]; times: Record<string, string[]> };

type PickerModule = {
  isPickerDateRestricted: (date: string, restrictions: Restrictions, useReservationRestrictions: boolean) => boolean;
  resolvePickerTimes: (date: string, availableTimes: string[] | null, provider?: (date: string) => string[]) => string[] | null;
};

describe('DateTimePicker calendar navigation', () => {
  it('keeps 22 August selected while browsing forward to December', async () => {
    const module = await import('./DateTimePicker') as unknown as Record<string, unknown>;
    const reducer = module.calendarDateStateReducer as CalendarDateStateReducer | undefined;

    expect(reducer).toBeTypeOf('function');

    let state: CalendarDateState = {
      selectedDate: '2026-08-22',
      visibleMonth: '2026-08-01',
    };
    for (let month = 0; month < 4; month += 1) {
      state = reducer!(state, { type: 'navigate', months: 1 });
    }

    expect(state).toEqual({
      selectedDate: '2026-08-22',
      visibleMonth: '2026-12-01',
    });
  });
});

describe('DateTimePicker consumer policy', () => {
  it('ignores reservation date closures when the consumer opts out', async () => {
    const module = await import('./DateTimePicker') as unknown as PickerModule;
    const restrictions = { dates: ['2026-09-01', '2026-12-20'], times: {} };

    expect(module.isPickerDateRestricted('2026-09-01', restrictions, true)).toBe(true);
    expect(module.isPickerDateRestricted('2026-09-01', restrictions, false)).toBe(false);
    expect(module.isPickerDateRestricted('2026-12-20', restrictions, false)).toBe(false);
  });

  it('uses date-aware slots and preserves an intentionally empty day', async () => {
    const module = await import('./DateTimePicker') as unknown as PickerModule;

    expect(module.resolvePickerTimes('2026-07-13', null, () => ['12:00', '12:15'])).toEqual(['12:00', '12:15']);
    expect(module.resolvePickerTimes('2026-07-13', null, () => [])).toEqual([]);
  });
});
