#!/usr/bin/env node
// Vérifie que les fichiers partagés sont identiques dans les deux dépôts
// (Façade hunoutl.gitlab.io / Machine hunoutl.github.io). Ils sont copiés
// à la main : sans ce contrôle, les deux faces dérivent sans qu'on le voie.
// Usage : node tools/check-shared.mjs ../hunoutl.github.io
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SHARED = ["scripts/geo.js", "scripts/floor-fit.js", "scripts/sim-core.js", "scripts/bar.js", "tools/build.mjs", "tools/check-shared.mjs", "tools/fit-floors.mjs"];
const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const other = process.argv[2];
if (!other) {
  console.error("Usage : node tools/check-shared.mjs <chemin du dépôt frère>");
  process.exit(2);
}
let bad = 0;
for (const f of SHARED) {
  let a, b;
  try {
    a = readFileSync(join(here, f));
    b = readFileSync(join(other, f));
  } catch (e) {
    console.error(`✗ ${f} : ${e.message}`);
    bad++;
    continue;
  }
  if (a.equals(b)) console.log(`✓ ${f}`);
  else {
    console.error(`✗ ${f} diffère entre les deux dépôts`);
    bad++;
  }
}
process.exit(bad ? 1 : 0);
