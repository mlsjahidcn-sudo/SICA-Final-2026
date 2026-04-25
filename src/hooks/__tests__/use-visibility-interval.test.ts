import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVisibilityInterval } from '../use-visibility-interval';

describe('useVisibilityInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs immediately and then on interval when visible', async () => {
    const fn = vi.fn();
    renderHook(() => useVisibilityInterval(fn, 1000, { immediate: true }));

    expect(fn).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('pauses when hidden and resumes when visible', async () => {
    const fn = vi.fn();
    renderHook(() => useVisibilityInterval(fn, 1000, { immediate: true }));

    expect(fn).toHaveBeenCalledTimes(1);

    (document as any).visibilityState = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(fn).toHaveBeenCalledTimes(1);

    (document as any).visibilityState = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));

    expect(fn).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(fn).toHaveBeenCalledTimes(3);
  });
});

