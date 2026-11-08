#!/usr/bin/env node
// POC "bascule invisible" : produit dist/index.html, un fichier UNIQUE
// tout-inline (CSS, JS, photo en data URI).
//
// Pourquoi : github.io et gitlab.io sont deux sites distincts, donc les
// caches HTTP sont partitionnés — ce que l'iframe miroir a chargé n'est
// pas réutilisable par la vraie page d'arrivée. Avec un fichier unique,
// le prefetch du seul document (Speculation Rules, cf. drag-swipe.js)
// suffit : l'arrivée n'a plus aucune requête réseau à faire.
//
// Usage : MIRROR_URL=https://hunoutl.github.io/poc/ node tools/build-poc.mjs
// (MIRROR_URL = URL de base du site miroir, slash final ; par défaut celle
// codée dans drag-swipe.js.)
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

const MIME = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
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
html = html.replace(/<link rel="stylesheet" href="([^"]+)" \/>/g, (_, p) => `<style>\n${read(p)}</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, p) => `<script>\n${transformScript(p, read(p))}</script>`);

const leftovers = html.match(/(?:src|href)="(?!https?:|data:|#|mailto:)[^"]+"/g)?.filter((m) => !m.includes("${"));
if (leftovers?.length) console.warn("Références locales restantes :", leftovers);

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/index.html"), html);
console.log(`dist/index.html — ${(Buffer.byteLength(html) / 1024).toFixed(1)} Ko${mirrorUrl ? ` — miroir ${mirrorUrl}` : ""}`);
