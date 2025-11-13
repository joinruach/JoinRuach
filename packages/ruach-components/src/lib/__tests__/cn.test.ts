import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });

  it('should handle false conditionals', () => {
    const isActive = false;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class');
  });

  it('should merge conflicting Tailwind classes correctly', () => {
    // twMerge should keep the last one
    const result = cn('p-4', 'p-8');
    expect(result).toBe('p-8');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['text-red-500', 'bg-blue-500']);
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('should handle objects with boolean values', () => {
    const result = cn({
      'text-red-500': true,
      'bg-blue-500': false,
      'font-bold': true,
    });
    expect(result).toBe('text-red-500 font-bold');
  });

  it('should handle undefined and null values', () => {
    const result = cn('base-class', undefined, null, 'other-class');
    expect(result).toBe('base-class other-class');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle complex combinations', () => {
    // Use identity function to prevent type narrowing
    const getVariant = (): 'primary' | 'secondary' => 'primary';
    const getSize = (): 'sm' | 'lg' => 'lg';

    const variant = getVariant();
    const size = getSize();
    const disabled = false;

    const result = cn(
      'base-button',
      variant === 'primary' && 'bg-blue-500 text-white',
      variant === 'secondary' && 'bg-gray-500 text-white',
      size === 'sm' && 'px-2 py-1',
      size === 'lg' && 'px-6 py-3',
      disabled && 'opacity-50 cursor-not-allowed'
    );

    expect(result).toBe('base-button bg-blue-500 text-white px-6 py-3');
  });

  it('should prioritize later classes over earlier ones for conflicts', () => {
    const result = cn('text-sm', 'text-lg');
    expect(result).toBe('text-lg');
  });

  it('should handle multiple conflicting utilities', () => {
    const result = cn('p-2 m-2', 'p-4 m-4');
    expect(result).toBe('p-4 m-4');
  });
});
