# lf-ui layouts

Jekyll `_layouts`-compatible full-page templates, vendored (copied) into each consumer's own `_layouts/` directory — same no-build-step model as `includes/`. See `../SYNCING.md`.

Unlike `includes/`, these are complete pages: front matter, `header.html`/`nav.html` through `footer.html`, no fragment left for the consumer to assemble around them.

## `people.html`

Renders a real public `/people/<name>` profile page — sidebar (photo, position/org, social icons, optional role badge), body (full bio). See `../includes/README.md`'s "`_people` is required on every consumer" section for the collection/defaults setup every consumer needs before this layout will render anything.

## `site-index.html`

Renders a page listing every content collection a consumer wants indexed, grouped into labeled sections. Reads `site.data.site-index.sections` — each consumer's own `_data/site-index.yml`, **not** vendored (per-site data, like `_data/csp.json`/`_data/site.json`) — a list of `{label, collection}` pairs, one per Jekyll collection to include:

```yaml
sections:
  - label: Notes
    collection: posts
  - label: Work
    collection: work
```

For each section, it pulls `site[section.collection]`, filters out anything with `sitemap: false` set or no `title`, and only renders that section's heading + card grid at all if at least one item survives the filter — a section with zero qualifying items (an empty collection, or one whose only entry is an unpublished template file) renders nothing, not an empty heading. This is the standard for "how does a consumer get a site index that scales" — adding a new collection to the index is a two-line data-file edit, not a template change, and collections don't need to be pre-checked for emptiness before listing them. Not every collection needs to be listed: govfresh's own `_data/site-index.yml` deliberately excludes `events`/`orgs`/`people` (thin or single-purpose collections that aren't useful as a public index category) even though all three exist as real collections there.

Needs a real content page pointing at it, description following the standard "A complete index of `{domain}`." convention (no need to hand-list what's in it — the page itself does that):

```yaml
---
layout: site-index
title: Site index
description: "A complete index of example.com."
permalink: /site-index/
---
```
