#!/usr/bin/env bash
#
# Cloudflare Pages build command.
#
# Set the CF Pages project's build command in the dashboard to:
#   ./scripts/cf-pages-build.sh
#
# This file is the single source of truth for what CF runs. If you need
# a new build step, put it here and commit it — don't edit the dashboard
# in isolation or the repo and deploy will drift.
#
# Why this exists: the GitHub Pages workflow at .github/workflows/deploy.yml
# runs one chain; CF's dashboard-configured build ran a subset; result was
# /docs/alpenglow/ and other assemble-site.js-produced assets missing on
# production even though they were present locally. Locking this into the
# repo means CF drift becomes a PR, not a silent deploy surprise.

set -euo pipefail

echo "── cf-pages-build: install ──"
npm ci
( cd site && npm ci )

echo "── cf-pages-build: api + feed ──"
npm run build:api
npm run build:feed

echo "── cf-pages-build: cdn bundles ──"
npm run build:cdn

echo "── cf-pages-build: doc-extras ──"
( cd site && npm run build:doc-extras 2>/dev/null || true )

echo "── cf-pages-build: demos (copy with path rewrites) ──"
npm run build:demos

echo "── cf-pages-build: cook SSG ──"
( cd site && npm run build )

echo "── cf-pages-build: assemble site assets ──"
npm run build:site-assets

echo "── cf-pages-build: done ──"
ls -1 site/dist/pages | head -20
echo "alpenglow? $(ls -d site/dist/pages/docs/alpenglow 2>/dev/null && echo YES || echo NO)"
echo "sitemap?   $(ls site/dist/pages/sitemap.xml 2>/dev/null && echo YES || echo NO)"
