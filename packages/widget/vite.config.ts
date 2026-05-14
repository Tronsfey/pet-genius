import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [
    solid(),
    {
      name: 'copy-styles',
      closeBundle() {
        copyFileSync(resolve(__dirname, 'src/styles.css'), resolve(__dirname, 'dist/styles.css'));
      },
    },
  ],
  build: {
    target: 'es2022',
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['solid-js', 'solid-js/web', 'pixi.js', '@pet-genius/shared'],
      output: {
        preserveModules: false,
      },
    },
    emptyOutDir: true,
  },
});
