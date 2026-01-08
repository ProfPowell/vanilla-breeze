import { defineConfig } from 'vite';

export default defineConfig({
  // Serve from project root
  root: '.',

  // Dev server configuration
  server: {
    open: '/docs/',
    port: 5173,
  },

  // Build configuration
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'docs/index.html',
      },
    },
  },
});
