import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'included', false && 'excluded');
    expect(result).toBe('base included');
  });

  it('should handle undefined and null values', () => {
    const result = cn('base', undefined, null, 'end');
    expect(result).toBe('base end');
  });

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('should handle object notation', () => {
    const result = cn({
      'active': true,
      'disabled': false,
      'primary': true,
    });
    expect(result).toBe('active primary');
  });

  it('should handle array notation', () => {
    const result = cn(['foo', 'bar'], 'baz');
    expect(result).toBe('foo bar baz');
  });

  it('should handle complex tailwind conflicts', () => {
    const result = cn(
      'text-sm font-medium',
      'text-lg',
      'hover:bg-primary hover:text-white'
    );
    expect(result).toBe('font-medium text-lg hover:bg-primary hover:text-white');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle multiple conflicting classes', () => {
    const result = cn('p-1', 'p-2', 'p-3', 'm-1', 'm-2');
    expect(result).toBe('p-3 m-2');
  });

  it('should merge responsive and state variants correctly', () => {
    const result = cn(
      'text-base md:text-lg',
      'text-xl md:text-2xl',
      'hover:text-primary'
    );
    expect(result).toBe('text-xl md:text-2xl hover:text-primary');
  });
});
