import { describe, expect, it, vi } from 'vitest';

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useEffect: vi.fn(),
    useState: vi.fn((initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()]),
  };
});

import DeliveryCheckout from './DeliveryCheckout';

type ElementNode = {
  props?: {
    'aria-label'?: string;
    'aria-pressed'?: boolean;
    children?: unknown;
    role?: string;
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

describe('DeliveryCheckout fulfillment selector accessibility', () => {
  it('exposes a labelled pressed-button group with delivery selected by default', () => {
    const checkout = DeliveryCheckout({
      items: [],
      subtotal: 0,
      onClose: vi.fn(),
      onSuccess: vi.fn(),
    });
    const group = findElement(checkout, (element) => element.props?.role === 'group');
    const delivery = findElement(checkout, (element) => element.props?.children === 'Доставка');
    const pickup = findElement(checkout, (element) => element.props?.children === 'Самовывоз');

    expect(group?.props?.['aria-label']).toBe('Способ получения заказа');
    expect(delivery?.props?.['aria-pressed']).toBe(true);
    expect(pickup?.props?.['aria-pressed']).toBe(false);
  });
});
