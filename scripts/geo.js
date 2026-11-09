// geo.js — LA géographie commune aux deux faces (fichier IDENTIQUE dans
// facade/ et machine/). Tout ce qui est position vit ici : villes = nœuds,
// fleuve = backbone, forêts = grappes de nœuds de calcul, sommets =
// commutateurs, rose des vents = anneau all-reduce. Chaque face ne fait
// que *dessiner* ces mêmes coordonnées à sa manière : glisser d'un site à
// l'autre revient à passer une radiographie sur la carte.
//
// Déterminisme : aucune valeur ne dépend d'autre chose que de la largeur
// de mise en page (identique dans l'iframe miroir et sur la page
// d'arrivée) et de graines fixes (PRNG mulberry32). Les hauteurs d'étage
// sont des constantes px par mode.
const GEO = (function () {
  const MODE_BREAK = 1100; // >= : planches "larges" (desktop)
  const HEIGHTS = {
    w: { hero: 900, apropos: 860, competences: 1160, experiences: 3400, formation: 1080 },
    n: { hero: 1000, apropos: 1240, competences: 1900, experiences: 3800, formation: 1660 },
  };

  function layoutWidth() {
    return document.documentElement.clientWidth || window.innerWidth;
  }
  function modeFor(W) {
    return W >= MODE_BREAK ? "w" : "n";
  }
  function plateWidth(W, m) {
    return Math.round(m === "w" ? Math.min(W, 1440) : Math.min(W, 760));
  }

  // --- PRNG seedé (jamais Math.random pour un rendu visible) ---
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(n) {
    return rng(n * 2654435761)();
  }
  const r1 = (v) => Math.round(v * 10) / 10;

  // --- Courbes : Catmull-Rom → Bézier cubiques, + table d'abscisse
  // curviligne (pour les objets qui voyagent le long d'un tracé). ---
  function smooth(pts, closed) {
    const n = pts.length;
    const segs = [];
    const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      segs.push([p1, c1, c2, p2]);
    }
    let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
    for (const [, c1, c2, p2] of segs) d += `C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
    if (closed) d += "Z";
    return { d, segs, pts };
  }
  function bez(s, t) {
    const [a, b, c, d] = s, u = 1 - t;
    return [
      u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
      u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
    ];
  }
  function sampler(curve) {
    const table = [];
    let len = 0, prev = curve.segs[0][0];
    table.push([0, prev[0], prev[1]]);
    for (const s of curve.segs) {
      for (let k = 1; k <= 24; k++) {
        const p = bez(s, k / 24);
        len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
        table.push([len, p[0], p[1]]);
        prev = p;
      }
    }
    function at(f) {
      const target = Math.max(0, Math.min(1, f)) * len;
      let lo = 0, hi = table.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (table[mid][0] < target) lo = mid; else hi = mid;
      }
      const A = table[lo], B = table[hi];
      const k = B[0] === A[0] ? 0 : (target - A[0]) / (B[0] - A[0]);
      return { x: A[1] + (B[1] - A[1]) * k, y: A[2] + (B[2] - A[2]) * k, a: Math.atan2(B[2] - A[2], B[1] - A[1]) };
    }
    // fraction du tracé la plus proche d'une ordonnée donnée (tracés monotones en y)
    function fracAtY(y) {
      let best = 0, bd = Infinity;
      for (const row of table) {
        const dd = Math.abs(row[2] - y);
        if (dd < bd) { bd = dd; best = row[0]; }
      }
      return best / len;
    }
    // distance minimale d'un point au tracé (placement des décors)
    function dist(x, y) {
      let bd = Infinity;
      for (const row of table) bd = Math.min(bd, (row[1] - x) ** 2 + (row[2] - y) ** 2);
      return Math.sqrt(bd);
    }
    return { len, at, fracAtY, dist };
  }

  // ===================================================================
  // Planches
  // ===================================================================

  // I — Vue d'ensemble : l'île / le domaine du cluster.
  function hero(P, m) {
    const g = { P, m, H: HEIGHTS[m].hero };
    if (m === "w") {
      g.card = { x: Math.round(P * 0.055), y: 140, w: Math.round(Math.min(540, P * 0.4)), h: 590 };
      g.map = { x0: P * 0.475, x1: P * 0.975, y0: 40, y1: 870 };
    } else {
      g.card = { x: 16, y: 20, w: P - 32, h: 564 };
      g.map = { x0: 8, x1: P - 8, y0: 604, y1: 992 };
    }
    const { x0, x1, y0, y1 } = g.map;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + (m === "w" ? 10 : 6);
    const rx = ((x1 - x0) / 2) * 0.84, ry = ((y1 - y0) / 2) * 0.82;
    g.c = { cx, cy, rx, ry };
    const P2 = (u, v) => [cx + u * rx, cy + v * ry];
    g.P2 = P2;
    // côte : ellipse bruitée (somme de sinus à phases seedées)
    const rnd = rng(1871);
    const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
    const coast = [];
    const N = 60;
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const f = 1 + 0.07 * Math.sin(3 * t + ph[0]) + 0.05 * Math.sin(5 * t + ph[1]) + 0.035 * Math.sin(9 * t + ph[2]) + 0.02 * Math.sin(14 * t + ph[3]);
      coast.push([cx + Math.cos(t) * rx * f, cy + Math.sin(t) * ry * f]);
    }
    g.coast = smooth(coast, true);
    g.coastPts = coast;
    // fleuve : des sources (sud) au port (nord)
    g.river = smooth([P2(0.16, 0.66), P2(0.32, 0.36), P2(0.02, 0.1), P2(0.16, -0.2), P2(-0.12, -0.5), P2(-0.06, -0.97)], false);
    g.riverS = sampler(g.river);
    // villes = étages de l'atlas
    g.towns = [
      { id: "experiences", at: P2(-0.08, -0.82), kind: "port" },
      { id: "apropos", at: P2(0.16, -0.2), kind: "town" },
      { id: "competences", at: P2(-0.56, 0.02), kind: "town" },
      { id: "formation", at: P2(0.16, 0.66), kind: "source" },
    ];
    // massifs (ouest = reliefs, sud = sources)
    const rm = rng(4242);
    g.mountains = [];
    for (let i = 0; i < 8; i++) g.mountains.push({ at: P2(-0.78 + (i % 4) * 0.12 + rm() * 0.05, -0.32 + Math.floor(i / 4) * 0.5 + rm() * 0.12), s: 0.8 + rm() * 0.5 });
    for (let i = 0; i < 5; i++) g.mountains.push({ at: P2(-0.1 + i * 0.14 + rm() * 0.04, 0.8 + (i % 2) * 0.05), s: 0.7 + rm() * 0.4 });
    // forêts = grappes de nœuds
    const rf = rng(9001);
    g.forests = [
      [0.5, -0.12, 14],
      [-0.4, -0.55, 10],
      [0.52, 0.38, 9],
    ].map(([u, v, n]) => {
      const trees = [];
      const cols = Math.ceil(Math.sqrt(n * 1.4));
      for (let k = 0; k < n; k++) {
        const col = k % cols, row = Math.floor(k / cols);
        trees.push(P2(u + (col - cols / 2) * 0.075 + (rf() - 0.5) * 0.03, v + row * 0.085 + (rf() - 0.5) * 0.03));
      }
      return trees;
    });
    // routes (villes reliées) — sinueuses côté Façade, droites côté Machine
    g.roads = [
      [g.towns[0].at, g.towns[2].at],
      [g.towns[2].at, g.towns[3].at],
      [g.towns[1].at, P2(0.5, -0.12)],
    ];
    // rose des vents (en mer, coin nord-est de la carte)
    g.rose = m === "w" ? { cx: x1 - 70, cy: y0 + 74, r: 50 } : { cx: x1 - 44, cy: y0 + 40, r: 32 };
    // échelle
    g.scale = m === "w" ? { x: x0 + 20, y: y1 - 16, w: 160 } : { x: x0 + 14, y: y1 - 12, w: 110 };
    return g;
  }

  // II — La boussole / l'anneau all-reduce.
  function apropos(P, m) {
    const g = { P, m, H: HEIGHTS[m].apropos };
    if (m === "w") {
      g.rose = { cx: Math.round(P * 0.31), cy: 440, R: Math.round(Math.min(235, P * 0.165)) };
      g.card = { x: Math.round(P * 0.6), y: 210, w: Math.round(Math.min(540, P * 0.36)), h: 460 };
    } else {
      g.rose = { cx: Math.round(P / 2), cy: 270, R: Math.round(Math.min(150, P / 2 - 54)) };
      g.card = { x: 16, y: 636, w: P - 32, h: 594 };
    }
    const { cx, cy, R } = g.rose;
    // 8 pointes : cardinales longues, intercardinales courtes
    g.tips = [];
    for (let k = 0; k < 8; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 4;
      const rr = k % 2 === 0 ? R : R * 0.62;
      g.tips.push({ k, a, x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
    }
    // libellés des 4 valeurs (cardinales)
    if (m === "w") {
      const lw = 240, sw = 150, gap = R * 1.04 + 26;
      g.values = [
        { x: cx - lw / 2, y: cy - gap - 62, w: lw, h: 58, al: "c" },
        { x: cx + gap, y: cy - 34, w: sw, h: 72, al: "l" },
        { x: cx - lw / 2, y: cy + gap + 4, w: lw, h: 58, al: "c" },
        { x: cx - gap - sw, y: cy - 34, w: sw, h: 72, al: "r" },
      ];
    } else {
      const cw = (P - 40) / 2;
      g.values = [0, 1, 2, 3].map((i) => ({ x: 16 + (i % 2) * (cw + 8), y: 470 + Math.floor(i / 2) * 82, w: cw, h: 72, al: "l" }));
    }
    return g;
  }

  // III — Les reliefs / le fat-tree (k=4) : 8 provinces = 8 feuilles.
  const SKILLS = ["ai", "ml", "monitoring", "dist", "hpc", "infra", "cloud", "lang"];
  function competences(P, m) {
    const g = { P, m, H: HEIGHTS[m].competences };
    g.leaves = [];
    g.aggs = [];
    g.cores = [];
    if (m === "w") {
      g.head = { x: Math.round(P * 0.05), y: 56, w: Math.round(Math.min(560, P * 0.42)), h: 230 };
      g.side = { x: Math.round(P * 0.64), y: 56, w: Math.round(P * 0.31), h: 200 };
      const cw = Math.round(Math.min(164, (P * 0.88) / 8 - 12));
      for (let i = 0; i < 8; i++) {
        const x = P * (0.075 + (i * 0.85) / 7);
        g.leaves.push({ id: SKILLS[i], x, y: 820, card: { x: Math.round(x - cw / 2), y: 852, w: cw, h: 270 } });
        g.aggs.push({ x, y: 610 });
      }
      for (let k = 0; k < 4; k++) g.cores.push({ x: P * (0.2 + k * 0.2), y: 400 });
    } else {
      g.head = { x: 16, y: 26, w: P - 32, h: 270 };
      const top = 420, step = 160;
      const cx = Math.round(P * 0.44);
      for (let i = 0; i < 8; i++) {
        const y = top + i * step;
        g.leaves.push({ id: SKILLS[i], x: cx - 12, y, card: { x: cx, y: y - 62, w: P - cx - 14, h: 150 } });
        g.aggs.push({ x: P * 0.27, y: y + (i % 2 === 0 ? 34 : -34) });
      }
      for (let k = 0; k < 4; k++) g.cores.push({ x: P * 0.1, y: top + 40 + k * 2 * step + (k % 2 ? 40 : 0) });
      g.side = { x: 16, y: top + 8 * step - 30, w: P - 32, h: 210 };
    }
    // liens : feuille i (pod p) ↔ agg 2p, 2p+1 ; agg j ↔ cœurs {0,1} (j pair) ou {2,3}
    g.links = [];
    for (let i = 0; i < 8; i++) {
      const p = Math.floor(i / 2);
      g.links.push({ a: ["leaf", i], b: ["agg", 2 * p], tier: 0 });
      g.links.push({ a: ["leaf", i], b: ["agg", 2 * p + 1], tier: 0 });
    }
    for (let j = 0; j < 8; j++) {
      const base = j % 2 === 0 ? 0 : 2;
      g.links.push({ a: ["agg", j], b: ["core", base], tier: 1 });
      g.links.push({ a: ["agg", j], b: ["core", base + 1], tier: 1 });
    }
    g.pt = (ref) => (ref[0] === "leaf" ? g.leaves : ref[0] === "agg" ? g.aggs : g.cores)[ref[1]];
    return g;
  }

  // IV — Le fleuve / traceroute : du présent (haut) aux débuts (bas).
  // main : ville sur le fleuve principal ; sinon bras secondaire.
  const STOPS = [
    { id: "aneo", main: true, sw: 360, sn: 390, vw: 92, vn: 70 },
    { id: "cfm", main: false, sw: 190, sn: 200, vw: 0, vn: 0 },
    { id: "x", main: false, sw: 210, sn: 240, vw: 0, vn: 0 },
    { id: "minerva", main: true, sw: 360, sn: 390, vw: 96, vn: 62 },
    { id: "cnrs", main: true, sw: 480, sn: 640, vw: 100, vn: 64 },
    { id: "fidle", main: false, sw: 270, sn: 255, vw: 76, vn: 60 },
    { id: "inria", main: true, sw: 310, sn: 320, vw: 80, vn: 56 },
    { id: "atos", main: true, sw: 360, sn: 410, vw: 80, vn: 60 },
    { id: "spascia", main: true, sw: 400, sn: 460, vw: 104, vn: 80 },
  ];
  // abscisse (fraction) de la ville en mode large ; < 0.5 → carte à gauche
  const XW = { aneo: 0.43, cfm: 0.6, x: 0.6, minerva: 0.45, cnrs: 0.565, fidle: 0.415, inria: 0.585, atos: 0.425, spascia: 0.56 };
  function experiences(P, m) {
    const g = { P, m, H: HEIGHTS[m].experiences };
    g.head = m === "w" ? { x: Math.round(P * 0.05), y: 40, w: Math.round(Math.min(600, P * 0.42)), h: 220 } : { x: 16, y: 30, w: P - 32, h: 250 };
    const top = m === "w" ? 330 : 380;
    g.shoreY = m === "w" ? 236 : 300;
    const exitX = m === "w" ? P * 0.5 : P * 0.15;
    let y = top;
    g.stops = STOPS.map((s) => {
      const slot = m === "w" ? s.sw : s.sn;
      const vh = m === "w" ? s.vw : s.vn;
      const st = { id: s.id, main: s.main, slot, y0: y, vh };
      if (m === "w") {
        const fx = XW[s.id];
        st.x = P * fx;
        st.y = y + 46;
        const left = fx < 0.5;
        const cw = Math.round(Math.min(440, P * 0.3));
        st.card = { x: left ? Math.round(P * 0.05) : Math.round(P * 0.95 - cw), y: y + 10, w: cw, h: slot - 40 };
        st.side = left ? "l" : "r";
      } else {
        st.x = s.main ? P * 0.15 : P * 0.07;
        st.y = y + 40;
        const cx = Math.round(P * 0.27);
        st.card = { x: cx, y: y + 8, w: P - cx - 12, h: slot - 30 };
        st.side = "r";
      }
      // vignette : bas de la carte (texte au-dessus, réservé par padding)
      const c = st.card;
      st.vig = vh ? { x: c.x + 14, y: c.y + c.h - 12 - vh, w: c.w - 28, h: vh } : null;
      y += slot;
      return st;
    });
    // fleuve principal : du large (haut) aux débuts (bas), puis vers les sources
    const mains = g.stops.filter((s) => s.main);
    const rp = [];
    rp.push([m === "w" ? P * 0.47 : P * 0.17, g.shoreY]);
    const rj = rng(77);
    mains.forEach((s, i) => {
      rp.push([s.x, s.y]);
      const nx = mains[i + 1];
      if (nx) {
        const mx = (s.x + nx.x) / 2 + (m === "w" ? (rj() - 0.5) * P * 0.06 : (rj() - 0.5) * P * 0.03);
        rp.push([mx, (s.y + nx.y) / 2]);
      }
    });
    rp.push([exitX, g.H - 120]);
    rp.push([exitX, g.H]);
    g.river = smooth(rp, false);
    g.riverS = sampler(g.river);
    // bras secondaires : partent du fleuve, passent par les villes, y reviennent
    const byId = Object.fromEntries(g.stops.map((s) => [s.id, s]));
    const onRiver = (yy) => {
      const p = g.riverS.at(g.riverS.fracAtY(yy));
      return [p.x, p.y];
    };
    const via = (pts) => {
      const out = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        out.push([a[0] + (b[0] - a[0]) * 0.5 + (i === 1 ? (b[0] - a[0]) * 0.3 : 0), (a[1] + b[1]) / 2]);
        out.push(b);
      }
      return smooth(out, false);
    };
    g.branches = {
      delta: via([onRiver(byId.minerva.y - 16), [byId.x.x, byId.x.y], [byId.cfm.x, byId.cfm.y], onRiver(byId.aneo.y + 44)]),
      fidle: via([onRiver(byId.inria.y - 14), [byId.fidle.x, byId.fidle.y], onRiver(byId.cnrs.y + 70)]),
    };
    const bS = Object.values(g.branches).map(sampler);
    // décors du paysage (collines, bosquets, touffes) : seedés, loin de l'eau
    g.decor = [];
    const rd = rng(2024);
    const N = m === "w" ? 420 : 160;
    const x0 = m === "w" ? P * 0.34 : P * 0.015, x1 = m === "w" ? P * 0.66 : P * 0.25;
    for (let i = 0; i < N; i++) {
      const x = x0 + rd() * (x1 - x0), yy = g.shoreY + 50 + rd() * (g.H - g.shoreY - 120);
      const kind = rd();
      if (g.riverS.dist(x, yy) < (m === "w" ? 34 : 18)) continue;
      if (bS.some((s) => s.dist(x, yy) < (m === "w" ? 26 : 14))) continue;
      if (g.stops.some((s) => Math.hypot(s.x - x, s.y - yy) < 30)) continue;
      if (g.decor.some((d) => Math.hypot(d.x - x, d.y - yy) < (m === "w" ? 30 : 22))) continue;
      g.decor.push({ x, y: yy, kind: kind < 0.5 ? "tuft" : kind < 0.82 ? "tree" : "hill" });
    }
    return g;
  }

  // V — Les sources / le démarrage.
  function formation(P, m) {
    const g = { P, m, H: HEIGHTS[m].formation };
    if (m === "w") {
      g.head = { x: Math.round(P * 0.05), y: 60, w: Math.round(Math.min(520, P * 0.36)), h: 200 };
      g.src = { x: P * 0.36, y: 470 };
      g.entry = P * 0.5;
      g.insa = { x: Math.round(P * 0.05), y: 560, w: Math.round(Math.min(420, P * 0.29)), h: 190 };
      g.inset = { x: Math.round(P * 0.6), y: 90, w: Math.round(P * 0.35), h: 300 };
      g.mtl = { x: g.inset.x + g.inset.w * 0.34, y: g.inset.y + g.inset.h * 0.56 };
      g.ets = { x: g.inset.x, y: g.inset.y + g.inset.h + 18, w: g.inset.w, h: 150 };
      g.seal = { cx: P * 0.55, cy: 660, r: 64 };
      g.toeic = { x: Math.round(P * 0.55 + 84), y: 610, w: 300, h: 110 };
      g.colo = { x: Math.round(P * 0.22), y: 810, w: Math.round(P * 0.56), h: 244 };
    } else {
      g.head = { x: 16, y: 30, w: P - 32, h: 210 };
      g.src = { x: P * 0.55, y: 360 };
      g.entry = P * 0.15;
      g.insa = { x: 16, y: 450, w: P - 32, h: 200 };
      g.inset = { x: 16, y: 690, w: P - 32, h: 230 };
      g.mtl = { x: g.inset.x + g.inset.w * 0.34, y: g.inset.y + g.inset.h * 0.55 };
      g.ets = { x: 16, y: 930, w: P - 32, h: 150 };
      g.seal = { cx: 16 + 58, cy: 1150, r: 50 };
      g.toeic = { x: 16 + 124, y: 1100, w: P - 32 - 124, h: 100 };
      g.colo = { x: 16, y: 1260, w: P - 32, h: 340 };
    }
    const rj = rng(31);
    const { x, y } = g.src;
    g.river = smooth([[g.entry, 0], [g.entry + (x - g.entry) * 0.2 + (rj() - 0.5) * 30, y * 0.32], [g.entry + (x - g.entry) * 0.7, y * 0.62], [x, y]], false);
    g.riverS = sampler(g.river);
    const rm = rng(555);
    g.mountains = [];
    const n = m === "w" ? 9 : 6;
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (0.95 + (i / (n - 1)) * 1.1);
      const rr = (m === "w" ? 120 : 80) + rm() * 40;
      g.mountains.push({ at: [x + Math.cos(a) * rr * 1.5, y + Math.sin(a) * rr * 0.7 + 30], s: 0.8 + rm() * 0.6 });
    }
    // route maritime source → Montréal
    const s0 = [x + 20, y + 10];
    const s1 = [g.mtl.x, g.mtl.y];
    g.sea =
      m === "w"
        ? smooth([s0, [(s0[0] + s1[0]) / 2 + 40, Math.min(s0[1], s1[1]) - 140], s1], false)
        : smooth([s0, [P - 26, y + 40], [P - 22, g.insa.y + g.insa.h / 2], [P - 40, g.inset.y + 30], s1], false);
    return g;
  }


  // ===================================================================
  // Mouvements partagés : mêmes positions des deux côtés, au même instant.
  // t = horloge murale (ms), ctx = { sy, top, vh } (scroll). Déterministes.
  // ===================================================================
  const cache = new Map();
  function memo(key, fn) {
    if (!cache.has(key)) cache.set(key, fn());
    return cache.get(key);
  }
  const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * x);
  function polySampler(pts) {
    return sampler({ segs: pts.slice(1).map((p, i) => [pts[i], pts[i], p, p]) });
  }
  const motion = {
    // tour de l'île (navire) / tour du domaine (paquet), 48 s
    orbit(g, t) {
      const s = memo(`orbit${g.P}${g.m}`, () => {
        const k = 1.06, { cx, cy } = g.c;
        return sampler(smooth(g.coastPts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]), true));
      });
      return s.at((t % 48000) / 48000);
    },
    // fleuve : flux du point source vers le port, 9 s par trajet
    downstream(g, t, k) {
      return g.riverS.at(1 - (((t + k * 3000) % 9000) / 9000));
    },
    // aiguille : scroll + légère oscillation (horloge)
    needle(g, t, ctx) {
      const prog = Math.max(0, Math.min(1, (ctx.sy + ctx.vh * 0.5 - ctx.top) / g.H));
      return { deg: -48 + 48 * ease(prog) + 3.5 * Math.sin(t / 1400) };
    },
    // marcheurs/paquets du fat-tree : feuille → agg → cœur → agg → feuille
    walker(g, t, k) {
      const T = 5200;
      const tt = t + k * 1733;
      const slot = Math.floor(tt / T);
      const r = rng(slot * 31 + k * 7919);
      const a = Math.floor(r() * 8);
      let b = Math.floor(r() * 7);
      if (b >= a) b++;
      const pa = Math.floor(a / 2), pb = Math.floor(b / 2);
      const ag = 2 * pa + Math.floor(r() * 2);
      const core = (ag % 2 === 0 ? 0 : 2) + Math.floor(r() * 2);
      const ag2 = 2 * pb + (ag % 2);
      const route = pa === pb ? [g.leaves[a], g.aggs[ag], g.leaves[b]] : [g.leaves[a], g.aggs[ag], g.cores[core], g.aggs[ag2], g.leaves[b]];
      const s = polySampler(route.map((p) => [p.x, p.y]));
      const f = ((tt % T) / T) * 1.15;
      const p = s.at(ease(Math.min(1, f)));
      p.route = [a, b];
      return p;
    },
    // le bateau / le paquet qui remonte le fleuve avec la lecture
    reader(g, t, ctx) {
      const y = Math.max(0, Math.min(g.H, ctx.sy + ctx.vh * 0.55 - ctx.top));
      return g.riverS.at(g.riverS.fracAtY(y));
    },
    // traversée de l'Atlantique (aller-retour 16 s)
    crossing(g, t) {
      const s = memo(`sea${g.P}${g.m}`, () => sampler(g.sea));
      const f = (t % 16000) / 16000;
      const p = s.at(ease(f < 0.5 ? f * 2 : 2 - f * 2));
      p.back = f >= 0.5;
      return p;
    },
  };

  const PLATES = { hero, apropos, competences, experiences, formation };

  // Utilitaires de rendu partagés (HTML positionné en px, identique des deux côtés)
  function box(r, cls, inner, extra) {
    return `<div class="${cls}" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px${extra ? ";" + extra : ""}">${inner}</div>`;
  }
  function plate(id, svg, html) {
    const W = layoutWidth();
    const m = modeFor(W);
    const P = plateWidth(W, m);
    const H = HEIGHTS[m][id];
    return `<div class="plate plate-${m}" style="width:${P}px;height:${H}px"><svg class="plate-svg" width="${P}" height="${H}" viewBox="0 0 ${P} ${H}" aria-hidden="true">${svg}</svg>${html}</div>`;
  }
  function geom(id) {
    const W = layoutWidth();
    const m = modeFor(W);
    return PLATES[id](plateWidth(W, m), m);
  }

  return { motion, HEIGHTS, rng, hash, smooth, sampler, bez, r1, geom, plate, box, layoutWidth, modeFor, plateWidth, SKILLS };
})();
