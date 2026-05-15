import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

// For the GitHub Pages build we set PET_BASE=/pet-genius/ so asset URLs
// resolve under the project-pages subpath. Local/dev + server-served prod
// keep the default '/'.
const base = process.env.PET_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [solid()],
  server: {
    port: 5173,
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
  },
});
