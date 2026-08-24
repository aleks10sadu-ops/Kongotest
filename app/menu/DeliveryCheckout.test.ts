import { describe, expect, it, vi } from 'vitest';

type SubmissionResult = { ok: true } | { ok: false; message: string };
type CheckoutModule = {
  submitCheckoutOrder: (
    payload: Record<string, unknown>,
    fetcher: typeof fetch,
  ) => Promise<SubmissionResult>;
};

const response = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('DeliveryCheckout order boundary', () => {
  it('shows a schedule rejection without Telegram fallback or success', async () => {
    const module = await import('./DeliveryCheckout') as unknown as CheckoutModule;
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(409, {
      ok: false,
      error: 'order_time_outside_schedule',
      message: 'Выберите время в интервале 12:00–21:45.',
    }));

    const result = await module.submitCheckoutOrder({ fulfillmentType: 'pickup' }, fetcher);

    expect(result).toEqual({ ok: false, message: 'Выберите время в интервале 12:00–21:45.' });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('/api/orders', expect.any(Object));
  });

  it('shows the MIN_ORDER message without Telegram fallback or success', async () => {
    const module = await import('./DeliveryCheckout') as unknown as CheckoutModule;
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(422, {
      ok: false,
      error: 'MIN_ORDER',
      message: 'Минимальный заказ на самовывоз — 1 000 ₽ или от 2 бизнес-ланчей.',
    }));

    const result = await module.submitCheckoutOrder({ fulfillmentType: 'pickup' }, fetcher);

    expect(result).toEqual({
      ok: false,
      message: 'Минимальный заказ на самовывоз — 1 000 ₽ или от 2 бизнес-ланчей.',
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('/api/orders', expect.any(Object));
  });

  it('reports failure when the orders 500 fallback receives Telegram 502', async () => {
    const module = await import('./DeliveryCheckout') as unknown as CheckoutModule;
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response(500, { ok: false, error: 'iiko_unavailable' }))
      .mockResolvedValueOnce(response(502, { ok: false, error: 'telegram_unavailable' }));

    const result = await module.submitCheckoutOrder({ fulfillmentType: 'pickup' }, fetcher);

    expect(result).toEqual({
      ok: false,
      message: 'Не удалось отправить заказ. Позвоните нам, пожалуйста.',
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenNthCalledWith(2, '/api/telegram', expect.any(Object));
  });
});
