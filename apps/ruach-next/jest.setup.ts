/**
 * Jest Setup for Next.js Frontend Tests
 *
 * This file runs before each test suite to configure the testing environment.
 */

import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret-min-32-characters-long-for-testing-purposes';
process.env.NEXT_PUBLIC_STRAPI_URL = 'http://localhost:1337';
process.env.NODE_ENV = 'test';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock next-auth
jest.mock('next-auth/react', () => {
  const originalModule = jest.requireActual('next-auth/react');
  const mockSession = {
    expires: new Date(Date.now() + 2 * 86400).toISOString(),
    user: {
      email: 'test@example.com',
      name: 'Test User',
      id: '1',
    },
    strapiJwt: 'mock-jwt-token',
  };

  return {
    __esModule: true,
    ...originalModule,
    useSession: jest.fn(() => ({
      data: mockSession,
      status: 'authenticated',
    })),
    signIn: jest.fn(),
    signOut: jest.fn(),
    SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global test utilities
global.fetch = jest.fn();

// Reset mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});
