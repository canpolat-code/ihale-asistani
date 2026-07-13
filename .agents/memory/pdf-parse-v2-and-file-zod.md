---
name: pdf-parse v2 API + DOM lib for File/Blob zod schemas
description: pdf-parse v2 replaced the v1 default-function API; Orval-generated file-upload zod schemas need the dom lib.
---

## pdf-parse v2.x API change

`pdf-parse` v1.x exported a default function: `import pdf from "pdf-parse"; const { text } = await pdf(buffer)`.

v2.x (e.g. 2.4.5) dropped that entirely in favor of a class-based API:

```ts
import { PDFParse } from "pdf-parse";
const parser = new PDFParse({ data: buffer }); // buffer/Uint8Array/ArrayBuffer/url
const { text } = await parser.getText();
```

There is no default export in v2; importing `.default` on the namespace is a TS error.

**Why:** Training-era knowledge of `pdf-parse` reflects the old v1 API and does not carry over; the package majorly rewrote its interface (also added `getInfo`, `getTable`, `getScreenshot`, `getImage`).

**How to apply:** Always check the installed `pdf-parse` major version/README before wiring it up — don't assume the v1 call signature.

## pdf-parse/pdfjs-dist needs canvas + esbuild externalization on Node

`pdf-parse` v2 pulls in `pdfjs-dist`, which (a) needs `@napi-rs/canvas` installed as a dependency so `DOMMatrix`/`Path2D`/`ImageData` polyfills work in Node, and (b) resolves its worker script (`pdf.worker.mjs`) as a sibling file on disk at runtime. If `pdf-parse`/`pdfjs-dist` are bundled into a single esbuild output file, that worker file resolution breaks ("Cannot find module '.../dist/pdf.worker.mjs'").

**Why:** pdfjs-dist's worker-loading mechanism assumes normal node_modules file layout; single-file bundling defeats it, and canvas polyfills are an optional peer needed only in Node (not bundled by default).

**How to apply:** Install `@napi-rs/canvas` alongside `pdf-parse`, and add both `pdf-parse` and `pdfjs-dist` to the esbuild `external` list (in e.g. `build.mjs`) so they stay as real files in `node_modules` instead of being inlined.

## Orval File/Blob zod schemas need `dom` lib

When an OpenAPI spec declares a `multipart/form-data` file-upload body, Orval emits `zod.instanceof(File)` (or `Blob`) in the generated zod schema package. If that package's `tsconfig.json` only targets a Node-ish `lib` (no DOM types), this fails to typecheck with "cannot find name 'File'".

**Why:** `File`/`Blob` are DOM/web platform types, not part of default Node.js `lib` typings, but Orval doesn't gate its output on the target `lib` setting.

**How to apply:** If a generated api-zod (or similar codegen) package has upload endpoints, ensure its `tsconfig.json` `compilerOptions.lib` includes `"dom"` (e.g. `["es2022", "dom"]`). Server-side code that receives the actual multipart upload should still use its file-upload middleware's own file type (e.g. `multer`'s `Express.Multer.File`), not the zod `File` schema, since Node has no browser `File` object at runtime for the raw buffer.
