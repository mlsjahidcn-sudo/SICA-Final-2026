import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../use-debounce';

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));
    
    expect(result.current).toBe('test');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    expect(result.current).toBe('initial');
    
    // Update the value
    rerender({ value: 'updated', delay: 500 });
    
    // Value should not have changed yet
    expect(result.current).toBe('initial');
    
    // Fast-forward time
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    
    // Now the value should be updated
    expect(result.current).toBe('updated');
  });

  it('should cancel pending updates when value changes rapidly', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } }
    );
    
    // Rapid value changes
    rerender({ value: 'b', delay: 500 });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    
    rerender({ value: 'c', delay: 500 });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    
    rerender({ value: 'd', delay: 500 });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    
    // Value should still be 'a' because delay hasn't completed
    expect(result.current).toBe('a');
    
    // Complete the delay for the last value
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    
    // Now it should be 'd'
    expect(result.current).toBe('d');
  });

  it('should use default delay of 300ms', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial' } }
    );
    
    rerender({ value: 'updated' });
    
    // Before default delay
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299);
    });
    expect(result.current).toBe('initial');
    
    // After default delay
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should work with different value types', async () => {
    // Test with number
    const { result: numberResult, rerender: rerenderNumber } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 0 } }
    );
    
    rerenderNumber({ value: 42 });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(numberResult.current).toBe(42);
    
    // Test with object
    const { result: objectResult, rerender: rerenderObject } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: { name: 'initial' } } }
    );
    
    const newObj = { name: 'updated' };
    rerenderObject({ value: newObj });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(objectResult.current).toEqual(newObj);
    
    // Test with array
    const { result: arrayResult, rerender: rerenderArray } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: [1, 2, 3] } }
    );
    
    const newArray = [4, 5, 6];
    rerenderArray({ value: newArray });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(arrayResult.current).toEqual(newArray);
  });

  it('should handle delay changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    rerender({ value: 'updated', delay: 200 });
    
    // With new shorter delay
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(result.current).toBe('updated');
  });
});
