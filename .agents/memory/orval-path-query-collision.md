---
name: Orval path+query param collision
description: Combining a path param and a query param on one OpenAPI operation makes Orval emit a colliding TS export (TS2308).
---

When an OpenAPI operation has both a path parameter and one or more query parameters (e.g. `GET /resource/{id}?q=&limit=`), Orval generates a combined params type with the same name in both the zod-schema output (`lib/api-zod/src/generated/api.ts`) and the plain-types output (`lib/api-zod/src/generated/types/`). Both files export a type with an identical generated name, so the package's barrel re-export fails to typecheck with TS2308 ("Module has already exported a member").

**Why:** This is an Orval codegen naming behavior, not a configuration mistake — it happens regardless of how the params are named in the spec.

**How to apply:** When designing an OpenAPI endpoint that needs both a resource-scoping id and free-form query filters, prefer redesigning it as query-only (put the scoping id in the query string too, e.g. `GET /items?resourceId=&q=`) rather than `GET /resources/{id}/items?q=`. This sidesteps the collision entirely. Only mix path + query params if you've confirmed via a codegen run that no collision results.
