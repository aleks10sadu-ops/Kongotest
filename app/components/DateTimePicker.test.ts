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
  parseControlledPickerValue: (value: string) => { date: string; time: string } | null;
  moscowDateString: (now: Date) => string;
  isBeforeMoscowToday: (date: string, now: Date) => boolean;
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

  it('keeps controlled local datetimes literal and compares dates against Moscow today', async () => {
    const module = await import('./DateTimePicker') as unknown as PickerModule;
    const instantFromUtc = new Date('2026-08-24T22:30:00.000Z');
    const sameInstantFromEast = new Date('2026-08-25T07:30:00.000+09:00');
    const sameInstantFromWest = new Date('2026-08-24T15:30:00.000-07:00');

    expect(module.parseControlledPickerValue('2026-08-24T00:30:00')).toEqual({
      date: '2026-08-24',
      time: '00:30',
    });
    expect([
      module.moscowDateString(instantFromUtc),
      module.moscowDateString(sameInstantFromEast),
      module.moscowDateString(sameInstantFromWest),
    ]).toEqual(['2026-08-25', '2026-08-25', '2026-08-25']);
    expect(module.isBeforeMoscowToday('2026-08-24', instantFromUtc)).toBe(true);
    expect(module.isBeforeMoscowToday('2026-08-25', instantFromUtc)).toBe(false);
  });
});
