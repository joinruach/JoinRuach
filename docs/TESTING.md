# Ruach Monorepo Testing Guide

This document provides comprehensive guidance on testing across the Ruach monorepo.

## 🎯 Coverage Goals

We maintain **100% test coverage** across all critical paths:
- ✅ Authentication & Authorization
- ✅ Payment Processing (Stripe)
- ✅ Media Upload & Storage (Cloudflare R2)
- ✅ Course & Lesson Management
- ✅ API Routes & Server Actions
- ✅ Shared Components

## 📦 Test Types

### 1. Unit Tests

Unit tests verify individual functions, components, and modules in isolation.

**Frameworks:**
- **Frontend**: Vitest + React Testing Library
- **Backend**: Jest + Supertest
- **Packages**: Vitest

**Running Unit Tests:**
```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests for specific package
pnpm --filter ruach-next test
pnpm --filter @ruach/components test
pnpm --filter ruach-ministries-backend test
```

### 2. Integration Tests

Integration tests verify that different parts of the system work together correctly.

**Examples:**
- Frontend → Backend API communication
- Backend → Database interactions
- Backend → R2 Storage operations
- Stripe webhook → Database updates

**Running Integration Tests:**
```bash
# Integration tests are included in the regular test suite
pnpm test

# Run backend integration tests
pnpm --filter ruach-ministries-backend test
```

### 3. End-to-End (E2E) Tests

E2E tests simulate real user journeys through the application.

**Framework**: Playwright

**Test Scenarios:**
- User registration and email confirmation
- Partner subscription via Stripe
- Course enrollment and lesson watching
- Media upload and testimony submission
- Admin content approval workflow

**Running E2E Tests:**
```bash
# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode
pnpm test:e2e:ui

# Run E2E tests in headed mode (see browser)
pnpm test:e2e:headed

# Debug E2E tests
pnpm test:e2e:debug
```

## 🚀 Quick Start

### Run All Tests

```bash
# Using the test matrix script
./scripts/test-matrix.sh

# Or using pnpm
pnpm test && pnpm test:e2e
```

### Run Tests with Coverage

```bash
./scripts/test-matrix.sh --coverage
```

### Run Specific Test Suites

```bash
# Unit tests only
./scripts/test-matrix.sh --unit

# E2E tests only
./scripts/test-matrix.sh --e2e

# Verbose output
./scripts/test-matrix.sh --verbose
```

## 📁 Test File Organization

```
ruach-monorepo/
├── apps/
│   └── ruach-next/
│       ├── src/
│       │   ├── lib/
│       │   │   └── __tests__/        # Utility tests
│       │   ├── components/
│       │   │   └── __tests__/        # Component tests
│       │   └── app/
│       │       └── api/
│       │           └── __tests__/    # API route tests
│       └── jest.config.js
├── ruach-ministries-backend/
│   ├── tests/
│   │   ├── services/                 # Service tests
│   │   ├── controllers/              # Controller tests
│   │   └── policies/                 # Policy tests
│   └── jest.config.js
├── packages/
│   ├── ruach-components/
│   │   ├── src/
│   │   │   └── **/__tests__/        # Component tests
│   │   └── vitest.config.ts
│   └── ruach-next-addons/
│       ├── src/
│       │   └── **/__tests__/        # Utility tests
│       └── vitest.config.ts
├── e2e/
│   ├── home.spec.ts                  # Homepage E2E
│   ├── courses.spec.ts               # Courses E2E
│   ├── auth.spec.ts                  # Auth flow E2E
│   └── ...
├── tests/
│   ├── fixtures/
│   │   ├── factories.ts              # Test data factories
│   │   └── mocks.ts                  # Mock objects
│   └── ...
└── playwright.config.ts
```

## 🧪 Writing Tests

### Unit Test Example (Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../my-module';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('');
    expect(myFunction(null)).toThrow();
  });
});
```

### Component Test Example (React Testing Library)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle clicks', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Test Example (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('user can sign up', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Sign Up');

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/check-email');
});
```

## 🏭 Test Factories & Mocks

We provide comprehensive test factories and mocks in `/tests/fixtures/`:

```typescript
import { createUser, createCourse, createLesson } from '@/tests/fixtures/factories';
import { createMockStripe, createMockRedis } from '@/tests/fixtures/mocks';

// Create test data
const user = createUser({ email: 'test@example.com' });
const course = createCourse({ title: 'My Course' });

// Create mocks
const mockStripe = createMockStripe();
const mockRedis = createMockRedis();
```

## 📊 Coverage Reports

Coverage reports are generated in the `coverage/` directory for each package:

```bash
# Generate and view coverage
pnpm test:coverage

# Open coverage report in browser
open coverage/index.html
open apps/ruach-next/coverage/index.html
open ruach-ministries-backend/coverage/index.html
```

**Coverage Thresholds:**
- Lines: 100%
- Functions: 100%
- Branches: 100%
- Statements: 100%

## 🔧 CI/CD Integration

All tests run automatically in CI/CD:

```yaml
# .github/workflows/ci-enhanced.yml
- Unit tests with coverage
- E2E tests with Playwright
- Coverage upload to Codecov
- Build verification
```

**CI Requirements:**
- ✅ All tests must pass
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ Coverage thresholds met
- ✅ Build succeeds

## 🐛 Debugging Tests

### Unit Tests

```bash
# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test path/to/test.test.ts

# Run tests matching pattern
pnpm test --grep "pattern"
```

### E2E Tests

```bash
# Debug mode (step through)
pnpm test:e2e:debug

# UI mode (interactive)
pnpm test:e2e:ui

# Headed mode (see browser)
pnpm test:e2e:headed

# Run specific test file
npx playwright test e2e/auth.spec.ts
```

## 📚 Best Practices

### 1. Test Naming

```typescript
// ✅ Good: Descriptive test names
it('should create user account when valid data is provided', () => {});

// ❌ Bad: Vague test names
it('works', () => {});
```

### 2. Test Structure

Use the AAA pattern: **Arrange, Act, Assert**

```typescript
it('should calculate total price', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(30);
});
```

### 3. Test Independence

Each test should be independent and not rely on other tests:

```typescript
// ✅ Good: Each test sets up its own data
describe('User Service', () => {
  it('test 1', () => {
    const user = createUser();
    // test with user
  });

  it('test 2', () => {
    const user = createUser();
    // test with user
  });
});

// ❌ Bad: Tests depend on shared state
let user;
it('test 1', () => {
  user = createUser();
});
it('test 2', () => {
  // depends on user from test 1
});
```

### 4. Mock External Dependencies

```typescript
import { vi } from 'vitest';

// Mock external API
vi.mock('@/lib/strapi', () => ({
  fetchCourses: vi.fn().mockResolvedValue([]),
}));
```

### 5. Clean Up After Tests

```typescript
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

## 🎓 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🆘 Troubleshooting

### Tests Fail Locally But Pass in CI

1. Check Node.js version matches CI
2. Clear `node_modules` and reinstall: `pnpm install`
3. Clear test caches: `pnpm test --clearCache`

### E2E Tests Timeout

1. Increase timeout in `playwright.config.ts`
2. Check if dev server is running: `pnpm dev`
3. Verify network conditions

### Coverage Not Generated

1. Ensure `--coverage` flag is used
2. Check for coverage configuration in config files
3. Verify test files are in correct locations

## 📞 Support

For testing-related questions or issues:
1. Check this documentation
2. Review existing tests for examples
3. Check CI logs for detailed error messages
4. Open an issue on GitHub

---

**Last Updated:** 2025-11-10
**Maintainer:** Ruach Studios Development Team
