/**
 * Class name utility with tailwind-merge support
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with tailwind-merge to handle Tailwind conflicts
 * @param inputs - Class names to combine
 * @returns Combined and deduplicated class names
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Simple class name concatenation (lighter alternative)
 * @param classes - Class names to combine
 * @returns Space-separated class names
 */
export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
