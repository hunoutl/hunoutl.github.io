// Glissement horizontal → bascule vers le site miroir, sur l'étage
// équivalent. Même fichier sur les deux sites : ce qui diffère
// (URL de l'autre face, sens du glissement) vient de site.js.
//
// Principe anti-flash : un iframe caché du site miroir est préchargé
// (à la première intention du visiteur, cf. armMirror) et gardé
// synchronisé (scroll) en continu. Pendant le drag, on fait
// glisser CE VRAI RENDU du miroir à l'écran (pas une simple couleur/
// overlay) — zéro flash puisque rien ne recharge pendant le geste.
// La navigation réelle (changement de domaine dans la barre d'adresse)
// n'est déclenchée qu'une fois l'iframe déjà en pleine couverture de
// l'écran, donc invisible pour l'essentiel du ressenti.
(function () {
  // URL de base du site miroir (avec slash final), cf. site.js.
  const MIRROR_URL = window.SITE.mirrorUrl;
  const MIRROR_ORIGIN = new URL(MIRROR_URL).origin;
  // Payload d'arrivée "<scrollY>.<lang>.<flags>.<innerHeight>.<tick figé>"
  // (dernier champ vide si la simulation tourne), transmis de deux façons :
  // - Chromium (Speculation Rules) : par window.name, que Chrome conserve en
  //   cross-site. L'URL de navigation doit rester EXACTEMENT l'URL
  //   prefetchée, fragment compris (mesuré : avec "#~sw…" →
  //   PrefetchSuccessfulButNotUsed) ;
  // - Firefox et Safari (pas de prefetch, et ils vident window.name en
  //   cross-site — github.io et gitlab.io sont deux sites distincts selon
  //   la Public Suffix List) : par le fragment d'URL, qui ne correspond à
  //   aucun id d'élément (pas de scroll d'ancre natif) et est retiré de
  //   l'URL (replaceState) dès la lecture.
  const PAYLOAD_PREFIX = "#~sw.";
  const NAME_PREFIX = "~sw.";
  const SPEC_RULES = !!(HTMLScriptElement.supports && HTMLScriptElement.supports("speculationrules"));
  const FLAG_USER_ACTIVATION = 1;
  const FLAG_DEBUG = 2;
  // Convention "carrousel" : +1 = voisin à droite, révélé en glissant vers
  // la gauche ; -1 = voisin à gauche, révélé en glissant vers la droite.
  const NEIGHBOR_DIRECTION = window.SITE.neighborDirection;
  const DRAG_THRESHOLD_RATIO = 0.22; // fraction de la largeur d'écran
  const SETTLE_MS = 260;
  // --- Geste rapide (v5) -------------------------------------------------
  // Un seuil en distance seul annulait les gestes rapides mais courts, et
  // une fin d'animation à durée/courbe fixes faisait freiner (ou bondir)
  // la page au lâcher. On mesure donc la vitesse du doigt au lâcher :
  //  - un coup sec vers le voisin (vitesse > FLICK_MIN_SPEED, distance >
  //    FLICK_MIN_RATIO de la largeur) suffit à basculer ; un coup sec dans
  //    l'autre sens annule, même au-delà du seuil de distance ;
  //  - la fin d'animation PART À LA VITESSE DU DOIGT (cf. settleCurve) et
  //    arrive à vitesse nulle : aucune rupture de vitesse.
  const FLICK_WINDOW_MS = 80; // vitesse mesurée sur les ~80 dernières ms du geste
  const FLICK_MIN_SPEED = 0.4; // px/ms (400 px/s)
  const FLICK_MIN_RATIO = 0.06; // fraction de la largeur d'écran
  const SETTLE_MIN_MS = 160;
  const SETTLE_MAX_MS = 440;
  // Le clic sur le bouton n'a pas le retour tactile immédiat d'un
  // vrai geste de drag : une bascule instantanée y paraît plus abrupte,
  // donc on lui laisse une animation un peu plus longue.
  const BUTTON_SETTLE_MS = 420;
  // Habillage de la bascule (proposition "cartographie") : en mode "scan",
  // la page courante NE BOUGE PAS ; l'iframe miroir est révélé sur place,
  // derrière une ligne de balayage qui suit le doigt — comme une
  // radiographie passée sur la carte (les deux faces partagent la même
  // géographie au pixel près). Mécanique identique au mode "slide"
  // d'origine : seuls les transforms appliqués diffèrent. Fenêtre
  // (#mirror-window, overflow:hidden) translatée de +x, iframe
  // contre-translaté de -x : le contenu miroir reste immobile à l'écran,
  // tout est composité (aucun clip-path animé). Même état final que
  // "slide" (tout à 0) au moment de la navigation.
  const REVEAL = "scan"; // "slide" = comportement d'origine
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isEmbedded = window.self !== window.top;

  // window.innerHeight varie pendant le scroll sur mobile (la barre
  // d'adresse se réduit/réapparaît) : deux mesures de fraction de scroll
  // prises à des moments différents (page fraîchement arrivée vs après
  // avoir déjà pas mal scrollé ailleurs) ne comptent alors pas la même
  // hauteur, ce qui décale la correspondance entre les deux sites — visible
  // seulement après avoir déjà navigué une fois. visualViewport.height
  // reflète la hauteur réellement visible à l'instant T, de façon plus
  // stable dans ce cas précis.
  function viewportHeight() {
    return window.visualViewport ? window.visualViewport.height : window.innerHeight;
  }

  let floors = [];
  let currentFloorId = "hero";
  let dragging = false;
  let committed = false;
  let startX = 0;
  let currentDx = 0;
  let pointerId = null;
  let mirrorFrame = null;
  let mirrorWindow = null; // mode "scan" : fenêtre qui contient l'iframe
  let scanLine = null; // mode "scan" : ligne de balayage (bord de la fenêtre)
  let mirrorFrameReady = false;

  // Place les calques du miroir. offset = décalage de la fenêtre (0 =
  // couverture totale, NEIGHBOR_DIRECTION * largeur = repos hors champ).
  function placeMirror(offset, ms, ease) {
    if (!mirrorFrame) return;
    const tr = ms ? `transform ${ms}ms ${ease || "cubic-bezier(0.22, 1, 0.36, 1)"}` : "none";
    if (REVEAL === "scan" && mirrorWindow) {
      mirrorWindow.style.transition = tr;
      mirrorWindow.style.transform = `translateX(${offset}px)`;
      mirrorFrame.style.transition = tr;
      mirrorFrame.style.transform = `translateX(${-offset}px)`;
      if (scanLine) {
        // voisin à gauche : la ligne est accrochée au bord DROIT de la fenêtre
        if (NEIGHBOR_DIRECTION < 0) scanLine.style.left = `${window.innerWidth}px`;
        scanLine.style.transition = tr;
        scanLine.style.transform = `translateX(${offset}px)`;
      }
    } else {
      mirrorFrame.style.transition = tr;
      mirrorFrame.style.transform = `translateX(${offset}px)`;
    }
  }

  function currentFloorFromScroll() {
    let best = floors[0];
    let bestDist = Infinity;
    const center = window.scrollY + viewportHeight() / 2;
    for (const el of floors) {
      const dist = Math.abs(el.offsetTop + el.offsetHeight / 2 - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = el;
      }
    }
    return best ? best.id : "hero";
  }

  // Synchronisation en pixels ABSOLUS (scrollY), pas en fraction de page :
  // les étages ont la même hauteur des deux côtés (geo.js), donc un même
  // scrollY tombe au même endroit ; la fraction dépendait de la hauteur de
  // viewport, qui varie sur mobile entre l'aperçu et l'arrivée.

  // Hauteur réelle de "100vh" sur CETTE page (sur mobile : viewport sans
  // la barre d'adresse). Dans l'iframe, 100vh vaudrait la hauteur de
  // l'iframe — différente dès que la barre d'adresse bouge — et les étages
  // en min-height:100vh n'auraient pas la même hauteur dans l'aperçu que
  // sur la vraie page d'arrivée (contenu décalé = "saut" à la bascule).
  // L'iframe reçoit donc cette valeur et l'applique via --vh (cf. CSS).
  let vhProbe = null;
  function measureVh() {
    if (!vhProbe) {
      vhProbe = document.createElement("div");
      vhProbe.style.cssText = "position:absolute;top:0;left:-9999px;width:1px;height:100vh;visibility:hidden;pointer-events:none";
      document.body.appendChild(vhProbe);
    }
    return vhProbe.offsetHeight;
  }

  function syncMirrorFrameScroll() {
    if (!mirrorFrame || !mirrorFrameReady) return;
    const lang = typeof currentLang !== "undefined" ? currentLang : undefined;
    mirrorFrame.contentWindow.postMessage(
      { type: "sync-scroll", scrollY: window.scrollY, lang, vh: measureVh(), pausedT: pausedTickNow() },
      MIRROR_ORIGIN
    );
  }

  // Partagé par l'arrivée réelle (handleArrival) et l'aperçu synchronisé
  // (message reçu dans l'iframe miroir) : la langue de la page de
  // départ prime toujours sur la préférence locale.
  function syncIncomingLang(lang) {
    if (
      (lang === "fr" || lang === "en") &&
      typeof currentLang !== "undefined" &&
      lang !== currentLang &&
      typeof renderFloors === "function"
    ) {
      currentLang = lang;
      if (typeof storeLang === "function") storeLang(currentLang);
      renderFloors(currentLang);
      if (typeof updateLangButton === "function") updateLangButton();
      if (typeof updateMirrorHint === "function") updateMirrorHint();
    }
  }

  // Tick figé de la simulation (bouton pause), ou null si elle tourne.
  function pausedTickNow() {
    return window.SIM && typeof SIM.pausedTick === "function" ? SIM.pausedTick() : null;
  }
  // L'autre face impose son état : figée sur le même tick, ou en marche.
  function syncIncomingPause(t) {
    if (!window.SIM || typeof SIM.pause !== "function") return;
    if (typeof t === "number" && isFinite(t)) SIM.pause(t);
    else SIM.resume();
  }

  function langNow() {
    return typeof currentLang !== "undefined" ? currentLang : "";
  }

  // --- Debug : ?debug=1 sur l'un des deux sites, propagé à l'autre
  // via le payload. Affiche un panneau de mesures en bas de l'écran.
  let DEBUG = false;
  let debugPanel = null;
  const debugLines = [];

  function initDebug(arrival) {
    const params = new URLSearchParams(location.search);
    try {
      if (params.get("debug") === "0") sessionStorage.removeItem("swipeDebug");
      else if (params.has("debug") || (arrival && arrival.debug)) sessionStorage.setItem("swipeDebug", "1");
      DEBUG = sessionStorage.getItem("swipeDebug") === "1";
    } catch (err) {
      DEBUG = params.has("debug");
    }
  }

  function debugLog(line) {
    if (!DEBUG || isEmbedded) return;
    debugLines.push(line);
    if (!debugPanel) {
      debugPanel = document.createElement("pre");
      debugPanel.id = "swipe-debug";
      debugPanel.style.cssText =
        "position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;margin:0;padding:8px 10px;" +
        "font:11px/1.4 ui-monospace,monospace;background:rgba(0,0,0,.82);color:#7CFC9A;" +
        "border-radius:6px;white-space:pre-wrap;pointer-events:none;max-height:40vh;overflow:hidden";
      document.body.appendChild(debugPanel);
    }
    debugPanel.textContent = debugLines.slice(-14).join("\n");
  }

  function reportArrivalMetrics(arrival) {
    if (!DEBUG || isEmbedded) return;
    const nav = performance.getEntriesByType("navigation")[0];
    const ref = document.referrer ? new URL(document.referrer).host : "—";
    debugLog(`[${location.host}] arrivée: ${arrival ? `swipe (${arrival.via})` : "directe"} · referrer ${ref}`);
    if (arrival) {
      debugLog(`userActivation au départ: ${arrival.ua === null ? "n/a" : arrival.ua}`);
      debugLog(`innerHeight départ ${arrival.innerHeight} → arrivée ${window.innerHeight} · 100vh ${measureVh()}`);
    }
    if (nav) {
      debugLog(
        `deliveryType="${nav.deliveryType !== undefined ? nav.deliveryType : "n/a"}" · type=${nav.type} · ` +
          `TTFB ${Math.round(nav.responseStart - nav.startTime)}ms · DCL ${Math.round(nav.domContentLoadedEventEnd)}ms`
      );
    }
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.name === "first-contentful-paint") debugLog(`FCP ${Math.round(e.startTime)}ms`);
        }
      }).observe({ type: "paint", buffered: true });
    } catch (err) {
      /* paint timing non supporté */
    }
    const nrr = nav && nav.notRestoredReasons;
    if (nrr) {
      const reasons = [];
      const walk = (n) => {
        if (!n) return;
        (n.reasons || []).forEach((r) => reasons.push(`${n.src || n.url || "main"}: ${r.reason}`));
        (n.children || []).forEach(walk);
      };
      walk(nrr);
      if (reasons.length) debugLog(`bfcache refusé: ${reasons.join(" | ")}`);
    }
    const specOk = HTMLScriptElement.supports && HTMLScriptElement.supports("speculationrules");
    debugLog(`speculationrules: ${specOk ? "oui" : "non"} · scrollY ${Math.round(window.scrollY)}`);
  }

  // Speculation Rules : PREFETCH (et non prerender) du document miroir.
  // Le prerender est interdit en cross-site ; le prefetch cross-site est
  // autorisé par Chrome tant que l'utilisateur n'a pas de cookie sur le
  // site cible (cas des Pages statiques). L'URL doit être EXACTEMENT celle
  // de la navigation réelle (le fragment du payload n'est pas envoyé au
  // serveur). Comme la page est un fichier unique tout-inline (cf.
  // tools/build.mjs), document prefetché = zéro requête réseau à l'arrivée.
  function addPrefetchRule() {
    if (!SPEC_RULES) return;
    const script = document.createElement("script");
    script.type = "speculationrules";
    script.textContent = JSON.stringify({
      prefetch: [{ source: "list", urls: [MIRROR_URL], eagerness: "immediate", referrer_policy: "strict-origin-when-cross-origin" }],
    });
    document.head.appendChild(script);
  }

  function onScroll() {
    currentFloorId = currentFloorFromScroll();
    syncMirrorFrameScroll();
    updateFallbackLinks();
    scheduleTease();
  }

  // --- Amorce : donner envie de glisser --------------------------------
  // Le geste est invisible (aucun bouton) : sans indice, la plupart des
  // visiteurs ne verraient jamais l'autre face. Au premier arrêt du
  // défilement (le visiteur lit), l'autre face se dévoile un instant sur
  // TEASE_RATIO de la largeur, ligne de scan visible, puis se retire.
  // Une fois par session, jamais pendant un geste, jamais en reduced-motion
  // ni après une arrivée par swipe (le visiteur connaît déjà le geste).
  const TEASE_KEY = "swTeased";
  const TEASE_RATIO = 0.08;
  const TEASE_MIN_PX = 36;
  const TEASE_IDLE_MS = 900; // immobilité qui compte comme « arrêt »
  const TEASE_MIN_SCROLL = 0.4; // fraction d'écran déjà parcourue
  let teaseTimer = 0;
  let teasing = 0; // 0 = non, sinon minuterie du retour
  let teaseDone = false;
  try {
    teaseDone = sessionStorage.getItem(TEASE_KEY) === "1";
  } catch (_) {
    /* stockage indisponible : une amorce par page */
  }

  function scheduleTease() {
    if (teaseDone || isEmbedded || reduceMotion) return;
    window.clearTimeout(teaseTimer);
    teaseTimer = window.setTimeout(tease, TEASE_IDLE_MS);
  }

  function tease() {
    if (teaseDone || dragging || committed || !mirrorFrameReady) return;
    if (document.visibilityState !== "visible") return;
    if (window.scrollY < window.innerHeight * TEASE_MIN_SCROLL) return;
    teaseDone = true;
    try {
      sessionStorage.setItem(TEASE_KEY, "1");
    } catch (_) {
      /* idem */
    }
    const w = window.innerWidth;
    const peek = Math.max(TEASE_MIN_PX, w * TEASE_RATIO);
    wakeMirror();
    document.body.classList.add("teasing");
    debugLog("amorce : l'autre face se dévoile");
    placeMirror(NEIGHBOR_DIRECTION * (w - peek), 650, "cubic-bezier(0.33, 1, 0.68, 1)");
    teasing = window.setTimeout(() => {
      placeMirror(NEIGHBOR_DIRECTION * window.innerWidth, 550, "cubic-bezier(0.32, 0, 0.67, 0)");
      teasing = window.setTimeout(endTease, 560);
    }, 650 + 700);
  }

  // Fin (ou interruption par un doigt / clic : le geste part du repos).
  function endTease(interrupted) {
    if (!teasing) return;
    window.clearTimeout(teasing);
    teasing = 0;
    if (interrupted) placeMirror(NEIGHBOR_DIRECTION * window.innerWidth, 0);
    document.body.classList.remove("teasing");
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
    // En mode "scan" la page ne bouge pas et personne ne lit --drag-x :
    // l'écrire sur :root à chaque touchmove forçait un recalcul de style
    // de TOUT le document (milliers de nœuds SVG) pendant le geste (v5).
    if (REVEAL !== "scan") document.documentElement.style.setProperty("--drag-x", `${clampedDx}px`);
    // iframe miroir : commence hors-champ (NEIGHBOR_DIRECTION * w) et
    // glisse vers 0 au même rythme que le doigt, sans jamais dépasser 0.
    if (mirrorFrame) {
      const restOffset = NEIGHBOR_DIRECTION * w;
      const raw = restOffset + clampedDx;
      const frameOffset = restOffset >= 0 ? Math.max(0, Math.min(restOffset, raw)) : Math.min(0, Math.max(restOffset, raw));
      placeMirror(frameOffset, 0);
    }
  }

  // Toujours une vraie navigation (servie par le prefetch). Un essai de
  // retour via history.back() + bfcache a été abandonné : la restauration
  // bfcache clignotait sur mobile.
  function goToMirrorReal() {
    const ua = navigator.userActivation ? navigator.userActivation.isActive : null;
    const flags = (ua ? FLAG_USER_ACTIVATION : 0) | (DEBUG ? FLAG_DEBUG : 0);
    // 5e champ : tick figé en millièmes (entier, le "." sert de séparateur),
    // vide si la simulation tourne. Ignoré par les versions antérieures.
    const pt = pausedTickNow();
    const payload = `${Math.round(window.scrollY)}.${langNow()}.${flags}.${window.innerHeight}.${pt === null ? "" : Math.round(pt * 1000)}`;
    debugLog(`départ: navigation (${SPEC_RULES ? "window.name" : "fragment"}) · userActivation ${ua}`);
    if (SPEC_RULES) {
      window.name = NAME_PREFIX + payload;
      window.location.href = MIRROR_URL;
    } else {
      window.location.href = `${MIRROR_URL}${PAYLOAD_PREFIX}${payload}`;
    }
  }

  // Fin d'animation qui prolonge le geste (v5). remaining = distance
  // restante (px), speed = vitesse du doigt VERS la cible au lâcher (px/ms).
  // Profil = décélération constante : y(u) = s·u − (s−1)·u² … exactement une
  // cubic-bezier(1/3, s/3, 2/3, 1) (élévation de degré d'une quadratique),
  // de pente initiale s (normalisée) et de pente finale nulle. On choisit
  // la durée pour que s = 2 (T = 2·D/v : la page part à la vitesse du doigt
  // et s'arrête pile sur la cible), bornée à [SETTLE_MIN_MS, SETTLE_MAX_MS] ;
  // si la borne s'applique, s = v·T/D garde la vitesse initiale exacte.
  // s ≤ 3 : y1 ≤ 1, la courbe ne dépasse jamais la cible ; au-delà (coup
  // très sec, peu de distance restante) on prend x1 = 1/s, y1 = 1, même
  // pente initiale et toujours sans dépassement.
  function settleCurve(remaining, speed) {
    const D = Math.max(1, remaining);
    const v = Math.max(0, speed);
    const ms = Math.round(Math.max(SETTLE_MIN_MS, Math.min(SETTLE_MAX_MS, v > 0 ? (2 * D) / v : SETTLE_MAX_MS)));
    const s = (v * ms) / D;
    const r = (n) => Math.round(n * 1000) / 1000;
    const ease = s <= 3 ? `cubic-bezier(0.333, ${r(s / 3)}, 0.667, 1)` : `cubic-bezier(${r(1 / s)}, 1, 0.667, 1)`;
    return { ms, ease };
  }

  // speed (facultatif) : vitesse du doigt vers le voisin au lâcher (px/ms).
  // Sans vitesse (lien de secours, durée imposée) : courbe d'origine.
  let settleTimer = 0;
  function settleCommitted(durationMs, speed) {
    window.clearTimeout(settleTimer);
    const w = window.innerWidth;
    let ms = durationMs || SETTLE_MS;
    let ease = null;
    if (speed != null) {
      const c = settleCurve(w - Math.max(0, progressTowardNeighbor(currentDx)), speed);
      ms = c.ms;
      ease = c.ease;
    }
    document.body.classList.add("settling");
    if (REVEAL !== "scan") document.documentElement.style.setProperty("--drag-x", `${NEIGHBOR_DIRECTION * w}px`);
    placeMirror(0, ms, ease);
    window.setTimeout(goToMirrorReal, ms);
  }

  // speed (facultatif) : vitesse du doigt vers le voisin au lâcher (px/ms) ;
  // le retour part à cette vitesse si le doigt revenait déjà en arrière.
  function settleCancelled(speed) {
    let ms = SETTLE_MS;
    let ease = null;
    const back = Math.max(0, progressTowardNeighbor(currentDx));
    if (speed != null && back > 0) {
      const c = settleCurve(back, -speed);
      ms = c.ms;
      ease = c.ease;
    }
    document.body.classList.add("settling");
    if (REVEAL !== "scan") document.documentElement.style.setProperty("--drag-x", "0px");
    placeMirror(NEIGHBOR_DIRECTION * window.innerWidth, ms, ease);
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      settleTimer = 0;
      document.body.classList.remove("settling");
    }, ms);
  }

  // Échantillons [t, dx] du geste, pour la vitesse de lâcher (v5).
  const samples = [];
  function trackSample(t, dx) {
    samples.push([t, dx]);
    // on garde un peu plus que la fenêtre de mesure
    while (samples.length > 2 && t - samples[0][0] > FLICK_WINDOW_MS * 2) samples.shift();
  }
  // Vitesse (px/ms, signe de dx) sur les FLICK_WINDOW_MS dernières ms.
  // Doigt immobile avant de lever (dernier échantillon trop ancien) : 0.
  function releaseVelocity(now) {
    const n = samples.length;
    if (n < 2) return 0;
    const [t1, x1] = samples[n - 1];
    if (now - t1 > FLICK_WINDOW_MS) return 0;
    let i = n - 2;
    while (i > 0 && t1 - samples[i - 1][0] <= FLICK_WINDOW_MS) i--;
    const [t0, x0] = samples[i];
    return t1 - t0 >= 8 ? (x1 - x0) / (t1 - t0) : 0;
  }

  // Sur les vrais éléments de texte, on laisse le navigateur gérer la
  // sélection : le drag n'y démarre pas. Les liens/boutons (mirror-hint,
  // lang-switch...), eux, PEUVENT servir de point de départ au drag —
  // seuls les champs de saisie restent exclus.
  //
  // À la souris, un vrai clic-glisser démarré sur du texte doit lancer
  // une sélection native, jamais notre swipe : FULL_TEXT_SELECTOR le
  // garantit. Au doigt, la sélection se fait par appui long (pas par un
  // simple glissement), et en layout mobile une colonne le texte occupe
  // presque tout l'écran — exclure ces éléments au toucher ne laisserait
  // quasiment plus aucune zone de départ valide pour le swipe. On se
  // contente donc d'exclure les champs de saisie au toucher, et de
  // laisser tomber notre drag en cours de route (voir updateDrag) si une
  // sélection démarre malgré tout.
  const FULL_TEXT_SELECTOR = "input, textarea, p, li, h1, h2, h3, span, strong, em, code, pre, blockquote, dt, dd, td, th";
  const TOUCH_TEXT_SELECTOR = "input, textarea";

  // Au-delà de cette distance, on considère qu'un vrai geste de drag a eu
  // lieu : le clic natif qui suivrait (sur un lien/bouton où le drag a
  // démarré) doit être annulé pour ne pas déclencher son action normale
  // en plus de la bascule de site.
  const DRAG_MOTION_PX = 8;
  let hadDragMotion = false;

  // Sur tactile, les bords de l'écran sont réservés au geste natif de
  // retour arrière (back-swipe) des navigateurs mobiles modernes : on
  // n'y démarre jamais notre propre drag, seul le centre de l'écran le
  // déclenche (c'est aussi le geste le plus naturel au pouce).
  const TOUCH_EDGE_RATIO = 0.12;

  // Sur tactile, on ne sait pas d'entrée si le geste est un swipe
  // horizontal (bascule de site), un scroll vertical, ou le début d'une
  // sélection de texte (appui long) : tant que l'intention n'est pas
  // tranchée (DIRECTION_LOCK_PX franchi dans un sens ou l'autre), on ne
  // touche à rien. La souris, elle, n'a pas cette ambiguïté : intention
  // résolue tout de suite (toujours horizontale).
  //
  // Le corps de page reste en touch-action: pan-y (cf. CSS) : le scroll
  // vertical est nativement géré par le navigateur (fluide, avec
  // inertie) dès qu'un mouvement est reconnu comme vertical — on lâche
  // alors complètement ce geste (dragging=false) sans jamais appeler
  // preventDefault dessus.
  //
  // IMPORTANT : le tactile est géré par les Touch Events natifs
  // (touchstart/touchmove/touchend), PAS par les Pointer Events. Testé
  // en conditions réelles (Chromium + émulation tactile) : avec
  // touch-action: none, les Pointer Events se font annuler par un
  // pointercancel prématuré après un seul mouvement (bug/quirk du
  // moteur constaté indépendamment de notre logique — reproduit même
  // avec des handlers vides). Repasser en touch-action: none pour
  // "simplifier" réintroduirait ce bug — ne pas y retoucher sans retest.
  // Les Touch Events reçoivent toute la séquence sans coupure, et avec
  // pan-y le scroll vertical n'a même plus besoin d'être réimplémenté à
  // la main. La souris reste sur Pointer Events (aucun souci constaté
  // là, et ça couvre aussi stylet/trackpad).
  const DIRECTION_LOCK_PX = 10;
  let startY = 0;
  let intentResolved = false;
  let activeTouchId = null;

  function beginDrag(clientX, clientY, isTouch) {
    dragging = true;
    committed = false;
    hadDragMotion = false;
    intentResolved = !isTouch; // souris : pas d'ambiguïté à lever
    startX = clientX;
    startY = clientY;
    currentDx = 0;
    samples.length = 0;
    document.body.classList.remove("settling");
  }

  // evt, si fourni, sert uniquement à preventDefault le geste natif une
  // fois confirmé horizontal — le reste ne dépend que des coordonnées.
  function updateDrag(clientX, clientY, evt) {
    if (!dragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;

    if (!intentResolved) {
      const selection = window.getSelection && window.getSelection();
      if (selection && selection.toString().length > 0) {
        // Une vraie sélection de texte a démarré (appui long) : on
        // laisse le navigateur faire, notre swipe n'a plus sa place ici.
        dragging = false;
        return;
      }
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > DIRECTION_LOCK_PX) {
        // Scroll vertical : touch-action: pan-y laisse le navigateur le
        // gérer nativement (scroll fluide, inertie) — on lâche ce geste.
        dragging = false;
        return;
      }
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > DIRECTION_LOCK_PX) {
        intentResolved = true;
        document.body.classList.add("dragging");
      } else {
        return; // pas assez de mouvement pour trancher
      }
    }

    currentDx = dx;
    trackSample(evt && evt.timeStamp ? evt.timeStamp : performance.now(), dx);
    if (Math.abs(currentDx) > DRAG_MOTION_PX) hadDragMotion = true;
    if (evt) evt.preventDefault();
    if (progressTowardNeighbor(currentDx) > 0) {
      setLayers(currentDx);
    } else {
      setLayers(0);
    }
  }

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove("dragging");
    const w = window.innerWidth;
    const progress = progressTowardNeighbor(currentDx);
    // vitesse vers le voisin au lâcher (> 0 : le doigt allait vers lui)
    const speed = progressTowardNeighbor(releaseVelocity(performance.now()));
    const flick = speed > FLICK_MIN_SPEED && progress > w * FLICK_MIN_RATIO;
    const flickBack = speed < -FLICK_MIN_SPEED;
    if (intentResolved && (flick || (progress > w * DRAG_THRESHOLD_RATIO && !flickBack))) {
      committed = true;
      settleCommitted(0, speed);
    } else {
      settleCancelled(intentResolved ? speed : null);
    }
    currentDx = 0;
  }

  function abortDrag() {
    if (!dragging) return;
    dragging = false;
    settleCancelled();
  }

  // Réveille l'iframe miroir à pleine cadence dès le premier contact
  // (avant même que l'intention horizontale soit tranchée) : hors champ,
  // elle ne dessine qu'à 6 i/s ; sans ce réveil anticipé, les premiers
  // frames révélés sous le doigt seraient en retard (proposition archipel).
  function wakeMirror() {
    if (mirrorFrame && mirrorFrame.contentWindow) {
      try {
        mirrorFrame.contentWindow.postMessage({ type: "wake" }, MIRROR_ORIGIN);
      } catch (err) {
        /* iframe pas encore navigable */
      }
    }
  }

  // --- Souris : Pointer Events ---
  function onPointerDown(e) {
    if (e.pointerType === "touch") return; // le tactile passe par les Touch Events, cf. plus haut
    armMirror();
    endTease(true);
    // Nouveau contact : le clic éventuel d'un geste précédent est passé
    // (sinon un swipe tactile, qui ne produit pas de clic, laissait le
    // drapeau levé et avalait le tap suivant, ex. sur le bouton de langue).
    hadDragMotion = false;
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest(FULL_TEXT_SELECTOR)) return; // laisser le navigateur gérer ces éléments
    wakeMirror();
    // Tant que l'iframe miroir n'a pas fini de charger (CSS + son propre JS,
    // qui remplit par ex. le texte du bouton de bascule), la faire glisser
    // à l'écran révèlerait une page à moitié initialisée — constaté comme
    // la cause du bandeau "parfois" incomplet en aperçu. On laisse
    // simplement le geste ne rien faire ce court instant plutôt que de
    // montrer un état intermédiaire.
    if (!mirrorFrameReady) return;
    pointerId = e.pointerId;
    beginDrag(e.clientX, e.clientY, false);
  }

  function onPointerMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    updateDrag(e.clientX, e.clientY, e);
    // Capture une fois le vrai geste engagé (son clic est de toute façon
    // annulé) : le relâchement hors de la fenêtre arrive quand même ici,
    // sinon le drag restait accroché au curseur. Pas dès le pointerdown :
    // la capture déplacerait la cible du clic d'un simple tap sur un bouton.
    if (hadDragMotion && !document.documentElement.hasPointerCapture(e.pointerId)) {
      try {
        document.documentElement.setPointerCapture(e.pointerId);
      } catch (err) {
        /* pointeur déjà relâché */
      }
    }
  }

  function onPointerUp(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    endDrag();
  }

  function onPointerCancel(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    abortDrag();
  }

  // --- Tactile : Touch Events ---
  function onTouchStart(e) {
    if (dragging) return; // un doigt déjà suivi
    hadDragMotion = false; // cf. onPointerDown
    armMirror();
    endTease(true);
    wakeMirror();
    if (!mirrorFrameReady) return; // cf. commentaire dans onPointerDown
    const t = e.touches[0];
    if (e.target.closest(TOUCH_TEXT_SELECTOR)) return; // laisser le navigateur gérer ces éléments
    const edge = window.innerWidth * TOUCH_EDGE_RATIO;
    if (t.clientX < edge || t.clientX > window.innerWidth - edge) return;
    activeTouchId = t.identifier;
    beginDrag(t.clientX, t.clientY, true);
  }

  function findActiveTouch(touchList) {
    for (let i = 0; i < touchList.length; i++) {
      if (touchList[i].identifier === activeTouchId) return touchList[i];
    }
    return null;
  }

  function onTouchMove(e) {
    if (!dragging) return;
    const t = findActiveTouch(e.touches);
    if (!t) return;
    updateDrag(t.clientX, t.clientY, e);
  }

  function onTouchEnd(e) {
    if (!dragging) return;
    if (findActiveTouch(e.touches)) return; // un autre doigt a levé, pas le nôtre
    endDrag();
  }

  function onTouchCancel(e) {
    if (!dragging) return;
    if (findActiveTouch(e.touches)) return;
    abortDrag();
  }

  // Le lien de secours (lien d'en-tête vers l'autre face) n'est PAS imbriqué
  // dans un étage : son href doit suivre l'étage courant en continu,
  // pas être figé une fois pour toutes sur "hero" au chargement.
  function updateFallbackLinks() {
    document.querySelectorAll("[data-mirror-link]").forEach((el) => {
      el.href = `${MIRROR_URL}#${currentFloorId}`;
    });
  }

  function createMirrorFrame() {
    if (isEmbedded) return; // pas d'aperçu récursif dans un aperçu
    const iframe = document.createElement("iframe");
    iframe.id = "mirror-frame";
    iframe.src = `${MIRROR_URL}?embedded=1`;
    iframe.setAttribute("aria-hidden", "true");
    iframe.title = "Aperçu de l’autre face du site";
    iframe.tabIndex = -1;
    // Largeur/hauteur en px exacts (pas 100vw/100vh en CSS) : sur mobile,
    // 100vw ne correspond pas toujours pixel pour pixel à window.innerWidth
    // (utilisé ci-dessous et dans setLayers pour le calcul du transform) —
    // l'écart, même sub-pixel, laissait un filet de la couleur du site
    // cible visible sur un bord.
    iframe.style.width = `${window.innerWidth}px`;
    iframe.style.height = `${window.innerHeight}px`;
    iframe.addEventListener("load", () => {
      if (!mirrorFrameReady && window.scrollY > 0) scheduleTease();
      mirrorFrameReady = true;
      syncMirrorFrameScroll();
    });
    mirrorFrame = iframe;
    if (REVEAL === "scan") {
      mirrorWindow = document.createElement("div");
      mirrorWindow.id = "mirror-window";
      mirrorWindow.setAttribute("aria-hidden", "true");
      mirrorWindow.style.width = `${window.innerWidth}px`;
      mirrorWindow.style.height = `${window.innerHeight}px`;
      mirrorWindow.appendChild(iframe);
      scanLine = document.createElement("div");
      scanLine.id = "scan-line";
      scanLine.className = NEIGHBOR_DIRECTION > 0 ? "from-right" : "from-left";
      scanLine.setAttribute("aria-hidden", "true");
      scanLine.innerHTML = '<span class="scan-tab"></span>';
      document.body.appendChild(mirrorWindow);
      document.body.appendChild(scanLine);
    } else {
      document.body.appendChild(iframe);
    }
    placeMirror(NEIGHBOR_DIRECTION * window.innerWidth, 0);
    // La barre d'adresse mobile qui se replie/réapparaît change
    // innerHeight : l'iframe doit suivre, sinon elle ne couvre plus tout
    // l'écran (ou déborde) au moment de la bascule.
    window.addEventListener("resize", () => {
      iframe.style.width = `${window.innerWidth}px`;
      iframe.style.height = `${window.innerHeight}px`;
      if (mirrorWindow) {
        mirrorWindow.style.width = `${window.innerWidth}px`;
        mirrorWindow.style.height = `${window.innerHeight}px`;
      }
      if (!dragging && !committed) placeMirror(NEIGHBOR_DIRECTION * window.innerWidth, 0);
      syncMirrorFrameScroll();
    });
  }

  // --- Aperçu miroir chargé à la première intention ---------------------
  // L'iframe (une deuxième page complète, deux contextes WebGL, ~120 Mo)
  // et le préchargement de l'autre face ne servent qu'à qui va glisser.
  // Les créer dès l'ouverture doublait le poids de chaque visite et
  // disputait le processeur au démarrage de la page. On attend donc un
  // premier signe d'activité : doigt posé, défilement, molette, clavier,
  // souris qui bouge, focus ou survol du lien vers l'autre face. Le
  // défilement de lecture précède presque toujours le premier swipe :
  // l'aperçu a le temps d'être prêt (cf. mirrorFrameReady).
  // Filet : ARM_IDLE_MS après le chargement sans aucune interaction (un
  // visiteur qui lit l'accueil puis glisse directement).
  // Data saver ou réseau très lent : seulement sur un geste explicite
  // (doigt posé, clic, lien) ; le tout premier geste peut alors ne rien
  // faire, le temps que l'aperçu charge.
  const ARM_IDLE_MS = 5000;
  const ARM_EVENTS = ["scroll", "wheel", "keydown", "mousemove", "focusin"];
  let mirrorArmed = false;
  let armTimer = 0;

  function frugalNetwork() {
    const c = navigator.connection;
    return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || "")));
  }

  function armMirror() {
    if (mirrorArmed || isEmbedded || reduceMotion) return;
    mirrorArmed = true;
    window.clearTimeout(armTimer);
    for (const t of ARM_EVENTS) window.removeEventListener(t, onArmEvent, true);
    debugLog("aperçu miroir : création (première intention)");
    addPrefetchRule();
    createMirrorFrame();
  }

  let firstMouse = null;
  function onArmEvent(e) {
    // focus/survol : seulement le lien vers l'autre face (intention claire)
    if (e.type === "focusin" && !e.target.closest("[data-mirror-link]")) return;
    if (e.type === "mousemove") {
      if (frugalNetwork() && !e.target.closest("[data-mirror-link]")) return;
      // Chrome émet un mousemove synthétique au chargement, sous un curseur
      // immobile : seul un vrai déplacement compte.
      if (!firstMouse) {
        firstMouse = [e.screenX, e.screenY];
        return;
      }
      if (Math.abs(e.screenX - firstMouse[0]) + Math.abs(e.screenY - firstMouse[1]) < 8) return;
    }
    armMirror();
  }

  function scheduleArm(arrival) {
    // Arrivée par swipe : le visiteur sait glisser, il reviendra sans doute.
    if (arrival) {
      teaseDone = true; // le visiteur connaît déjà le geste
      return armMirror();
    }
    if (frugalNetwork()) {
      // seuls les gestes explicites (pointerdown/touchstart) et le lien arment
      window.addEventListener("focusin", onArmEvent, true);
      window.addEventListener("mousemove", onArmEvent, true);
      return;
    }
    for (const t of ARM_EVENTS) window.addEventListener(t, onArmEvent, { capture: true, passive: true });
    const idle = () => {
      armTimer = window.setTimeout(armMirror, ARM_IDLE_MS);
    };
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
  }

  function listenForSync() {
    window.addEventListener("message", (e) => {
      if (e.origin !== MIRROR_ORIGIN) return;
      const data = e.data;
      if (!data) return;
      if (data.type === "mirror-ready" && e.source === (mirrorFrame && mirrorFrame.contentWindow)) {
        // premier rendu complet de l'iframe (contenu + simulation) : le
        // drag est permis sans attendre l'événement load
        if (!mirrorFrameReady) {
          mirrorFrameReady = true;
          syncMirrorFrameScroll();
          // arrêt de défilement survenu avant que l'aperçu soit prêt
          if (window.scrollY > 0) scheduleTease();
        }
        return;
      }
      // seul le parent (page qui affiche cet aperçu) pilote l'iframe
      if (data.type !== "sync-scroll" || e.source !== window.parent) return;
      syncIncomingLang(data.lang);
      syncIncomingPause(data.pausedT);
      if (typeof data.vh === "number" && data.vh > 0) {
        document.documentElement.style.setProperty("--vh", `${data.vh}px`);
      }
      const max = document.documentElement.scrollHeight;
      if (typeof data.scrollY === "number") window.scrollTo(0, Math.min(data.scrollY, max));
    });
  }

  // Arrivée par swipe : lecture SYNCHRONE du payload (fragment d'URL),
  // pendant le parsing, avant le tout premier rendu. La page n'est plus
  // jamais masquée (visibility:hidden) : le premier frame peint est
  // directement le bon contenu, à la bonne position. Masquer retardait le
  // premier rendu de contenu, ce qui laissait voir le fond vide — en
  // particulier sur Chrome Android, où le "paint holding" cross-origin
  // (qui garderait l'ancienne page affichée) est désactivé par défaut.
  let arrivalScrollY = null;

  function readArrivalPayload() {
    let raw = null;
    let via = "";
    if (location.hash.startsWith(PAYLOAD_PREFIX)) {
      raw = location.hash.slice(PAYLOAD_PREFIX.length);
      via = "fragment";
      history.replaceState(history.state, "", location.pathname + location.search);
    }
    if (window.name.startsWith(NAME_PREFIX)) {
      if (!raw) {
        raw = window.name.slice(NAME_PREFIX.length);
        via = "window.name";
      }
      window.name = ""; // sinon resterait attaché à l'onglet (rechargement, autres navigations)
    }
    if (!raw) return null;
    const [y, lang, flags, vh, pt] = raw.split(".");
    const f = Number(flags) || 0;
    return {
      scrollY: Number(y) || 0,
      lang: lang || "",
      ua: (f & FLAG_USER_ACTIVATION) !== 0,
      debug: (f & FLAG_DEBUG) !== 0,
      innerHeight: Number(vh) || null,
      pausedT: pt ? Number(pt) / 1000 : null,
      via,
    };
  }

  function applyArrivalScroll() {
    if (arrivalScrollY === null) return;
    window.scrollTo(0, Math.min(arrivalScrollY, document.documentElement.scrollHeight));
  }

  function handleArrival(arrival) {
    if (!arrival) return;
    syncIncomingLang(arrival.lang);
    syncIncomingPause(arrival.pausedT);
    arrivalScrollY = arrival.scrollY;
    applyArrivalScroll();
  }

  // Remet les calques dans l'état "page normale", sans animation. Appelé
  // au pageshow d'une restauration bfcache (bouton Retour du navigateur),
  // avant le premier rendu de la page restaurée — JAMAIS au pagehide : le navigateur peut encore peindre
  // un frame de la page de départ après le pagehide — la remettre en état
  // "normal" à ce moment-là faisait réapparaître le départ en flash juste
  // avant l'arrivée.
  function resetLayersInstant() {
    dragging = false;
    committed = false;
    document.body.classList.remove("settling", "dragging");
    document.body.classList.add("no-anim");
    document.documentElement.style.setProperty("--drag-x", "0px");
    placeMirror(NEIGHBOR_DIRECTION * window.innerWidth, 0);
  }

  function init() {
    const arrival = isEmbedded ? null : readArrivalPayload();
    initDebug(arrival);
    floors = Array.from(document.querySelectorAll("[data-floor-id]"));
    listenForSync();
    document.addEventListener("floors-rendered", refreshFloors);
    // pause/reprise sur cette face : l'aperçu miroir suit immédiatement
    document.addEventListener("sim-pause-change", syncMirrorFrameScroll);
    handleArrival(arrival);
    onScroll();
    reportArrivalMetrics(arrival);
    // Filet de sécurité si la mise en page bouge encore d'ici le load
    // (normalement non : tout est inline, photo en data URI avec
    // width/height, polices système).
    window.addEventListener("load", applyArrivalScroll, { once: true });

    window.addEventListener("pageshow", (e) => {
      if (!e.persisted) return;
      resetLayersInstant();
      debugLog(`[${location.host}] restaurée depuis le bfcache · scrollY ${Math.round(window.scrollY)}`);
      syncMirrorFrameScroll();
      requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove("no-anim")));
    });

    // Avant le retour anticipé : en reduced-motion, le lien de secours doit
    // lui aussi suivre l'étage courant (sinon on arrivait en haut de l'autre face).
    window.addEventListener("scroll", onScroll, { passive: true });

    if (reduceMotion || isEmbedded) {
      document.body.classList.add("reduced-motion");
      return; // pas de drag élastique, seulement les liens de secours
    }

    scheduleArm(arrival);

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerCancel);
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchCancel);
    // Coupe la sélection de texte native dès le pointerdown (avant même
    // que le seuil de drag soit atteint) : sans ça, un petit mouvement
    // sur du texte déclenche une sélection avant qu'on ait pu réagir.
    document.addEventListener("selectstart", (e) => {
      if (dragging) e.preventDefault();
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

    // Le lien de secours (lien d'en-tête vers l'autre face) déclenche la même
    // animation de bascule qu'un drag mené jusqu'au bout à la main,
    // plutôt qu'un saut d'ancre natif instantané.
    document.addEventListener("click", (e) => {
      const link = e.target.closest("[data-mirror-link]");
      if (!link) return;
      e.preventDefault();
      if (committed) return; // déjà en route (double clic)
      endTease(); // la bascule repart de la position de l'amorce
      dragging = false;
      committed = true;
      // Aperçu pas encore prêt (clic juste après l'ouverture, réseau
      // économe) : rien à révéler, on part tout de suite.
      if (!mirrorFrameReady) return goToMirrorReal();
      settleCommitted(BUTTON_SETTLE_MS);
    });
  }

  // Script placé en fin de <body> : le DOM utile existe déjà, on
  // initialise tout de suite (pas d'attente de DOMContentLoaded, qui
  // laisserait au navigateur une occasion de peindre avant).
  if (document.getElementById("floors")) init();
  else document.addEventListener("DOMContentLoaded", init);
})();
