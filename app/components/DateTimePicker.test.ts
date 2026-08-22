import { describe, expect, it } from 'vitest';

type CalendarDateState = {
  selectedDate: string;
  visibleMonth: string;
};

type CalendarDateStateReducer = (
  state: CalendarDateState,
  action: { type: 'navigate'; months: number },
) => CalendarDateState;

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
