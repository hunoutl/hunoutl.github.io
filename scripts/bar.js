// Boutons de la barre du haut, communs aux deux faces (fichier identique
// dans les deux dépôts) :
// - pause de l'animation (WCAG 2.2.2) : fige la simulation sur l'instant
//   présent ; drag-swipe.js transmet ce tick à l'autre face ;
// - CV (PDF), pas encore publié : le bouton l'annonce « bientôt disponible ».
// Chargé après sim-core.js et AVANT drag-swipe.js : la préférence de pause
// mémorisée s'applique d'abord, puis une arrivée par swipe impose l'état
// de la face de départ.
(() => {
  const PAUSE_KEY = "simPaused";
  const L = {
    fr: {
      pause: "Mettre l’animation en pause",
      resume: "Relancer l’animation",
      cv: "CV",
      soon: "bientôt",
      cvTitle: "CV (PDF) : bientôt disponible",
      cvToast: "Le CV en PDF sera bientôt disponible.",
    },
    en: {
      pause: "Pause the animation",
      resume: "Resume the animation",
      cv: "CV",
      soon: "soon",
      cvTitle: "CV (PDF): coming soon",
      cvToast: "The PDF résumé is coming soon.",
    },
  };
  const lang = () => (typeof currentLang !== "undefined" && L[currentLang] ? currentLang : "en");

  const pauseBtn = document.getElementById("motion-toggle");
  const cvBtn = document.getElementById("cv-soon");
  const toast = document.getElementById("bar-toast");

  function readPref() {
    try {
      return localStorage.getItem(PAUSE_KEY) === "1";
    } catch (_) {
      return false;
    }
  }
  function writePref(on) {
    try {
      if (on) localStorage.setItem(PAUSE_KEY, "1");
      else localStorage.removeItem(PAUSE_KEY);
    } catch (_) {
      /* stockage indisponible */
    }
  }

  function render() {
    const t = L[lang()];
    if (pauseBtn) {
      const paused = !!(window.SIM && SIM.pausedTick() !== null);
      pauseBtn.setAttribute("aria-pressed", String(paused));
      pauseBtn.setAttribute("aria-label", paused ? t.resume : t.pause);
      pauseBtn.title = paused ? t.resume : t.pause;
    }
    if (cvBtn) {
      cvBtn.innerHTML = `${t.cv}<small>${t.soon}</small>`;
      cvBtn.title = t.cvTitle;
      cvBtn.setAttribute("aria-label", t.cvTitle);
    }
  }

  let toastTimer = 0;
  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("on");
      toast.textContent = "";
    }, 2600);
  }

  // Animation déjà figée (réglage système) ou aperçu miroir : pas de bouton.
  const canPause = pauseBtn && window.SIM && typeof SIM.pause === "function" && !SIM.reduceMotion;
  if (canPause) {
    pauseBtn.hidden = false;
    if (!SIM.embedded && readPref()) SIM.pause();
    pauseBtn.addEventListener("click", () => {
      if (SIM.pausedTick() !== null) {
        SIM.resume();
        writePref(false);
      } else {
        SIM.pause();
        writePref(true);
      }
    });
    document.addEventListener("sim-pause-change", render);
  }
  if (cvBtn) cvBtn.addEventListener("click", () => showToast(L[lang()].cvToast));
  document.addEventListener("floors-rendered", render);
  render();
})();
