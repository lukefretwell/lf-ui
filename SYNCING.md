# Updating an lf-ui consumer

Consumer repositories (`lukefretwell.github.io`, `govfresh.github.io`, `schemaGov`) vendor the bundle so they remain deployable independently from plain static hosting.

## Bundle files

Copy these together from one `lf-ui` release or commit, into the consumer's `assets/lf-ui/` folder:

```text
BOOTSTRAP_VERSION                    -> assets/lf-ui/BOOTSTRAP_VERSION
vendor/bootstrap.min.css             -> assets/lf-ui/bootstrap.min.css
vendor/bootstrap.bundle.min.js       -> assets/lf-ui/bootstrap.bundle.min.js
vendor/fonts/                        -> consumer's own assets/fonts/ (see below)
theme/lf-theme.css                   -> assets/lf-ui/lf-theme.css
theme/lf-components.css              -> assets/lf-ui/lf-components.css
js/cta-banner.js                     -> assets/lf-ui/cta-banner.js
js/analytics.js                      -> js/analytics.js (NOT assets/lf-ui/ — see below)
favicon/site.webmanifest             -> assets/img/favicon/site.webmanifest (NOT assets/lf-ui/ — see below)
includes/*.html                      -> _includes/<same filename>
layouts/*.html                       -> _layouts/<same filename>
```

`js/analytics.js` and `favicon/site.webmanifest` are the files that don't follow the `assets/lf-ui/` convention — they vendor to each consumer's own existing asset locations instead (`js/analytics.js` alongside that consumer's own page-behavior scripts like `toc-active.js`/`read-time-bar.js`; `site.webmanifest` alongside that consumer's own `favicon.svg`/`.ico`/PNGs), since that's structurally what they are. Both are Liquid-templated despite not being `.html` files — blank front matter (`---\n---`) is enough to make Jekyll process them, reading `site.title`/`site.description`/`site.data.site.*` so no per-site literal needs to be hand-authored. Don't "fix" either to match the other `js/`/`assets/lf-ui/` entries; `check-sync.js` already expects them where they are.

Every `.html` file in `includes/`/`layouts/` is vendored the same way, by filename, into the consumer's `_includes/`/`_layouts/`. `check-sync.js` walks both directories automatically — adding a new shared include or layout to `lf-ui` doesn't require also editing `check-sync.js`.

### Font path substitution (expected, not drift)

Both consumers already had their own `/assets/fonts/public-sans/...` and `/assets/fonts/roboto-mono/...` layout before `lf-ui` existed. Rather than introduce a second font location, `lf-theme.css`'s `@font-face` `src` paths (`../vendor/fonts/...`, correct relative to `lf-ui/theme/`) get rewritten to `/assets/fonts/...` when copied into a consumer:

```bash
sed 's#\.\./vendor/fonts/#/assets/fonts/#g' theme/lf-theme.css > <consumer>/assets/lf-ui/lf-theme.css
```

`scripts/check-sync.js` already normalizes this substitution away before diffing, so it won't false-positive as drift. Font *files* themselves (`vendor/fonts/*.woff2`) still need to be copied byte-for-byte into the consumer's existing `assets/fonts/` tree.

## schemaGov (Eleventy)

schemaGov is Eleventy with `public/` as its passthrough root. It consumes lf-ui the same way the Jekyll sites do — byte-identical, never hand-ported:

- CSS/JS bundle → `public/assets/lf-ui/`, `public/js/theme.js` (fonts path `fonts/`).
- Shared includes `nav.html`, `footer.html`, `footer-nav.html`, `cta-banner.html`, `favicon.html` → `_includes/`, plus `data/icon_presets.json` → `_data/`.
- They render because schemaGov's page layout (`_includes/layouts/base.liquid`) is Liquid, `eleventy.config.js` enables `setLiquidOptions({ jekyllInclude: true, dynamicPartials: false })`, and `_data/site.js` exposes `site` in Jekyll's shape (`site.baseurl`, `site.data.site`, `site.data.nav`, `site.data.icon_presets`). Site config lives in `_lib/site.json`.
- Site-owned (not vendored): `style.html`, `js.html`, the `<head>` in `base.liquid`, and the `.njk` content pages.

If a shared include needs a new `site.*` value, add it to `_data/site.js`, not to the include.

## Shared rule: no restyling in sites

Body background/text, the dark palette, visited-link color, prose links, blockquote, card stretched links, `.post` heading spacing and the byline/author link treatment live only in `lf-theme.css`/`lf-components.css` (lukefretwell values). `check-sync.js` fails if a site's `css/style.css` redefines them. If a site needs to look different, change lf-ui so all three change.

`theme.js` loads in `<head>` on every site (Jekyll: `head-meta.html`; schemaGov: `base.liquid`) so there is no light flash before first paint.

## Update procedure

Fast path: `node scripts/check-sync.js --write` re-vendors every drifted file into all three consumers (with font-path rewriting); then review each consumer's diff. Plain `node scripts/check-sync.js` reports drift and style-override violations, and exits 1.


1. Confirm the consumer has no unrelated uncommitted changes.
2. Copy the complete bundle from one tagged release or commit (rewriting font paths in `lf-theme.css` per above).
3. Review the diff.
4. Serve the site locally and confirm pages and local resources still load.
5. Check both light and dark mode (`prefers-color-scheme` / `[data-bs-theme]`), keyboard navigation, and focus visibility.
6. Run `node scripts/check-sync.js` from `lf-ui` to confirm the consumer is back in sync.
7. Commit the bundle update.

Do not edit a vendored file inside a consumer directly. Make the fix in `lf-ui`, then re-vendor into consumers.
