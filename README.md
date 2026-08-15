# lf-ui

Implemented Bootstrap-based UI system for `luke.fretwell.github.io` and `govfresh.github.io`.

Policy this implements — accent color, typography, accessibility baseline — is canonical in [lf-standards](https://github.com/lukefretwell/lf-standards), not here. See `../lf-design-system-plan.md` in the local working copy for the full plan.

Mechanically modeled on [`scangov/components`](https://github.com/ScanGov/components), which is a source only — no ScanGov site consumes `lf-ui` and no `lf-ui` consumer touches `scangov/components`.

## Project structure

```text
BOOTSTRAP_VERSION
vendor/
  bootstrap.min.css          # stock, unmodified, v5.3.2
  bootstrap.bundle.min.js    # stock, unmodified, v5.3.2 (includes Popper — trim later once actual usage is known)
  fonts/
    public-sans/
    pt-serif/
    roboto-mono/
theme/
  lf-theme.css                # accent color + font-family overrides, light/dark via [data-bs-theme]
includes/                     # Jekyll _includes-compatible partials (not yet populated — see below)
templates/                    # static component reference pages (not yet populated — see below)
scripts/
  check-sync.js                # drift checker against both consumer repos
SYNCING.md
```

## `includes/` and `templates/` are still empty

Building the shared header/footer/nav partials and component reference pages requires comparing `luke.fretwell.github.io` and `govfresh.github.io`'s actual current markup first — including the Web Awesome component audit called out in the plan. That happens during each site's migration (plan Phases 3–4), not before, so these directories aren't populated with guessed content.

## Bootstrap version

Pinned to 5.3.2 — the same version already deployed in `southern-unionists` and `emmettfretwell`, vendored from there rather than fetched fresh, so it's a known-working starting point. Recorded in `BOOTSTRAP_VERSION`. Upgrading is a deliberate future step, not something to do silently while scaffolding.

## Consumer updates

Consumers vendor `theme/lf-theme.css`, the `vendor/` files they use, and `BOOTSTRAP_VERSION` together. See `SYNCING.md`.

## Development notes

- No npm package, no build step — stays static-host-friendly, matching how both consumer sites deploy (GitHub Pages).
- Do not edit a consumer's vendored copy directly. Make the fix in `lf-ui`, then re-vendor into consumers.
