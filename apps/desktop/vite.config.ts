import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

// Tauri wraps this vite dev server. In dev mode tauri.conf.json points its
// `devUrl` to http://localhost:5174; the production bundle is what vite build
// emits into dist/ and Tauri loads via `frontendDist`.
export default defineConfig({
  plugins: [solid()],
  clearScreen: false,
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: false,
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
  },
});
