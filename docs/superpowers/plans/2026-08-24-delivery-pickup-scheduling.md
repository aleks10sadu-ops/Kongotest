# Delivery, Pickup, and Scheduled Orders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pickup plus ASAP and scheduled date/time ordering to the existing food checkout without breaking delivery, iiko, or Telegram.

**Architecture:** Keep one checkout with a `delivery | pickup` discriminator. Put Moscow scheduling and fulfillment validation in pure `lib/delivery` modules, build the iiko request through a pure payload builder, and preserve the current iiko-webhook-first Telegram flow with explicit fulfillment labels.

**Tech Stack:** Next.js 16 App Router, React 18, TypeScript 5.9, Vitest 2.1, iikoCloud `/api/1/deliveries/create`, Supabase Edge Functions (Deno), Telegram Bot API.

**Spec:** `docs/superpowers/specs/2026-08-24-delivery-pickup-scheduling-design.md`

## Global Constraints

- Pickup minimum is 1,000 RUB or at least two business lunches.
- Delivery keeps the existing zone-specific minimums.
- Both fulfillment types use Moscow time: Mon–Thu 12:00–21:45, Fri–Sat 12:00–23:00, Sun 13:00–21:45.
- Both fulfillment types retain ASAP and gain scheduled date/time with 15-minute slots.
- Food orders must ignore September 1, December/January, and `reservation_settings` booking restrictions.
- Pickup address is exactly `Дмитров, Промышленная улица, 20Б`.
- Missing `fulfillmentType` means `delivery`; an unknown value returns HTTP 400.
- Successful iiko creation remains the primary Telegram path; the direct Telegram endpoint remains technical fallback only.
- Do not alter `.codex-tmp/`, `outputs/`, existing booking rules, payment methods, delivery zones, or menu data.

---

## File Structure

- `lib/delivery/types.ts`: shared fulfillment and timing discriminators.
- `lib/delivery/schedule.ts`: Moscow opening windows, 15-minute slots, and server time validation.
- `lib/delivery/orderRules.ts`: pure payload compatibility, time, business-lunch, address, and minimum-order rules.
- `lib/iiko/orders.ts`: pure iiko order builder plus network submission/polling.
- `app/components/DateTimePicker.tsx`: generic calendar UI with booking restrictions opt-out and date-aware time slots.
- `app/menu/DeliveryCheckout.tsx`: single delivery/pickup form and client submission behavior.
- `app/api/orders/route.ts`: authoritative server orchestration.
- `app/api/telegram/route.ts`: direct fallback formatting.
- `supabase/functions/_shared/orderFulfillment.ts`: Deno-safe iiko fulfillment presentation shared by webhook and poller.
- `supabase/functions/iiko-webhook/index.ts`: immediate Telegram notification.
- `supabase/functions/iiko-poller/index.ts`: deduplicated fallback notification and status cascade.

### Task 1: Moscow scheduling domain

**Files:**
- Create: `lib/delivery/types.ts`
- Modify: `lib/delivery/schedule.ts`
- Test: `lib/delivery/schedule.test.ts`

**Interfaces:**
- Produces: `FulfillmentType`, `OrderTimingMode`, `orderTimeSlots(date, now)`, and `validateOrderTime(mode, custom, now)`.
- `validateOrderTime` returns either `{ ok: true, requestedAt, completeBefore }` or `{ ok: false, code, message }`.

- [ ] **Step 1: Add the shared discriminators**

```ts
// lib/delivery/types.ts
export type FulfillmentType = 'delivery' | 'pickup';
export type OrderTimingMode = 'asap' | 'custom';
```

- [ ] **Step 2: Write failing schedule tests**

Append tests that name the breaks they catch:

```ts
import { orderTimeSlots, validateOrderTime } from './schedule';

describe('scheduled order slots', () => {
  it('uses 15-minute slots and includes the closing boundary', () => {
    const slots = orderTimeSlots('2026-07-13', msk('2026-07-12T10:00:00'));
    expect(slots[0]).toBe('12:00');
    expect(slots[1]).toBe('12:15');
    expect(slots.at(-1)).toBe('21:45');
  });

  it('uses the later Friday closing boundary', () => {
    expect(orderTimeSlots('2026-07-17', msk('2026-07-16T10:00:00')).at(-1)).toBe('23:00');
  });

  it('removes elapsed slots for today without hiding future days', () => {
    const now = msk('2026-07-13T12:07:00');
    expect(orderTimeSlots('2026-07-13', now)[0]).toBe('12:15');
    expect(orderTimeSlots('2026-07-14', now)[0]).toBe('12:00');
  });
});

describe('validateOrderTime', () => {
  it('accepts a future scheduled order while the restaurant is currently closed', () => {
    const result = validateOrderTime('custom', '2026-07-13T12:30:00', msk('2026-07-13T08:00:00'));
    expect(result).toMatchObject({ ok: true, completeBefore: '2026-07-13 12:30:00.000' });
  });

  it('rejects past and outside-schedule timestamps', () => {
    expect(validateOrderTime('custom', '2026-07-13T12:00:00', msk('2026-07-13T12:01:00')))
      .toMatchObject({ ok: false, code: 'order_time_past' });
    expect(validateOrderTime('custom', '2026-07-13T22:00:00', msk('2026-07-13T08:00:00')))
      .toMatchObject({ ok: false, code: 'order_time_outside_schedule' });
  });

  it('keeps ASAP tied to the current opening window', () => {
    expect(validateOrderTime('asap', undefined, msk('2026-07-13T11:59:00')))
      .toMatchObject({ ok: false, code: 'delivery_closed' });
    expect(validateOrderTime('asap', undefined, msk('2026-07-13T12:00:00')))
      .toMatchObject({ ok: true, completeBefore: null });
  });
});
```

- [ ] **Step 3: Run the tests and verify RED**

Run: `npm test -- lib/delivery/schedule.test.ts`

Expected: FAIL because `orderTimeSlots` and `validateOrderTime` are not exported.

- [ ] **Step 4: Implement the minimal schedule API**

Keep the existing `isDeliveryOpen` and `todayDeliveryWindowText`. Add an inclusive scheduled-time window and strict Moscow conversion:

```ts
import type { OrderTimingMode } from './types';

export type OrderTimeValidation =
  | { ok: true; requestedAt: Date; completeBefore: string | null }
  | { ok: false; code: 'delivery_closed' | 'order_time_invalid' | 'order_time_past' | 'order_time_outside_schedule'; message: string };

const LOCAL_ORDER_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

function windowForDate(date: string): DayWindow | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const day = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  if (day.toISOString().slice(0, 10) !== date) return null;
  return SCHEDULE[['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getUTCDay()]] ?? null;
}

export function orderTimeSlots(date: string, now: Date = new Date()): string[] {
  const window = windowForDate(date);
  if (!window) return [];
  const from = window.from[0] * 60 + window.from[1];
  const to = window.to[0] * 60 + window.to[1];
  const slots: string[] = [];
  for (let minute = from; minute <= to; minute += 15) {
    const time = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
    const candidate = new Date(`${date}T${time}:00+03:00`);
    if (candidate.getTime() > now.getTime()) slots.push(time);
  }
  return slots;
}

export function validateOrderTime(
  mode: OrderTimingMode,
  custom: string | undefined,
  now: Date = new Date(),
): OrderTimeValidation {
  if (mode === 'asap') {
    return isDeliveryOpen(now)
      ? { ok: true, requestedAt: now, completeBefore: null }
      : { ok: false, code: 'delivery_closed', message: deliveryClosedMessage(now) };
  }
  const match = custom ? LOCAL_ORDER_TIME.exec(custom) : null;
  if (!match) return { ok: false, code: 'order_time_invalid', message: 'Выберите дату и время заказа.' };
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  const time = `${match[4]}:${match[5]}`;
  const requestedAt = new Date(`${date}T${time}:${match[6] || '00'}+03:00`);
  if (!windowForDate(date) || Number.isNaN(requestedAt.getTime())) {
    return { ok: false, code: 'order_time_invalid', message: 'Некорректная дата заказа.' };
  }
  if (requestedAt.getTime() <= now.getTime()) {
    return { ok: false, code: 'order_time_past', message: 'Выбранное время уже прошло.' };
  }
  const window = windowForDate(date)!;
  const minute = Number(match[4]) * 60 + Number(match[5]);
  const from = window.from[0] * 60 + window.from[1];
  const to = window.to[0] * 60 + window.to[1];
  if (minute < from || minute > to) {
    return { ok: false, code: 'order_time_outside_schedule', message: `Выберите время в интервале ${fmt(window.from)}–${fmt(window.to)}.` };
  }
  return { ok: true, requestedAt, completeBefore: `${date} ${time}:00.000` };
}
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `npm test -- lib/delivery/schedule.test.ts`

Expected: all schedule tests pass with zero failures.

- [ ] **Step 6: Commit the scheduling domain**

```powershell
git add -- lib/delivery/types.ts lib/delivery/schedule.ts lib/delivery/schedule.test.ts
git commit -m "feat(delivery): add scheduled order windows"
```

### Task 2: iiko courier and pickup payloads

**Files:**
- Modify: `lib/iiko/orders.ts`
- Test: `lib/iiko/orders.test.ts`

**Interfaces:**
- Consumes: `FulfillmentType` from `lib/delivery/types.ts`.
- Produces: `CreateSiteOrderArgs`, `buildIikoOrder(args, addressFormat)`, and `createSiteOrder(args)`.
- Preserves: `createSiteDelivery` as a compatibility alias during this change.

- [ ] **Step 1: Write failing iiko payload tests**

Add a reusable base order and assertions on the real payload builder:

```ts
import { buildDeliveryAddress, buildIikoOrder, type CreateSiteOrderArgs, type SiteOrderAddress } from './orders';

const base: SiteOrderAddress = {
  full: 'Дмитров, Промышленная, д. 28, корп. 2, подъезд 1, этаж 5, кв. 12',
  line1: 'Дмитров, Промышленная, д. 28, корп. 2',
  city: 'Дмитров', street: 'Промышленная', streetId: 'street-guid', house: '28', building: '2',
  entrance: '1', floor: '5', flat: '12', doorphone: '45', latitude: 56.3, longitude: 37.5,
};

const baseOrder: Omit<CreateSiteOrderArgs, 'fulfillmentType' | 'address'> = {
  phone: '+79161112233',
  customerName: 'Анна',
  comment: 'ЗАКАЗ С САЙТА',
  completeBefore: '2026-07-17 19:30:00.000',
  items: [{ productId: 'dish-guid', amount: 1, modifiers: [] }],
};

describe('buildIikoOrder', () => {
  it('keeps the courier service and delivery point for delivery', () => {
    const order = buildIikoOrder({ ...baseOrder, fulfillmentType: 'delivery', address: base }, 'legacy');
    expect(order).toMatchObject({
      orderServiceType: 'DeliveryByCourier',
      completeBefore: '2026-07-17 19:30:00.000',
      deliveryPoint: { address: { type: 'legacy' } },
    });
  });

  it('uses DeliveryByClient and omits deliveryPoint for pickup', () => {
    const order = buildIikoOrder({ ...baseOrder, fulfillmentType: 'pickup' }, 'legacy');
    expect(order).toMatchObject({ orderServiceType: 'DeliveryByClient' });
    expect(order).not.toHaveProperty('deliveryPoint');
  });
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test -- lib/iiko/orders.test.ts`

Expected: FAIL because `CreateSiteOrderArgs` and `buildIikoOrder` do not exist.

- [ ] **Step 3: Add the pure order builder and service discriminator**

Replace the delivery-only argument type with:

```ts
import type { FulfillmentType } from '../delivery/types';

export interface CreateSiteOrderArgs {
  fulfillmentType: FulfillmentType;
  phone: string;
  customerName: string;
  comment: string;
  completeBefore?: string | null;
  items: SiteOrderItem[];
  address?: SiteOrderAddress;
}

export interface SiteOrderAddress {
  full: string;
  line1: string;
  city: string | null;
  street: string | null;
  streetId?: string | null;
  house: string | null;
  building?: string | null;
  entrance?: string | null;
  floor?: string | null;
  flat?: string | null;
  doorphone?: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type CreateSiteDeliveryArgs = Omit<CreateSiteOrderArgs, 'fulfillmentType'> & {
  fulfillmentType?: 'delivery';
};
```

Change `buildDeliveryAddress` to accept `SiteOrderAddress`, so an optional pickup address never leaks into the address builder's type.

Move the existing `order` object into the pure builder:

```ts
export function buildIikoOrder(args: CreateSiteOrderArgs, addressFormat: AddressFormat): Record<string, unknown> {
  if (args.fulfillmentType === 'delivery' && !args.address) {
    throw new Error('delivery address is required');
  }
  return {
    orderServiceType: args.fulfillmentType === 'pickup' ? 'DeliveryByClient' : 'DeliveryByCourier',
    sourceKey: 'Сайт',
    ...(args.completeBefore ? { completeBefore: args.completeBefore } : {}),
    phone: args.phone,
    customer: { name: args.customerName },
    comment: args.comment,
    items: args.items.map((it) => ({
      type: 'Product',
      productId: it.productId,
      amount: it.amount,
      modifiers: it.modifiers.map((m) => ({
        productId: m.productId,
        productGroupId: m.productGroupId,
        amount: m.amount,
      })),
    })),
    ...(args.fulfillmentType === 'delivery' && args.address ? {
      deliveryPoint: {
        ...(args.address.latitude != null && args.address.longitude != null
          ? { coordinates: { latitude: args.address.latitude, longitude: args.address.longitude } }
          : {}),
        address: buildDeliveryAddress(addressFormat, args.address),
        comment: args.address.full,
      },
    } : {}),
  };
}
```

Rename the network function to `createSiteOrder`, call `getAddressFormat` only for delivery, and add the compatibility export:

```ts
export async function createSiteOrder(args: CreateSiteOrderArgs): Promise<{ orderId: string }> {
  const { organizationId } = getIikoConfig();
  const terminalGroupId = process.env.IIKO_TERMINAL_GROUP_ID;
  if (!terminalGroupId) throw new Error('iiko config: missing env IIKO_TERMINAL_GROUP_ID');
  const token = await getToken();
  const addressFormat = args.fulfillmentType === 'delivery' ? await getAddressFormat(token) : 'legacy';
  const order = buildIikoOrder(args, addressFormat);
  const created = await iikoPost<CreateDeliveryResponse>(
    '/api/1/deliveries/create',
    { organizationId, terminalGroupId, createOrderSettings: { transportToFrontTimeout: 30 }, order },
    token,
  );
  const orderId = created.orderInfo.id;
  for (let i = 0; i < 10; i++) {
    await sleep(2000);
    const state = await iikoPost<OrderByIdResponse>(
      '/api/1/deliveries/by_id',
      { organizationId, orderIds: [orderId] },
      token,
    );
    const result = state.orders?.[0];
    if (!result || result.creationStatus === 'InProgress') continue;
    if (result.creationStatus === 'Success') return { orderId };
    throw new Error(`iiko отклонила заказ: ${result.errorInfo?.message || result.errorInfo?.code || 'unknown'}`);
  }
  return { orderId };
}

export function createSiteDelivery(args: CreateSiteDeliveryArgs): Promise<{ orderId: string }> {
  return createSiteOrder({ ...args, fulfillmentType: 'delivery' });
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- lib/iiko/orders.test.ts`

Expected: all address and fulfillment payload tests pass.

- [ ] **Step 5: Commit the iiko boundary**

```powershell
git add -- lib/iiko/orders.ts lib/iiko/orders.test.ts
git commit -m "feat(iiko): create pickup orders"
```

### Task 3: Authoritative server order rules

**Files:**
- Create: `lib/delivery/orderRules.ts`
- Create: `lib/delivery/orderRules.test.ts`
- Modify: `lib/delivery/minOrder.ts`
- Modify: `lib/delivery/minOrder.test.ts`
- Modify: `app/api/orders/route.ts`

**Interfaces:**
- Consumes: `FulfillmentType`, `validateMinOrder`, `validateOrderTime`, `isBusinessLunchOpen`, and `createSiteOrder`.
- Produces: `evaluateOrderRules(input)` for pure compatibility/time/business-lunch/address/minimum validation.

- [ ] **Step 1: Write failing fulfillment-rule tests**

```ts
import { describe, expect, it } from 'vitest';
import { evaluateOrderRules } from './orderRules';

const dish = { id: 'dish', qty: 1, price: 1000 };

describe('evaluateOrderRules', () => {
  it('treats a missing discriminator as delivery and requires its address', () => {
    expect(evaluateOrderRules({ fulfillmentType: undefined, address: '', items: [dish], zone: null, deliveryTime: 'asap', now: msk('2026-07-13T12:30:00') }))
      .toMatchObject({ ok: false, status: 400, error: 'address_required' });
  });

  it('rejects unknown fulfillment types', () => {
    expect(evaluateOrderRules({ fulfillmentType: 'table', address: '', items: [dish], zone: null, deliveryTime: 'asap', now: msk('2026-07-13T12:30:00') }))
      .toMatchObject({ ok: false, status: 400, error: 'invalid_fulfillment_type' });
  });

  it('rejects an unknown timing mode even when a timestamp is present', () => {
    expect(evaluateOrderRules({
      fulfillmentType: 'pickup', address: '', items: [dish], zone: null,
      deliveryTime: 'later' as never, deliveryTimeCustom: '2026-07-13T13:00:00', now: msk('2026-07-12T12:00:00'),
    })).toMatchObject({ ok: false, status: 400, error: 'invalid_order_time_mode' });
  });

  it('allows pickup from 1000 RUB without an address', () => {
    expect(evaluateOrderRules({ fulfillmentType: 'pickup', address: '', items: [dish], zone: null, deliveryTime: 'asap', now: msk('2026-07-13T12:30:00') }))
      .toMatchObject({ ok: true, fulfillmentType: 'pickup', completeBefore: null });
  });

  it('allows pickup with two business lunches below 1000 RUB', () => {
    const lunches = [{ id: 'bl-1', qty: 2, price: 400, isBusinessLunch: true }];
    expect(evaluateOrderRules({ fulfillmentType: 'pickup', address: '', items: lunches, zone: null, deliveryTime: 'asap', now: msk('2026-07-13T12:30:00') }))
      .toMatchObject({ ok: true, fulfillmentType: 'pickup' });
  });

  it('rejects pickup below both minimum thresholds', () => {
    expect(evaluateOrderRules({ fulfillmentType: 'pickup', address: '', items: [{ ...dish, price: 999 }], zone: null, deliveryTime: 'asap', now: msk('2026-07-13T12:30:00') }))
      .toMatchObject({
        ok: false,
        status: 422,
        error: 'MIN_ORDER',
        message: 'Минимальный заказ на самовывоз — 1 000 ₽ или от 2 бизнес-ланчей.',
      });
  });

  it('checks business lunches against the scheduled moment', () => {
    const lunches = [{ id: 'bl-1', qty: 2, price: 400, isBusinessLunch: true }];
    expect(evaluateOrderRules({
      fulfillmentType: 'pickup', address: '', items: lunches, zone: null,
      deliveryTime: 'custom', deliveryTimeCustom: '2026-07-13T15:30:00', now: msk('2026-07-12T18:00:00'),
    })).toMatchObject({ ok: true, completeBefore: '2026-07-13 15:30:00.000' });
    expect(evaluateOrderRules({
      fulfillmentType: 'pickup', address: '', items: lunches, zone: null,
      deliveryTime: 'custom', deliveryTimeCustom: '2026-07-13T16:00:00', now: msk('2026-07-12T18:00:00'),
    })).toMatchObject({ ok: false, status: 409, error: 'business_lunch_closed' });
  });
});
```

Use the same `msk` helper as `schedule.test.ts` at the top of this test file.

Also add the pickup wording assertion to `lib/delivery/minOrder.test.ts` before production changes:

```ts
expect(validateMinOrder([{ id: 'dish', qty: 1, price: 999 }], undefined, null, 'pickup').message)
  .toBe('Минимальный заказ на самовывоз — 1 000 ₽ или от 2 бизнес-ланчей.');
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test -- lib/delivery/orderRules.test.ts lib/delivery/minOrder.test.ts`

Expected: FAIL because `orderRules.ts` does not exist.

- [ ] **Step 3: Implement the pure fulfillment gate**

```ts
import { validateMinOrder, isBusinessLunchItem, type MinOrderItem, type MinOrderZone } from './minOrder';
import { isBusinessLunchOpen, BUSINESS_LUNCH_WINDOW_TEXT } from '../menu/businessLunchWindow';
import { validateOrderTime } from './schedule';
import type { FulfillmentType, OrderTimingMode } from './types';

type RuleInput = {
  fulfillmentType: unknown;
  address?: string;
  items: MinOrderItem[];
  zone?: MinOrderZone | null;
  deliveryTime?: OrderTimingMode;
  deliveryTimeCustom?: string;
  now?: Date;
};

export type FulfillmentRuleResult =
  | { ok: true; fulfillmentType: FulfillmentType; requestedAt: Date; completeBefore: string | null }
  | { ok: false; status: 400 | 409 | 422; error: string; message: string };

export function evaluateOrderRules(input: RuleInput): FulfillmentRuleResult {
  const fulfillmentType = input.fulfillmentType == null ? 'delivery' : input.fulfillmentType;
  if (fulfillmentType !== 'delivery' && fulfillmentType !== 'pickup') {
    return { ok: false, status: 400, error: 'invalid_fulfillment_type', message: 'Неизвестный способ получения заказа.' };
  }
  if (fulfillmentType === 'delivery' && !input.address?.trim()) {
    return { ok: false, status: 400, error: 'address_required', message: 'Укажите адрес доставки.' };
  }
  if (input.deliveryTime != null && input.deliveryTime !== 'asap' && input.deliveryTime !== 'custom') {
    return { ok: false, status: 400, error: 'invalid_order_time_mode', message: 'Неизвестный режим времени заказа.' };
  }
  const timing = validateOrderTime(input.deliveryTime || 'asap', input.deliveryTimeCustom, input.now);
  if (!timing.ok) return { ok: false, status: 409, error: timing.code, message: timing.message };
  if (input.items.some(isBusinessLunchItem) && !isBusinessLunchOpen(timing.requestedAt)) {
    return {
      ok: false,
      status: 409,
      error: 'business_lunch_closed',
      message: `Бизнес-ланчи можно заказать только ${BUSINESS_LUNCH_WINDOW_TEXT} (по Москве).`,
    };
  }
  const min = validateMinOrder(
    input.items,
    undefined,
    fulfillmentType === 'delivery' ? input.zone : null,
    fulfillmentType,
  );
  if (!min.isValid) {
    return { ok: false, status: 422, error: 'MIN_ORDER', message: min.message || 'Заказ не проходит по минимальной сумме.' };
  }
  return { ok: true, fulfillmentType, requestedAt: timing.requestedAt, completeBefore: timing.completeBefore };
}
```

Extend `validateMinOrder` with a backward-compatible fourth argument. It changes pickup wording while existing callers keep delivery wording:

```ts
import type { FulfillmentType } from './types';

export function validateMinOrder(
  items: MinOrderItem[],
  subtotal?: number,
  zone?: MinOrderZone | null,
  fulfillmentType: FulfillmentType = 'delivery',
): MinOrderValidation {
  const total = subtotal ?? items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const businessLunchCount = items.filter(isBusinessLunchItem).reduce((sum, item) => sum + item.qty, 0);
  const paidZone = fulfillmentType === 'delivery' && !!zone && zone.price > 0;
  const required = fulfillmentType === 'delivery' && zone ? zone.minOrder : MIN_ORDER_TOTAL;
  const lunchException = !paidZone && businessLunchCount >= MIN_BUSINESS_LUNCH_COUNT;
  const isValid = total >= required || lunchException;
  const subject = fulfillmentType === 'pickup' ? 'самовывоз' : 'доставку';
  const message = isValid
    ? null
    : paidZone
      ? `В зоне «${zone!.name}» минимальный заказ на доставку — ${required.toLocaleString('ru-RU')} ₽ (без учёта стоимости доставки).`
      : `Минимальный заказ на ${subject} — ${MIN_ORDER_TOTAL.toLocaleString('ru-RU')} ₽ или от ${MIN_BUSINESS_LUNCH_COUNT} бизнес-ланчей.`;
  return { isValid, businessLunchCount, subtotal: total, message };
}
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `npm test -- lib/delivery/orderRules.test.ts lib/delivery/minOrder.test.ts`

Expected: all fulfillment-rule and minimum-order tests pass.

- [ ] **Step 5: Integrate the rules into `/api/orders`**

Make the payload compatible and validate before all external calls:

```ts
interface IncomingPayload {
  fulfillmentType?: 'delivery' | 'pickup';
}

const zone = p.fulfillmentType === 'pickup'
  ? null
  : ((Array.isArray(p.coordinates) && p.coordinates.length === 2
      ? checkDeliveryZoneForCoords(p.coordinates)
      : null) ?? findZoneByName(p.zoneName));

const rules = evaluateOrderRules({
  fulfillmentType: p.fulfillmentType,
  address: p.address,
  items: p.items,
  zone,
  deliveryTime: p.deliveryTime,
  deliveryTimeCustom: p.deliveryTimeCustom,
});
if (!rules.ok) {
  await logOrderAttempt({
    outcome: rules.error === 'MIN_ORDER'
      ? 'rejected_min_order'
      : rules.error === 'business_lunch_closed'
        ? 'rejected_bl_window'
        : rules.status === 409
          ? 'rejected_schedule'
          : 'bad_request',
    detail: rules.message,
    ...logTail,
  });
  return NextResponse.json(
    { ok: false, code: rules.error === 'MIN_ORDER' ? 'MIN_ORDER' : undefined, error: rules.error, message: rules.message },
    { status: rules.status },
  );
}
```

Change the route's initial request check so pickup is not rejected before the pure gate:

```ts
if (!p.phone || !Array.isArray(p.items) || p.items.length === 0) {
  await logOrderAttempt({ outcome: 'bad_request', detail: 'phone и items обязательны', ...logTail });
  return NextResponse.json({ ok: false, error: 'phone и items обязательны' }, { status: 400 });
}
```

Remove the old current-time schedule and business-lunch gates because `evaluateOrderRules` now applies them to the authoritative requested moment. Branch all street parsing, street lookup, and courier-address construction behind `rules.fulfillmentType === 'delivery'` and assign the result to `courierIikoAddress`:

```ts
const courierIikoAddress = rules.fulfillmentType === 'delivery'
  ? {
      ...parsed,
      street: streetName,
      streetId: resolved?.streetId ?? null,
      house,
      building: p.building?.trim() || null,
      entrance: p.entrance?.trim() || null,
      floor: p.floor?.trim() || null,
      flat: p.apartment?.trim() || null,
      doorphone: p.intercom?.trim() || null,
      full: courierAddress,
      line1,
      latitude: lat,
      longitude: lon,
    }
  : undefined;
```

Recompute arithmetic from the selected items and the server-resolved zone before building comments or logs:

```ts
const serverSubtotal = p.items.reduce((sum, item) => sum + item.price * item.qty, 0);
const serverDeliveryPrice = rules.fulfillmentType === 'delivery' ? (zone?.price ?? 0) : 0;
const normalizedPayload = {
  ...p,
  subtotal: serverSubtotal,
  deliveryPrice: serverDeliveryPrice,
  total: serverSubtotal + serverDeliveryPrice,
  zoneName: rules.fulfillmentType === 'delivery' ? zone?.name : undefined,
};
```

Call iiko as:

```ts
const { orderId } = await createSiteOrder({
  fulfillmentType: rules.fulfillmentType,
  phone: normalizePhone(p.phone),
  customerName: p.name || 'Гость сайта',
  comment: buildComment(normalizedPayload, rules.fulfillmentType),
  completeBefore: rules.completeBefore,
  items,
  ...(rules.fulfillmentType === 'delivery' ? { address: courierIikoAddress! } : {}),
});
```

Set `logTail.address` to `Самовывоз: ${SITE.address}` for pickup. Remove the old duplicate minimum, current-time schedule, business-lunch, and `completeBefore` parsing blocks after the new gate is connected. Keep stop-list and modifier validation before iiko. The route must no longer reject a valid future order merely because `isDeliveryOpen()` is false now.

- [ ] **Step 6: Run all affected server-domain tests**

Run: `npm test -- lib/delivery/orderRules.test.ts lib/delivery/schedule.test.ts lib/iiko/orders.test.ts`

Expected: all tests pass; no existing iiko address test regresses.

- [ ] **Step 7: Commit server orchestration**

```powershell
git add -- lib/delivery/minOrder.ts lib/delivery/minOrder.test.ts lib/delivery/orderRules.ts lib/delivery/orderRules.test.ts app/api/orders/route.ts
git commit -m "feat(orders): validate delivery and pickup"
```

### Task 4: Date/time picker and unified checkout UI

**Files:**
- Modify: `app/components/DateTimePicker.tsx`
- Modify: `app/components/DateTimePicker.test.ts`
- Modify: `app/menu/DeliveryCheckout.tsx`

**Interfaces:**
- Consumes: `FulfillmentType`, `orderTimeSlots`, `SITE.address`.
- Extends `DateTimePickerProps` with `useReservationRestrictions?: boolean` and `availableTimesForDate?: (date: string) => string[]`.

- [ ] **Step 1: Write failing picker policy tests**

Extend the existing test with real decision helpers used by the component:

```ts
type Restrictions = { dates: string[]; times: Record<string, string[]> };
type PickerModule = {
  isPickerDateRestricted: (date: string, restrictions: Restrictions, useReservationRestrictions: boolean) => boolean;
  resolvePickerTimes: (date: string, availableTimes: string[] | null, provider?: (date: string) => string[]) => string[] | null;
};

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
```

- [ ] **Step 2: Run the picker test and verify RED**

Run: `npm test -- app/components/DateTimePicker.test.ts`

Expected: FAIL because both helper exports are missing.

- [ ] **Step 3: Implement the picker opt-out and date-aware slots**

```ts
export function isPickerDateRestricted(
  date: string,
  restrictions: Restrictions,
  useReservationRestrictions: boolean,
): boolean {
  return useReservationRestrictions && restrictions.dates.includes(date);
}

export function resolvePickerTimes(
  date: string,
  availableTimes: string[] | null,
  provider?: (date: string) => string[],
): string[] | null {
  return provider ? provider(date) : availableTimes;
}
```

Add props and defaults:

```ts
availableTimesForDate?: (date: string) => string[];
useReservationRestrictions?: boolean;

// defaults
useReservationRestrictions = true,
```

At the start of the restrictions effect, skip network access when disabled:

```ts
if (!useReservationRestrictions) {
  setRestrictions({ dates: [], times: {} });
  return;
}
```

Change the effect dependency list from `[]` to `[useReservationRestrictions]`, so consumer policy changes cannot leave stale booking restrictions in memory.

Use `isPickerDateRestricted` in the calendar. In `generateTimeSlots`, return `resolvePickerTimes(selectedDate, availableTimes, availableTimesForDate)` whenever it is not `null`, including an empty array. Apply restricted times only when `useReservationRestrictions` is true.

- [ ] **Step 4: Run the picker test and verify GREEN**

Run: `npm test -- app/components/DateTimePicker.test.ts`

Expected: all picker navigation and policy tests pass.

- [ ] **Step 5: Convert the checkout into the approved unified form**

Add state with delivery as the compatibility default:

```ts
const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('delivery');
const isPickup = fulfillmentType === 'pickup';
const effectiveZone = isPickup ? null : zone;
const deliveryPrice = isPickup ? 0 : (zone?.price ?? null);
const minOrder = validateMinOrder(items, subtotal, effectiveZone, fulfillmentType);
```

Render the two-option selector before the map, conditionally render delivery fields, and show pickup information:

```tsx
<div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-forest-ink/40 p-1">
  {([['delivery', 'Доставка'], ['pickup', 'Самовывоз']] as const).map(([value, label]) => (
    <button key={value} type="button" onClick={() => setFulfillmentType(value)}
      className={`rounded-lg px-3 py-2.5 text-sm font-medium ${fulfillmentType === value ? 'bg-terracotta text-[#FBF3EA]' : 'text-cream/70'}`}>
      {label}
    </button>
  ))}
</div>

{isPickup && (
  <div className="rounded-lg border border-brass/30 bg-brass/10 p-3 text-sm text-cream">
    <p className="font-semibold text-brass">Забрать в ресторане</p>
    <p className="mt-1">{SITE.address}</p>
  </div>
)}
```

Replace `<input type="time">` with:

```tsx
{f.deliveryTime === 'custom' && (
  <DateTimePicker
    value={f.deliveryTimeCustom}
    onChange={(deliveryTimeCustom) => set({ deliveryTimeCustom })}
    disablePastDates
    useReservationRestrictions={false}
    availableTimesForDate={(date) => orderTimeSlots(date)}
    ariaLabel="Дата и время заказа"
  />
)}
```

Send `fulfillmentType` and the combined `deliveryTimeCustom` unchanged. Require address/zone only for delivery. Disable submit on a closed current schedule only for ASAP:

```ts
const asapUnavailable = f.deliveryTime === 'asap' && !scheduleOpen;
```

For all server responses below 500, display the server message and return without Telegram fallback:

```ts
if (!res.ok && res.status < 500) {
  setStatus('error');
  setErrorMsg(data.message || data.error || 'Проверьте данные заказа.');
  return;
}
```

Keep technical 5xx/network failures in the existing fallback and include `fulfillmentType`. Update titles, CTA, success copy, totals, analytics metadata, and fallback address to use the chosen fulfillment type.

- [ ] **Step 6: Run UI-adjacent tests and TypeScript**

Run: `npm test -- app/components/DateTimePicker.test.ts lib/delivery/schedule.test.ts lib/delivery/orderRules.test.ts`

Then run: `npx tsc --noEmit`

Expected: all tests pass and TypeScript exits 0.

- [ ] **Step 7: Commit the unified checkout**

```powershell
git add -- app/components/DateTimePicker.tsx app/components/DateTimePicker.test.ts app/menu/DeliveryCheckout.tsx
git commit -m "feat(checkout): add pickup and scheduled time"
```

### Task 5: Telegram fulfillment labels without duplicate notifications

**Files:**
- Create: `supabase/functions/_shared/orderFulfillment.ts`
- Create: `supabase/functions/_shared/orderFulfillment.test.ts`
- Modify: `supabase/functions/iiko-webhook/index.ts`
- Modify: `supabase/functions/iiko-poller/index.ts`
- Modify: `app/api/telegram/route.ts`
- Modify: `app/api/telegram/route.test.ts`

**Interfaces:**
- Consumes: iiko `orderServiceType` and fallback `fulfillmentType`.
- Produces: `iikoFulfillmentPresentation(order)` returning `{ type, emoji, noun, pickupAddress }`.
- Preserves: `iiko_notified_orders` claim, `tg_message_id`, `orig_text`, seven-minute reminder, and cancellation reply logic.

- [ ] **Step 1: Write failing direct-fallback tests**

```ts
it('formats pickup without a courier address', () => {
  const message = buildMessage({
    type: 'delivery',
    fulfillmentType: 'pickup',
    name: 'Анна',
    phone: '+79161112233',
    address: '',
    items: [{ name: 'Пицца', qty: 1, price: 1000 }],
    total: 1000,
    deliveryTime: 'custom',
    deliveryTimeCustom: '2026-07-17T19:30:00',
    paymentMethod: 'card',
  });
  expect(message).toContain('Заявка: Самовывоз');
  expect(message).toContain('Дмитров, Промышленная улица, 20Б');
  expect(message).toContain('17 июля 2026 г. в 19:30');
  expect(message).not.toContain('<b>Адрес доставки:</b>');
});

it('keeps a legacy payload formatted as delivery', () => {
  const message = buildMessage({
    type: 'delivery', name: 'Анна', phone: '+79161112233', address: 'Профессиональная, 1',
    items: [], total: 0, deliveryTime: 'asap', paymentMethod: 'card',
  });
  expect(message).toContain('Заявка: Доставка');
});
```

- [ ] **Step 2: Write failing iiko presentation tests**

```ts
import { describe, expect, it } from 'vitest';
import { iikoFulfillmentPresentation } from './orderFulfillment';

describe('iikoFulfillmentPresentation', () => {
  it('identifies client pickup', () => {
    expect(iikoFulfillmentPresentation({ orderServiceType: 'DeliveryByClient' })).toEqual({
      type: 'pickup', emoji: '🛍', noun: 'самовывоз', pickupAddress: 'Дмитров, Промышленная улица, 20Б',
    });
  });

  it('also reads the service type nested in older iiko event shapes', () => {
    expect(iikoFulfillmentPresentation({ orderType: { orderServiceType: 'DeliveryByClient' } }))
      .toMatchObject({ type: 'pickup' });
  });

  it('defaults unknown and old events to courier delivery', () => {
    expect(iikoFulfillmentPresentation({})).toMatchObject({ type: 'delivery', emoji: '🚚', noun: 'доставка' });
  });
});
```

- [ ] **Step 3: Run both tests and verify RED**

Run: `npm test -- app/api/telegram/route.test.ts supabase/functions/_shared/orderFulfillment.test.ts`

Expected: FAIL because pickup fallback formatting and the shared presentation module do not exist.

- [ ] **Step 4: Implement shared iiko presentation**

```ts
export const PICKUP_ADDRESS = 'Дмитров, Промышленная улица, 20Б';

export function iikoFulfillmentPresentation(order: {
  orderServiceType?: string;
  orderType?: { orderServiceType?: string };
}) {
  const serviceType = order.orderServiceType || order.orderType?.orderServiceType;
  return serviceType === 'DeliveryByClient'
    ? { type: 'pickup' as const, emoji: '🛍', noun: 'самовывоз', pickupAddress: PICKUP_ADDRESS }
    : { type: 'delivery' as const, emoji: '🚚', noun: 'доставка', pickupAddress: null };
}
```

- [ ] **Step 5: Update fallback Telegram formatting**

Extend `DeliveryPayload` with `fulfillmentType?: 'delivery' | 'pickup'`. Default missing to delivery. Build the heading and location lines conditionally:

```ts
const isPickup = payload.fulfillmentType === 'pickup';
const fulfillmentLabel = isPickup ? 'Самовывоз' : 'Доставка';
const locationLine = isPickup
  ? `<b>Забрать по адресу:</b> ${escapeHtml(SITE.address)}\n`
  : `<b>Адрес доставки:</b> ${escapeHtml(address)}\n`;
```

Replace timezone-shifting of a timezone-less scheduled value with literal Moscow-local formatting:

```ts
function formatOrderTime(value: string): string {
  const local = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (local) {
    const date = new Date(`${local[1]}-${local[2]}-${local[3]}T12:00:00`);
    return `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} г. в ${local[4]}:${local[5]}`;
  }
  return formatMoscowTime(value);
}
```

Use `formatOrderTime(deliveryTimeCustom)` in the custom-time branch.

Keep items, payment, allergies, selected time, chat ID, and order logging behavior unchanged.

- [ ] **Step 6: Update webhook and poller labels**

Import the shared helper from `../_shared/orderFulfillment.ts`. In `fmtOrder` and `fmtBase`, derive the presentation from the real iiko order:

```ts
const fulfillment = iikoFulfillmentPresentation(ord);
lines.push(`${fulfillment.emoji} ${fulfillment.type === 'pickup' ? 'Новый самовывоз' : 'Новая доставка'} №${ord.number}`);
if (fulfillment.type === 'pickup') {
  lines.push(`Забрать: ${fulfillment.pickupAddress}`);
} else {
  const addr = fmtAddress(ord);
  if (addr) lines.push(`Адрес: ${addr}`);
}
```

Do not change the insert-before-send claim, conflict handling, deletion rollback, `orig_text`, message editing, reminder counter, or terminal status logic.

- [ ] **Step 7: Run Telegram tests and verify GREEN**

Run: `npm test -- app/api/telegram/route.test.ts supabase/functions/_shared/orderFulfillment.test.ts`

Expected: direct fallback and iiko event presentation tests pass.

- [ ] **Step 8: Commit Telegram integration**

```powershell
git add -- app/api/telegram/route.ts app/api/telegram/route.test.ts supabase/functions/_shared/orderFulfillment.ts supabase/functions/_shared/orderFulfillment.test.ts supabase/functions/iiko-webhook/index.ts supabase/functions/iiko-poller/index.ts
git commit -m "feat(telegram): label pickup orders"
```

### Task 6: Full regression verification

**Files:**
- Verify all changed files from Tasks 1–5.
- Do not change unrelated user files.

**Interfaces:**
- Confirms the complete browser → server → iiko → Telegram data contract.

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test`

Expected: Vitest exits 0 with zero failed tests.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: Next.js production build exits 0 with no TypeScript errors.

- [ ] **Step 3: Inspect change scope and whitespace**

Run:

```powershell
git diff --check 03e3327..HEAD
git status --short
git diff 03e3327..HEAD -- app/menu/DeliveryCheckout.tsx app/api/orders/route.ts lib/iiko/orders.ts app/api/telegram/route.ts supabase/functions/iiko-webhook/index.ts supabase/functions/iiko-poller/index.ts
```

Expected: no whitespace errors; only the planned files plus pre-existing `.codex-tmp/` and `outputs/` are present.

- [ ] **Step 4: Verify the requirements against evidence**

Confirm each statement from test/build output and diff:

```text
delivery default preserved
pickup minimum: 1000 RUB or two business lunches
ASAP checks current Moscow window
scheduled orders accept future 15-minute slots and ignore booking closures
iiko courier has deliveryPoint; pickup is DeliveryByClient without deliveryPoint
Telegram primary and fallback paths label fulfillment without changing deduplication
```

- [ ] **Step 5: Commit only if verification required a correction**

```powershell
git add -- lib/delivery/types.ts lib/delivery/schedule.ts lib/delivery/schedule.test.ts lib/delivery/orderRules.ts lib/delivery/orderRules.test.ts lib/iiko/orders.ts lib/iiko/orders.test.ts app/components/DateTimePicker.tsx app/components/DateTimePicker.test.ts app/menu/DeliveryCheckout.tsx app/api/orders/route.ts app/api/telegram/route.ts app/api/telegram/route.test.ts supabase/functions/_shared/orderFulfillment.ts supabase/functions/_shared/orderFulfillment.test.ts supabase/functions/iiko-webhook/index.ts supabase/functions/iiko-poller/index.ts
git commit -m "fix(orders): address integration verification"
```

If no correction was needed, do not create an empty commit.
