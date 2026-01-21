import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    include: ['**/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/',
        '**/.next/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ruach/components': path.resolve(__dirname, '../../packages/ruach-components/src'),
      '@ruach/addons': path.resolve(__dirname, '../../packages/ruach-next-addons/src'),
      '@ruach/formation': path.resolve(__dirname, '../../packages/ruach-formation/src'),
      '@ruach/utils': path.resolve(__dirname, '../../packages/ruach-utils/src'),
      '@ruach/hooks': path.resolve(__dirname, '../../packages/ruach-hooks/src'),
      '@ruach/ai': path.resolve(__dirname, '../../packages/ruach-ai/src'),
    },
  },
});
