# lf-ui

Implemented Bootstrap-based UI system for `luke.fretwell.github.io` and `govfresh.github.io`.

Policy this implements — accent color, typography, accessibility baseline — is canonical in [lf-standards](https://github.com/lukefretwell/lf-standards), not here. See `../lf-design-system-plan.md` in the local working copy for the full plan.

## Unified theme, not just DRY code

This is a shared theme for a scaled ecosystem, not a grab-bag of "mostly the same" includes. When a shared include or CSS rule covers the same kind of UI element on both consumers (an image + caption, a card, a button), it should render **identically** — same classes, same markup — not merely be structurally consolidated into one file while quietly keeping each site's prior visual differences as parameterized branches. A per-content-type branch is legitimate when it reflects a real content-model difference (different fields, different collections, different schema.org needs — see the schema.org note under "Standing up a new consumer" below); it is not legitimate as a way to preserve incidental styling drift between the two sites. When resolving a divergence, default to whichever site's implementation is more complete/mature as the template, unless told otherwise.

Mechanically modeled on [`scangov/components`](https://github.com/ScanGov/components), which is a source only — no ScanGov site consumes `lf-ui` and no `lf-ui` consumer touches `scangov/components`.

## Project structure

```text
BOOTSTRAP_VERSION
vendor/
  bootstrap.min.css          # stock, unmodified, v5.3.2
  bootstrap.bundle.min.js    # stock, unmodified, v5.3.2 (includes Popper — trim later once actual usage is known)
  fonts/
    public-sans/
    roboto-mono/
theme/
  lf-theme.css                # accent color, border-color, shadow and font-family/motion tokens, light/dark via [data-bs-theme]
  lf-components.css           # shared component rules (.navbar/.navbar-brand/.navbar-nav, #logo sizing, .btn, .card, .drop-shadow(2), skip-link focus state, etc.) that consume lf-theme.css's tokens
includes/                     # Jekyll _includes-compatible partials — see includes/README.md
  nav.html, breadcrumb.html, footer.html, footer-nav.html, cta-banner.html, share.html,
  author.html, social.html, bio.html, bio-card.html, role.html, analytics.html, favicon.html
layouts/                      # Jekyll _layouts-compatible full-page templates — see layouts/README.md
  people.html, site-index.html
js/
  cta-banner.js                 # pairs with includes/cta-banner.html, vendors to assets/lf-ui/
  analytics.js                 # pairs with includes/analytics.html, vendors to plain js/ (see SYNCING.md)
templates/                    # static component reference pages (not yet populated — see below)
scripts/
  check-sync.js                # drift checker — every file in includes/ and layouts/ is tracked automatically, plus the explicitly-listed theme/vendor/js files
SYNCING.md
```

## `includes/` and `layouts/`

See `includes/README.md` for what each partial does and the naming conventions (`site.logo`, `item.icon`/`item.icon-only`, the `author_data` ambient-variable pattern) that let markup stay identical across consumers instead of branching per site. `jumbotron.html`/`image.html`/`header.html` are deliberately still local to each consumer — see "What's still local, and why" below.

`layouts/` is newer and smaller than `includes/` — full-page templates (front matter + complete `<html>`-adjacent structure via `header.html`/`footer.html`) rather than partial fragments. Same vendoring rule applies: copy verbatim into each consumer's `_layouts/`, don't hand-edit the copy.

## `templates/` is still empty

Static component reference pages haven't been built yet. Lower priority than `includes/` — revisit once the includes layer is stable across both consumers.

## Bootstrap version

Pinned to 5.3.2 — the same version already deployed in `southern-unionists` and `emmettfretwell`, vendored from there rather than fetched fresh, so it's a known-working starting point. Recorded in `BOOTSTRAP_VERSION`. Upgrading is a deliberate future step, not something to do silently while scaffolding.

## Consumer updates

Consumers vendor `theme/lf-theme.css`, `theme/lf-components.css`, the `vendor/` files they use, and `BOOTSTRAP_VERSION` together, into their own `assets/lf-ui/` folder. See `SYNCING.md` — including the expected font-path substitution in `lf-theme.css`.

Rules that don't actually render identically across both consumers (currently just `.card` border-hover retargeting, tied to site-specific link classes) stay in each consumer's own `css/style.css` rather than being forced into `lf-components.css`. Only extract a rule once it's genuinely identical (or should be) on both sites.

The full navbar (`.navbar`/`.navbar-brand`/`.navbar-nav`/`.nav-link`/`.navbar-toggler`/`.navbar-collapse`/`#logo`) is fully shared — no per-site navbar CSS should exist in either consumer. `includes/nav.html` is the matching shared markup; both consumers vendor it verbatim.

## Analytics — shared include, per-site config

`includes/analytics.html`/`js/analytics.js` are identical on both consumers and included from every layout, but only render/fire anything when `jekyll.environment == "production"` *and* `site.data.site.analytics.google` (a real GA measurement ID, from that consumer's own `_data/site.json`) is set. govfresh sets it; luke.fretwell.github.io's `site.json` omits the `analytics` key entirely, so the include is a no-op there — not a missing feature, a configured-off one (omit the key, don't set it to an empty string — see the Footer section below for why that distinction matters). This used to live in `_config.yml` as a bare `google-analytics:` key — moved into `site.json` so every "part of the theme but genuinely site-specific data" value lives in the same one place, not split between `_config.yml` scalars and JSON data depending on when it was added.

## What's still local, and why

`header.html`, `jumbotron.html`, and `image.html` are not in `includes/` yet. Unlike `people.html`/`bio-card.html`/etc., these have real, currently-unreconciled differences between consumers (header.html: different OG/meta-tag and JSON-LD logic; jumbotron.html/image.html: govfresh branches on many more page types than luke.fretwell.github.io has). Don't copy one consumer's version over the other's to "finish" these — needs a deliberate decision, not a side effect of an unrelated change. `header.html` is the planned next unification pass.

## CSP — per-site data, shared construction pattern

Each consumer's real Content-Security-Policy is genuinely different (govfresh allows `googletagmanager.com`/`google-analytics.com`/YouTube embeds/Substack frames/GitHub-hosted media that luke.fretwell.github.io doesn't need; luke.fretwell.github.io allows `'unsafe-inline'` on `script-src` for its inline dark-mode-detection snippet and sets `upgrade-insecure-requests`, which govfresh doesn't). Rather than hardcode the full policy string in each consumer's `header.html`, the directives themselves live in that consumer's own `_data/csp.json` — `{ "directive-name": ["source", ...] }`, with an empty array for a bare directive like `upgrade-insecure-requests` — and `header.html` assembles the meta tag from it:

```liquid
{% capture csp_content %}{% for directive in site.data.csp %}{% assign csp_name = directive[0] %}{% assign csp_values = directive[1] %}{{ csp_name }}{% if csp_values.size > 0 %} {{ csp_values | join: ' ' }}{% endif %}; {% endfor %}{% endcapture %}
<meta http-equiv="Content-Security-Policy" content="{{ csp_content | strip }}">
```

This is the same shape as the analytics pattern above (identical *mechanism*, per-site *data*) — but since `header.html` itself isn't a shared include yet, each consumer currently carries its own copy of the capture/loop snippet too. When `header.html` is unified, this becomes literally shared code with no further change; until then, keep both copies of the snippet identical by hand and don't let the policy data itself drift into the template.

## `_data/site.json` — the one place per-site identity/config values live

`includes/footer.html` is fully shared — unlike CSP, it went straight to a real shared include rather than staying local with a duplicated snippet, because the footer's own markup carries no per-site branching at all once its content moves to data. `site.json` started as footer-only data but is now the general answer to "where does this per-site value go" — analytics and theme colors live here too, not scattered across `_config.yml`/hardcoded template values. Full shape:

```json
{
  "feedback": { "text": "...", "link": "/feedback", "link_text": "...", "icon": "fa-solid fa-..." },
  "scangov": { "link": "https://..." },
  "cta_banner": { "links": [{ "text": "...", "url": "...", "icon": "fa-..." }], "sponsor_text": "...", "sponsor_link": "..." },
  "services_cta": { "button_text": "...", "button_link": "..." },
  "analytics": { "google": "G-..." },
  "theme": { "light": "#ffffff", "dark": "#..." }
}
```

`analytics.google` (read by `includes/analytics.html`) and the whole `analytics` key are optional — omit it entirely on a consumer with no analytics configured. `theme.light`/`theme.dark` are read by each consumer's `header.html` (theme-color meta tags, not shared yet) and by the shared `favicon/site.webmanifest` template — see "Favicon" below. These must be real hex values matching that consumer's actual `--bs-body-bg` in `css/style.css` (light and dark) — nothing enforces that automatically, since CSS custom properties aren't readable from a `<meta>` tag or a JSON manifest, so `theme.dark` drifting out of sync with the CSS is a real failure mode to watch for when either changes.

Two things matter if you're adding a third consumer:

- **Each `cta_banner.links[].url` must equal that page's real `page.url` exactly**, trailing slash and all — `cta-banner.html` compares them directly to filter that link out while a reader is already on its target page, so a mismatch (e.g. configuring `/subscribe` when the page's actual permalink renders as `/subscribe/`) means that link never hides on its own page. With multiple links, only the matching one drops out — the others still show.
- **Omit `sponsor_text`/`sponsor_link` entirely when there's no sponsor — never set them to `""`.** Liquid treats an empty string as truthy, so `{% if include.sponsor_text %}` would still render a broken `Sponsor: <a href=""></a>` if the key is merely blank instead of absent (or JSON `null`, which Liquid does read as falsy).

`scangov.link` and `feedback.link` are each independently optional — omit either (or the site-index page itself) and that piece of the footer just doesn't render, no other config needed.

## CTA banner — one component, always the same shape

`includes/cta-banner.html` (paired with `js/cta-banner.js`) replaced an earlier `subscribe-button.html` that only wrapped itself in the fixed floating band when a `sponsor` param was passed — which is exactly how the two consumers ended up styling the same include two different ways in site-local CSS (one always passing a sponsor and relying on the band, one never passing one and inventing a bare-button fallback). The band (`#cta-banner`) now takes a `links` array (one or more `{text, url, icon}` buttons, `icon` optional) instead of a single fixed button — it only renders once at least one link survives the current-page filter (see above); the sponsor credit inside it is separately conditional on `sponsor_text`. `sponsor_text`/`sponsor_link` are passed as plain data params, not a pre-built HTML string — the include builds the `Sponsor: <a>...</a>` markup itself.

## Favicon — shared include, per-site artwork, shared manifest template

`includes/favicon.html` is fully shared and byte-identical — four `<link>` tags (SVG icon, `.ico` fallback, apple-touch-icon, web manifest), all pointing at fixed paths under each consumer's own `assets/img/favicon/`. The favicon artwork itself (`favicon.svg` — a separate, purpose-built square icon mark, not the same file as `brand-mark.html`'s wordmark SVG below — plus `.ico` and the PNGs) is real per-site content the include never needs to know the contents of, only that it exists at those fixed filenames.

`assets/img/favicon/site.webmanifest`, unlike the artwork, is *not* hand-authored per consumer — it's vendored from `favicon/site.webmanifest` (blank front matter, same Liquid-processing trick as `js/analytics.js`), reading `site.title`/`site.description`/`site.data.site.theme.dark` directly, so there's no per-site JSON to keep in sync by hand. `theme-color` meta tags (light/dark aware) live in each consumer's own `header.html`, reading the same `site.data.site.theme.*` values — `favicon.html` itself carries no theme-color content, which is what keeps it byte-identical.

**`favicon.svg` must be dark-mode aware itself** — a plain `<link rel="icon" type="image/svg+xml">` doesn't get any help from `theme-color`/CSS custom properties/`prefers-color-scheme` meta tags; the SVG file is the only thing that can respond to OS dark mode, and it has to do so itself via an embedded `<style>` block (well-supported in Chrome/Firefox/Edge; Safari support is inconsistent but degrades to just not adapting, not breaking). A solid-color mark with no embedded media query silently becomes low/no-contrast in whichever mode it wasn't designed for — both consumers' marks were solid black with no background and went invisible on dark browser chrome until this was added. Both now use the same transparent-background, glyph-color-only pattern:
```svg
<style>
  path { fill: #000; }
  @media (prefers-color-scheme: dark) { path { fill: #fff; } }
</style>
```
No background rect — an opaque background would itself need a second dark-mode swap (and, on a mark with no natural "canvas" edge like these, just look like a stray colored square in the browser tab rather than an icon). Keep new consumers' `favicon.svg` transparent and glyph-only for the same reason, rather than reintroducing a filled background per mark.

## `#logo` — inline SVG, not `<img>`

Each consumer's `_includes/brand-mark.html` inlines its own `<svg id="logo" class="logo" fill="currentColor">` directly (not `<img src="logo.svg">`), so the mark is genuinely CSS-modifiable: it inherits `color` from `.navbar-brand` like text would, tracks light/dark mode automatically through the site's existing `--bs-body-color` token (no separate dark-mode filter/invert rule needed), and repaints on `.navbar-brand:hover` for free. This requires the source SVG to be monochrome — `fill="currentColor"` on the root `<svg>`, no per-shape `fill` overrides, no gradients, no background rect (an opaque background would stay its baked-in color while the mark inverts, breaking contrast in one mode). `brand-mark.html` itself isn't shared (each site's mark is different artwork), but the convention (inline, `id="logo" class="logo"`, `aria-hidden="true"` since the parent `.navbar-brand` anchor already carries the accessible name via `aria-label`) is.

## govfresh's layout count — partially consolidated

govfresh's `_layouts/` had a real duplication problem: `research.html`, `thoughts.html`, `briefs.html`, `papers.html` were ~45-line near-copies of each other (same header/nav/breadcrumb → jumbotron → `.thoughts-layout` + TOC → aside/previews → footer skeleton, differing only in which optional includes appeared and one CSS class), and `events.html`/`orgs.html` were the same story (same skeleton, differing only in an action button's label and which page field it read).

Both groups are now consolidated via Jekyll layout-chaining rather than merged into one literal file: each original layout name (`research.html`, `thoughts.html`, `briefs.html`, `papers.html`, `events.html`, `orgs.html`) is a ~5-line stub whose own front matter sets `layout: article` (or `layout: event-org`) plus a few flags (`include_audio`, `post_class`, `include_bio`, `action_field`, etc.), and delegates to one real shared skeleton (`_layouts/article.html`, `_layouts/event-org.html`) that reads those flags via Jekyll's `layout.*` variable. This was deliberately **not** done by changing `page.layout` itself and collapsing the stub files away — `page.layout` is read as a content-type discriminator well outside these layout files (`jumbotron.html`, `image.html`, `audio.html`, `video.html`, `style.html` all branch on `page.layout == "research"` etc.), so keeping each stub's own name/layout value intact avoids a much larger, riskier audit of every one of those cross-cutting conditionals.

Net effect: file count went from 27 to 29 (two new shared skeletons, no stub deleted), but duplicated logic dropped from ~240 lines across 6 files to ~100 (single skeleton + tiny stubs) — future changes to the shared skeleton now happen in one place instead of needing to be replicated by hand across every content type.

The rest of the 27 (`dm.html`, `podcast.html`, `book.html`, `signal.html`, `quick-thoughts.html`, `labs.html`, `demos.html`, `icons.html`, `people.html`, `news.html`) were checked and found to have genuinely distinct structure — not code drift, real differences in what each content type needs (podcast's two-column audio-player layout, book's review/quote block, demos' related-demos aside, icons.html's completely different topic-grid shape). Forcing those into a shared template would mean parameterizing away real differences, not removing duplication — left as-is.

## Standing up a new consumer

What a brand-new consumer needs, now that the sections above cover most per-site config with one shape each. No custom edits to any shared `lf-ui` include should be required for a site that fits this — if one turns out to be needed, that's a signal something should have been data-driven here and wasn't.

- **`_config.yml`**: `title`/`description`/`url`/`author`/`logo` (identity Jekyll itself and its plugins read directly — these stay in `_config.yml`, not `site.json`, since `jekyll-feed`/`jekyll-sitemap`/etc. expect them there) plus a real `collections:`/`defaults:` block matching this site's own content model. This part is inherently custom — different sites have different content types — and isn't something to consolidate away.
- **`_data/site.json`**: feedback, scangov, cta_banner, analytics, theme — see above for the full shape. One file, one shape, every key independently optional except what `footer.html`/`analytics.html`/`header.html`/the webmanifest actually read.
- **`_data/csp.json`**: real CSP directives for this site — see the CSP section above.
- **`_data/nav.json`**, **`_data/connect.yml`** (icon-class block + a real `docs:` list for the connect page — see `social.html`'s default branch), **`_data/site-index.yml`** (which collections to index, and under what label).
- **`assets/img/favicon/`**: `favicon.svg` (this site's own square icon mark), `favicon.ico`, `apple-icon-180x180.png`, `android-icon-192x192.png` — `site.webmanifest` needs no authoring at all, it's vendored and self-populates from `_config.yml`/`site.json`.
- **`_includes/brand-mark.html`** (this site's own inline navbar SVG — see "`#logo`" below) and a real `_people/<you>.md` entry (required even for a single-author site — see `includes/README.md`).

## Content conventions

Accumulated authoring rules for anyone (human or agent) writing markup against this theme — not enforced by a linter, so they only hold if whoever's editing a consumer's templates knows to follow them:

- **No `text-uppercase` eyebrow/caption labels.** Full caps reads as shouting and turns an ordinary word ("sections", "schemas") into something a reader has to re-parse as "not really a word". Use the `.lf-eyebrow` class (`theme/lf-components.css`) instead, and keep the label text itself in sentence case.
- **Badges are regular weight, not bold** (`.badge` sets `font-weight: 400` in `theme/lf-components.css`). A status tag is a label, not emphasis — don't reintroduce bold with an inline style or a wrapping `<strong>`.
- **Don't use `<strong>` unless the content genuinely needs emphasis and that's actually been asked for.** It's not a default way to make a name or title stand out — links, headings, and table structure already carry that weight. Reach for it only when someone explicitly wants a word or phrase emphasized.
- **Never make a heading (`h1`–`h6`) or a table header cell (`th`) a link.** Making things linkable is good, but a clickable heading or column header reads as ambiguous — is it a label or a control? Link the body text/data cell instead, or use the stretched-link pattern (`.card .body-link::after`, see "Badges" section of `lf-components.css`) to make an entire card clickable via one visible link elsewhere in it.
- **Button/link labels are noun phrases, not verb phrases.** "Specification", not "Read the specification"; "Core profile", not "or see the core profile". The control itself (a `<button>`/`<a class="btn">`, or its position as a link) already signals that clicking does something — restating the action in the label is redundant, and inconsistent verb choices ("Read"/"See"/"View"/"Go to") across a page read as sloppier than they are. Says what you'll get, not what to do to get it.

## Development notes

- No npm package, no build step — stays static-host-friendly, matching how both consumer sites deploy (GitHub Pages).
- Do not edit a consumer's vendored copy directly. Make the fix in `lf-ui`, then re-vendor into consumers.
