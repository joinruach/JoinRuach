import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Vitest Configuration for @ruach/components
 * Tests shared React components
 */
export default defineConfig({
  plugins: [react()],
  test: {
    name: '@ruach/components',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    onConsoleLog(log, type) {
      if (type === 'error' && log.includes('Test error')) {
        return false;
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.{ts,tsx}',
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
