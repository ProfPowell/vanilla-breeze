# Vendored: qrcodegen (Project Nayuki QR Code generator library)

Used by `<qr-code>` (`src/web-components/qr-code/encode.js`).

- Upstream: <https://github.com/nayuki/QR-Code-generator>, `typescript-javascript/qrcodegen.ts`
- Pinned commit: `2c9044de6b049ca25cb3cd1649ed7e27aa055138` (2025-01-23)
- sha256 of `upstream/qrcodegen.ts`: `1dc03fb5a10e0e2318ea162755bbdb9977ca6ce52cff959e9c9b6deafdccda9c`
- Licence: MIT, Copyright (c) Project Nayuki (full notice at the top of both files)

`upstream/qrcodegen.ts` is the verbatim upstream file (kept in a subfolder so
TypeScript does not resolve `./qrcodegen.js` imports to it). `qrcodegen.js` is generated from
it by `scripts/vendor-qrcodegen.mjs`: esbuild strips the TypeScript types
(the namespaces become IIFEs), the licence header is copied across, and ES
module exports (`default`, `QrCode`, `QrSegment`) are appended. Do not edit
either file by hand.

Why vendored rather than an npm dependency: `src/web-components/index.js` is
loaded raw over HTTP by dev demos, so components import their libraries by
relative path (same reason as `src/vendor/marked/`). Upstream does not publish
an ES module build.

To update:

1. Set `COMMIT` and `SHA256` in `scripts/vendor-qrcodegen.mjs`.
2. Run `npm run vendor:qrcodegen -- --fetch`.
3. Update the commit and hash above.
4. Run `node --test tests/unit/qr-code-decode.test.js`. It checks the pinned
   hash, checks that the `.js` matches the script output, and decodes codes at
   every error-correction level with jsQR.
