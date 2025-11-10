import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration for @ruach/addons
 * Tests shared utilities and helpers
 */
export default defineConfig({
  test: {
    name: '@ruach/addons',
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
      ],
      all: true,
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
