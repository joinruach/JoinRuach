# Testing Patterns

**Analysis Date:** 2026-01-08

## Test Framework

**Runner:**
- Vitest 4.0.8 (primary, modern test runner) - `vitest.config.ts`
- Jest 29.7.0 (legacy, Next.js app) - `jest.config.js`
- Playwright 1.56.1 (E2E) - `playwright.config.ts`

**Assertion Library:**
- Vitest built-in expect
- Jest built-in expect (legacy)
- @testing-library/jest-dom 6.9.1 (DOM matchers)
- Matchers: toBe, toEqual, toThrow, toBeInTheDocument, toHaveClass

**Run Commands:**
```bash
pnpm test                              # Run all tests
pnpm test:watch                        # Watch mode
pnpm test:coverage                     # Coverage report
pnpm test:all                          # All packages with continue flag
pnpm test:e2e                          # Playwright E2E
pnpm test:e2e:backend                  # E2E with backend
pnpm test:e2e:ui                       # Interactive mode
pnpm test:e2e:headed                   # See browser
pnpm typecheck                         # Type checking
pnpm lint                              # Linting
```

## Test File Organization

**Location:**
- Co-located with source files (preferred)
  - `src/components/Button.tsx` → `src/components/__tests__/Button.test.tsx`
  - `src/lib/cn.ts` → `src/lib/__tests__/cn.test.ts`
- Alternative: `__tests__/` subdirectory alongside source

**Naming:**
- Unit/Integration: `*.test.ts`, `*.test.tsx`
- E2E: `*.spec.ts` (in `e2e/` directory)
- No distinction in filename between unit vs integration

**Structure:**
```
packages/ruach-components/src/
  components/
    ruach/
      ui/
        Button.tsx
        __tests__/
          Button.test.tsx          # 207 lines
          LoadingSpinner.test.tsx  # 68 lines
  lib/
    __tests__/
      cn.test.ts                   # 82 lines

apps/ruach-next/src/
  lib/
    __tests__/
      validate-env.test.ts         # 222 lines

e2e/
  home.spec.ts                     # 126 lines
  auth.spec.ts
  courses.spec.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Button from '../Button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      // Arrange
      render(<Button>Click me</Button>);

      // Act
      const button = screen.getByRole('button');

      // Assert
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click me');
    });
  });

  describe('interactions', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
```

**Patterns:**
- Use `beforeEach` for per-test setup (avoid `beforeAll`)
- Use `afterEach` to clean up: `cleanup()`, `vi.restoreAllMocks()`
- Explicit arrange/act/assert comments in tests
- Nested describe blocks for logical grouping
- One primary assertion focus per test (multiple expects OK)

## Mocking

**Framework:**
- Vitest: `vi.mock()`, `vi.fn()`, `vi.mocked()`
- Jest: `jest.mock()`, `jest.fn()`, `jest.mocked()`

**Patterns:**

*Module Mocking (Vitest):*
```typescript
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    pathname: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) =>
    createElement('a', { href }, children),
}));
```

*Function Mocking:*
```typescript
it('should call callback', async () => {
  const mockFn = vi.fn();
  const user = userEvent.setup();

  render(<Component onClick={mockFn} />);
  await user.click(screen.getByRole('button'));

  expect(mockFn).toHaveBeenCalledTimes(1);
  expect(mockFn).toHaveBeenCalledWith(expectedArg);
});
```

**What to Mock:**
- Next.js modules: next/navigation, next/link, next-auth/react
- External APIs: fetch, HTTP clients
- File system operations (Strapi tests)
- Environment variables

**What NOT to Mock:**
- Internal pure functions and utilities
- Simple helpers (string manipulation, array operations)
- TypeScript types

## Fixtures and Factories

**Test Data:**
```typescript
// Factory functions in test file
function createTestUser(overrides?: Partial<User>): User {
  return {
    id: 'test-id',
    name: 'Test User',
    email: 'test@example.com',
    ...overrides
  };
}

// Mock session (from jest.setup.ts)
const mockSession = {
  expires: new Date(Date.now() + 2 * 86400).toISOString(),
  user: {
    email: 'test@example.com',
    name: 'Test User',
    id: '1',
  },
  strapiJwt: 'mock-jwt-token',
};
```

**Location:**
- Factory functions: Define in test file near usage
- Shared test utilities: `jest.setup.ts`, `vitest.setup.ts`
- Mock data: Inline in test when simple, factory when complex

## Coverage

**Requirements:**

*Vitest (packages):*
- Target: 100% lines, functions, branches, statements
- Provider: v8
- Configuration: `vitest.config.ts`

*Jest (Next.js app):*
- Threshold: 70% global (lines, functions, branches, statements)
- Configuration: `jest.config.js`
- Timeout: 10000ms

**Configuration:**

*Vitest excludes:*
- `node_modules/`, `dist/`, `build/`, `.next/`, `coverage/`
- `**/*.config.{js,ts}`
- `**/*.d.ts`
- `**/types/`
- Index files and stories

*Jest excludes:*
- `src/**/*.d.ts`
- `src/**/*.stories.{js,jsx,ts,tsx}`
- `src/**/_*.{js,jsx,ts,tsx}` (Next.js internal files)

**View Coverage:**
```bash
pnpm test:coverage          # Generate coverage report
open coverage/index.html    # View HTML report
```

## Test Types

**Unit Tests:**
- Scope: Test single function/component in isolation
- Mocking: Mock all external dependencies
- Speed: Fast (<100ms per test)
- Examples:
  - `packages/ruach-components/src/lib/__tests__/cn.test.ts` - Class name utility
  - `apps/ruach-next/src/lib/__tests__/validate-env.test.ts` - Environment validation

**Component Tests:**
- Scope: Test React components with React Testing Library
- Mocking: Mock Next.js modules, external APIs
- Examples:
  - `packages/ruach-components/src/components/ruach/ui/__tests__/Button.test.tsx` (207 lines)
  - `packages/ruach-components/src/components/ruach/ui/__tests__/LoadingSpinner.test.tsx` (68 lines)
- Patterns: Test rendering, variants, interactions, accessibility

**E2E Tests:**
- Framework: Playwright 1.56.1
- Scope: Full user flows from browser perspective
- Location: `e2e/` directory
- Configuration: `playwright.config.ts`
- Examples:
  - `e2e/home.spec.ts` - Homepage load, navigation, hero section
  - `e2e/auth.spec.ts` - Authentication flows
  - `e2e/courses.spec.ts` - Course browsing and enrollment
- Execution: Sequential (workers: 1)
- Timeouts: 30s per test, 10s actions, 15s navigation
- Artifacts: Screenshots/videos on failure, trace on retry

## Common Patterns

**Async Testing:**
```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});

// With user interactions
it('should submit form', async () => {
  const user = userEvent.setup();
  render(<Form />);

  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: 'Submit' }));

  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

**Error Testing:**
```typescript
it('should throw on invalid input', () => {
  expect(() => parse(null)).toThrow('Cannot parse null');
});

// Async error
it('should reject on failure', async () => {
  await expect(asyncCall()).rejects.toThrow('error message');
});
```

**Accessibility Testing:**
```typescript
it('should be accessible', () => {
  render(<Button>Click me</Button>);

  const button = screen.getByRole('button', { name: 'Click me' });
  expect(button).toBeInTheDocument();
  expect(button).toHaveAttribute('aria-label', 'Click me');
});
```

**Snapshot Testing:**
- Not used in this codebase
- Prefer explicit assertions for clarity

## Test Setup Files

**Vitest Setup** (`packages/ruach-components/vitest.setup.ts`):
- Imports: `@testing-library/jest-dom/vitest`
- Cleanup: `afterEach(() => cleanup())`
- Mocks: next/navigation, next/link, next-auth/react
- Console error spy to suppress expected warnings
- Uses `vi.mock()` and `vi.fn()` (Vitest APIs)

**Jest Setup** (`apps/ruach-next/jest.setup.ts`):
- Environment variables: NEXTAUTH_URL, NEXTAUTH_SECRET, NEXT_PUBLIC_STRAPI_URL
- Mock session with strapiJwt
- Mocks: next/navigation, next-auth/react
- Global fetch mock: `globalThis.fetch = jest.fn()`
- Clears mocks between tests: `afterEach(() => jest.clearAllMocks())`

**Playwright Config** (`playwright.config.ts`):
- Test directory: `./e2e`
- Sequential execution: `workers: 1`
- Timeouts: 30s test, 10s action, 15s navigation
- Retries: 2 in CI, 0 locally
- Reporters: html, list, github (in CI)
- Projects: chromium, firefox, webkit

---

*Testing analysis: 2026-01-08*
*Update when test patterns change*
