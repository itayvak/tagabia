# Activity Logs

## 2026-07-30 — Fix `npm run dev` hanging on "Retrying 1/3..."

**Prompt:** "fix this" — with a `npm run dev` transcript showing `○ Compiling /_error ...` followed by ~17 repetitions of `Retrying 1/3...`.

**Diagnosis:**
- The message comes from `next/dist/compiled/@next/font/dist/google/retry.js`, i.e. `next/font/google` failing to download font files.
- `src/lib/fonts.ts` loaded **Google Sans**, which Google Fonts serves in **25 subsets**. `next/font`'s `subsets` option only controls *preloading* (`find-font-files-in-css.js`), so all 25 `.woff2` files were downloaded on every cold compile.
- In dev, `fetch-resource.js` applies a hard **3000 ms timeout** per request, and all 25 fire concurrently. Reproduced from this WSL2 shell: a 25-way parallel fetch to `fonts.gstatic.com` fails with `connect ETIMEDOUT 142.250.75.74:443`, while 8 concurrent requests all succeed in ~650 ms.

**Fix:** self-host only the subsets actually used.
- Added `scripts/download-fonts.mjs` + `npm run download:fonts` — fetches the Google Fonts CSS and downloads the needed subsets sequentially into `src/fonts/` (120 KB total: Google Sans latin / latin-ext / hebrew, Dela Gothic One latin).
- Rewrote `src/lib/fonts.ts` to use `next/font/local`, one call per subset carrying Google's own `unicode-range` via `declarations`, exporting the composed `googleSansFontFamily`.
- `src/theme.ts` now uses `googleSansFontFamily`.
- `src/pages/_app.tsx`: dropped the `--font-google-sans` CSS-variable class effect — the variable was never read anywhere and has no single-family equivalent under the per-subset setup.

**Verification:** cold `rm -rf .next && npm run dev` → `/` returned 200, `/todo` returned 200, **zero** `Retrying` lines. All four `@font-face` rules emit with correct `unicode-range`; 3 font preloads present (latin-ext deliberately `preload: false`). `tsc --noEmit` clean for `src/` (only pre-existing errors in generated `.next/dev/types/validator.ts`), eslint clean, `npm test` 11/11 passing.

## 2026-07-30 — Duplicate viewport meta in `_document.tsx`

**Prompt:** dev-server output showing `Warning: viewport meta tags should not be used in _document.js's <Head>` and `GET /workEnvironment 404`.

**`/workEnvironment` 404 — not a bug.** The page exists only on branch `dev-metzger` (commit `46be3cf` "added toolbox page"), which is not merged into `master`. It brings `src/pages/workEnvironment.tsx`, `src/types/workEnvironment.ts` and seven `src/lib/workEnvironment*`/`*WorkEnvironment*` modules. Nothing on `master` links to the route, so the 404 is correct. Left branches untouched.

**Viewport warning — fixed.** `src/pages/_document.tsx` rendered `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, byte-identical to the one already in `src/pages/_app.tsx`'s `<Head>`. Next warns because `_document` is rendered once per document and cannot be overridden per page. Removed the `_document` copy; `_app.tsx` remains the single source.

**Verification:** clean `rm -rf .next && npm run dev` → `/` and `/commander` each serve exactly one viewport meta with the full `width=device-width, initial-scale=1, viewport-fit=cover` (so `viewport-fit=cover` PWA safe-area behaviour is preserved), title and description still present, zero viewport warnings in the log. eslint clean, `npm test` 11/11.

*Note on process:* the first verification run was invalid — a previous dev server still held port 3000, the new one silently moved to 3001, and `curl localhost:3000` hit the stale server whose `.next` had just been deleted, returning a 500 `_error` fallback with Next's default `width=device-width`. Kill lingering `next` processes and confirm the port is free before trusting a dev-server check.
