// Bascule FR/EN locale (même page, pas de navigation) : petit fondu
// sur le contenu pendant le remplacement, pas de dépendance à
// l'ancien overlay plein écran (supprimé avec l'architecture iframe).
const DEFAULT_LANG = "en";
const STORAGE_KEY = "siteLang";

const LANGS = ["fr", "en"];

// Stockage protégé : cookies bloqués ou iframe tierce → SecurityError.
// Sans ce garde-fou, currentLang n'est jamais défini et la page reste vide.
function readStoredLang() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return LANGS.includes(v) ? v : null;
  } catch (_) {
    return null;
  }
}
function storeLang(lang) {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) { /* stockage indisponible */ }
}

let currentLang = readStoredLang() || DEFAULT_LANG;

// Typographie au rendu, sur les nœuds texte seulement (jamais le code) :
// apostrophes courbes partout ; en français, espace insécable avant « : »
// et « % », espace fine insécable avant « ; ? ! » et dans les guillemets.
const NBSP = " ";
const NNBSP = " ";
function typeset(root, lang) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement && n.parentElement.closest("code, pre, script, style") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    let s = n.nodeValue.replace(/(\p{L})'(\p{L})/gu, "$1’$2");
    if (lang === "fr") {
      s = s
        .replace(/(\S) ([:%])(?=\s|$)/g, `$1${NBSP}$2`)
        .replace(/(\S) ([;?!])/g, `$1${NNBSP}$2`)
        .replace(/« /g, `«${NNBSP}`)
        .replace(/ »/g, `${NNBSP}»`);
    }
    if (s !== n.nodeValue) n.nodeValue = s;
  }
}

function renderFloors(lang) {
  if (!LANGS.includes(lang)) lang = DEFAULT_LANG;
  document.documentElement.lang = lang;
  const container = document.getElementById("floors");
  container.innerHTML = "";
  for (const floor of FLOORS) {
    const section = document.createElement("section");
    section.className = "floor";
    section.id = floor.id;
    section.dataset.floorId = floor.id;
    // hauteur fixe (geo.js, identique des deux côtés) AVANT toute
    // restauration de scroll : un même scrollY tombe au même endroit.
    section.style.height = `${GEO.floorHeight(floor.id, GEO.layoutWidth())}px`;
    const render = floor[lang];
    section.innerHTML = `<div class="floor-inner">${render()}</div>`;
    typeset(section, lang);
    container.appendChild(section);
  }
  // drag-swipe.js met en cache la liste des étages : elle doit être
  // rafraîchie puisque les nœuds DOM viennent d'être recréés.
  document.dispatchEvent(new CustomEvent("floors-rendered"));
}

function updateLangButton() {
  const btn = document.getElementById("lang-switch");
  if (!btn) return;
  btn.textContent = currentLang === "en" ? "FR" : "EN";
  // Le nom accessible contient le texte visible (WCAG 2.5.3).
  btn.setAttribute("aria-label", currentLang === "en" ? "FR — version française" : "EN — English version");
  btn.lang = currentLang === "en" ? "fr" : "en";
}

// Machine → Façade : la carte se redéplie par-dessus le plan.
const MIRROR_HINT_LABEL = { fr: "← La carte", en: "← The map" };

function updateMirrorHint() {
  const link = document.getElementById("mirror-hint");
  if (!link) return;
  link.textContent = MIRROR_HINT_LABEL[currentLang] || MIRROR_HINT_LABEL[DEFAULT_LANG];
}

function toggleLanguage() {
  const container = document.getElementById("floors");
  const nextLang = currentLang === "en" ? "fr" : "en";
  container.classList.add("lang-fading");
  window.setTimeout(() => {
    currentLang = nextLang;
    storeLang(currentLang);
    renderFloors(currentLang);
    updateLangButton();
    updateMirrorHint();
    requestAnimationFrame(() => {
      container.classList.remove("lang-fading");
    });
  }, 180);
}

// Les planches sont dessinées en px pour la largeur de mise en page (même
// valeur dans l'iframe miroir et sur la page d'arrivée). Elles ne sont
// redessinées que si cette LARGEUR change (rotation, fenêtre) — jamais
// pour un simple changement de hauteur (barre d'adresse mobile).
let renderedWidth = 0;
function renderIfWidthChanged() {
  const w = GEO.layoutWidth();
  if (w !== renderedWidth) {
    renderedWidth = w;
    renderFloors(currentLang);
  }
}

function initLang() {
  renderedWidth = GEO.layoutWidth();
  renderFloors(currentLang);
  window.addEventListener("resize", renderIfWidthChanged);
  updateLangButton();
  updateMirrorHint();
  document.getElementById("lang-switch").addEventListener("click", toggleLanguage);
}

// Script en fin de <body> : rendu immédiat, pendant le parsing, pour que
// le contenu existe dès le premier frame peint (cf. drag-swipe.js).
if (document.getElementById("floors")) initLang();
else document.addEventListener("DOMContentLoaded", initLang);
