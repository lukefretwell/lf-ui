#!/usr/bin/env node
// Reports drift between lf-ui's shared files and each consumer site's own
// vendored copy, and (with --write) re-vendors them. lf-ui has no build
// step, so nothing else catches a consumer falling behind after an lf-ui
// edit.
// Adapted from scangov/components/scripts/check-sync.js.
// Run: node scripts/check-sync.js          (report drift, exit 1 if any)
//      node scripts/check-sync.js --write  (overwrite drifted/missing consumer files from lf-ui)

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const write = process.argv.includes('--write');

// fontsPrefix: what lf-theme.css's `../vendor/fonts/` becomes in that
// consumer (SYNCING.md). partials: whether the consumer vendors all of
// includes/ + layouts/. schemaGov vendors only the includeOnly subset (its
// head/js/style includes are its own).
const consumers = [
  { name: 'lukefretwell', dir: path.join(root, '..', '..', 'lukefretwell', 'lukefretwell.github.io'), fontsPrefix: '/assets/fonts/', partials: true },
  { name: 'govfresh', dir: path.join(root, '..', '..', 'govfresh', 'govfresh.github.io'), fontsPrefix: '/assets/fonts/', partials: true },
  // schemaGov is Eleventy: static assets live in public/, templates in its
  // root. It renders these includes with Liquid (setLiquidOptions
  // jekyllInclude), so they are vendored byte-identical — never hand-ported.
  { name: 'schemaGov', dir: path.join(root, '..', '..', 'govfresh', 'schemaGov', 'public'), siteRoot: path.join(root, '..', '..', 'govfresh', 'schemaGov'), fontsPrefix: 'fonts/', partials: false,
    includeOnly: ['nav.html', 'footer.html', 'footer-nav.html', 'cta-banner.html', 'favicon.html'] },
];

// sourcePath is relative to lf-ui; consumerPath is relative to the consumer
// root (its public/ dir for schemaGov). Everything vendored lives under
// assets/lf-ui/ except js/analytics.js, toc-active.js, theme.js and
// favicon/site.webmanifest, which sit beside each consumer's own scripts and
// favicons — see SYNCING.md.
const trackedFiles = [
  { sourcePath: 'theme/lf-theme.css', consumerPath: 'assets/lf-ui/lf-theme.css', fonts: true },
  { sourcePath: 'theme/lf-components.css', consumerPath: 'assets/lf-ui/lf-components.css' },
  { sourcePath: 'vendor/bootstrap.min.css', consumerPath: 'assets/lf-ui/bootstrap.min.css' },
  { sourcePath: 'vendor/bootstrap.bundle.min.js', consumerPath: 'assets/lf-ui/bootstrap.bundle.min.js' },
  { sourcePath: 'js/cta-banner.js', consumerPath: 'assets/lf-ui/cta-banner.js' },
  { sourcePath: 'js/analytics.js', consumerPath: 'js/analytics.js', partialsOnly: true },
  { sourcePath: 'js/toc-active.js', consumerPath: 'js/toc-active.js', partialsOnly: true },
  { sourcePath: 'js/toc-active.js', consumerPath: 'assets/lf-ui/toc-active.js', partialsOff: true },
  { sourcePath: 'js/copy-field.js', consumerPath: 'assets/lf-ui/copy-field.js', partialsOff: true },
  { sourcePath: 'js/theme.js', consumerPath: 'js/theme.js' },
  { sourcePath: 'favicon/site.webmanifest', consumerPath: 'assets/img/favicon/site.webmanifest', partialsOnly: true },
  { sourcePath: 'data/services.json', consumerPath: '_data/services.json', partialsOnly: true },
  { sourcePath: 'data/icon_presets.json', consumerPath: '_data/icon_presets.json' },
  { sourcePath: 'robots.txt', consumerPath: 'robots.txt', partialsOnly: true },
  { sourcePath: 'vendor/icons/arrow-up-right-from-square.svg', consumerPath: 'assets/img/icons/arrow-up-right-from-square.svg' },
];

// includes/ and layouts/ are Jekyll partials vendored 1:1 by filename —
// every file is tracked automatically.
const trackedDirs = [
  { sourceDir: 'includes', consumerDir: '_includes' },
  { sourceDir: 'layouts', consumerDir: '_layouts' },
];

// lf-theme.css's @font-face rules point at ../vendor/fonts/... (correct
// relative to lf-ui's own theme/ folder); each consumer serves fonts from
// its own location (SYNCING.md). Expected substitution, not drift.
function applyFonts(content, consumer) {
  return content.replaceAll('../vendor/fonts/', consumer.fontsPrefix);
}

let outOfSync = 0;
let checked = 0;

function compare(relSource, sourceBuf, consumer, consumerFullPath, addIfMissing = false) {
  const name = consumer.name;
  const exists = existsSync(consumerFullPath);
  // Not vendored yet isn't drift — unless re-vendoring, where we add it
  // only for files a consumer already opted into by existing.
  if (!exists) {
    // A new shared include/layout is meant for every partials consumer;
    // --write adds it. (Plain check never fails on a missing file.)
    if (write && addIfMissing) {
      mkdirSync(path.dirname(consumerFullPath), { recursive: true });
      writeFileSync(consumerFullPath, sourceBuf);
      console.log(`ADDED: ${relSource} in ${name}`);
    }
    return;
  }
  checked++;
  if (Buffer.compare(readFileSync(consumerFullPath), sourceBuf) === 0) return;
  outOfSync++;
  if (write) {
    mkdirSync(path.dirname(consumerFullPath), { recursive: true });
    writeFileSync(consumerFullPath, sourceBuf);
    console.log(`UPDATED: ${relSource} in ${name}`);
  } else {
    console.log(`OUT OF SYNC: ${relSource} in ${name}`);
  }
}

for (const consumer of consumers) {
  for (const f of trackedFiles) {
    if (f.partialsOnly && !consumer.partials) continue;
    if (f.partialsOff && consumer.partials) continue;
    let buf = readFileSync(path.join(root, f.sourcePath));
    if (f.fonts) buf = Buffer.from(applyFonts(buf.toString('utf8'), consumer));
    compare(f.sourcePath, buf, consumer, path.join(f.consumerPath.startsWith('_') ? (consumer.siteRoot ?? consumer.dir) : consumer.dir, f.consumerPath));
  }
  if (!consumer.partials && !consumer.includeOnly) continue;
  for (const { sourceDir, consumerDir } of trackedDirs) {
    if (!consumer.partials && sourceDir !== 'includes') continue;
    for (const file of readdirSync(path.join(root, sourceDir)).filter((n) => n.endsWith('.html') && (!consumer.includeOnly || consumer.includeOnly.includes(n)))) {
      compare(`${sourceDir}/${file}`, readFileSync(path.join(root, sourceDir, file)), consumer, path.join(consumer.siteRoot ?? consumer.dir, consumerDir, file), true);
    }
  }
}

// Palette lint: body colors, dark palette and the shared content rules
// live only in lf-ui. A site stylesheet redefining them is how the three
// sites drifted apart before.
const forbidden = [/--bs-body-bg\s*:/, /--bs-body-color\s*:/, /--site-link-visited\s*:/, /^\s*(main )?a:visited\s*\{/m, /^blockquote\s*\{/m, /\.author-link\s*[,{]/, /\.toc-link/];
let lintFails = 0;
for (const consumer of consumers) {
  for (const css of ['css/style.css']) {
    const full = path.join(consumer.dir, css);
    if (!existsSync(full)) continue;
    const text = readFileSync(full, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const re of forbidden) {
      if (re.test(text)) { lintFails++; console.log(`LINT: ${consumer.name}/${css} redefines a shared lf-ui rule: ${re}`); }
    }
  }
}
if (lintFails) outOfSync += lintFails;

if (checked === 0) {
  console.log('check-sync: no consumer has vendored lf-ui yet — nothing to check.');
} else if (outOfSync === 0) {
  console.log(`check-sync: all ${checked} file/repo pairs in sync.`);
} else if (write) {
  console.log(`check-sync: re-vendored ${outOfSync} of ${checked} file/repo pairs.`);
} else {
  console.log(`check-sync: ${outOfSync} of ${checked} file/repo pairs out of sync. Run with --write to re-vendor.`);
  process.exit(1);
}
