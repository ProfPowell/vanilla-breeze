# Vendored: marked

`marked.esm.js` and `marked.esm.d.ts` are verbatim copies of
`node_modules/marked/lib/marked.esm.js` and `lib/marked.d.ts` (MIT; version
and copyright in the file header).

Why vendored rather than imported by bare specifier: `src/web-components/index.js`
is loaded raw over HTTP by dev demos. A bare `import ... from 'marked'` is
unresolvable there and an unresolvable static import kills the whole module
graph, so every component on the page stops registering (kdkb). A relative
import works both raw and under esbuild.

To update: `npm install marked@<version>` then `npm run vendor:marked`.
`tests/unit/vendored-marked.test.js` fails until the copies match the
installed package again.
