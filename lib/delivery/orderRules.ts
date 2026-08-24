import { BUSINESS_LUNCH_WINDOW_TEXT, isBusinessLunchOpen } from '../menu/businessLunchWindow';
import {
  isBusinessLunchItem,
  validateMinOrder,
  type MinOrderItem,
  type MinOrderZone,
} from './minOrder';
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
  | {
      ok: true;
      fulfillmentType: FulfillmentType;
      requestedAt: Date;
      completeBefore: string | null;
    }
  | { ok: false; status: 400 | 409 | 422; error: string; message: string };

export function evaluateOrderRules(input: RuleInput): FulfillmentRuleResult {
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
    return {
      ok: false,
      status: 422,
      error: 'MIN_ORDER',
      message: min.message || 'Заказ не проходит по минимальной сумме.',
    };
  }

  return {
    ok: true,
    fulfillmentType,
    requestedAt: timing.requestedAt,
    completeBefore: timing.completeBefore,
  };
}
