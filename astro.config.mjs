import { defineConfig } from 'astro/config';
import { existsSync } from 'fs';
import { join } from 'path';

// Vite plugin to serve index.html for directory requests in public/
// and rewrite /cdn/ requests to /src/ during dev
function servePublicIndexHtml() {
  return {
    name: 'serve-public-index-html',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Rewrite /cdn/vanilla-breeze.css to /src/main.css during dev
        if (req.url?.startsWith('/cdn/vanilla-breeze.css')) {
          req.url = '/src/main.css';
        }
        // Rewrite /cdn/vanilla-breeze.js to /src/main.js during dev
        if (req.url?.startsWith('/cdn/vanilla-breeze.js')) {
          req.url = '/src/main.js';
        }
        // Handle directory index.html for public folders
        if (req.url?.endsWith('/') && !req.url.startsWith('/@')) {
          const publicPath = join(process.cwd(), 'public', req.url, 'index.html');
          if (existsSync(publicPath)) {
            req.url = req.url + 'index.html';
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  site: 'https://profpowell.github.io/vanilla-breeze',
  base: process.env.BASE_URL || '/',
  srcDir: './site',
  outDir: './dist',

  vite: {
    plugins: [servePublicIndexHtml()],
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
