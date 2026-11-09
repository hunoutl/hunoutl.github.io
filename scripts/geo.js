// geo.js — LE MÊME FICHIER sur les deux sites (Façade et Machine).
//
// Une seule géographie : étages (hauteurs fixes par mode), archipels (une
// île principale par époque, ses îlots autour), villes (rues, îlots bâtis,
// monuments), navire en coupe, nuages de l'ouverture, route du voilier
// jusqu'au quai. La Façade la dessine à l'encre ; la Machine en montre le
// squelette (tracés, points de contrôle, boîtes). La radiographie (bascule
// "scan") révèle donc l'autre face au pixel près, au même endroit.
//
// Tout est fonction de la seule largeur W (identique dans l'iframe miroir
// et sur la page d'arrivée), jamais de la hauteur de fenêtre.
(function () {
  const BP = 760;
  const TAU = Math.PI * 2;

  // hour : 0 midi → 6 aube, 7 aube claire (la journée à l'envers).
  const FLOORS = [
    { id: "hero", d: 1500, m: 1500, hour: 0 },
    { id: "vents", d: 1050, m: 1450, hour: 0.25 },
    { id: "aujourdhui", d: 1100, m: 1380, hour: 1 },
    { id: "dalia", d: 1050, m: 1320, hour: 2 },
    { id: "jeanzay", d: 1350, m: 1700, hour: 3 },
    { id: "atos", d: 1000, m: 1280, hour: 4 },
    { id: "spascia", d: 980, m: 1250, hour: 5 },
    { id: "origines", d: 1100, m: 1450, hour: 6 },
    { id: "contact", d: 900, m: 1050, hour: 7 },
  ];
  const IDS = FLOORS.map((f) => f.id);

  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Côte : ellipse déformée par quelques harmoniques seedées. On garde
  // aussi les points de contrôle (la Machine les dessine).
  function blob(cx, cy, rx, ry, seed, rough, n) {
    const r = rng(seed);
    n = n || 40;
    rough = rough == null ? 0.16 : rough;
    const H = [];
    for (let h = 2; h <= 6; h++) H.push([h, (rough * (0.35 + r())) / Math.pow(h, 0.85), r() * TAU]);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      let k = 1;
      for (const [h, A, ph] of H) k += A * Math.cos(h * a + ph);
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return pts;
  }
  // Catmull-Rom → Béziers cubiques ; ctrl reçoit les poignées.
  function pathD(p, open, ctrl) {
    const n = p.length;
    const f = (v) => Math.round(v * 10) / 10;
    let d = `M${f(p[0][0])} ${f(p[0][1])}`;
    const last = open ? n - 1 : n;
    for (let i = 0; i < last; i++) {
      const p0 = p[open ? Math.max(i - 1, 0) : (i - 1 + n) % n];
      const p1 = p[i];
      const p2 = p[open ? i + 1 : (i + 1) % n];
      const p3 = p[open ? Math.min(i + 2, n - 1) : (i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      if (ctrl) ctrl.push([p1, c1, c2, p2]);
      d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
    }
    return open ? d : d + "Z";
  }
  function inside(pts, x, y) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function scatter(pts, n, seed, minD, test) {
    const r = rng(seed);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y] of pts) {
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    const out = [];
    let tries = 0;
    let d = minD;
    while (out.length < n && tries < 40000) {
      tries++;
      if (tries % 4000 === 0) d *= 0.9;
      const x = x0 + r() * (x1 - x0);
      const y = y0 + r() * (y1 - y0);
      if (!inside(pts, x, y) || (test && !test(x, y))) continue;
      let ok = true;
      for (const q of out) if ((q[0] - x) ** 2 + (q[1] - y) ** 2 < d * d) { ok = false; break; }
      if (ok) out.push([x, y]);
    }
    return out;
  }
  function shrink(pts, cx, cy, k) {
    return pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
  }

  // Ville : îlots bâtis sur une grille de rues orientée, dans la côte
  // rétrécie, hors des zones réservées (monuments). Rues = la grille.
  function city(o, sp, ang, keep, avoid) {
    const core = shrink(o.pts, o.x, o.y, keep);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const R = Math.max(o.rx, o.ry) * 1.2;
    const blocks = [];
    for (let i = -Math.ceil(R / sp); i <= R / sp; i++)
      for (let j = -Math.ceil(R / sp); j <= R / sp; j++) {
        const u = (i + 0.5) * sp, v = (j + 0.5) * sp;
        const x = o.x + u * ca - v * sa;
        const y = o.y + u * sa + v * ca;
        if (!inside(core, x, y)) continue;
        if (avoid && avoid.some((a) => (a.length === 4 ? Math.abs(x - a[0]) < a[2] && Math.abs(y - a[1]) < a[3] : Math.hypot(x - a[0], y - a[1]) < a[2]))) continue;
        if (i === 0 || j === 0) continue; // deux avenues qui se croisent au centre
        // quartier : place centrale, parcs, îlots denses, lotissements
        const q = (Math.imul((Math.floor(i / 3) + 50) * 73856093 ^ (Math.floor(j / 3) + 50) * 19349663, 2654435761) >>> 0) % 100;
        const type = Math.abs(i) <= 1 && Math.abs(j) <= 1 ? "plaza" : q < 14 ? "park" : q < 40 ? "dense" : "res";
        blocks.push([x, y, i, j, type]);
      }
    return { sp, ang, blocks, core };
  }

  function layout(W) {
    const m = W < BP;
    const L = { W, m, floors: [], byId: {}, isles: [], annex: [], cards: {}, marks: {} };
    let y = 0;
    for (const f of FLOORS) {
      const fl = { id: f.id, top: y, h: m ? f.m : f.d, hour: f.hour };
      L.floors.push(fl);
      L.byId[f.id] = fl;
      y += fl.h;
    }
    L.docH = y;
    const T = (id) => L.byId[id].top;
    const S = m ? 1 : Math.min(1.12, Math.max(0.8, W / 1440));
    const isle = (floor, kind, x, yy, rx, ry, seed, rough) => {
      const o = { floor, kind, x, y: yy, rx, ry, seed, pts: blob(x, yy, rx, ry, seed, rough) };
      L.isles.push(o);
      return o;
    };
    // îlot de l'archipel : posé contre l'île principale, à l'angle donné
    const islet = (floor, key, main, ang, r, seed) => {
      const d = Math.max(main.rx, main.ry) * 0 + Math.hypot(Math.cos(ang) * main.rx, Math.sin(ang) * main.ry) * 1.18 + r * 1.25;
      const x = main.x + Math.cos(ang) * d;
      const yy = main.y + Math.sin(ang) * d;
      const o = { floor, key, x, y: yy, r, rx: r, ry: r * 0.8, pts: blob(x, yy, r, r * 0.8, seed, 0.2, 28), to: main };
      L.annex.push(o);
      return o;
    };
    const card = (id, x, yy, w) => (L.cards[id] = { x, y: yy, w });
    const pad = m ? 16 : Math.max(40, W * 0.06);
    const colW = m ? W - 32 : Math.min(470, W * 0.36);
    const leftX = pad;
    const rightX = W - pad - colW;

    // Ouverture : la caméra monte à travers les nuages. Le changement
    // d'angle (perspective → carte) a lieu pendant que les nuages couvrent
    // l'écran (fenêtre [c0, c1] du scroll).
    L.cam = m ? { f: 0.98 * W, yh: 470, phi0: 0.16, c0: 250, c1: 430, end: 700 } : { f: 0.55 * W, yh: 500, phi0: 0.14, c0: 260, c1: 450, end: 760 };
    L.READ = m ? 520 : 560; // repère de lecture du voilier (constante)
    // nuages de premier plan (bouffées) : position de départ (écran), échelle, côté
    {
      const r = rng(4242);
      const cl = [];
      const n = m ? 7 : 9;
      for (let i = 0; i < n; i++) {
        const side = i % 2 ? 1 : -1;
        const x = W * (0.5 + side * (0.2 + 0.32 * r()));
        const yy = L.cam.yh + (m ? 10 : 30) + (r() - 0.5) * (m ? 90 : 110);
        const s = (m ? 52 : 90) * (0.7 + 0.6 * r());
        const puffs = [];
        const np = 5 + Math.floor(r() * 3);
        for (let k = 0; k < np; k++) puffs.push([(k / (np - 1) - 0.5) * 2 * s * 0.9, -Math.sin((k / (np - 1)) * Math.PI) * s * 0.42 * (0.7 + 0.5 * r()), s * (0.32 + 0.22 * r())]);
        cl.push({ x, y: yy, s, side, puffs, z: 0.6 + r() * 0.8 });
      }
      L.clouds = cl;
    }

    card("hero", m ? 16 : pad, m ? 92 : 120, m ? W - 32 : Math.min(760, W * 0.6));
    card("hero2", m ? 16 : rightX, m ? 940 : 980, colW);

    // vents → le navire en plan de coupe (compétences / stack)
    // encart (cartouche) : centre, largeur, hauteur ; le dessin est dans GEO.ship()
    L.ship = m ? { x: W * 0.5, y: 960, w: W - 32, h: 470 } : { x: W * 0.68, y: 500, w: Math.min(640, W * 0.5), h: 640 };
    card("vents", leftX, m ? 70 : 150, colW);

    // aujourd'hui : port marchand relié au nuage, îlot CFM
    {
      const id = "aujourdhui";
      const main = m ? isle(id, "aneo", W * 0.42, 600, W * 0.31, 135, 101) : isle(id, "aneo", W * 0.64, 660, 240 * S, 175 * S, 101);
      const sky = m ? isle(id, "sky", W * 0.66, 190, W * 0.24, 66, 202, 0.18) : isle(id, "sky", W * 0.78, 230, 175 * S, 80 * S, 202, 0.18);
      L.marks.whirl = m ? { x: W * 0.8, y: 400, r: 46 } : { x: W * 0.9, y: 430, r: 70 * S };
      islet(id, "cfm", main, m ? 2.3 : 2.5, m ? 30 : 46 * S, 303);
      main.city = city(main, m ? 15 : 21 * S, 0.3, 0.74, [[main.x - main.rx * 0.45, main.y + main.ry * 0.35, m ? 34 : 50]]);
      main.harbor = [main.x - main.rx * 0.55, main.y + main.ry * 0.5];
      sky.city = city(sky, m ? 13 : 18 * S, 0.3, 0.62);
      card(id, leftX, m ? 840 : 170, colW);
    }
    // dalia : l'île-volcan, îlot X-HEC
    {
      const id = "dalia";
      const v = m ? isle(id, "volcano", W * 0.52, 340, W * 0.34, 155, 404, 0.12) : isle(id, "volcano", W * 0.34, 540, 250 * S, 205 * S, 404, 0.12);
      const cr = (L.marks.crater = { x: v.x + (m ? 4 : 6), y: v.y - (m ? 10 : 16), r: m ? 48 : 76 * S });
      L.marks.lava = [0.45, 1.5, 2.55].map((a, k) => {
        const pts = [];
        for (let i = 0; i <= 10; i++) {
          const u = i / 10;
          const r = cr.r * (1.05 + u * (m ? 1.45 : 1.75));
          const aa = a + 0.22 * Math.sin(u * 5 + k * 2);
          pts.push([cr.x + Math.cos(aa) * r, cr.y + Math.sin(aa) * r * 0.9]);
        }
        return pts;
      });
      islet(id, "xhec", v, m ? 3.6 : 3.4, m ? 30 : 44 * S, 505);
      v.city = city(v, m ? 14 : 20 * S, -0.2, 0.84, [[cr.x, cr.y, cr.r * 2.5]]);
      card(id, m ? leftX : rightX, m ? 690 : 200, colW);
    }
    // jean zay : la grande île ; halle neuve (CNRS), halle ancienne (Inria)
    {
      const id = "jeanzay";
      const j = m ? isle(id, "jeanzay", W * 0.5, 450, W * 0.42, 290, 606, 0.12) : isle(id, "jeanzay", W * 0.64, 660, 330 * S, 300 * S, 606, 0.12);
      // halle neuve : 52 × 28 travées (Machine : 1456 H100, une par GPU)
      L.marks.newCity = m ? { x: j.x - W * 0.25, y: j.y - 165, w: W * 0.5, h: 112 } : { x: j.x - 175 * S, y: j.y - 180 * S, w: 350 * S, h: 150 * S };
      L.marks.oldCity = m ? { x: j.x - W * 0.13, y: j.y + 95, w: W * 0.26, h: 60 } : { x: j.x - 60 * S, y: j.y + 125 * S, w: 190 * S, h: 80 * S };
      const nc = L.marks.newCity, oc = L.marks.oldCity;
      j.city = city(j, m ? 16 : 22 * S, 0, 0.82, [
        [nc.x + nc.w / 2, nc.y + nc.h / 2, nc.w / 2 + 10, nc.h / 2 + 10],
        [oc.x + oc.w / 2, oc.y + oc.h / 2, oc.w / 2 + 10, oc.h / 2 + 10],
      ]);
      islet(id, "fidle", j, m ? -2.4 : -2.6, m ? 28 : 44 * S, 707);
      islet(id, "dlojz", j, m ? -0.6 : -0.5, m ? 26 : 40 * S, 808);
      islet(id, "panoramia", j, m ? 0.9 : 1.0, m ? 26 : 40 * S, 909);
      card(id, leftX, m ? 920 : 170, colW);
    }
    // atos : le phare et la ville-usine (tapis roulant)
    {
      const id = "atos";
      const a = m ? isle(id, "atos", W * 0.5, 300, W * 0.3, 110, 1010, 0.16) : isle(id, "atos", W * 0.3, 470, 190 * S, 140 * S, 1010, 0.16);
      L.marks.light = { x: a.x - a.rx * 0.55, y: a.y - a.ry * 0.25, R: m ? W * 0.72 : 560 * S };
      L.marks.belt = { x0: a.x - a.rx * 0.2, y0: a.y + a.ry * 0.3, x1: a.x + a.rx * 0.62, y1: a.y + a.ry * 0.3 };
      a.city = city(a, m ? 14 : 19 * S, 0.12, 0.8, [[L.marks.light.x, L.marks.light.y, m ? 30 : 44], [(L.marks.belt.x0 + L.marks.belt.x1) / 2, L.marks.belt.y0, (L.marks.belt.x1 - L.marks.belt.x0) / 2 + 14, (m ? 26 : 34)]]);
      card(id, m ? leftX : rightX, m ? 640 : 220, colW);
    }
    // spascia : le village aux 110 cabanes
    {
      const id = "spascia";
      const s = m ? isle(id, "spascia", W * 0.5, 330, W * 0.4, 150, 1111, 0.14) : isle(id, "spascia", W * 0.66, 480, 260 * S, 180 * S, 1111, 0.14);
      L.marks.cabins = scatter(shrink(s.pts, s.x, s.y, 0.78), 110, 1212, m ? 15 : 22 * S);
      card(id, leftX, m ? 640 : 220, colW);
    }
    // origines : le port d'attache, chantier naval ; îlot Montréal
    {
      const id = "origines";
      const o = m ? isle(id, "port", W * 0.46, 350, W * 0.36, 150, 1313, 0.15) : isle(id, "port", W * 0.32, 540, 270 * S, 200 * S, 1313, 0.15);
      L.marks.yard = { x: o.x + o.rx * 0.45, y: o.y + o.ry * 0.38 };
      islet(id, "ets", o, m ? -0.7 : -0.4, m ? 28 : 44 * S, 1414);
      o.city = city(o, m ? 15 : 21 * S, -0.25, 0.8, [[L.marks.yard.x, L.marks.yard.y, m ? 46 : 70]]);
      card(id, m ? leftX : rightX, m ? 650 : 230, colW);
    }
    // contact : l'embarcadère où le voilier accoste
    {
      const id = "contact";
      const c = m ? isle(id, "quay", W * 0.08, 820, W * 0.42, 170, 1515, 0.1) : isle(id, "quay", W * 0.1, 640, 300 * S, 280 * S, 1515, 0.1);
      L.marks.pier = m ? { x0: c.x + W * 0.3, y0: 700, x1: W * 0.6, y1: 560 } : { x0: c.x + 240 * S, y0: 560, x1: W * 0.44, y1: 420 };
      c.city = city(c, m ? 15 : 21 * S, 0.2, 0.7);
      card(id, m ? leftX : rightX, m ? 110 : 160, colW);
    }

    // Route du voilier : x(y) monotone ; elle se termine au bout du quai.
    const wp = [];
    const P = (id, x, yy) => wp.push([x, T(id) + yy]);
    if (m) {
      P("hero", W * 0.5, 0); P("hero", W * 0.5, 700); P("hero", W * 0.78, 1300);
      P("vents", W * 0.86, 400); P("vents", W * 0.5, 1050); P("vents", W * 0.16, 1400);
      P("aujourdhui", W * 0.12, 330); P("aujourdhui", W * 0.86, 560); P("aujourdhui", W * 0.88, 1300);
      P("dalia", W * 0.12, 250); P("dalia", W * 0.1, 520); P("dalia", W * 0.88, 640); P("dalia", W * 0.9, 1270);
      P("jeanzay", W * 0.06, 470); P("jeanzay", W * 0.5, 840); P("jeanzay", W * 0.92, 1500);
      P("atos", W * 0.88, 280); P("atos", W * 0.5, 470); P("atos", W * 0.1, 1200);
      P("spascia", W * 0.06, 330); P("spascia", W * 0.5, 540); P("spascia", W * 0.92, 1180);
      P("origines", W * 0.92, 380); P("origines", W * 0.84, 560); P("origines", W * 0.6, 1400);
      P("contact", W * 0.72, 380);
    } else {
      P("hero", W * 0.5, 0); P("hero", W * 0.5, 700); P("hero", W * 0.46, 1300);
      P("vents", W * 0.3, 950);
      P("aujourdhui", W * 0.44, 380); P("aujourdhui", W * 0.4, 900);
      P("dalia", W * 0.62, 180); P("dalia", W * 0.52, 840);
      P("jeanzay", W * 0.4, 200); P("jeanzay", W * 0.42, 1100);
      P("atos", W * 0.56, 300); P("atos", W * 0.5, 800);
      P("spascia", W * 0.44, 330); P("spascia", W * 0.42, 840);
      P("origines", W * 0.6, 380); P("origines", W * 0.52, 900);
      P("contact", W * 0.5, 260);
    }
    const pr = L.marks.pier;
    // dernière approche : on arrive le long du quai
    wp.push([pr.x1 + (m ? 16 : 22), T("contact") + pr.y1 - 4]);
    L.route = wp;
    L.dock = { x: pr.x1 + (m ? 16 : 22), y: T("contact") + pr.y1 - 4, ang: Math.atan2(pr.y1 - pr.y0, pr.x1 - pr.x0) };
    return L;
  }

  function routeX(L, y) {
    const p = L.route;
    if (y <= p[0][1]) return p[0][0];
    if (y >= p[p.length - 1][1]) return p[p.length - 1][0];
    let i = 0;
    while (i < p.length - 2 && p[i + 1][1] < y) i++;
    const p0 = p[Math.max(i - 1, 0)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(i + 2, p.length - 1)];
    const u = (y - p1[1]) / (p2[1] - p1[1]);
    const m1 = ((p2[0] - p0[0]) / (p2[1] - p0[1] || 1)) * (p2[1] - p1[1]);
    const m2 = ((p3[0] - p1[0]) / (p3[1] - p1[1] || 1)) * (p2[1] - p1[1]);
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * p1[0] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2[0] + (u3 - u2) * m2;
  }
  // Position du voilier sur la route en fonction du scroll : il accélère
  // sur la fin pour atteindre le quai quelle que soit la hauteur d'écran
  // (fonction du seul scroll, donc identique aperçu / arrivée).
  function boatY(L, s) {
    const yEnd = L.dock.y;
    const k0 = yEnd - L.READ - 700;
    let y = s + L.READ + Math.max(0, s - k0) * 1.2;
    return Math.min(y, yEnd);
  }

  function hourAt(L, y) {
    const F = L.floors;
    const c0 = F[0].top + F[0].h * 0.5;
    if (y <= c0) return F[0].hour;
    for (let i = 0; i < F.length - 1; i++) {
      const a = F[i].top + F[i].h * 0.5;
      const b = F[i + 1].top + F[i + 1].h * 0.5;
      if (y <= b) {
        const u = (y - a) / (b - a);
        return F[i].hour + (F[i + 1].hour - F[i].hour) * (u * u * (3 - 2 * u));
      }
    }
    return F[F.length - 1].hour;
  }

  // Les nuages de l'ouverture à un scroll donné : chaque nuage grossit et
  // s'écarte vers son côté (la caméra monte et les traverse). Courbe douce.
  function cloudState(L, s, out) {
    const C = L.cam;
    const u = Math.min(1, Math.max(0, s / C.end));
    const e = u * u * (3 - 2 * u);
    out.length = 0;
    for (const c of L.clouds) {
      const grow = 1 + e * e * 9 * c.z;
      const dx = c.side * L.W * 0.95 * Math.pow(Math.max(0, (u - 0.5) / 0.5), 1.6) * c.z;
      const dy = -s * 0.25 + (c.y - L.cam.yh) * e * 0.6;
      const op = u < 0.85 ? 1 : 1 - (u - 0.85) / 0.15;
      out.push({ x: c.x + dx * 1.2 + (c.x - L.W / 2) * e * 0.8, y: c.y + dy, k: grow, op: Math.max(0, op), c });
    }
    return out;
  }

  // Le navire en plan de coupe (élévation, étrave à droite), en unités u
  // dans l'encart. Chaque partie = un savoir-faire (Façade) = une couche de
  // la stack (Machine). Les coordonnées sont locales à l'encart.
  function ship(B) {
    const u = Math.min((B.w * 0.8) / 100, (B.h * 0.78) / 118);
    const ox = B.w * 0.5 - 2 * u;
    const oy = B.h * 0.5 + 36 * u;
    const P = (pts) => pts.map(([x, y]) => [ox + x * u, oy + y * u]);
    return {
      u, ox, oy,
      hull: P([[-48, -6], [-20, -7.5], [20, -8.5], [51, -10], [46, 0], [36, 8], [10, 13], [-24, 12.5], [-40, 8], [-47, 1]]),
      keel: P([[-6, 13], [8, 13], [6, 27], [-2, 27]]),
      rudder: P([[-44, 6], [-39, 6], [-40, 21], [-46, 19]]),
      tiller: P([[-43, -6], [-33, -13]]),
      cabin: P([[-26, -7], [-4, -7], [-6, -17], [-24, -17]]),
      mast: P([[8, -9], [8, -94]]),
      boom: P([[8, -16], [-38, -14]]),
      main: P([[8, -90], [8, -17], [-36, -15]]),
      jib: P([[10, -86], [49, -12], [14, -14]]),
      flags: [P([[8, -94], [19, -91], [8, -88]]), P([[8, -87], [17, -84.5], [8, -82]])],
      decks: [P([[-45, 2], [44, 2]]), ...[-26, -6, 14, 30].map((x) => P([[x, 2], [x, 11.5]]))],
      water: P([[-60, 0], [62, 0]]),
      // ancres des étiquettes : voiles, coque, barre, carré, pavillons
      parts: P([[-12, -50], [20, 6], [-41, -10], [-15, -12], [16, -90]]),
    };
  }

  window.GEO = {
    ship,
    BP, FLOORS, IDS, rng, blob, pathD, inside, scatter, shrink, layout, routeX, boatY, hourAt, cloudState,
    floorHeight(id, W) {
      const f = FLOORS.find((x) => x.id === id);
      return f ? (W < BP ? f.m : f.d) : 0;
    },
    layoutWidth() {
      return window.innerWidth;
    },
  };
})();
