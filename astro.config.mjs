import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://profpowell.github.io/vanilla-breeze',
  // base: '/vanilla-breeze', // Enable for GitHub Pages deployment
  srcDir: './site',
  outDir: './dist',

  vite: {
    resolve: {
      alias: {
        '@lib': '/src',
        '@components': '/site/components',
        '/src': '/src',
        '/docs': '/docs'
      }
    },
    server: {
      fs: { allow: ['.'] }
    }
  }
});
