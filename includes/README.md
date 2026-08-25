# lf-ui includes

Jekyll `_includes`-compatible partials, vendored (copied) into each consumer's own `_includes/` directory — same no-build-step model as `vendor/`. See `../SYNCING.md`.

## `nav.html`

Site navigation with Bootstrap's native `.navbar`/`.navbar-collapse` (mobile toggle is `data-bs-toggle="collapse"` — no custom JS). Logo and per-item icons are both conditional, driven by two naming conventions rather than being hardcoded per site:

### Logo convention

Set `logo: <include-filename>` in `_config.yml` to point at a partial (found in the consumer's own `_includes/`) that renders the brand mark. If `site.logo` is unset, `nav.html` falls back to plain text: `{{ site.title }}`.

**Markup**: `brand-mark.html` inlines the actual `<svg id="logo" class="logo" fill="currentColor" aria-hidden="true">...</svg>` markup directly — not an `<img src>` reference. Inlining is what makes the mark CSS-modifiable: `fill="currentColor"` on the root `<svg>` lets it inherit `color` from `.navbar-brand`, the same way text would, so it tracks light/dark mode via the site's existing `--bs-body-color` token and repaints on `.navbar-brand:hover` — all handled by `lf-ui/theme/lf-components.css`, with no per-site dark-mode filter/invert rule needed. `aria-hidden="true"` on the `<svg>` avoids double-announcing the name, since the parent anchor already carries it via `aria-label`.

**Source SVG requirements**: this only works cleanly if the mark is monochrome — `fill="currentColor"` on the root `<svg>`, no per-shape `fill` overrides, no gradients or partial opacity, no background rect. A background rect is the one that bites: it would stay its own hardcoded color while the mark's `currentColor` fill flips for dark mode, breaking contrast in whichever mode the rect no longer matches. (Both sites' `assets/img/brand/logo.svg` — kept as the source-of-truth asset file even though the include inlines its content — went through exactly this cleanup: flat single-color paths, transparent background.)

Example: both `govfresh.github.io` and `luke.fretwell.github.io` set `logo: brand-mark.html`, each with its own inline-SVG `brand-mark.html` (different artwork, same convention) and a matching `assets/img/brand/logo.svg` source file. `assets/img/brand/` also holds `og.png`, the default Open Graph fallback image (referenced from `header.html`'s `og_image_path` logic, not from `nav.html`).

### Icon convention

Each entry in `site.data.nav.docs` (`_data/nav.json`) may set `icon: fa-some-icon` (a Font Awesome class suffix). If present, `nav.html` renders `<i class="fa-solid {{ item.icon }}">` before the label. If absent, no icon renders — no per-site branching needed here either. `icon-only: true` additionally hides the visible label text and moves it to `aria-label` instead, for icon-only nav items (e.g. a search link).

This is why the same `nav.html` already renders correctly for both current consumers without modification: `govfresh.github.io`'s `_data/nav.json` sets `icon` on every entry; `luke.fretwell.github.io`'s sets none.

## `breadcrumb.html`

Params: `href`, `label`. Deliberately takes explicit params rather than reading page front matter directly, because the two current consumers name their front matter differently (`page.parent`/`page.folder` vs. `page.folder`/`page.label`) — the shared include doesn't force either site to rename its content's front matter; each call site maps its own fields to the params instead:

```liquid
{% include breadcrumb.html href=page.parent label=page.folder %}
```

## `footer-nav.html`

No params — reads `site.data.nav.docs` directly, same data source as `nav.html`. Byte-identical between consumers already, so no parameterization was needed.

## `footer.html`

No params — reads `site.data.site` (each consumer's own `_data/site.json`) for the CTA banner, feedback CTA, and ScanGov scorecard link, plus `site.data.site-index` (truthy check only, to decide whether to link `/site-index/` at all) and `site.data.nav.docs` (via `footer-nav.html`). See the top-level `README.md`'s "Footer — shared include, per-site `site.json`" section for the exact data shape and the two footguns to avoid (`page.url` exact-match, and omitting rather than blanking optional sponsor fields). Ends with `{% include js.html %}</body></html>` — `js.html` itself stays local per consumer, but the closing tags live here now, not in `js.html`, on every consumer.

## `cta-banner.html`

Params: `href`, `aria_label`, `text`, and optional `sponsor_text`/`sponsor_link` (plain data, not raw HTML — the include builds `Sponsor: <a href="{{ sponsor_link }}">{{ sponsor_text }}</a>` itself). The outer `#cta-banner` band is unconditional; only the sponsor `<span class="cta-banner-sponsor">` is conditional on `sponsor_text` being present. Pairs with `../js/cta-banner.js` (vendored to `assets/lf-ui/cta-banner.js`), which fades the whole band in after the reader scrolls past ~40% of the viewport and hides it again near the footer. The button's `id="cta-banner-button"` and the band's `id="cta-banner"` are fixed, not parameterized — the script relies on those exact ids.

## `favicon.html`

No params — four fixed-path `<link>` tags (SVG icon, `.ico` fallback, apple-touch-icon, web manifest) under each consumer's own `assets/img/favicon/`. Byte-identical because it only references filenames, never their content — each consumer supplies its own real `favicon.svg` (a separate square icon mark, not the navbar wordmark), `.ico`, PNGs, and `site.webmanifest` at those exact paths. Previously one consumer's `favicon.html` never got updated to reference its own already-present `favicon.svg` at all, and still ran an older `.ico` + 16×16/32×32 PNG chain instead — a good example of why per-consumer copies of a "should be identical" include drift: nobody notices a stale include until someone reads it side-by-side with the other consumer's version. `theme-color` meta tags are deliberately NOT here (they'd need to differ from a fixed shared value if a consumer's palette changed) — they live in each consumer's own `header.html`, light/dark aware.

## `share.html`

No params beyond `page.url`/`page.title`, already in scope. Fixed set of platforms (LinkedIn, Bluesky, Mastodon, X, Facebook, email, copy-link). The copy-link control is a real `<button>`, not an `<a href="javascript:void(0)">` — pick this version over either consumer's prior implementation if you find an older copy elsewhere.

## `author.html`

No params — reads `page.author` (falls back to `post.author` when looping a collection), loops it, looks each name up in `site.people`, links to the profile page, and only renders a byline at all if the matched profile has real content (`author_data.content.size > 1`).

## `bio-card.html`

No params — reads an ambient `author_data` variable that the *caller* must assign before including it (same convention `social.html`'s `"small"` branch and `author.html` both use). Renders one bio card: avatar, name, social icons, short bio, "more about" link — all conditional on whether `author_data` actually has each field, nothing hardcoded.

## `bio.html`

```liquid
{% for author in page.author %}
  {% assign author_data = site.people | where: "title", author | first %}
  {% include bio-card.html %}
{% endfor %}
```

That's the whole file, byte-identical on every consumer. It's what makes `author_data` available to `bio-card.html` and `social.html`'s `"small"` branch.

## `_people` is required on every consumer, even single-author ones

Every consumer needs a real `_people` collection (`_config.yml`: `collections.people`, plus a `defaults` scope for `type: "people"` setting `folder`/`img-path`/`parent`/`layout`/`schematype`/`og-type` — copy govfresh's block verbatim) and a `people.html` layout. A single-author site's collection just has one entry. This isn't optional scaffolding for sites that "need" multiple authors — `author.html`/`bio-card.html`/`social.html` all assume `site.people` exists, so skipping it doesn't make those includes simpler, it makes them silently render nothing. (That was a real, previously-shipped bug here: luke.fretwell.github.io had no `_people` collection, so `author.html` and the bio box's social icons rendered empty. The fix was giving it a real `_people` entry, not adding a fallback branch to every include that touches author data — a second code path is more to keep in sync, not less.)

`_layouts/people.html` renders a real public `/people/<name>` profile page (sidebar: photo, name/position/org, social icons; body: full bio) — govfresh's version additionally includes `role.html` (team-role badge: "Maintainer"/"Contributor") and `analytics.html`, which are genuinely govfresh-specific (no team-role concept, no equivalent analytics setup, on a single-author site) and aren't part of the shared layout.

## `social.html`

Params: `size` (`"small"` | unset). `"small"` is the bio-box icon row; unset/default renders the full card-grid of connect-page links (used by the shared `connect.html` layout — see the top-level README's Connect section). The `"footer"` branch this used to also support was deleted — confirmed no caller anywhere passed `size="footer"`, on either site. Icon glyphs and sizes come from `site.data.connect.*` (each consumer needs its own `_data/connect.yml` — see below). The `"small"` branch's actual link *values* (email/website/linkedin/etc.) come from, in priority order: a matched `site.people` author profile → page-level front matter overrides. (Not a third `_config.yml`-scalar fallback tier — neither consumer's copy of this code ever actually read `site.email`/`site.linkedin` as a fallback, despite an earlier version of this doc claiming otherwise.) The email link normalizes with `| remove: 'mailto:'` before re-adding the prefix, since consumers aren't consistent about whether the source value already includes it.

### `_data/connect.yml` — icon-class mapping, not fully vendored yet

Both consumers need `_data/connect.yml`'s icon-size (`sm`/`md`/`lg`/`xl`) and icon-class (`email`/`linkedin`/`github`/etc.) keys — `social.html` reads them directly. Both consumers now also carry a real `docs:` list (their own connect-page links — real per-site content, not shareable). These aren't literally synced by `check-sync.js` (that only tracks the CSS/JS/font bundle) — if you add or change an icon-class key, update both files' shared portion by hand for now.

## Consumer CSS still required for anything not in `lf-ui/theme/lf-components.css`

`.navbar`/`.nav-link`/`.navbar-toggler`/`.navbar-collapse`/`#logo`/`.btn`/`.card`/`.badge`/`.breadcrumb`/`.icon-link`/`.bio-callout`/`.bio-avatar`/`.content-narrow`/`.thoughts-layout`/`.thoughts-toc`/`.cta-banner`/`.cta-banner-sponsor`/`footer`/`.footer-bar`/`.footer-nav`/`.icon-line`/`.img-caption`/`.card-description`/`.card-byline`/`.card-caption`/`.card-tags`/`.bio-text`/`.cta-text`/heading-anchor-link visibility are all in `lf-ui/theme/lf-components.css` now — vendoring the markup here does also get you the matching look for those. `.share`/anything else not listed there still needs each consumer's own styling. If you add markup here that needs shared styling, add the CSS to `lf-components.css` in the same change, not as a follow-up — that's the rule this exact pair of files broke twice already (once with the original theme split, once when `footer.html` was promoted to shared markup but its CSS was initially left per-consumer "because it genuinely differed" — it only differed because each site had separately hand-rolled it; once the markup was shared, the CSS should have moved with it in the same change, not a follow-up round after a user reported the visible mismatch).
