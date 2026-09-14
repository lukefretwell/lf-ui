#!/usr/bin/env node
// Reports drift between lf-ui's shared files and each consumer site's own
// vendored copy. lf-ui has no build step — every site gets its CSS/JS/
// includes/layouts via manual `cp` (see SYNCING.md) — so nothing else
// catches a consumer falling behind after an lf-ui edit.
// Adapted from scangov/components/scripts/check-sync.js.
// Run: node scripts/check-sync.js

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

// Consumers live under different top-level folders than lf-ui does
// (unlike scangov/components' flat sibling layout), so each gets an
// explicit relative path instead of a shared parent + name.
const consumers = [
  path.join(root, '..', '..', 'lukefretwell', 'lukefretwell.github.io'),
  path.join(root, '..', '..', 'govfresh', 'govfresh.github.io'),
];

// sourcePath is relative to lf-ui's own root; consumerPath is relative to
// each consumer's root. These differ because consumers vendor everything
// under a single assets/lf-ui/ folder regardless of where it lives inside
// lf-ui itself (theme/, vendor/) — see SYNCING.md. js/ is a genuine
// exception: cta-banner.js goes to assets/lf-ui/ like the rest of
// the vendor bundle, but analytics.js goes to plain js/, alongside each
// consumer's own pre-existing page-behavior scripts (toc-active.js,
// read-time-bar.js) — it reads as one of those, not a vendored UI library.
const trackedFiles = [
  { sourcePath: 'theme/lf-theme.css', consumerPath: 'assets/lf-ui/lf-theme.css', normalize: normalizeFontPaths },
  { sourcePath: 'theme/lf-components.css', consumerPath: 'assets/lf-ui/lf-components.css' },
  { sourcePath: 'vendor/bootstrap.min.css', consumerPath: 'assets/lf-ui/bootstrap.min.css' },
  { sourcePath: 'vendor/bootstrap.bundle.min.js', consumerPath: 'assets/lf-ui/bootstrap.bundle.min.js' },
  { sourcePath: 'js/cta-banner.js', consumerPath: 'assets/lf-ui/cta-banner.js' },
  { sourcePath: 'js/analytics.js', consumerPath: 'js/analytics.js' },
  { sourcePath: 'js/toc-active.js', consumerPath: 'js/toc-active.js' },
  { sourcePath: 'js/theme.js', consumerPath: 'js/theme.js' },
  { sourcePath: 'favicon/site.webmanifest', consumerPath: 'assets/img/favicon/site.webmanifest' },
  { sourcePath: 'data/services.json', consumerPath: '_data/services.json' },
  { sourcePath: 'data/icon_presets.json', consumerPath: '_data/icon_presets.json' },
  { sourcePath: 'robots.txt', consumerPath: 'robots.txt' },
  { sourcePath: 'vendor/icons/arrow-up-right-from-square.svg', consumerPath: 'assets/img/icons/arrow-up-right-from-square.svg' },
];

// includes/ and layouts/ are Jekyll _includes/_layouts-compatible partials
// vendored 1:1 by filename — every file in lf-ui's copy of each folder is
// tracked automatically, so a new shared include doesn't also need a new
// line added here.
const trackedDirs = [
  { sourceDir: 'includes', consumerDir: '_includes' },
  { sourceDir: 'layouts', consumerDir: '_layouts' },
];

// lf-theme.css's @font-face rules point at ../vendor/fonts/... (correct
// relative to lf-ui's own theme/ folder). Each consumer instead serves
// fonts from its pre-existing top-level /assets/fonts/... convention, so
// vendoring rewrites that one path segment. That's an expected, documented
// substitution (SYNCING.md) — normalize it away before diffing so it
// doesn't read as drift.
function normalizeFontPaths(content) {
  return content.replaceAll('../vendor/fonts/', '/assets/fonts/');
}

let outOfSync = 0;
let checked = 0;

for (const { sourcePath: relSource, consumerPath: relConsumer, normalize } of trackedFiles) {
  const sourceFullPath = path.join(root, relSource);
  let sourceContent = readFileSync(sourceFullPath, 'utf8');
  if (normalize) sourceContent = normalize(sourceContent);

  for (const consumerRoot of consumers) {
    const consumerFullPath = path.join(consumerRoot, relConsumer);
    if (!existsSync(consumerFullPath)) continue; // not vendored there yet — not drift
    checked++;
    const consumerContent = readFileSync(consumerFullPath, 'utf8');
    if (consumerContent !== sourceContent) {
      outOfSync++;
      console.log(`OUT OF SYNC: ${relSource} in ${path.basename(consumerRoot)}`);
    }
  }
}

for (const { sourceDir, consumerDir } of trackedDirs) {
  const sourceDirFull = path.join(root, sourceDir);
  const files = readdirSync(sourceDirFull).filter((f) => f.endsWith('.html'));

  for (const file of files) {
    const sourceFullPath = path.join(sourceDirFull, file);
    const sourceContent = readFileSync(sourceFullPath, 'utf8');
    const relSource = `${sourceDir}/${file}`;

    for (const consumerRoot of consumers) {
      const consumerFullPath = path.join(consumerRoot, consumerDir, file);
      if (!existsSync(consumerFullPath)) continue; // not vendored there yet — not drift
      checked++;
      const consumerContent = readFileSync(consumerFullPath, 'utf8');
      if (consumerContent !== sourceContent) {
        outOfSync++;
        console.log(`OUT OF SYNC: ${relSource} in ${path.basename(consumerRoot)}`);
      }
    }
  }
}

if (checked === 0) {
  console.log('check-sync: no consumer has vendored lf-ui yet — nothing to check.');
} else if (outOfSync === 0) {
  console.log(`check-sync: all ${checked} file/repo pairs in sync.`);
} else {
  console.log(`check-sync: ${outOfSync} of ${checked} file/repo pairs out of sync.`);
  process.exit(1);
}
