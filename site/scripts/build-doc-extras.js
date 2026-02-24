#!/usr/bin/env node
/**
 * Bundle third-party doc components (code-block, browser-window)
 * into a single CDN-ready file.
 *
 * These components are NOT part of the main VB bundle — they're
 * doc-site-only dependencies loaded after the main VB script.
 */

import * as esbuild from 'esbuild';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CDN = join(ROOT, '..', 'dist', 'cdn');

// Ensure cdn directory exists
if (!existsSync(CDN)) {
  mkdirSync(CDN, { recursive: true });
}

// Create a temporary entry point
const entryContent = `
import '@profpowell/code-block';
import '@profpowell/browser-window';
`;

const entryPath = join(__dirname, '.doc-extras-entry.js');
writeFileSync(entryPath, entryContent);

async function build() {
  console.log('Building doc-extras bundle...');

  await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    minify: true,
    format: 'esm',
    outfile: join(CDN, 'doc-extras.js'),
    logLevel: 'info',
    // Resolve node_modules from the root project
    nodePaths: [join(ROOT, '..', 'node_modules')],
  });

  // Clean up temp file
  const { unlinkSync } = await import('fs');
  unlinkSync(entryPath);

  console.log('doc-extras.js ready at dist/cdn/doc-extras.js');
}

build().catch(e => {
  console.error('doc-extras build failed:', e);
  process.exit(1);
});
