#!/usr/bin/env node
// Reports drift between lf-ui's shared files and each consumer site's own
// vendored copy. lf-ui has no build step — every site gets its CSS/vendor
// files via manual `cp` (see SYNCING.md) — so nothing currently catches a
// consumer falling behind after an lf-ui edit.
// Adapted from scangov/components/scripts/check-sync.js.
// Run: node scripts/check-sync.js

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

// Consumers live under different top-level folders than lf-ui does
// (unlike scangov/components' flat sibling layout), so each gets an
// explicit relative path instead of a shared parent + name.
const consumers = [
  path.join(root, '..', '..', 'lukefretwell', 'lukefretwell.github.io'),
  path.join(root, '..', '..', 'govfresh', 'govfresh.github.io'),
];

const trackedFiles = [
  'theme/lf-theme.css',
  'vendor/bootstrap.min.css',
  'vendor/bootstrap.bundle.min.js',
];

let outOfSync = 0;
let checked = 0;

for (const relFile of trackedFiles) {
  const sourcePath = path.join(root, relFile);
  const sourceContent = readFileSync(sourcePath, 'utf8');

  for (const consumerRoot of consumers) {
    const consumerPath = path.join(consumerRoot, relFile);
    if (!existsSync(consumerPath)) continue; // not vendored there yet — not drift
    checked++;
    const consumerContent = readFileSync(consumerPath, 'utf8');
    if (consumerContent !== sourceContent) {
      outOfSync++;
      console.log(`OUT OF SYNC: ${relFile} in ${path.basename(consumerRoot)}`);
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
