import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'next',
    'next-auth',
    '@radix-ui/*',
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"',
    };
  },
});
