// sim-core.js — LE MÊME FICHIER sur les deux sites (Façade et Machine).
//
// Une simulation lagrangienne jouet : des traceurs advectés dans un
// écoulement 2D, étage par étage. La Façade la peint (encre sur papier),
// la Machine la montre telle qu'elle est (maillage, champ de vitesse,
// découpage du domaine entre "GPU"). Le rendu diffère, l'ÉTAT est le même.
//
// Condition de la bascule sans saut : l'aperçu iframe et la page d'arrivée
// doivent calculer EXACTEMENT les mêmes positions au même instant. D'où :
//  - temps = horloge murale, quantifiée en ticks fixes (20 Hz) depuis une
//    époque fixe ; le rendu interpole entre deux ticks ;
//  - chaque traceur a une vie finie (LIFE ticks) qui démarre à une date
//    déterminée par son index ; sa position initiale vient d'un hash seedé
//    (index, numéro de vie) — jamais Math.random() ;
//  - la position à l'instant T est donc une fonction pure de T : on
//    l'obtient soit pas à pas, soit en réintégrant depuis la naissance
//    (au plus LIFE pas) — même suite d'opérations, mêmes bits ;
//  - géométrie en coordonnées document (étages à hauteur fixe identique
//    des deux côtés), x périodique de période = largeur de viewport : la
//    page qui part et l'iframe qui arrive (décalée d'exactement une
//    largeur) montrent le même monde de part et d'autre de la couture.
//  Rien ne dépend de l'historique de scroll, du DPR, ni du débit d'images.
(function () {
  const TICK_HZ = 20;
  const DT = 1 / TICK_HZ;
  const TICK_MS = 1000 / TICK_HZ;
  const EPOCH = Date.UTC(2026, 0, 1);
  const LIFE = 110; // ticks (5,5 s)
  const K = 22; // longueur de traînée (ticks)
  const KK = K + 3; // anneau d'historique
  const BP = 760; // < BP px : mise en page mobile (= @media (max-width: 759px))
  const TAU = Math.PI * 2;
  // prefers-reduced-motion : image fixe, mais la MÊME des deux côtés.
  const FROZEN_T = 6.3e8 + 0.37;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isEmbedded = window.self !== window.top;

  // --- aléatoire seedé (entiers 32 bits, Math.imul : déterministe) ---
  function hash3(a, b, c) {
    let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b);
    h ^= Math.imul((b | 0) + 0x632be5ab, 0xc2b2ae35);
    h = (h << 13) | (h >>> 19);
    h ^= Math.imul((c | 0) ^ 0x27d4eb2f, 0x165667b1);
    h ^= h >>> 15;
    h = Math.imul(h, 0x2c1b3c6d);
    h ^= h >>> 12;
    h = Math.imul(h, 0x297a2d39);
    h ^= h >>> 15;
    return h >>> 0;
  }
  function makeRng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    // Box-Muller (une seule valeur), r() dans [0,1)
    const u = 1 - r();
    const v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
  }

  // --- horloge ---
  function tickFloat() {
    if (typeof window.__SIM_T === "number") return (window.__SIM_T - EPOCH) / TICK_MS; // hook de test
    if (reduceMotion) return FROZEN_T;
    return (performance.timeOrigin + performance.now() - EPOCH) / TICK_MS;
  }

  // --- géométrie partagée (aussi exposée au CSS via des variables) ---
  function wrapD(d, W) {
    // plus courte distance horizontale dans un domaine périodique
    if (d > W / 2) return d - W;
    if (d < -W / 2) return d + W;
    return d;
  }

  function riverX(y, g) {
    if (g.mobile) return 30 + 8 * Math.sin(y / 240 + 0.8) + 3 * Math.sin(y / 77 + 2);
    return g.W * (0.5 + 0.05 * Math.sin(y / 300 + 0.8) + 0.018 * Math.sin(y / 93 + 2));
  }
  function riverSlope(y, g) {
    if (g.mobile) return (8 / 240) * Math.cos(y / 240 + 0.8) + (3 / 77) * Math.cos(y / 77 + 2);
    return g.W * ((0.05 / 300) * Math.cos(y / 300 + 0.8) + (0.018 / 93) * Math.cos(y / 93 + 2));
  }

  function layout(W) {
    const m = W < BP;
    const L = { W, mobile: m };
    L.hero = m ? { x: W * 0.5, y: 196, r: 76 } : { x: W * 0.7, y: 440, r: 128 };
    L.src = m ? { x: W * 0.5, y: 150 } : { x: W * 0.27, y: 420 };
    L.att = m
      ? [0, 1, 2, 3, 4].map((k) => ({ x: W * (k % 2 ? 0.8 : 0.2), y: 300 + k * 205 }))
      : [
          { x: W * 0.2, y: 390 },
          { x: W * 0.5, y: 330 },
          { x: W * 0.8, y: 400 },
          { x: W * 0.33, y: 740 },
          { x: W * 0.68, y: 760 },
        ];
    L.lat = m ? { x0: W * 0.06, y0: 96, x1: W * 0.94, y1: 380 } : { x0: W * 0.54, y0: 150, x1: W * 0.94, y1: 640 };
    L.sink = m ? { x: W * 0.5, y: 290 } : { x: W * 0.5, y: 340 };
    return L;
  }

  function applyCssVars(L) {
    const s = document.documentElement.style;
    const px = (v) => `${Math.round(v * 100) / 100}px`;
    s.setProperty("--W", px(L.W));
    s.setProperty("--hero-x", px(L.hero.x));
    s.setProperty("--hero-y", px(L.hero.y));
    s.setProperty("--hero-r", px(L.hero.r));
    s.setProperty("--src-x", px(L.src.x));
    s.setProperty("--src-y", px(L.src.y));
    L.att.forEach((a, k) => {
      s.setProperty(`--a${k}x`, px(a.x));
      s.setProperty(`--a${k}y`, px(a.y));
    });
    s.setProperty("--lat-x0", px(L.lat.x0));
    s.setProperty("--lat-y0", px(L.lat.y0));
    s.setProperty("--lat-x1", px(L.lat.x1));
    s.setProperty("--lat-y1", px(L.lat.y1));
    s.setProperty("--sink-x", px(L.sink.x));
    s.setProperty("--sink-y", px(L.sink.y));
  }

  // --- écoulement de fond : fonction de courant ψ, donc ∇·u = 0 ---
  // Modes entiers en x : le champ est exactement périodique de période W.
  function makeModes(W) {
    const lam = [620, 340, 190];
    const spd = [22, 14, 8];
    const om = [0.23, 0.31, 0.43];
    const ph = [0.0, 1.7, 4.1];
    const sy = [1, -1, 1];
    return lam.map((l, j) => {
      const n = Math.max(1, Math.round((W * 0.6) / l));
      const kx = (TAU * n) / W;
      const ky = sy[j] * 0.8 * (TAU / l);
      const a = spd[j] / Math.hypot(kx, ky);
      return { n, kx, ky, a, om: om[j], ph: ph[j] };
    });
  }
  const DRIFT = 7; // px/s vers la droite (compatible avec la périodicité)

  function base(x, y, tau, g, out, amp) {
    let u = 0;
    let v = 0;
    const md = g.modes;
    for (let j = 0; j < 3; j++) {
      const m = md[j];
      const c = Math.cos(m.kx * x + m.ky * y + m.om * tau + m.ph) * m.a;
      u += c * m.ky;
      v -= c * m.kx;
    }
    out[0] = (u + DRIFT) * amp;
    out[1] = v * amp;
  }

  // --- un système de traceurs par étage ---
  const DEFS = {
    hero: {
      seed: 11,
      dens: 95,
      field(x, y, tau, g, o) {
        base(x, y, tau, g, o, 0.9);
        const A = g.L.hero;
        const dx = wrapD(x - A.x, g.W);
        const dy = y - A.y;
        const r2 = dx * dx + dy * dy;
        const R = A.r;
        const rc = R * 0.9;
        const G = (70 * ((R + 30) * (R + 30) + rc * rc)) / (R + 30);
        const k = G / (r2 + rc * rc);
        o[0] += -k * dy;
        o[1] += k * dx;
        const r = Math.sqrt(r2) + 1e-6;
        if (r < R + 10) {
          const push = (90 * (R + 10 - r)) / R;
          o[0] += (dx / r) * push;
          o[1] += (dy / r) * push;
        }
      },
      spawn(r, g, o) {
        const A = g.L.hero;
        if (r() < 0.55) {
          const a = r() * TAU;
          const rad = A.r + 10 + 2.2 * A.r * Math.sqrt(r());
          o[0] = A.x + Math.cos(a) * rad;
          o[1] = A.y + Math.sin(a) * rad;
        } else {
          o[0] = r() * g.W;
          o[1] = r() * g.H;
        }
      },
    },
    apropos: {
      seed: 23,
      dens: 72,
      field(x, y, tau, g, o) {
        base(x, y, tau, g, o, 0.6);
        const S = g.L.src;
        const dx = wrapD(x - S.x, g.W);
        const dy = y - S.y;
        const r2 = dx * dx + dy * dy;
        const r = Math.sqrt(r2) + 1e-6;
        const ur = (4200 * r) / (r2 + 900);
        o[0] += (dx / r) * ur - (dy / r) * ur * 0.3;
        o[1] += (dy / r) * ur + (dx / r) * ur * 0.3;
      },
      spawn(r, g, o) {
        const S = g.L.src;
        if (r() < 0.65) {
          o[0] = S.x + gauss(r) * 9;
          o[1] = S.y + gauss(r) * 9;
        } else {
          o[0] = r() * g.W;
          o[1] = r() * g.H;
        }
      },
    },
    experiences: {
      seed: 37,
      dens: 40,
      field(x, y, tau, g, o) {
        base(x, y, tau, g, o, 0.45);
        const w = g.mobile ? 14 : 46;
        const d = wrapD(x - riverX(y, g), g.W);
        const s = riverSlope(y, g);
        const inv = 1 / Math.sqrt(1 + s * s);
        const prof = Math.exp((-d * d) / (2 * w * w));
        const V = 75 * prof;
        o[0] += V * s * inv - d * 0.8 * (1 - 0.5 * prof) * Math.exp((-d * d) / (18 * w * w));
        o[1] += V * inv;
      },
      spawn(r, g, o) {
        const w = g.mobile ? 14 : 46;
        if (r() < 0.75) {
          const y = r() * g.H;
          o[1] = y;
          o[0] = riverX(y, g) + gauss(r) * w * 0.8;
        } else {
          o[0] = r() * g.W;
          o[1] = r() * g.H;
        }
      },
    },
    competences: {
      seed: 41,
      dens: 58,
      field(x, y, tau, g, o) {
        base(x, y, tau, g, o, 0.5);
        const sig = g.mobile ? 95 : 150;
        const as = g.L.att;
        for (let k = 0; k < as.length; k++) {
          const dx = wrapD(x - as[k].x, g.W);
          const dy = y - as[k].y;
          const r2 = dx * dx + dy * dy;
          const wgt = Math.exp(-r2 / (2 * sig * sig));
          if (wgt < 1e-3) continue;
          const G = (k % 2 ? -1 : 1) * 5333;
          const kk = G / (r2 + 400);
          const r = Math.sqrt(r2) + 20;
          o[0] += wgt * (-kk * dy - (18 * dx) / r);
          o[1] += wgt * (kk * dx - (18 * dy) / r);
        }
      },
      spawn(r, g, o) {
        if (r() < 0.5) {
          const a = g.L.att[Math.floor(r() * g.L.att.length)];
          const sig = g.mobile ? 76 : 120;
          o[0] = a.x + gauss(r) * sig;
          o[1] = a.y + gauss(r) * sig;
        } else {
          o[0] = r() * g.W;
          o[1] = r() * g.H;
        }
      },
    },
    formation: {
      seed: 53,
      lattice: true,
      field(x, y, tau, g, o) {
        base(x, y, tau, g, o, 0.8);
      },
      spawn(r, g, o, i) {
        const Z = g.lat;
        const col = i % Z.nx;
        const row = Math.floor(i / Z.nx);
        o[0] = Z.x0 + (col + 0.5) * Z.sx + (r() - 0.5);
        o[1] = Z.y0 + (row + 0.5) * Z.sy + (r() - 0.5);
      },
    },
    contact: {
      seed: 67,
      dens: 62,
      field(x, y, tau, g, o) {
        base(x, y, tau, g, o, 0.5);
        const C = g.L.sink;
        const dx = wrapD(x - C.x, g.W);
        const dy = y - C.y;
        const r2 = dx * dx + dy * dy;
        const r = Math.sqrt(r2) + 1e-6;
        const ur = (-3600 * r) / (r2 + 576);
        o[0] += (dx / r) * ur + (dy / r) * ur * 0.6;
        o[1] += (dy / r) * ur - (dx / r) * ur * 0.6;
      },
      spawn(r, g, o) {
        if (r() < 0.3) {
          const a = r() * TAU;
          const rad = (g.mobile ? 0.45 : 0.3) * g.W * (0.8 + 0.4 * r());
          o[0] = g.L.sink.x + Math.cos(a) * rad;
          o[1] = g.L.sink.y + Math.sin(a) * rad * 0.8;
        } else {
          o[0] = r() * g.W;
          o[1] = r() * g.H;
        }
      },
    },
  };

  function makeSystem(id, el, W, L, modes) {
    const def = DEFS[id];
    if (!def) return null;
    const H = el.offsetHeight;
    const g = { W, H, mobile: L.mobile, L, modes, top: el.offsetTop };
    let N;
    if (def.lattice) {
      const Z = L.lat;
      const step = L.mobile ? 22 : 26;
      const nx = Math.max(1, Math.floor((Z.x1 - Z.x0) / step));
      const ny = Math.max(1, Math.floor((Z.y1 - Z.y0) / step));
      g.lat = { x0: Z.x0, y0: Z.y0, nx, ny, sx: (Z.x1 - Z.x0) / nx, sy: (Z.y1 - Z.y0) / ny };
      N = nx * ny;
    } else {
      N = Math.round((def.dens * W * H * (L.mobile ? 1.25 : 1)) / 1e5);
      N = Math.max(80, Math.min(1100, N));
    }
    const sys = {
      id,
      def,
      g,
      N,
      L: LIFE,
      KK,
      n: -1,
      hx: new Float64Array(N * KK),
      hy: new Float64Array(N * KK),
      sp: new Float64Array(N).fill(NaN),
      sx: new Float64Array(N),
      sy: new Float64Array(N),
      ph: new Float64Array(N),
    };
    for (let i = 0; i < N; i++) sys.ph[i] = hash3(def.seed, i, 7) % LIFE;
    return sys;
  }

  const tmp = [0, 0];
  const v1 = [0, 0];
  const v2 = [0, 0];

  function lifeStart(sys, i, T) {
    const ph = sys.ph[i];
    return Math.floor((T + ph) / sys.L) * sys.L - ph;
  }

  function spawn(sys, i, s) {
    const m = (s + sys.ph[i]) / sys.L;
    const r = makeRng(hash3(sys.def.seed, i, m));
    sys.def.spawn(r, sys.g, tmp, i);
    const W = sys.g.W;
    let x = tmp[0] % W;
    if (x < 0) x += W;
    const j = i * KK + (s % KK);
    sys.hx[j] = x;
    sys.hy[j] = tmp[1];
    sys.sp[i] = s;
    sys.sx[i] = x;
    sys.sy[i] = tmp[1];
  }

  // Un pas RK2 (point milieu) du tick k au tick k+1.
  function stepParticle(sys, i, k) {
    const g = sys.g;
    const f = sys.def.field;
    const a = i * KK + (k % KK);
    const b = i * KK + ((k + 1) % KK);
    const x = sys.hx[a];
    const y = sys.hy[a];
    const tau = k * DT;
    f(x, y, tau, g, v1);
    const xm = x + v1[0] * DT * 0.5;
    const ym = y + v1[1] * DT * 0.5;
    f(xm, ym, tau + DT * 0.5, g, v2);
    let nx = (x + v2[0] * DT) % g.W;
    if (nx < 0) nx += g.W;
    sys.hx[b] = nx;
    sys.hy[b] = y + v2[1] * DT;
  }

  function fullCompute(sys, T) {
    for (let i = 0; i < sys.N; i++) {
      const s = lifeStart(sys, i, T);
      spawn(sys, i, s);
      for (let k = s; k < T; k++) stepParticle(sys, i, k);
    }
    sys.n = T;
  }

  function stepAll(sys) {
    const T = sys.n + 1;
    for (let i = 0; i < sys.N; i++) {
      const s = lifeStart(sys, i, T);
      if (s !== sys.sp[i]) spawn(sys, i, s);
      else stepParticle(sys, i, T - 1);
    }
    sys.n = T;
  }

  function ensure(sys, T) {
    if (sys.n === T) return;
    if (sys.n < 0 || T < sys.n || T - sys.n >= sys.L) fullCompute(sys, T);
    else while (sys.n < T) stepAll(sys);
  }

  // --- état global, canvas et boucle ---
  const SIM = {
    TICK_HZ,
    DT,
    LIFE,
    K,
    KK,
    BP,
    wrapD,
    riverX,
    base,
    hash3,
    makeRng,
    systems: [],
    layout: null,
    view: { scrollY: 0, vh: 0, W: 0, tf: 0, n0: 0, frac: 0, dpr: 1, visible: [] },
    embedded: isEmbedded,
    reduceMotion,
  };
  window.SIM = SIM;

  let canvas = null;
  let ctx = null;
  let running = false;
  let onScreen = true; // iframe miroir : ralentie tant qu'elle est hors champ (cf. frame)
  let rafId = 0;
  let lastKey = "";

  function build() {
    const W = window.innerWidth;
    const L = layout(W);
    SIM.layout = L;
    applyCssVars(L);
    const modes = makeModes(W);
    SIM.systems = Array.from(document.querySelectorAll("section.floor[data-floor-id]"))
      .map((el) => makeSystem(el.dataset.floorId, el, W, L, modes))
      .filter(Boolean);
    lastKey = "";
    if (window.RENDER && RENDER.layout) RENDER.layout(SIM);
  }

  function sizeCanvas() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, W < BP ? 1.5 : 1.75);
    SIM.view.dpr = dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    lastKey = "";
  }

  // Iframe miroir hors champ : on continue à dessiner, mais au ralenti
  // (HIDDEN_FPS). Arrêter complètement la boucle a été essayé : Chrome
  // cesse alors de présenter l'iframe cross-site, qui glisse VIDE à
  // l'écran pendant plusieurs centaines de ms avant de se repeindre.
  const HIDDEN_FPS = 6;
  let lastHiddenDraw = 0;
  function frame(ts) {
    rafId = 0;
    if (!running) return;
    if (onScreen) draw();
    else if (ts - lastHiddenDraw > 1000 / HIDDEN_FPS) {
      lastHiddenDraw = ts;
      draw();
    }
    schedule();
  }

  function schedule() {
    if (rafId || !running) return;
    rafId = requestAnimationFrame(frame);
  }

  function draw() {
    const v = SIM.view;
    v.W = window.innerWidth;
    v.vh = window.innerHeight;
    v.scrollY = window.scrollY;
    v.tf = tickFloat();
    v.n0 = Math.floor(v.tf);
    v.frac = v.tf - v.n0;
    // image fixe (mouvement réduit) : ne redessiner que si la vue change
    const key = `${v.n0}|${v.scrollY}|${v.vh}|${v.W}|${SIM.renderKey || ""}`;
    if ((reduceMotion || typeof window.__SIM_T === "number") && key === lastKey) return;
    lastKey = key;
    const top = v.scrollY - 160;
    const bot = v.scrollY + v.vh + 160;
    v.visible.length = 0;
    for (const sys of SIM.systems) {
      if (sys.g.top + sys.g.H < top || sys.g.top > bot) continue;
      ensure(sys, v.n0 + 1);
      v.visible.push(sys);
    }
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    if (window.RENDER) RENDER.frame(ctx, SIM);
  }
  SIM.redraw = function () {
    lastKey = "";
    if (ctx) draw();
  };

  SIM.start = function () {
    canvas = document.getElementById("sim");
    if (!canvas) return;
    ctx = canvas.getContext("2d", { alpha: false });
    build();
    sizeCanvas();
    running = true;
    draw(); // premier rendu SYNCHRONE : présent dès le premier frame peint
    if (isEmbedded && "IntersectionObserver" in window) {
      onScreen = true;
      new IntersectionObserver((entries) => {
        const vis = entries[entries.length - 1].isIntersecting;
        if (vis && !onScreen) {
          onScreen = true;
          draw();
        } else if (!vis) {
          onScreen = false;
        }
      }).observe(canvas);
    }
    schedule();
    let lastW = window.innerWidth;
    window.addEventListener("resize", () => {
      if (window.innerWidth !== lastW) {
        lastW = window.innerWidth;
        build();
      }
      sizeCanvas();
      draw();
    });
    document.addEventListener("floors-rendered", () => {
      // changement de langue : nouveaux nœuds, même géométrie
      if (window.RENDER && RENDER.layout) RENDER.layout(SIM);
      SIM.redraw();
    });
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) SIM.redraw();
    });
  };
})();
