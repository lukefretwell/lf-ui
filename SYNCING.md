# Updating an lf-ui consumer

Consumer repositories (`luke.fretwell.github.io`, `govfresh.github.io`) vendor the bundle so they remain deployable independently from plain static hosting.

## Bundle files

Copy these together from one `lf-ui` release or commit:

```text
BOOTSTRAP_VERSION
vendor/bootstrap.min.css
vendor/bootstrap.bundle.min.js
vendor/fonts/
theme/lf-theme.css
```

Copy `includes/` and `templates/` files once they exist and once the consumer actually uses them.

## Update procedure

1. Confirm the consumer has no unrelated uncommitted changes.
2. Copy the complete bundle from one tagged release or commit.
3. Review the diff.
4. Serve the site locally and confirm pages and local resources still load.
5. Check both light and dark mode (`prefers-color-scheme` / `[data-bs-theme]`), keyboard navigation, and focus visibility.
6. Run `node scripts/check-sync.js` from `lf-ui` to confirm the consumer is back in sync.
7. Commit the bundle update.

Do not edit a vendored file inside a consumer directly. Make the fix in `lf-ui`, then re-vendor into consumers.
