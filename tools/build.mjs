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
  return code.replace(/<\/script/gi, "<\\/script");
}

let html = read("index.html");
// Commentaires HTML et préchargements cross-site (inutiles : tout est inline).
html = html.replace(/<!--[\s\S]*?-->\s*/g, "");
html = html.replace(/\s*<link rel="(?:prefetch|preconnect)"[^>]*>/g, "");
// CSS : polices (woff2 subsettées, OFL) inlinées en data URI — aucune
// requête externe, et Chromium décode les polices data: de façon
// synchrone (pas de texte qui change de police après le premier rendu).
const transformCss = (css) => css.replace(/url\((?:"|')?((?:\.\.\/)?assets\/[\w./-]+\.(?:woff2|webp|png|svg))(?:"|')?\)/g, (_, p) => `url(${dataUri(p.replace(/^\.\.\//, ""))})`);
html = html.replace(/<link rel="stylesheet" href="([^"]+)" \/>/g, (_, p) => `<style>\n${transformCss(read(p))}</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, p) => `<script>\n${transformScript(p, read(p))}</script>`);

const leftovers = html.match(/(?:src|href)="(?!https?:|data:|#|mailto:)[^"]+"/g)?.filter((m) => !m.includes("${"));
if (leftovers?.length) console.warn("Références locales restantes :", leftovers);

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/index.html"), html);
console.log(`dist/index.html — ${(Buffer.byteLength(html) / 1024).toFixed(1)} Ko${mirrorUrl ? ` — miroir ${mirrorUrl}` : ""}`);
