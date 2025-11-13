import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { track } from '../analytics';

describe('analytics', () => {
  describe('track function', () => {
    let originalWindow: typeof globalThis.window;

    beforeEach(() => {
      // Save original window
      originalWindow = globalThis.window;
    });

    afterEach(() => {
      // Restore original window
      globalThis.window = originalWindow;
    });

    it('should call window.plausible when available', () => {
      const mockPlausible = vi.fn();
      globalThis.window = {
        ...originalWindow,
        plausible: mockPlausible,
      } as any;

      track('page_view');

      expect(mockPlausible).toHaveBeenCalledTimes(1);
      expect(mockPlausible).toHaveBeenCalledWith('page_view', { props: undefined });
    });

    it('should pass props to plausible', () => {
      const mockPlausible = vi.fn();
      globalThis.window = {
        ...originalWindow,
        plausible: mockPlausible,
      } as any;

      const props = { page: '/home', referrer: 'google' };
      track('page_view', props);

      expect(mockPlausible).toHaveBeenCalledWith('page_view', { props });
    });

    it('should handle multiple properties', () => {
      const mockPlausible = vi.fn();
      globalThis.window = {
        ...originalWindow,
        plausible: mockPlausible,
      } as any;

      const props = {
        page: '/courses',
        category: 'education',
        userId: '123',
        value: 99,
      };

      track('course_view', props);

      expect(mockPlausible).toHaveBeenCalledWith('course_view', { props });
    });

    it('should not throw when window.plausible is undefined', () => {
      globalThis.window = {
        ...originalWindow,
        plausible: undefined,
      } as any;

      expect(() => track('page_view')).not.toThrow();
    });

    it('should not throw when window.plausible is not a function', () => {
      globalThis.window = {
        ...originalWindow,
        plausible: 'not a function' as any,
      } as any;

      expect(() => track('page_view')).not.toThrow();
    });

    it('should handle server-side rendering (no window)', () => {
      // Temporarily remove window
      const originalWindow = globalThis.window;
      delete (globalThis as any).window;

      expect(() => track('page_view')).not.toThrow();

      // Restore window
      globalThis.window = originalWindow;
    });

    it('should handle empty event name', () => {
      const mockPlausible = vi.fn();
      globalThis.window = {
        ...originalWindow,
        plausible: mockPlausible,
      } as any;

      track('');

      expect(mockPlausible).toHaveBeenCalledWith('', { props: undefined });
    });

    it('should handle empty props object', () => {
      const mockPlausible = vi.fn();
      globalThis.window = {
        ...originalWindow,
        plausible: mockPlausible,
      } as any;

      track('event', {});

      expect(mockPlausible).toHaveBeenCalledWith('event', { props: {} });
    });

    it('should handle complex nested props', () => {
      const mockPlausible = vi.fn();
      globalThis.window = {
        ...originalWindow,
        plausible: mockPlausible,
      } as any;

      const props = {
        userId: '123',
        userName: 'Test User',
        browser: 'Chrome',
        os: 'Linux',
      };

      track('complex_event', props);

      expect(mockPlausible).toHaveBeenCalledWith('complex_event', { props });
    });

    it('should handle special characters in event names', () => {
      const mockPlausible = vi.fn();
      globalThis.window = {
        ...originalWindow,
        plausible: mockPlausible,
      } as any;

      track('event:name-with.special_chars');

      expect(mockPlausible).toHaveBeenCalledWith(
        'event:name-with.special_chars',
        { props: undefined }
      );
    });

    it('should handle rapid successive calls', () => {
      const mockPlausible = vi.fn();
      globalThis.window = {
        ...originalWindow,
        plausible: mockPlausible,
      } as any;

      track('event1');
      track('event2');
      track('event3');

      expect(mockPlausible).toHaveBeenCalledTimes(3);
    });

    it('should not interfere with other window properties', () => {
      const mockPlausible = vi.fn();
      const otherFunction = vi.fn();

      globalThis.window = {
        ...originalWindow,
        plausible: mockPlausible,
        otherFunction,
      } as any;

      track('event');

      expect(mockPlausible).toHaveBeenCalled();
      expect(otherFunction).not.toHaveBeenCalled();
      expect((globalThis.window as any).otherFunction).toBe(otherFunction);
    });
  });

  describe('Common tracking scenarios', () => {
    let mockPlausible: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockPlausible = vi.fn();
      globalThis.window = {
        plausible: mockPlausible,
      } as any;
    });

    it('should track page views', () => {
      track('pageview', { path: '/courses' });
      expect(mockPlausible).toHaveBeenCalledWith('pageview', {
        props: { path: '/courses' },
      });
    });

    it('should track button clicks', () => {
      track('button_click', { button: 'subscribe', location: 'header' });
      expect(mockPlausible).toHaveBeenCalledWith('button_click', {
        props: { button: 'subscribe', location: 'header' },
      });
    });

    it('should track form submissions', () => {
      track('form_submit', { form: 'contact', success: 'true' });
      expect(mockPlausible).toHaveBeenCalledWith('form_submit', {
        props: { form: 'contact', success: 'true' },
      });
    });

    it('should track video plays', () => {
      track('video_play', { videoId: '123', title: 'Test Video' });
      expect(mockPlausible).toHaveBeenCalledWith('video_play', {
        props: { videoId: '123', title: 'Test Video' },
      });
    });

    it('should track donations', () => {
      track('donation', { amount: 50, frequency: 'monthly' });
      expect(mockPlausible).toHaveBeenCalledWith('donation', {
        props: { amount: 50, frequency: 'monthly' },
      });
    });

    it('should track course enrollments', () => {
      track('course_enroll', { courseId: '456', courseName: 'Discipleship 101' });
      expect(mockPlausible).toHaveBeenCalledWith('course_enroll', {
        props: { courseId: '456', courseName: 'Discipleship 101' },
      });
    });
  });
});
