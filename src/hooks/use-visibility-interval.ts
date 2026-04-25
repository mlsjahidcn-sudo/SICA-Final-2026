'use client';

import { useEffect, useRef } from 'react';

export function useVisibilityInterval(
  fn: () => void | Promise<void>,
  delayMs: number | null,
  options?: { immediate?: boolean }
) {
  const fnRef = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (delayMs === null) return;

    const stop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const start = () => {
      if (timerRef.current) return;
      timerRef.current = setInterval(() => fnRef.current(), delayMs);
    };

    const restartIfVisible = (runImmediate: boolean) => {
      stop();
      if (document.visibilityState !== 'visible') return;
      if (runImmediate) fnRef.current();
      start();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        restartIfVisible(Boolean(options?.immediate));
        return;
      }
      stop();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    restartIfVisible(Boolean(options?.immediate));

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stop();
    };
  }, [delayMs, options?.immediate]);
}
