# İhale Birim Fiyat Asistanı (Tender Unit Price Assistant)

Helps Turkish contractors auto-fill unit prices on a tender's bill of quantities (Poz No line items) by matching each item against previously published official "Serbest Birim Fiyat" (free unit price) catalogs.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/tender-pricer run dev` — run the frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec (run after editing `lib/api-spec/openapi.yaml`)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite artifact `artifacts/tender-pricer` (Turkish UI, code/comments in English), wouter routing
- API: Express 5 (`artifacts/api-server`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec) — generated React Query hooks + Zod schemas
- File parsing: `xlsx` (Excel), `pdf-parse` v2 (PDF, best-effort text-regex parsing)
- Build: esbuild (CJS/ESM bundle)

## Where things live

- DB schema: `lib/db/src/schema/{price-lists,price-items,tender-projects,tender-items}.ts`
- API contract (source of truth): `lib/api-spec/openapi.yaml`
- Generated hooks/schemas (do not hand-edit): `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`
- Backend routes: `artifacts/api-server/src/routes/{price-lists,price-items,tender-projects,tender-items}.ts`
- Parsing/matching logic: `artifacts/api-server/src/lib/{parse-price-list,parse-tender,matching,export-tender,upload}.ts`
- Frontend pages: `artifacts/tender-pricer/src/pages/` (project list `/`, project detail `/projeler/:id`, price catalogs `/fiyat-listeleri`)

## Architecture decisions

- File uploads (price list Excel/PDF, tender Excel) and the Excel export are handled with plain `fetch`/`FormData`/blob response on the frontend, bypassing the generated Orval hooks — Orval's zod schemas model file bodies as `File` instances which don't round-trip cleanly through the generated fetch wrapper for multipart/binary I/O.
- Matching: exact match on normalized Poz No first (dots/dashes/whitespace unified, case-insensitive), else bigram Dice-coefficient similarity on the description text (threshold 0.5), else left unmatched. Manual price overrides on a tender item are excluded from future re-matching runs.
- PDF price-list parsing is best-effort only: Turkish public institutions do not follow one consistent PDF layout, so the parser uses line-level regex heuristics and always returns warnings for the user to review — it is not guaranteed to catch every row. Excel price lists parse far more reliably (header-keyword column detection with a fallback fixed column order).
- Uploaded files are parsed in-memory (`multer` memory storage) and never persisted as raw bytes; only the extracted structured rows go into Postgres.

## Product

- Manage one or more "Birim Fiyat Kaynağı" (price list) catalogs, populated by uploading official Excel/PDF publications or adding items manually.
- Create tender projects, upload a bill-of-quantities Excel file, and run "Otomatik Eşleştir" to auto-fill unit prices from the catalogs.
- Review match status per line (Eşleşti / Yaklaşık Eşleşme / Eşleşmedi / Manuel), manually override any price or pick a different catalog match, then export the priced cetvel back to Excel.

## User preferences

- UI text in Turkish; all code, comments, and identifiers in English.

## Gotchas

- Orval emits a colliding TypeScript export when an endpoint combines a path param with a query param on the same operation (e.g. `GET /resource/{id}?q=`) — it generates the same combined-name params type in both the zod-schema output and the types output, causing a TS2308 export collision. Avoid mixing path + query params on one operation; prefer query-only or path-only.
- `lib/api-zod/tsconfig.json` needs `"lib": ["es2022", "dom"]` for the generated schemas to type-check, since Orval emits `zod.instanceof(File)`/`Blob` for file-upload bodies.
- `pdf-parse` v2.x has a completely different API from v1.x: no default export/function — use `import { PDFParse } from "pdf-parse"; new PDFParse({ data: buffer }).getText()`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
