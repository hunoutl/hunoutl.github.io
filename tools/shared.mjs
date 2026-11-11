#!/usr/bin/env node
// Code partagé entre les deux faces (Façade hunoutl.gitlab.io / Machine
// hunoutl.github.io). Les fichiers de SHARED sont IDENTIQUES octet pour
// octet dans les deux dépôts ; ce qui distingue une face de l'autre vit
// ailleurs (scripts/site.js, content.js, render-*.js, styles, index.html).
//
//   node tools/shared.mjs check [dépôt frère]  → échoue s'ils divergent
//   node tools/shared.mjs sync  [dépôt frère]  → copie CE dépôt → frère
//
// On modifie un fichier partagé dans l'un des deux dépôts, puis `sync`
// depuis ce dépôt : il fait foi. `sync` refuse d'écraser un fichier que le
// frère a modifié sans le committer, plus récemment qu'ici (--force pour
// passer outre).
// Le hook tools/hooks/pre-commit lance `check` à chaque commit
// (activation : git config core.hooksPath tools/hooks).
// Dépôt frère par défaut : le dossier voisin (../hunoutl.github.io depuis
// la Façade, ../hunoutl.gitlab.io depuis la Machine).
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync, statSync } from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

export const SHARED = [
  "scripts/bar.js",
  "scripts/drag-swipe.js",
  "scripts/floor-fit.js",
  "scripts/geo.js",
  "scripts/lang-switch.js",
  "scripts/sim-core.js",
  "tools/build.mjs",
  "tools/fit-floors.mjs",
  "tools/shared.mjs",
  "tools/hooks/pre-commit",
];

const here = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SIBLING = { "hunoutl.gitlab.io": "hunoutl.github.io", "hunoutl.github.io": "hunoutl.gitlab.io" };
const args = process.argv.slice(2);
const force = args.includes("--force");
const [cmd, siblingArg] = args.filter((a) => a !== "--force");
const other = siblingArg ? resolve(siblingArg) : SIBLING[basename(here)] && join(here, "..", SIBLING[basename(here)]);

if (!["check", "sync"].includes(cmd) || !other) {
  console.error("Usage : node tools/shared.mjs check|sync [chemin du dépôt frère] [--force]");
  process.exit(2);
}
if (!existsSync(join(other, "scripts"))) {
  console.error(`Dépôt frère introuvable : ${other}`);
  process.exit(2);
}

const read = (root, f) => (existsSync(join(root, f)) ? readFileSync(join(root, f)) : null);

if (cmd === "check") {
  let bad = 0;
  for (const f of SHARED) {
    const a = read(here, f);
    const b = read(other, f);
    if (a && b && a.equals(b)) continue;
    console.error(`✗ ${f} ${!a || !b ? `absent de ${!a ? here : other}` : "diffère entre les deux dépôts"}`);
    bad++;
  }
  if (bad) {
    console.error(`\n${bad} fichier(s) partagé(s) divergent. Depuis le dépôt qui fait foi : node tools/shared.mjs sync`);
    process.exit(1);
  }
  console.log(`✓ ${SHARED.length} fichiers partagés identiques (${basename(other)})`);
  process.exit(0);
}

// sync : refuser d'écraser des modifications non committées du frère
let dirty = [];
try {
  dirty = execFileSync("git", ["-C", other, "status", "--porcelain", "--", ...SHARED], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .map((l) => l.slice(3))
    // modifié là-bas APRÈS la version d'ici : pas une simple synchro antérieure
    .filter((f) => read(other, f) && read(here, f) && !read(other, f).equals(read(here, f)))
    .filter((f) => statSync(join(other, f)).mtimeMs > statSync(join(here, f)).mtimeMs);
} catch (_) {
  /* frère hors git : pas de garde-fou */
}
if (dirty.length && !force) {
  console.error(`Modifications non committées dans ${basename(other)}, qui seraient écrasées :\n  ${dirty.join("\n  ")}`);
  console.error("Les reporter ici d'abord, ou relancer avec --force.");
  process.exit(1);
}
let n = 0;
for (const f of SHARED) {
  const a = read(here, f);
  if (!a) {
    console.error(`✗ ${f} absent de ce dépôt`);
    process.exit(1);
  }
  const b = read(other, f);
  if (b && a.equals(b)) continue;
  mkdirSync(dirname(join(other, f)), { recursive: true });
  writeFileSync(join(other, f), a);
  chmodSync(join(other, f), statSync(join(here, f)).mode);
  console.log(`→ ${f}`);
  n++;
}
console.log(n ? `${n} fichier(s) copié(s) vers ${basename(other)}` : "Déjà identiques.");
