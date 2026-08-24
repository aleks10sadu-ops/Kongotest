import { BUSINESS_LUNCH_WINDOW_TEXT, isBusinessLunchOpen } from '../menu/businessLunchWindow';
import {
  isBusinessLunchItem,
  validateMinOrder,
  type MinOrderItem,
  type MinOrderZone,
} from './minOrder';
import { validateOrderTime } from './schedule';
import type { FulfillmentType, OrderTimingMode } from './types';

type OrderPreflightInput = {
  fulfillmentType: unknown;
  address?: string;
  deliveryTime?: OrderTimingMode;
  deliveryTimeCustom?: string;
  now?: Date;
};

type RuleInput = OrderPreflightInput & {
  items: MinOrderItem[];
  zone?: MinOrderZone | null;
};

type OrderRuleFailure = { ok: false; status: 400 | 409 | 422; error: string; message: string };

export type OrderPreflightSuccess = {
  ok: true;
  fulfillmentType: FulfillmentType;
  requestedAt: Date;
  completeBefore: string | null;
};

export type OrderPreflightResult = OrderPreflightSuccess | OrderRuleFailure;

export type FulfillmentRuleResult = OrderPreflightSuccess | OrderRuleFailure;

export function evaluateOrderPreflight(input: OrderPreflightInput): OrderPreflightResult {
  const fulfillmentType = input.fulfillmentType == null ? 'delivery' : input.fulfillmentType;
  if (fulfillmentType !== 'delivery' && fulfillmentType !== 'pickup') {
    return {
      ok: false,
      status: 400,
      error: 'invalid_fulfillment_type',
      message: 'Неизвестный способ получения заказа.',
    };
  }
  if (fulfillmentType === 'delivery' && !input.address?.trim()) {
    return {
      ok: false,
      status: 400,
      error: 'address_required',
      message: 'Укажите адрес доставки.',
    };
  }
  if (input.deliveryTime != null && input.deliveryTime !== 'asap' && input.deliveryTime !== 'custom') {
    return {
      ok: false,
      status: 400,
      error: 'invalid_order_time_mode',
      message: 'Неизвестный режим времени заказа.',
    };
  }

  const timing = validateOrderTime(input.deliveryTime || 'asap', input.deliveryTimeCustom, input.now);
  if (!timing.ok) {
    return { ok: false, status: 409, error: timing.code, message: timing.message };
  }

  return {
    ok: true,
    fulfillmentType,
    requestedAt: timing.requestedAt,
    completeBefore: timing.completeBefore,
  };
}

export function evaluateAuthoritativeOrderRules(input: {
  preflight: OrderPreflightSuccess;
  items: MinOrderItem[];
  zone?: MinOrderZone | null;
}): FulfillmentRuleResult {
  if (input.items.some(isBusinessLunchItem) && !isBusinessLunchOpen(input.preflight.requestedAt)) {
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
    input.preflight.fulfillmentType === 'delivery' ? input.zone : null,
    input.preflight.fulfillmentType,
  );
  if (!min.isValid) {
    return {
      ok: false,
      status: 422,
      error: 'MIN_ORDER',
      message: min.message || 'Заказ не проходит по минимальной сумме.',
    };
  }

  return input.preflight;
}

export function evaluateOrderRules(input: RuleInput): FulfillmentRuleResult {
  const preflight = evaluateOrderPreflight(input);
  return preflight.ok
    ? evaluateAuthoritativeOrderRules({ preflight, items: input.items, zone: input.zone })
    : preflight;
}
