import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  treeshake: true,
  // Don't bundle node built-ins or peer/runtime deps; the consumer's
  // bundler / Node should resolve them.
  external: ['hono', 'openai', 'sharp', 'zod', '@pet-genius/shared'],
});
