#!/usr/bin/env node
// Mesure la place qu'il manque au texte de chaque étage, sur les DEUX faces
// et dans les DEUX langues, pour toutes les largeurs, et écrit la table
// scripts/floor-fit.js (identique dans les deux dépôts). geo.js ajoute ces
// marges aux hauteurs de base : les hauteurs restent une fonction de la
// seule largeur, les mêmes des deux côtés (radiographie alignée), sans
// aucune mesure au chargement.
//
// À relancer après toute modification de texte, de police ou de mise en
// page des cartouches :
//   PLAYWRIGHT=<chemin vers playwright/index.mjs> node tools/fit-floors.mjs ../hunoutl.github.io
// (Chromium requis. PLAYWRIGHT vaut "playwright" par défaut.)
//
// Rapidité : les 4 combinaisons face × langue et, dans chacune, des
// tranches contiguës de largeurs sont mesurées en parallèle, une page
// (donc un processus de rendu) par tranche, JOBS pages à la fois (par
// défaut : nombre de cœurs). WebGL est coupé : la mer (canvas #sea, hors
// des étages) retombe sur son repli prévu (masquée), ce qui ne change
// aucune mesure et évite le rendu logiciel swiftshader à chaque largeur,
// qui coûtait plus que tout le reste.
import { execFileSync } from "node:child_process";
import { availableParallelism } from "node:os";
import { writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sibling = process.argv[2] && resolve(process.argv[2]);
if (!sibling) {
  console.error("Usage : node tools/fit-floors.mjs <chemin du dépôt frère>");
  process.exit(2);
}
const W0 = 320, W1 = 2560, STEP = 10;
const MARGIN = 32; // air sous le bas du dernier texte (px)
const QUANT = 8; // marges arrondies au multiple supérieur (table stable)
const JOBS = Math.max(1, +process.env.JOBS || availableParallelism());

const pw = process.env.PLAYWRIGHT || "playwright";
const { chromium } = await import(pw.startsWith("/") ? pathToFileURL(pw).href : pw);

const repos = [here, sibling];
for (const r of repos) execFileSync(process.execPath, ["tools/build.mjs"], { cwd: r, stdio: "inherit" });

// Bas du texte de chaque étage, relatif à son haut, moins la hauteur de
// base : ce qu'il faut ajouter (0 si ça tient). Sur ordinateur, le premier
// panneau de l'accueil (hero2) est exclu : il est placé selon la fenêtre et
// peut descendre exprès sur l'étage suivant (en restant au-dessus de son
// cartouche, cf. render-*.js). Sur mobile, il est compté comme le reste.
function measure() {
  const out = {};
  const W = window.innerWidth;
  const skip = W >= GEO.BP ? "svg, [data-card='hero2']" : "svg";
  const GAP = 28;
  for (const sec of document.querySelectorAll("#floors .floor:not(.floor-static)")) {
    const top = sec.getBoundingClientRect().top;
    // Navire (étage « vents ») : descente nécessaire pour passer sous le
    // texte du cartouche quand celui-ci est au-dessus (mobile). Calculée
    // depuis la position de base (sans la descente déjà appliquée).
    let ship = 0, cur = 0;
    const inset = sec.querySelector(".inset");
    const card = sec.querySelector(".card");
    if (inset && card) {
      cur = GEO.shipShift(W);
      const ri = inset.getBoundingClientRect(), rc = card.getBoundingClientRect();
      const across = Math.min(rc.right, ri.right) - Math.max(rc.left, ri.left) > 0;
      if (W < GEO.BP && across && rc.top < ri.top - cur) ship = Math.max(0, rc.bottom + GAP - (ri.top - cur));
      out["ship"] = ship;
    }
    let bottom = 0;
    for (const el of sec.querySelectorAll(".floor-inner *")) {
      if (el.closest(skip)) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const dy = el.closest(".inset") ? ship - cur : 0;
      bottom = Math.max(bottom, r.bottom + dy - top);
    }
    // Ordinateur : le premier panneau de l'accueil descend au plus jusqu'au
    // cartouche ou au navire de l'étage suivant (render-*.js) ; l'accueil
    // doit être assez haut pour qu'il y tienne depuis sa position de base.
    const h2 = sec.querySelector("[data-card='hero2']");
    if (W >= GEO.BP && h2 && window.SIM && SIM.layout) {
      const L = SIM.layout;
      const below = Math.min(L.cards.vents.y, L.ship.y - L.ship.h / 2);
      bottom = Math.max(bottom, L.cards.hero2.y + h2.offsetHeight + 24 - below);
    }
    out[sec.id] = Math.max(0, bottom - GEO.baseHeight(sec.id, W));
  }
  return out;
}

const b = await chromium.launch({ args: ["--disable-gpu", "--disable-webgl"] });
const widths = [];
for (let W = W0; W <= W1; W += STEP) widths.push(W);
// Tranches : assez pour occuper JOBS pages, pas trop (chaque tranche
// recharge la page). Une page chargée directement à une largeur donne la
// même mise en page qu'une page redimensionnée jusqu'à elle.
const combos = repos.flatMap((repo) => ["fr", "en"].map((lang) => ({ repo, lang, left: 0 })));
const perCombo = Math.max(1, Math.ceil((JOBS * 2) / combos.length));
const size = Math.ceil(widths.length / perCombo);
const tasks = [];
for (const c of combos)
  for (let k0 = 0; k0 < widths.length; k0 += size, c.left++) tasks.push({ c, k0, k1: Math.min(widths.length, k0 + size) });

const need = {}; // id → tableau des marges (max sur faces et langues)
async function run({ c, k0, k1 }) {
  // animations réduites : pas d'iframe miroir ni de boucle d'animation
  const ctx = await b.newContext({ viewport: { width: widths[k0], height: 900 }, reducedMotion: "reduce" });
  await ctx.addInitScript((l) => localStorage.setItem("siteLang", l), c.lang);
  const p = await ctx.newPage();
  await p.goto(pathToFileURL(join(c.repo, "dist/index.html")).href);
  await p.waitForTimeout(300);
  for (let k = k0; k < k1; k++) {
    if (k > k0) await p.setViewportSize({ width: widths[k], height: 900 });
    await p.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
    const m = await p.evaluate(measure);
    for (const [id, v] of Object.entries(m)) {
      (need[id] ||= [])[k] = Math.max(need[id][k] || 0, v);
    }
  }
  await ctx.close();
  if (!--c.left) console.log(`${c.repo.split("/").pop()} ${c.lang} : mesuré`);
}
const queue = tasks.slice();
await Promise.all(Array.from({ length: Math.min(JOBS, tasks.length) }, async () => {
  while (queue.length) await run(queue.shift());
}));
await b.close();
// Pas de trou dans les tableaux (une clé absente à une largeur vaut 0).
for (const a of Object.values(need)) for (let k = 0; k < widths.length; k++) a[k] ||= 0;

const d = {}, sh = {};
for (const [id, a] of Object.entries(need)) {
  if (id === "ship") {
    const q = a.map((v) => (v > 0 ? Math.ceil(v / QUANT) * QUANT : 0));
    if (q.some((v) => v > 0)) sh.ship = q;
    continue;
  }
  const q = a.map((v) => (v > 0 ? Math.ceil((v + MARGIN) / QUANT) * QUANT : 0));
  if (q.some((v) => v > 0)) d[id] = q;
}
const src =
  "// Généré par tools/fit-floors.mjs — ne pas modifier à la main.\n" +
  `// Marge (px) à ajouter à chaque étage, de ${W0} à ${W1} px de large par pas de ${STEP}.\n` +
  `window.FLOOR_FIT = {\n  w0: ${W0},\n  step: ${STEP},\n  d: {\n` +
  Object.entries(d).map(([id, a]) => `    ${id}: [${a.join(",")}],`).join("\n") +
  "\n  },\n  // descente du plan de coupe du navire (px), mêmes largeurs\n  s: {\n" +
  Object.entries(sh).map(([id, a]) => `    ${id}: [${a.join(",")}],`).join("\n") +
  "\n  },\n};\n";
for (const r of repos) writeFileSync(join(r, "scripts/floor-fit.js"), src);
for (const [id, a] of Object.entries(d)) console.log(`${id.padEnd(11)} max +${Math.max(...a)} px`);
for (const [id, a] of Object.entries(sh)) console.log(`${id.padEnd(11)} descente max ${Math.max(...a)} px`);
