import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({
  dispatchCalendarDate: vi.fn(),
  effects: [] as Array<() => void | (() => void)>,
  pickerRoot: {
    current: {
      contains: vi.fn(),
    },
  },
  refCall: 0,
  setIsOpen: vi.fn(),
  setSelectedTime: vi.fn(),
  stateCall: 0,
}));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useEffect: vi.fn((effect: () => void | (() => void)) => {
      hooks.effects.push(effect);
    }),
    useReducer: vi.fn(() => [{ selectedDate: '2026-07-12', visibleMonth: '2026-07-01' }, hooks.dispatchCalendarDate]),
    useRef: vi.fn((initial) => {
      const call = hooks.refCall++;
      return call === 1 ? hooks.pickerRoot : { current: initial };
    }),
    useState: vi.fn((initial) => {
      const call = hooks.stateCall++;
      if (call === 0) return [true, hooks.setIsOpen];
      if (call === 1) return ['12:00', hooks.setSelectedTime];
      if (call === 2) return [{ dates: [], times: {} }, vi.fn()];
      if (call === 3) return [{ start: '10:00', end: '00:00' }, vi.fn()];
      return [typeof initial === 'function' ? initial() : initial, vi.fn()];
    }),
  };
});

import DateTimePicker from './DateTimePicker';

type ElementNode = {
  props?: {
    'aria-label'?: string;
    className?: string;
    children?: unknown;
    onClick?: () => void;
  };
};

function findElement(node: unknown, predicate: (element: ElementNode) => boolean): ElementNode | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, predicate);
      if (found) return found;
    }
    return undefined;
  }
  if (!node || typeof node !== 'object' || !('props' in node)) return undefined;
  const element = node as ElementNode;
  return predicate(element) ? element : findElement(element.props?.children, predicate);
}

function findElementPath(
  node: unknown,
  predicate: (element: ElementNode) => boolean,
  ancestors: ElementNode[] = [],
): ElementNode[] | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElementPath(child, predicate, ancestors);
      if (found) return found;
    }
    return undefined;
  }
  if (!node || typeof node !== 'object' || !('props' in node)) return undefined;
  const element = node as ElementNode;
  const path = [...ancestors, element];
  return predicate(element) ? path : findElementPath(element.props?.children, predicate, path);
}

describe('DateTimePicker date interaction', () => {
  beforeEach(() => {
    hooks.effects.length = 0;
    hooks.refCall = 0;
    hooks.stateCall = 0;
    hooks.dispatchCalendarDate.mockClear();
    hooks.pickerRoot.current.contains.mockReset();
    hooks.setIsOpen.mockClear();
    hooks.setSelectedTime.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps scrollable ancestors uncovered and closes on an outside click', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.stubGlobal('document', { addEventListener, removeEventListener });

    const picker = DateTimePicker({
      value: '2026-07-12',
      onChange: vi.fn(),
      dateOnly: true,
      useReservationRestrictions: false,
    });
    const fullScreenClickCatcher = findElement(picker, (element) => {
      const classes = element.props?.className?.split(/\s+/) ?? [];
      return classes.includes('fixed') && classes.includes('inset-0') && element.props?.onClick !== undefined;
    });

    expect(fullScreenClickCatcher).toBeUndefined();

    const cleanup = hooks.effects.at(-1)?.();
    const outsideClickListener = addEventListener.mock.calls.find(([event]) => event === 'click')?.[1];
    expect(outsideClickListener).toBeTypeOf('function');

    const insideTarget = {};
    hooks.pickerRoot.current.contains.mockReturnValueOnce(true);
    outsideClickListener({ target: insideTarget });
    expect(hooks.setIsOpen).not.toHaveBeenCalled();

    const outsideTarget = {};
    hooks.pickerRoot.current.contains.mockReturnValueOnce(false);
    outsideClickListener({ target: outsideTarget });
    expect(hooks.setIsOpen).toHaveBeenCalledWith(false);

    cleanup?.();
    expect(removeEventListener).toHaveBeenCalledWith('click', outsideClickListener);
  });

  it('clears the old selected time and controlled value when choosing an empty-slot date', () => {
    const onChange = vi.fn();
    const picker = DateTimePicker({
      value: '2026-07-12T12:00:00',
      onChange,
      useReservationRestrictions: false,
      availableTimesForDate: (date) => date === '2026-07-13' ? [] : ['12:00'],
    });
    const nextDate = findElement(
      picker,
      (element) => element.props?.['aria-label']?.startsWith('13 июля 2026') === true,
    );

    expect(nextDate?.props?.onClick).toBeTypeOf('function');
    nextDate!.props!.onClick!();

    expect(hooks.setSelectedTime).toHaveBeenCalledWith('');
    expect(onChange).toHaveBeenCalledWith('');
    expect(hooks.dispatchCalendarDate).toHaveBeenCalledWith({ type: 'select', date: '2026-07-13' });
  });

  it('keeps a late full-picker slot inside a scrollable popover and selectable', () => {
    const onChange = vi.fn();
    const picker = DateTimePicker({
      value: '2026-07-12T12:00:00',
      onChange,
      useReservationRestrictions: false,
      availableTimes: ['19:30'],
    });
    const path = findElementPath(picker, (element) => element.props?.children === '19:30');

    expect(path).toBeDefined();
    expect(path!.some((element) => element.props?.className?.includes('overflow-y-auto'))).toBe(true);
    path!.at(-1)!.props!.onClick!();
    expect(onChange).toHaveBeenCalledWith('2026-07-12T19:30:00');
  });
});
