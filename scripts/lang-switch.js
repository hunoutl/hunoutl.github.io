// Bascule FR/EN locale (même page, pas de navigation) : petit fondu
// sur le contenu pendant le remplacement, pas de dépendance à
// l'ancien overlay plein écran (supprimé avec l'architecture iframe).
const DEFAULT_LANG = "en";
const STORAGE_KEY = "siteLang";

let currentLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;

function renderFloors(lang) {
  const container = document.getElementById("floors");
  container.innerHTML = "";
  for (const floor of FLOORS) {
    const section = document.createElement("section");
    section.className = "floor";
    section.id = floor.id;
    section.dataset.floorId = floor.id;
    const render = floor[lang] || floor[DEFAULT_LANG];
    section.innerHTML = `<div class="floor-inner">${render()}</div>`;
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
  btn.setAttribute("aria-label", currentLang === "en" ? "Passer en français" : "Switch to English");
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
    localStorage.setItem(STORAGE_KEY, currentLang);
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
