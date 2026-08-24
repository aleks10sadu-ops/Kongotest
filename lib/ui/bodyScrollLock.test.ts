import { describe, expect, it } from 'vitest';
import { lockBodyScroll } from './bodyScrollLock';

describe('lockBodyScroll', () => {
  it('keeps the page locked until every overlay releases its lock', () => {
    const documentLike = {
      body: {
        style: {
          overflow: 'auto',
        },
      },
    };

    const releaseCartLock = lockBodyScroll(documentLike);
    const releaseCheckoutLock = lockBodyScroll(documentLike);

    expect(documentLike.body.style.overflow).toBe('hidden');

    releaseCartLock();
    expect(documentLike.body.style.overflow).toBe('hidden');

    releaseCheckoutLock();
    expect(documentLike.body.style.overflow).toBe('auto');

    releaseCheckoutLock();
    expect(documentLike.body.style.overflow).toBe('auto');
  });
});
