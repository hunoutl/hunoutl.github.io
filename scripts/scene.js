// scene.js — moteur d'animation commun aux deux faces (fichier IDENTIQUE).
//
// Règle d'or de la bascule : l'aperçu iframe et la page d'arrivée doivent
// calculer EXACTEMENT le même état au même instant. Donc :
//  - mouvements pilotés par l'horloge murale (Date.now()) et/ou le scroll,
//    jamais par un compteur de frames ni par Math.random ;
//  - premier état calculé de façon SYNCHRONE (script en fin de body, après
//    drag-swipe.js qui a déjà restauré le scroll d'arrivée) : le premier
//    frame peint est déjà juste, aucune animation d'entrée ;
//  - les objets animés sont des éléments HTML déplacés par transform
//    (composités), pas des attributs SVG (pas de repeinture de planche) ;
//  - les planches hors écran ne sont pas animées (IntersectionObserver,
//    qui dans l'iframe miroir cachée hors champ coupe aussi tout).
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FROZEN_T = 7300; // horloge figée (identique des deux côtés) si mouvement réduit
  const READ_VH = 800; // repère de lecture fixe (indépendant de la barre d'adresse mobile)
  let plates = [];
  let raf = 0;
  let lastName = "";

  const now = () => (reduce ? FROZEN_T : Date.now());

  function collect() {
    plates = Array.from(document.querySelectorAll(".floor")).map((sec) => {
      const id = sec.dataset.floorId;
      const movers = Array.from(sec.querySelectorAll("[data-m]")).map((el) => ({ el, kind: el.dataset.m, k: Number(el.dataset.k || 0) }));
      return { sec, id, g: GEO.geom(id), movers, top: sec.offsetTop, visible: true, clock: movers.some((m) => !SCROLL_ONLY.has(m.kind)) };
    });
    observe();
  }

  let io = null;
  function observe() {
    if (io) io.disconnect();
    if (!("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const p = plates.find((q) => q.sec === e.target);
          if (p) p.visible = e.isIntersecting;
        }
        draw(false);
        kick();
      },
      { rootMargin: "200px 0px" }
    );
    plates.forEach((p) => io.observe(p.sec));
  }

  function draw(all) {
    const t = now();
    const sy = window.scrollY;
    for (const p of plates) {
      if (!all && !p.visible) continue;
      const ctx = { sy, top: p.top, vh: READ_VH };
      for (const m of p.movers) {
        const f = FACE_MOVE[m.kind];
        if (f) f(m.el, p.g, t, ctx, m.k);
      }
    }
  }

  function frame() {
    raf = 0;
    draw(false);
    if (!reduce && plates.some((p) => p.visible && p.clock)) raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (!raf && !reduce) raf = requestAnimationFrame(frame);
  }

  // Nom de la planche courante dans le bandeau (même calcul des deux côtés).
  function updateName() {
    const el = document.getElementById("plate-name");
    if (!el || !plates.length) return;
    const y = window.scrollY + 300;
    let cur = plates[0];
    for (const p of plates) if (p.top <= y) cur = p;
    const lang = typeof currentLang !== "undefined" ? currentLang : "en";
    const name = (PLATE_NAMES[lang] || {})[cur.id] || "";
    if (name !== lastName) {
      el.textContent = name;
      lastName = name;
    }
  }

  function onScroll() {
    draw(false);
    updateName();
  }

  function init() {
    collect();
    draw(true); // synchrone : le premier frame peint est déjà dans le bon état
    updateName();
    kick();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("floors-rendered", () => {
      lastName = "";
      collect();
      draw(true);
      updateName();
      kick();
    });
  }

  init();
})();
