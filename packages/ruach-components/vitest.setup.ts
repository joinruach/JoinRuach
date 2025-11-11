import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, afterAll } from 'vitest';

const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

declare global {
  // eslint-disable-next-line no-var
  var __CONSOLE_ERROR_SPY__: typeof consoleErrorSpy | undefined;
}

globalThis.__CONSOLE_ERROR_SPY__ = consoleErrorSpy;

// Cleanup after each test
afterEach(() => {
  cleanup();
  consoleErrorSpy.mockClear();
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
  delete globalThis.__CONSOLE_ERROR_SPY__;
});

// Mock Next.js modules that aren't available in test environment
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) =>
    createElement('a', { href }, children),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
