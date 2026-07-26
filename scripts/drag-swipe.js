// Glissement horizontal → bascule vers le site miroir, sur l'étage
// équivalent. Même fichier sur les deux sites, seuls MIRROR_ORIGIN,
// MIRROR_*_URL et NEIGHBOR_DIRECTION changent.
//
// Principe anti-flash : un iframe caché du site miroir est préchargé
// et gardé synchronisé (scroll) en continu. Pendant le drag, on fait
// glisser CE VRAI RENDU du miroir à l'écran (pas une simple couleur/
// overlay) — zéro flash puisque rien ne recharge pendant le geste.
// La navigation réelle (changement de domaine dans la barre d'adresse)
// n'est déclenchée qu'une fois l'iframe déjà en pleine couverture de
// l'écran, donc invisible pour l'essentiel du ressenti.
(function () {
  const MIRROR_ORIGIN = "https://hunoutl.gitlab.io";
  const MIRROR_CSS_URL = `${MIRROR_ORIGIN}/styles/facade.css`;
  const MIRROR_JS_CONTENT_URL = `${MIRROR_ORIGIN}/scripts/content.js`;
  const MIRROR_JS_DRAG_URL = `${MIRROR_ORIGIN}/scripts/drag-swipe.js`;
  // Convention "carrousel" : le voisin de gauche (ici Façade) se révèle
  // en glissant vers la DROITE (comme revenir en arrière dans une galerie).
  // +1 = voisin à droite, -1 = voisin à gauche (cf. version gitlab.io).
  const NEIGHBOR_DIRECTION = -1;
  const DRAG_THRESHOLD_RATIO = 0.22; // fraction de la largeur d'écran
  const SETTLE_MS = 260;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isEmbedded = window.self !== window.top;

  let floors = [];
  let currentFloorId = "hero";
  let dragging = false;
  let committed = false;
  let startX = 0;
  let currentDx = 0;
  let pointerId = null;
  let mirrorFrame = null;
  let mirrorFrameReady = false;

  function currentFloorFromScroll() {
    let best = floors[0];
    let bestDist = Infinity;
    const center = window.scrollY + window.innerHeight / 2;
    for (const el of floors) {
      const dist = Math.abs(el.offsetTop + el.offsetHeight / 2 - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = el;
      }
    }
    return best ? best.id : "hero";
  }

  function scrollFraction() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return 0;
    return Math.min(1, Math.max(0, window.scrollY / max));
  }

  function syncMirrorFrameScroll() {
    if (!mirrorFrame || !mirrorFrameReady) return;
    const lang = typeof currentLang !== "undefined" ? currentLang : undefined;
    mirrorFrame.contentWindow.postMessage({ type: "sync-scroll", sf: scrollFraction(), lang }, MIRROR_ORIGIN);
  }

  // Partagé par l'arrivée réelle (handleArrival) et l'aperçu synchronisé
  // (message reçu dans l'iframe miroir) : la langue de la page de
  // départ prime toujours sur la préférence locale.
  function syncIncomingLang(lang) {
    if (
      lang &&
      typeof currentLang !== "undefined" &&
      lang !== currentLang &&
      typeof renderFloors === "function"
    ) {
      currentLang = lang;
      localStorage.setItem("siteLang", currentLang);
      renderFloors(currentLang);
      if (typeof updateLangButton === "function") updateLangButton();
    }
  }

  let lastSpecSf = null;
  let lastSpecFloor = null;

  function roundSf(sf) {
    return Math.round(sf * 100) / 100;
  }

  // Speculation Rules API (Chromium) : en plus de l'iframe, on pré-rend
  // aussi la vraie page cible en tâche de fond, pour que la navigation
  // réelle déclenchée après coup ait, elle aussi, le maximum de chances
  // d'être instantanée (là où le navigateur le supporte).
  function updateSpeculation() {
    if (!floors.length) return;
    const sf = roundSf(scrollFraction());
    if (sf === lastSpecSf && currentFloorId === lastSpecFloor) return;
    lastSpecSf = sf;
    lastSpecFloor = currentFloorId;
    const url = `${MIRROR_ORIGIN}/#${currentFloorId}`;
    let script = document.getElementById("mirror-speculation-rules");
    if (!script) {
      script = document.createElement("script");
      script.type = "speculationrules";
      script.id = "mirror-speculation-rules";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      prerender: [{ source: "list", urls: [url], eagerness: "immediate" }],
    });
  }

  function onScroll() {
    currentFloorId = currentFloorFromScroll();
    document.body.classList.toggle("at-hero", currentFloorId === "hero");
    updateSpeculation();
    syncMirrorFrameScroll();
    updateFallbackLinks();
  }

  // lang-switch.js recrée entièrement les sections .floor (innerHTML =
  // "") quand on bascule FR/EN : le tableau `floors` mis en cache ici
  // pointerait alors vers des nœuds DOM détachés. On le rafraîchit à
  // chaque changement de langue.
  function refreshFloors() {
    floors = Array.from(document.querySelectorAll("[data-floor-id]"));
    onScroll();
  }

  // dx suit toujours le doigt/curseur, mais le sens qui DÉCLENCHE la
  // navigation dépend du côté où se trouve le voisin : glisser vers le
  // voisin (comme dans une galerie) = dx * NEIGHBOR_DIRECTION < 0.
  function progressTowardNeighbor(dx) {
    return -dx * NEIGHBOR_DIRECTION;
  }

  function setLayers(dx) {
    const w = window.innerWidth;
    const clampedDx = Math.max(-w, Math.min(w, dx));
    // contenu courant : suit le doigt, jusqu'à sortir complètement.
    document.documentElement.style.setProperty("--drag-x", `${clampedDx}px`);
    // iframe miroir : commence hors-champ (NEIGHBOR_DIRECTION * w) et
    // glisse vers 0 au même rythme que le doigt, sans jamais dépasser 0.
    if (mirrorFrame) {
      const restOffset = NEIGHBOR_DIRECTION * w;
      const raw = restOffset + clampedDx;
      const frameOffset = restOffset >= 0 ? Math.max(0, Math.min(restOffset, raw)) : Math.min(0, Math.max(restOffset, raw));
      mirrorFrame.style.transition = "none";
      mirrorFrame.style.transform = `translateX(${frameOffset}px)`;
    }
  }

  function goToMirrorReal() {
    updateSpeculation();
    // Fraction exacte (non arrondie) : lastSpecSf est arrondi à 2 décimales
    // pour limiter les mises à jour de Speculation Rules, ce qui suffisait
    // à créer un petit décalage visible au réatterrissage sur l'autre site.
    const sf = scrollFraction();
    const floorId = lastSpecFloor !== null ? lastSpecFloor : currentFloorId;
    // window.name survit à une navigation complète (même cross-domaine)
    // et n'est lisible que par du JS : ça garde l'URL propre, pas de
    // paramètre technique visible/partageable dans la barre d'adresse.
    // Important : PAS de #floorId ici — le scroll natif du navigateur
    // sur l'ancre viendrait écraser le repositionnement précis (sf)
    // qu'on s'apprête à faire nous-mêmes à l'arrivée.
    // La langue de la page de départ voyage aussi, pour que le site
    // d'arrivée affiche la même langue plutôt que sa préférence propre
    // (typeof-guard : lang-switch.js est chargé avant, mais on ne
    // suppose rien s'il venait à manquer).
    const lang = typeof currentLang !== "undefined" ? currentLang : undefined;
    window.name = JSON.stringify({ from: "drag", sf, floorId, lang });
    window.location.href = `${MIRROR_ORIGIN}/`;
  }

  function settleCommitted() {
    const w = window.innerWidth;
    document.body.classList.add("settling");
    document.documentElement.style.setProperty("--drag-x", `${NEIGHBOR_DIRECTION * w}px`);
    if (mirrorFrame) {
      mirrorFrame.style.transition = `transform ${SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      mirrorFrame.style.transform = "translateX(0px)";
    }
    window.setTimeout(goToMirrorReal, SETTLE_MS);
  }

  function settleCancelled() {
    document.body.classList.add("settling");
    document.documentElement.style.setProperty("--drag-x", "0px");
    if (mirrorFrame) {
      mirrorFrame.style.transition = `transform ${SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      mirrorFrame.style.transform = `translateX(${NEIGHBOR_DIRECTION * window.innerWidth}px)`;
    }
    window.setTimeout(() => {
      document.body.classList.remove("settling");
    }, SETTLE_MS);
  }

  // Sur les vrais éléments de texte, on laisse le navigateur gérer la
  // sélection : le drag n'y démarre pas. Les liens/boutons (mirror-hint,
  // lang-switch...), eux, PEUVENT servir de point de départ au drag —
  // seuls les champs de saisie restent exclus.
  const TEXT_SELECTOR = "input, textarea, p, li, h1, h2, h3, span, strong, em, code, pre, blockquote, dt, dd, td, th";

  // Au-delà de cette distance, on considère qu'un vrai geste de drag a eu
  // lieu : le clic natif qui suivrait (sur un lien/bouton où le drag a
  // démarré) doit être annulé pour ne pas déclencher son action normale
  // en plus de la bascule de site.
  const DRAG_MOTION_PX = 8;
  let hadDragMotion = false;

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest(TEXT_SELECTOR)) return; // laisser le navigateur gérer ces éléments
    dragging = true;
    committed = false;
    hadDragMotion = false;
    pointerId = e.pointerId;
    startX = e.clientX;
    currentDx = 0;
    document.body.classList.remove("settling");
  }

  function onPointerMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    currentDx = e.clientX - startX;
    if (Math.abs(currentDx) > DRAG_MOTION_PX) hadDragMotion = true;
    e.preventDefault();
    document.body.classList.add("dragging");
    if (progressTowardNeighbor(currentDx) > 0) {
      setLayers(currentDx);
    } else {
      setLayers(0);
    }
  }

  function onPointerUp(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    document.body.classList.remove("dragging");
    const threshold = window.innerWidth * DRAG_THRESHOLD_RATIO;
    if (progressTowardNeighbor(currentDx) > threshold) {
      committed = true;
      settleCommitted();
    } else {
      settleCancelled();
    }
    currentDx = 0;
  }

  // Le lien de secours (ex. "plain-language version") n'est PAS
  // imbriqué dans un étage : son href doit suivre l'étage courant en
  // continu, pas être figé une fois pour toutes sur "hero" au chargement.
  function updateFallbackLinks() {
    document.querySelectorAll("[data-mirror-link]").forEach((el) => {
      el.href = `${MIRROR_ORIGIN}/#${currentFloorId}`;
    });
  }

  function createMirrorFrame() {
    if (isEmbedded) return; // pas d'aperçu récursif dans un aperçu
    const iframe = document.createElement("iframe");
    iframe.id = "mirror-frame";
    iframe.src = `${MIRROR_ORIGIN}/?embedded=1`;
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    iframe.style.transform = `translateX(${NEIGHBOR_DIRECTION * window.innerWidth}px)`;
    iframe.addEventListener("load", () => {
      mirrorFrameReady = true;
      syncMirrorFrameScroll();
    });
    document.body.appendChild(iframe);
    mirrorFrame = iframe;
  }

  function listenForSync() {
    window.addEventListener("message", (e) => {
      if (e.origin !== MIRROR_ORIGIN) return;
      const data = e.data;
      if (!data || data.type !== "sync-scroll") return;
      syncIncomingLang(data.lang);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0) window.scrollTo(0, data.sf * max);
    });
  }

  // window.name transporte la position exacte (sf) d'un domaine à
  // l'autre sans passer par l'URL. On la lit puis on la vide tout de
  // suite : sinon elle resterait attachée à l'onglet et fausserait un
  // futur rechargement "normal" (hors drag) de cette même page.
  function handleArrival() {
    let payload = null;
    if (window.name) {
      try {
        payload = JSON.parse(window.name);
      } catch (err) {
        payload = null;
      }
      window.name = "";
    }
    if (!payload || payload.from !== "drag") return;
    syncIncomingLang(payload.lang);

    if (typeof payload.sf === "number") {
      const sf = Math.min(1, Math.max(0, payload.sf));
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0) window.scrollTo(0, sf * max);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    floors = Array.from(document.querySelectorAll("[data-floor-id]"));
    listenForSync();
    document.addEventListener("floors-rendered", refreshFloors);
    onScroll();
    handleArrival();
    document.documentElement.style.visibility = "visible";

    if (reduceMotion || isEmbedded) {
      document.body.classList.add("reduced-motion");
      return; // pas de drag élastique, seulement les liens de secours
    }

    createMirrorFrame();

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    // Coupe la sélection de texte native dès le pointerdown (avant même
    // que le seuil de drag soit atteint) : sans ça, un petit mouvement
    // sur du texte déclenche une sélection avant qu'on ait pu réagir.
    document.addEventListener("selectstart", (e) => {
      if (dragging) e.preventDefault();
    });
    document.addEventListener("pointercancel", () => {
      dragging = false;
      settleCancelled();
    });

    // Si un vrai geste de drag a démarré sur un lien/bouton (lang-switch,
    // mirror-hint...), on annule le clic qui suivrait sinon en plus —
    // capture (avant la cible) pour intercepter avant tout autre handler.
    document.addEventListener(
      "click",
      (e) => {
        if (hadDragMotion) {
          hadDragMotion = false;
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );

    // Le lien de secours ("plain-language version"...) déclenche la même
    // animation de bascule qu'un drag mené jusqu'au bout à la main,
    // plutôt qu'un saut d'ancre natif instantané.
    document.addEventListener("click", (e) => {
      const link = e.target.closest("[data-mirror-link]");
      if (!link) return;
      e.preventDefault();
      dragging = false;
      committed = true;
      settleCommitted();
    });
  });
})();
