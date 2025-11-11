import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/embeddings/index.ts',
    'src/chat/index.ts',
    'src/recommendations/index.ts',
  ],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['openai', '@ai-sdk/anthropic', 'ai'],
});
