import { defineConfig } from 'vite';
import { readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

// Recursively find all HTML files in a directory
function findHtmlFiles(dir, baseDir = dir) {
  const files = {};
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      Object.assign(files, findHtmlFiles(fullPath, baseDir));
    } else if (entry.endsWith('.html')) {
      // Create a unique key based on the relative path
      const relativePath = fullPath.replace(baseDir + '/', '').replace(/\//g, '_').replace('.html', '');
      files[relativePath] = fullPath;
    }
  }

  return files;
}

// Get all HTML files from docs directory
const docsHtmlFiles = findHtmlFiles(resolve(__dirname, 'docs'));

export default defineConfig({
  // Serve from project root
  root: '.',

  // Base URL for GitHub Pages (set via env var in CI, defaults to '/' for local dev)
  base: process.env.BASE_URL || '/',

  // Dev server configuration
  server: {
    open: '/docs/',
    port: 5173,
  },

  // Build configuration
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: docsHtmlFiles,
    },
  },
});
