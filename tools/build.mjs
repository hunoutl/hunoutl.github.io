#!/usr/bin/env node
// Build du site : produit dist/index.html, un fichier UNIQUE
// tout-inline (CSS, JS, photo en data URI).
//
// Pourquoi : github.io et gitlab.io sont deux sites distincts, donc les
// caches HTTP sont partitionnés — ce que l'iframe miroir a chargé n'est
// pas réutilisable par la vraie page d'arrivée. Avec un fichier unique,
// le prefetch du seul document (Speculation Rules, cf. drag-swipe.js)
// suffit : l'arrivée n'a plus aucune requête réseau à faire.
//
// Usage : node tools/build.mjs (lancé par la CI avant déploiement)
// Test en réseau local : MIRROR_URL=http://<ip-ou-nom>:<port>/ node tools/build.mjs
// (URL de base du site miroir, slash final ; par défaut la production
// codée dans drag-swipe.js.) Ajouter ?debug=1 pour le panneau de mesures.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const mirrorUrl = process.env.MIRROR_URL;
if (mirrorUrl && !/^https?:\/\/.+\/$/.test(mirrorUrl)) {
  console.error(`MIRROR_URL doit être une URL http(s) terminée par "/" : ${mirrorUrl}`);
  process.exit(1);
}

const MIME = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const dataUri = (p) => `data:${MIME[extname(p)]};base64,${readFileSync(join(root, p)).toString("base64")}`;

function transformScript(path, code) {
  if (path.endsWith("content.js")) {
    code = code.replace(/assets\/[\w.-]+\.(webp|png|jpg|svg)/g, (asset) => dataUri(asset));
  }
  if (path.endsWith("drag-swipe.js") && mirrorUrl) {
    const re = /const MIRROR_URL = "[^"]*";/;
    if (!re.test(code)) throw new Error("MIRROR_URL introuvable dans drag-swipe.js");
    code = code.replace(re, `const MIRROR_URL = ${JSON.stringify(mirrorUrl)};`);
  }
  // Rien dans le code inliné ne doit pouvoir fermer la balise ou ouvrir un
  // commentaire HTML (qui changerait le mode d'analyse du <script>).
  return code.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--");
}

let html = read("index.html");

// --- Étages pré-générés (contenu lisible sans JavaScript : robots,
// aperçus de liens, NoScript, script en échec). geo.js et content.js sont
// exécutés tels quels dans un bac à sable ; seule la langue par défaut de
// la page (<html lang>) est produite. Avec JS, une ligne du <head> passe
// <html> de .no-js à .js : ces sections sont alors masquées dès le premier
// rendu, puis remplacées par lang-switch.js (rendu inchangé, au pixel près).
const NBSP = "\u00a0", NNBSP = "\u202f";
function typesetText(t, lang) {
  t = t.replace(/(\p{L})'(\p{L})/gu, "$1’$2");
  if (lang !== "fr") return t;
  return t
    .replace(/(\S) ([:%])(?=\s|$)/g, `$1${NBSP}$2`)
    .replace(/(\S) ([;?!])/g, `$1${NNBSP}$2`)
    .replace(/« /g, `«${NNBSP}`)
    .replace(/ »/g, `${NNBSP}»`);
}
function prerenderFloors(lang) {
  const sandbox = { console };
  sandbox.window = sandbox;
  sandbox.innerWidth = 1280;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(read("scripts/geo.js"), ctx, { filename: "geo.js" });
  vm.runInContext(read("scripts/content.js"), ctx, { filename: "content.js" });
  const floors = vm.runInContext(`FLOORS.map((f) => [f.id, f[${JSON.stringify(lang)}]()])`, ctx);
  return floors
    .map(([id, inner]) => {
      // texte entre les balises seulement (les attributs ne sont pas touchés)
      inner = inner.replace(/>([^<]+)</g, (_, t) => `>${typesetText(t, lang)}<`);
      return `<section class="floor floor-static" id="${id}" data-floor-id="${id}"><div class="floor-inner">${inner.trim()}</div></section>`;
    })
    .join("\n");
}
const pageLang = (html.match(/<html lang="(\w+)"/) || [])[1];
if (!pageLang) throw new Error('<html lang="…"> introuvable');
if (!html.includes('<main id="floors"></main>')) throw new Error('<main id="floors"></main> introuvable');
html = html.replace('<main id="floors"></main>', () => `<main id="floors">\n${prerenderFloors(pageLang)}\n</main>`);
// Lien vers l'autre face : utilisable sans JS (drag-swipe.js le remplace ensuite)
if (mirrorUrl) html = html.replace(/(data-mirror-link href=")[^"]*"/, (_, a) => `${a}${mirrorUrl}"`);
// Commentaires HTML et préchargements cross-site (inutiles : tout est inline).
html = html.replace(/<!--[\s\S]*?-->\s*/g, "");
html = html.replace(/\s*<link rel="(?:prefetch|preconnect)"[^>]*>/g, "");
// CSS : polices (woff2 subsettées, OFL) inlinées en data URI — aucune
// requête externe, et Chromium décode les polices data: de façon
// synchrone (pas de texte qui change de police après le premier rendu).
const transformCss = (css) => css.replace(/url\((?:"|')?((?:\.\.\/)?assets\/[\w./-]+\.(?:woff2|webp|png|svg))(?:"|')?\)/g, (_, p) => `url(${dataUri(p.replace(/^\.\.\//, ""))})`);
// Favicon (SVG) et icône d'écran d'accueil (PNG) inlinées en data URI.
html = html.replace(/(<link rel="(?:icon|apple-touch-icon)" href=")(assets\/[\w.-]+)"/g, (_, a, p) => `${a}${dataUri(p)}"`);
// Attributs dans n'importe quel ordre ; un attribut inattendu (defer,
// type=module…) ferait échouer le build plus bas plutôt que d'être ignoré.
html = html.replace(/<link\b(?=[^>]*\brel="stylesheet")[^>]*\bhref="([^"]+)"[^>]*>/g, (_, p) =>
  `<style>\n${transformCss(read(p)).replace(/<\/style/gi, "<\\/style")}</style>`);
html = html.replace(/<script\b([^>]*)\bsrc="([^"]+)"([^>]*)><\/script>/g, (m, a, p, b) => {
  if ((a + b).trim()) throw new Error(`Attributs non gérés sur ${m}`);
  return `<script>\n${transformScript(p, read(p))}</script>`;
});

const leftovers = html.match(/(?:src|href)="(?!https?:|data:|#|mailto:)[^"]+"/g)?.filter((m) => !m.includes("${"));
// Une ressource locale non inlinée casserait l'arrivée par swipe (le
// prefetch ne couvre que le document) : on refuse de déployer.
if (leftovers?.length) {
  console.error("Références locales non inlinées :", leftovers);
  process.exit(1);
}

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/index.html"), html);
console.log(`dist/index.html — ${(Buffer.byteLength(html) / 1024).toFixed(1)} Ko${mirrorUrl ? ` — miroir ${mirrorUrl}` : ""}`);
