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

const MIRROR_HINT_LABEL = { fr: "Mode humain", en: "Human mode" };

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

document.addEventListener("DOMContentLoaded", () => {
  renderFloors(currentLang);
  updateLangButton();
  updateMirrorHint();
  document.getElementById("lang-switch").addEventListener("click", toggleLanguage);
});
