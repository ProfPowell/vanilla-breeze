import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: '{{LIBRARY_NAME}}',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src'
      }
    },
    cssCodeSplit: true,
    sourcemap: true
  },
  server: {
    port: 3000,
    open: '/docs/index.html'
  }
});