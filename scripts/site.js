// Ce qui distingue cette face (Machine, hunoutl.github.io) de l'autre.
// C'est le SEUL script propre au site avec content.js et render-machine.js :
// tous les autres sont identiques sur les deux dépôts (cf.
// tools/sync-shared.mjs). Chargé avant tous les autres scripts.
window.SITE = {
  // URL de base de l'autre face (slash final). tools/build.mjs peut
  // réécrire cette ligne (MIRROR_URL=...) pour les tests en réseau local.
  mirrorUrl: "https://hunoutl.gitlab.io/",
  // Convention "carrousel" : -1 = l'autre face est à gauche et se révèle
  // en glissant vers la DROITE (comme revenir en arrière dans une galerie).
  neighborDirection: -1,
  defaultLang: "en",
  // Lien d'en-tête vers l'autre face : la carte se redéplie par-dessus le plan.
  mirrorHint: { fr: "← La carte", en: "← The map" },
};
