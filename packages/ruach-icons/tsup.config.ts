import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false, // Temporarily disabled due to TypeScript project configuration issues
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  external: ['react'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
