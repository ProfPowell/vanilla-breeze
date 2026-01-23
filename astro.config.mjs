import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://profpowell.github.io',
  base: '/vanilla-breeze',
  srcDir: './site',
  outDir: './dist',

  vite: {
    resolve: {
      alias: {
        '@lib': '/src',
        '@components': '/site/components'
      }
    },
    server: {
      fs: { allow: ['./r-n-d', './src', './docs'] }
    }
  }
});
