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
  function city(o, sp, ang, keep, avoid, mix) {
    const [pk, dn] = mix || [14, 40]; // % de parcs, % d'îlots denses (v5 : par thème)
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
        const type = Math.abs(i) <= 1 && Math.abs(j) <= 1 ? "plaza" : q < pk ? "park" : q < pk + dn ? "dense" : "res";
        blocks.push([x, y, i, j, type]);
      }
    return { sp, ang, blocks, core };
  }

  function layout(W) {
    const m = W < BP;
    const L = { W, m, floors: [], byId: {}, isles: [], annex: [], cards: {}, marks: {}, mons: [], labels: {} };
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
    // Nuages de l'ouverture (v5) : trois couches de profondeur D (proche
    // ≈ 1,3, milieu ≈ 2,2, lointaine ≈ 3,6). Chaque nuage est un contour
    // festonné (bosses = cercles) posé sur une base plate ; dessiné en
    // vecteurs à chaque image (net à toute taille). Position écran au
    // repos (x0, y0), dérive lente vers l'est (v px/s, plus lente au loin).
    {
      const r = rng(4242);
      const cl = [];
      const LAY = m
        ? [{ D: 3.6, n: 5, s: 26, y: -26, dy: 34, v: 2.2 }, { D: 2.2, n: 4, s: 44, y: -96, dy: 70, v: 4 }, { D: 1.3, n: 3, s: 66, y: 46, dy: 60, v: 6.5 }]
        : [{ D: 3.6, n: 7, s: 40, y: -30, dy: 40, v: 2.5 }, { D: 2.2, n: 6, s: 70, y: -120, dy: 90, v: 4.5 }, { D: 1.3, n: 4, s: 108, y: 60, dy: 70, v: 7 }];
      LAY.forEach((ly, z) => {
        const mg = ly.s * 2.4;
        for (let i = 0; i < ly.n; i++) {
          const s = ly.s * (0.75 + 0.5 * r());
          const bumps = [];
          const nb = 4 + Math.floor(r() * 3);
          for (let k = 0; k < nb; k++) {
            const t = k / (nb - 1);
            const rr = s * (0.36 + 0.3 * Math.sin(t * Math.PI) * (0.7 + 0.6 * r()));
            bumps.push([(t - 0.5) * 2 * s * 1.05, -rr * (0.55 + 0.35 * r()), rr]);
          }
          cl.push({ z, D: ly.D * (0.93 + 0.14 * r()), x0: -mg + ((i + 0.2 + 0.6 * r()) / ly.n) * (W + 2 * mg), y0: L.cam.yh + ly.y + (r() - 0.5) * ly.dy, v: ly.v * (0.8 + 0.4 * r()), mg, s, bumps });
        }
      });
      L.clouds = cl;
    }

    card("hero", m ? 16 : pad, m ? 92 : 120, m ? W - 32 : Math.min(760, W * 0.6));
    card("hero2", m ? 16 : rightX, m ? 940 : 980, colW);

    // vents → le navire en plan de coupe (compétences / stack)
    // encart (cartouche) : centre, largeur, hauteur ; le dessin est dans GEO.ship()
    L.ship = m ? { x: W * 0.5, y: 960, w: W - 32, h: 470 } : { x: W * 0.68, y: 500, w: Math.min(640, W * 0.5), h: 640 };
    card("vents", leftX, m ? 70 : 150, colW);

    // ---- v5 : une île = un monde (thème, architecture, monuments) ----
    // Les monuments (L.mons) sont des boîtes englobantes (centre x, y ;
    // taille w × h) ; leur dessin vient de GEO.glyph(), partagé : la Façade
    // le remplit à l'encre, la Machine en trace le fil de fer et la boîte.
    const u = m ? 0.8 : S * 1.3; // échelle des monuments
    const mon = (floor, kind, x, yy, w, h, o) => {
      const q = Object.assign({ floor, kind, x, y: yy, w, h, s: u }, o);
      L.mons.push(q);
      return q;
    };
    const avoidOf = (fl) => L.mons.filter((q) => q.floor === fl && !q.free).map((q) => [q.x, q.y, q.w / 2 + 5 * u, q.h / 2 + 5 * u]);
    const inMon = (fl, pad) => (x, yy) => !L.mons.some((q) => q.floor === fl && !q.free && Math.abs(x - q.x) < q.w / 2 + pad && Math.abs(yy - q.y) < q.h / 2 + pad);
    const lab = (key, x, yy) => (L.labels[key] = [x, yy]);
    const rock = (floor, x, yy, r, seed) => isle(floor, "rock", x, yy, r, r * 0.72, seed, 0.32);
    // point de la côte dans la direction a (les points de blob() sont rangés par angle)
    const coastAt = (o, a, k) => {
      const n = o.pts.length;
      const q = o.pts[((Math.round((a / TAU) * n) % n) + n) % n];
      return [o.x + (q[0] - o.x) * k, o.y + (q[1] - o.y) * k];
    };
    // enceinte : remparts le long de la côte, tours régulières
    const rampart = (fl, o, k) => mon(fl, "rampart", o.x, o.y, o.rx * 2, o.ry * 2, { free: 1, pts: GEO.shrink(o.pts, o.x, o.y, k) });

    // aujourd'hui : la cité marchande (Aneo), la corbeille (CFM), l'île céleste (AWS)
    {
      const id = "aujourdhui";
      const main = m ? isle(id, "aneo", W * 0.42, 610, W * 0.33, 145, 101) : isle(id, "aneo", W * 0.62, 660, 280 * S, 195 * S, 101);
      const sky = m ? isle(id, "sky", W * 0.66, 190, W * 0.24, 66, 202, 0.18) : isle(id, "sky", W * 0.78, 230, 175 * S, 80 * S, 202, 0.18);
      L.marks.whirl = m ? { x: W * 0.82, y: 400, r: 44 } : { x: W * 0.92, y: 420, r: 64 * S };
      const cfm = islet(id, "cfm", main, m ? 2.3 : 2.5, m ? 32 : 50 * S, 303);
      // le port : quais vers l'est, cargos à quai, grues ; entrepôts derrière
      const hp = coastAt(main, 0.22, 0.97);
      mon(id, "port", hp[0] + 52 * u, hp[1] + 4 * u, 112 * u, 84 * u, { free: 1 });
      main.harbor = [hp[0] + 96 * u, hp[1] + 44 * u];
      mon(id, "warehouses", hp[0] - 50 * u, hp[1] - 4 * u, 74 * u, 56 * u);
      const bo = mon(id, "bourse", main.x - 18 * u, main.y - 30 * u, 150 * u, 76 * u);
      const st = mon(id, "stalls", main.x - 30 * u, main.y + 58 * u, 124 * u, 24 * u);
      mon(id, "corbeille", cfm.x, cfm.y, cfm.r * 1.25, cfm.r, { free: 1 });
      main.city = city(main, m ? 15 : 21 * S, 0.3, 0.8, avoidOf(id), [8, 46]);
      sky.city = city(sky, m ? 13 : 18 * S, 0.3, 0.62);
      lab("bourse", bo.x - 10 * u, bo.y + bo.h / 2 + 13);
      lab("stalls", st.x, st.y + st.h / 2 + 12);
      lab("harbor", hp[0] + 50 * u, hp[1] + 56 * u);
      if (m) rock(id, W * 0.1, 470, 9, 3101);
      else { rock(id, W * 0.97, 760, 16, 3101); rock(id, W * 0.5, 930, 12, 3102); rock(id, W * 0.95, 980, 10, 3103); }
      card(id, leftX, m ? 840 : 170, colW);
    }
    // dalia : la Forge, forteresse en étoile ; l'anneau des 72 forges ; X-HEC
    {
      const id = "dalia";
      const v = m ? isle(id, "volcano", W * 0.52, 345, W * 0.36, 165, 404, 0.12) : isle(id, "volcano", W * 0.34, 545, 275 * S, 218 * S, 404, 0.12);
      const cr = (L.marks.crater = { x: v.x + (m ? 4 : 6), y: v.y - (m ? 10 : 16), r: m ? 56 : 90 * S });
      // coulées canalisées : canaux presque droits, de l'anneau à la mer
      L.marks.lava = [0.45, 1.5, 2.55].map((a, k) => {
        const pts = [];
        for (let i = 0; i <= 10; i++) {
          const q = i / 10;
          const r = cr.r * (1.05 + q * (m ? 1.4 : 1.5));
          const aa = a + 0.07 * Math.sin(q * 4 + k * 2);
          pts.push([cr.x + Math.cos(aa) * r, cr.y + Math.sin(aa) * r * 0.92]);
        }
        return pts;
      });
      const xh = islet(id, "xhec", v, m ? 3.6 : 3.4, m ? 32 : 48 * S, 505);
      mon(id, "fort", cr.x, cr.y, cr.r * 3.9, cr.r * 3.9, { free: 1, r: cr.r });
      mon(id, "forges", cr.x, cr.y, cr.r * 2, cr.r * 2, { free: 1, r: cr.r * 0.86, n: 72 });
      rampart(id, v, 0.9);
      const sm = mon(id, "smithy", v.x - v.rx * 0.62, v.y - v.ry * 0.28, 66 * u, 50 * u);
      mon(id, "barracks", v.x + v.rx * 0.6, v.y - v.ry * 0.3, 64 * u, 46 * u);
      mon(id, "academy", xh.x, xh.y, xh.r * 1.3, xh.r * 1.05, { free: 1 });
      v.city = city(v, m ? 14 : 20 * S, -0.2, 0.84, avoidOf(id).concat([[cr.x, cr.y, cr.r * 2.05]]), [6, 52]);
      lab("forges", cr.x + cr.r * 1.5, cr.y - cr.r * 1.95);
      lab("smithy", sm.x, sm.y + sm.h / 2 + 12);
      if (m) rock(id, W * 0.9, 120, 10, 4101);
      else { rock(id, W * 0.07, 200, 14, 4101); rock(id, W * 0.6, 900, 15, 4102); rock(id, W * 0.06, 880, 11, 4103); }
      card(id, m ? leftX : rightX, m ? 690 : 200, colW);
    }
    // jean zay : la Capitale ; inria : l'île des savants (même archipel, plus loin dans le temps)
    {
      const id = "jeanzay";
      const j = m ? isle(id, "jeanzay", W * 0.5, 400, W * 0.42, 245, 606, 0.1) : isle(id, "jeanzay", W * 0.645, 600, 335 * S, 295 * S, 606, 0.1);
      // le grand palais : 52 × 28 travées (Machine : 1456 H100, une par GPU)
      L.marks.newCity = m ? { x: j.x - W * 0.25, y: j.y - 125, w: W * 0.5, h: 100 } : { x: j.x - 185 * S, y: j.y - 110 * S, w: 370 * S, h: 150 * S };
      const nc = L.marks.newCity;
      const pc = [nc.x + nc.w / 2, nc.y + nc.h / 2];
      mon(id, "palace", pc[0], pc[1], nc.w + 16, nc.h + 16, { box: nc });
      const ci = m ? mon(id, "citadel", j.x + j.rx * 0.5, j.y + j.ry * 0.48, 66, 66) : mon(id, "citadel", j.x + j.rx * 0.6, j.y - j.ry * 0.64, 80 * u, 80 * u);
      const d1 = mon(id, "dome", j.x - j.rx * 0.5, j.y + j.ry * 0.46, 70 * u, 58 * u);
      if (!m) mon(id, "dome", j.x + j.rx * 0.36, j.y + j.ry * 0.5, 64 * u, 54 * u);
      mon(id, "arch", pc[0], nc.y + nc.h + (m ? 34 : 46), 34 * u, 30 * u);
      rampart(id, j, 0.9);
      // avenues rayonnantes : du palais aux portes de l'enceinte
      const segs = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + 0.39;
        const p0 = [pc[0] + Math.cos(a) * nc.w * 0.36, pc[1] + Math.sin(a) * nc.h * 0.5];
        const p1 = coastAt(j, Math.atan2(Math.sin(a), Math.cos(a)), 0.9);
        segs.push([p0[0], p0[1], p1[0], p1[1]]);
      }
      mon(id, "avenues", j.x, j.y, j.rx * 2, j.ry * 2, { free: 1, segs });
      j.city = city(j, m ? 13 : 18 * S, 0, 0.84, avoidOf(id), [7, 62]);
      for (const [key, a, r, sd] of m ? [["fidle", -2.4, 28, 707], ["dlojz", -0.6, 26, 808], ["panoramia", 0.9, 26, 909]] : [["fidle", -2.6, 46 * S, 707], ["dlojz", -0.5, 42 * S, 808], ["panoramia", 1.0, 42 * S, 909]]) {
        const it = islet(id, key, j, a, r, sd);
        mon(id, "amphi", it.x, it.y, it.r * 1.25, it.r * 0.95, { free: 1 });
      }
      const ir = m ? isle(id, "inria", W * 0.42, 790, W * 0.3, 62, 616, 0.14) : isle(id, "inria", W * 0.27, 1130, 175 * S, 110 * S, 616, 0.14);
      L.marks.oldCity = { x: ir.x - ir.rx * 0.42 - ir.rx * 0.31, y: ir.y - ir.ry * 0.3 - ir.ry * 0.21, w: ir.rx * 0.62, h: ir.ry * 0.42 };
      const oc = L.marks.oldCity;
      mon(id, "labs", oc.x + oc.w / 2, oc.y + oc.h / 2, oc.w + 8, oc.h + 8, { box: oc });
      const ob = mon(id, "observatory", ir.x + ir.rx * 0.45, ir.y - ir.ry * 0.2, 46 * u, 54 * u);
      mon(id, "greenhouse", ir.x - ir.rx * 0.3, ir.y + ir.ry * 0.42, 66 * u, 32 * u);
      mon(id, "garden", ir.x + ir.rx * 0.25, ir.y + ir.ry * 0.45, ir.ry * 0.5, ir.ry * 0.5);
      lab("citadel", ci.x, ci.y + ci.h / 2 + 12);
      lab("dome", d1.x, d1.y + d1.h / 2 + 12);
      lab("observatory", ob.x + (m ? 6 : 0), ob.y - ob.h / 2 - 10);
      if (m) rock(id, W * 0.12, 700, 9, 6101);
      else { rock(id, W * 0.97, 300, 14, 6101); rock(id, W * 0.62, 1180, 16, 6102); rock(id, W * 0.53, 1240, 9, 6103); }
      card(id, leftX, m ? 920 : 170, colW);
    }
    // atos : l'île-usine, le phare, le tapis roulant du contrôle qualité
    {
      const id = "atos";
      const a = m ? isle(id, "atos", W * 0.5, 300, W * 0.32, 115, 1010, 0.16) : isle(id, "atos", W * 0.3, 480, 245 * S, 180 * S, 1010, 0.16);
      L.marks.light = { x: a.x - a.rx * 0.55, y: a.y - a.ry * 0.3, R: m ? W * 0.72 : 560 * S };
      L.marks.belt = { x0: a.x - a.rx * 0.2, y0: a.y + a.ry * 0.3, x1: a.x + a.rx * 0.62, y1: a.y + a.ry * 0.3 };
      const b = L.marks.belt;
      mon(id, "lighthouse", L.marks.light.x, L.marks.light.y + 20 * u, 30 * u, 52 * u);
      mon(id, "beltHall", (b.x0 + b.x1) / 2, b.y0, b.x1 - b.x0 + 12, 52 * u);
      const ch = mon(id, "chimneys", a.x + a.rx * 0.1, a.y - a.ry * 0.42, 74 * u, 66 * u);
      mon(id, "workshop", a.x + a.rx * 0.42, a.y - a.ry * 0.04, 84 * u, 30 * u);
      a.city = city(a, m ? 14 : 19 * S, 0.12, 0.8, avoidOf(id), [6, 50]);
      lab("chimneys", ch.x + ch.w * 0.7, ch.y - ch.h * 0.25);
      if (m) rock(id, W * 0.88, 150, 10, 1101);
      else { rock(id, W * 0.62, 260, 14, 1101); rock(id, W * 0.55, 700, 11, 1102); rock(id, W * 0.08, 760, 15, 1103); }
      card(id, m ? leftX : rightX, m ? 640 : 220, colW);
    }
    // spascia : l'île des airs, la nuit ; ballons-sondes, stations, 110 cabanes
    {
      const id = "spascia";
      const s = m ? isle(id, "spascia", W * 0.5, 330, W * 0.42, 150, 1111, 0.14) : isle(id, "spascia", W * 0.66, 480, 270 * S, 185 * S, 1111, 0.14);
      const lb = mon(id, "chemlab", s.x - s.rx * 0.36, s.y - s.ry * 0.12, 74 * u, 46 * u);
      mon(id, "station", s.x + s.rx * 0.5, s.y + s.ry * 0.25, 18 * u, 22 * u);
      mon(id, "station", s.x - s.rx * 0.1, s.y + s.ry * 0.55, 18 * u, 22 * u);
      mon(id, "mast", s.x + s.rx * 0.18, s.y - s.ry * 0.5, 16 * u, 64 * u);
      mon(id, "mast", s.x - s.rx * 0.7, s.y + s.ry * 0.2, 16 * u, 52 * u);
      L.marks.anemos = [[s.x + s.rx * 0.62, s.y - s.ry * 0.28], [s.x - s.rx * 0.32, s.y + s.ry * 0.42]].map(([x, yy]) => {
        mon(id, "anemo", x, yy - 10 * u, 22 * u, 44 * u);
        return { x, y: yy - 30 * u, r: 9 * u };
      });
      // ballons-sondes : ancrés sur l'île, ils flottent au-dessus (animés)
      const rb = rng(1777);
      L.marks.balloons = [[0.05, -0.35, -10, -78], [0.45, 0.05, 30, -70], [-0.55, -0.4, -24, -66], [-0.2, 0.3, 14, -84], [0.75, -0.55, 40, -60]].slice(0, m ? 4 : 5).map(([ax, ay, dx, dy]) => {
        const x = s.x + ax * s.rx, yy = s.y + ay * s.ry;
        return { ax: x, ay: yy, x: x + dx * u, y: yy + dy * u, r: (m ? 9 : 13) * (0.85 + 0.3 * rb()), ph: rb() * TAU };
      });
      L.marks.cabins = scatter(shrink(s.pts, s.x, s.y, 0.8), 110, 1212, m ? 14 : 20 * S, inMon(id, m ? 5 : 8));
      L.marks.lanterns = L.marks.cabins.filter((_, i) => i % 9 === 4);
      lab("chemlab", lb.x, lb.y + lb.h / 2 + 12);
      if (m) rock(id, W * 0.12, 120, 9, 1201);
      else { rock(id, W * 0.97, 250, 13, 1201); rock(id, W * 0.94, 780, 16, 1202); rock(id, W * 0.4, 820, 10, 1203); }
      card(id, leftX, m ? 640 : 220, colW);
    }
    // origines : le chantier naval dans la forêt ; îlot Montréal
    {
      const id = "origines";
      const o = m ? isle(id, "port", W * 0.46, 350, W * 0.38, 158, 1313, 0.15) : isle(id, "port", W * 0.32, 545, 285 * S, 205 * S, 1313, 0.15);
      const ya = 0.55;
      const yp = coastAt(o, ya, 0.92);
      L.marks.yard = { x: yp[0], y: yp[1], a: Math.atan2(Math.sin(ya) * o.ry, Math.cos(ya) * o.rx) };
      mon(id, "slipway", yp[0] + Math.cos(L.marks.yard.a) * 16 * u, yp[1] + Math.sin(L.marks.yard.a) * 16 * u, 120 * u, 120 * u, { a: L.marks.yard.a, free: 1 });
      islet(id, "ets", o, m ? -0.7 : -0.4, m ? 28 : 44 * S, 1414);
      const sw = mon(id, "sawmill", o.x + o.rx * 0.05, o.y + o.ry * 0.48, 70 * u, 44 * u);
      mon(id, "logs", L.marks.yard.x - 64 * u, L.marks.yard.y - 30 * u, 44 * u, 26 * u);
      mon(id, "logs", o.x - o.rx * 0.18, o.y + o.ry * 0.62, 36 * u, 22 * u);
      // ruisseau qui fait tourner la roue de la scierie, jusqu'à la mer
      const rv = [];
      for (let i = 0; i <= 8; i++) {
        const q = i / 8;
        rv.push([o.x - o.rx * 0.25 + q * o.rx * 0.32 + Math.sin(q * 6) * 8 * u, o.y - o.ry * 0.1 + q * o.ry * 1.05]);
      }
      mon(id, "river", o.x, o.y, o.rx * 2, o.ry * 2, { free: 1, pts: rv });
      o.city = city(o, m ? 14 : 19 * S, -0.25, 0.42, avoidOf(id), [4, 30]);
      L.marks.forest = scatter(shrink(o.pts, o.x, o.y, 0.9), m ? 80 : 170, 1717, m ? 11 : 14 * S, (x, yy) => inMon(id, 6)(x, yy) && !inside(o.city.core, x, yy) && !rv.some((p) => Math.hypot(p[0] - x, p[1] - yy) < 14 * u));
      lab("sawmill", sw.x, sw.y + sw.h / 2 + 12);
      lab("forest", o.x - o.rx * 0.5, o.y - o.ry * 0.62);
      if (m) rock(id, W * 0.9, 560, 10, 1301);
      else { rock(id, W * 0.66, 900, 14, 1301); rock(id, W * 0.04, 260, 12, 1302); rock(id, W * 0.6, 160, 10, 1303); }
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

  // Les nuages de l'ouverture à un scroll s (px) et une heure t (s) donnés
  // (v5). La caméra avance dans la couche de nuages : profondeur parcourue
  // T(s) ; un nuage à la profondeur D est vu à l'échelle k = D / (D − T),
  // écarté du point de fuite (perspective vraie : parallaxe entre les
  // couches, les proches passent d'abord). Il s'efface juste avant d'être
  // traversé. Dérive horizontale lente pilotée par l'horloge murale, bouclée
  // hors champ. Fonction pure de (L, s, t) : identique aperçu / arrivée.
  function cloudState(L, s, t, out) {
    const C = L.cam;
    const u = Math.min(1, Math.max(0, s / C.end));
    const e = u * u * (3 - 2 * u);
    const T = 3.9 * e;
    const cx = L.W / 2, cy = C.yh - (L.m ? 40 : 70);
    out.length = 0;
    for (const c of L.clouds) {
      const gap = c.D - T;
      if (gap <= 0.16) continue;
      const k = c.D / gap;
      const span = L.W + 2 * c.mg;
      let x = (((c.x0 + c.mg + c.v * (t % 100000)) % span) + span) % span - c.mg;
      const op = Math.min(1, (gap - 0.16) / 0.5) * (u < 0.9 ? 1 : (1 - u) / 0.1);
      out.push({ x: cx + (x - cx) * k, y: cy + (c.y0 - cy) * k + s * 0.18 * (1 - u), k, op: Math.max(0, op), c });
    }
    // du plus lointain au plus proche
    out.sort((a, b) => b.c.D - a.c.D);
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

  // ---- v5 : pictogrammes des monuments (géométrie partagée) ----
  // glyph(q) renvoie des [rôle, d] (chemins SVG). Rôles : surfaces (water,
  // glass, green, forest, stone, shade, wall, wood, metal, roof, slate,
  // red, glow, lava, dark), traits (line, thin, tick), doubles traits
  // (road, rampart). La Façade donne à chaque rôle un lavis et un trait
  // d'encre ; la Machine trace les mêmes chemins en fil de fer. Les
  // bâtiments sont en élévation (vue cavalière des cartes anciennes) posés
  // sur leur base (bas de la boîte), les places et les forts en plan.
  const g1 = (v) => Math.round(v * 10) / 10;
  const REC = (x, y, w, h) => `M${g1(x)} ${g1(y)}h${g1(w)}v${g1(h)}h${g1(-w)}Z`;
  const POL = (pts, open) => "M" + pts.map((p) => `${g1(p[0])} ${g1(p[1])}`).join("L") + (open ? "" : "Z");
  // cercles dans le sens horaire, comme les polygones : un même <path> (règle nonzero)
  // fait l'union des formes qui se recouvrent au lieu d'y percer des trous
  const CIR = (x, y, r) => `M${g1(x - r)} ${g1(y)}a${g1(r)} ${g1(r)} 0 1 1 ${g1(2 * r)} 0a${g1(r)} ${g1(r)} 0 1 1 ${g1(-2 * r)} 0Z`;
  const SEG = (x0, y0, x1, y1) => `M${g1(x0)} ${g1(y0)}L${g1(x1)} ${g1(y1)}`;
  const ARCP = (x, y, rx, ry, a0, a1, n) => {
    const p = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      p.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]);
    }
    return p;
  };
  const turn = (cx, cy, a) => (p) => [cx + p[0] * Math.cos(a) - p[1] * Math.sin(a), cy + p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  // petit bâtiment en élévation : murs, toit à deux pans, porte, fenêtres
  function house(o, x, y, w, h, roof, s, win) {
    o.push(["wall", REC(x - w / 2, y - h, w, h)]);
    o.push([roof || "roof", POL([[x - w / 2 - 2 * s, y - h], [x, y - h - h * 0.55], [x + w / 2 + 2 * s, y - h]])]);
    o.push(["dark", REC(x - 2 * s, y - 5 * s, 4 * s, 5 * s)]);
    if (win) for (let i = -1; i <= 1; i += 2) o.push([win, REC(x + i * w * 0.28 - 1.5 * s, y - h * 0.7, 3 * s, 3 * s)]);
  }
  function chimney(o, x, y, s, h) {
    o.push(["stone", POL([[x - 5 * s, y], [x - 3.5 * s, y - h], [x + 3.5 * s, y - h], [x + 5 * s, y]])]);
    o.push(["red", REC(x - 3.8 * s, y - h * 0.82, 7.6 * s, 4 * s)]);
    // panache de fumée à l'encre, porté par le vent
    let d = `M${g1(x)} ${g1(y - h - 2 * s)}`;
    for (let k = 1; k <= 4; k++) d += `q${g1(5 * s)} ${g1(-5 * s)} ${g1(10 * s)} ${g1(-3 * s - k)}`;
    o.push(["thin", d]);
    for (let k = 0; k < 3; k++) o.push(["thin", CIR(x + (9 + k * 9) * s, y - h - (6 + k * 3) * s, (2.6 + k * 1.3) * s)]);
  }
  function conifer(o, x, y, s, k) {
    const h = (13 + 5 * k) * s, w = (6 + 2 * k) * s;
    o.push(["forest", POL([[x, y - h], [x + w, y - h * 0.38], [x + w * 0.45, y - h * 0.42], [x + w * 1.15, y - 2 * s], [x - w * 1.15, y - 2 * s], [x - w * 0.45, y - h * 0.42], [x - w, y - h * 0.38]])]);
    o.push(["line", SEG(x, y - 2 * s, x, y + 1.5 * s)]);
    o.push(["thin", SEG(x + w * 0.2, y - h * 0.7, x + w * 0.7, y - h * 0.42) + SEG(x + w * 0.25, y - h * 0.3, x + w * 0.9, y - 3 * s)]);
  }

  const GLYPH = {
    // Palais de la Bourse : perron, colonnade, fronton ; tableau des cours
    bourse(o, q) {
      const s = q.s, x = q.x - q.w / 2 + 52 * s, y = q.y + q.h / 2;
      o.push(["stone", REC(x - 52 * s, y - 5 * s, 104 * s, 5 * s) + REC(x - 48 * s, y - 10 * s, 96 * s, 5 * s)]);
      o.push(["shade", REC(x - 44 * s, y - 44 * s, 88 * s, 34 * s)]);
      for (let i = 0; i < 8; i++) o.push(["wall", REC(x - 41 * s + (i * 82 * s) / 7 - 3.2 * s, y - 44 * s, 6.4 * s, 34 * s)]);
      o.push(["wall", REC(x - 50 * s, y - 51 * s, 100 * s, 7 * s)]);
      o.push(["roof", POL([[x - 54 * s, y - 51 * s], [x, y - 68 * s], [x + 54 * s, y - 51 * s]])]);
      o.push(["line", POL([[x - 38 * s, y - 54 * s], [x, y - 63.5 * s], [x + 38 * s, y - 54 * s]], 1)]);
      o.push(["glow", CIR(x, y - 57 * s, 3 * s)]);
      const bx = x + 60 * s, by = y - 42 * s, bw = 40 * s, bh = 26 * s;
      o.push(["line", SEG(bx + 6 * s, by + bh, bx + 6 * s, y) + SEG(bx + bw - 6 * s, by + bh, bx + bw - 6 * s, y)]);
      o.push(["dark", REC(bx, by, bw, bh)]);
      const r = rng(77);
      let d = "";
      for (let i = 0; i <= 8; i++) d += `${i ? "L" : "M"}${g1(bx + 3 * s + (i * (bw - 6 * s)) / 8)} ${g1(by + bh * (0.25 + 0.55 * r()))}`;
      o.push(["tick", d]);
      for (let i = 0; i < 6; i++) o.push([i % 3 ? "glow" : "red", REC(bx + 4 * s + i * 6 * s, by + bh - 6 * s, 4 * s, 3 * s)]);
    },
    // comptoirs : étals à auvents rayés
    stalls(o, q) {
      const s = q.s, n = 5, w = q.w / n, y = q.y + q.h / 2;
      for (let i = 0; i < n; i++) {
        const x = q.x - q.w / 2 + w * (i + 0.5);
        o.push(["wall", REC(x - w * 0.38, y - 11 * s, w * 0.76, 11 * s)]);
        for (let k = 0; k < 4; k++) o.push([k % 2 ? "wall" : "red", POL([[x - w * 0.44 + (k * w * 0.88) / 4, y - 11 * s], [x - w * 0.44 + ((k + 1) * w * 0.88) / 4, y - 11 * s], [x - w * 0.38 + ((k + 0.5) * w * 0.76) / 4, y - 18 * s]])]);
        o.push(["wood", REC(x - w * 0.3, y - 6 * s, w * 0.6, 3 * s)]);
      }
    },
    // entrepôts : deux halles à toits en dents de scie
    warehouses(o, q) {
      const s = q.s;
      for (let r = 0; r < 2; r++) {
        const y = q.y - q.h / 2 + (r + 1) * q.h * 0.5, x0 = q.x - q.w / 2 + r * 8 * s, w = q.w - 8 * s;
        o.push(["wall", REC(x0, y - 13 * s, w, 13 * s)]);
        const n = 5, tw = w / n;
        for (let i = 0; i < n; i++) o.push([i % 2 ? "slate" : "roof", POL([[x0 + i * tw, y - 13 * s], [x0 + i * tw, y - 21 * s], [x0 + (i + 1) * tw, y - 13 * s]])]);
        for (let i = 0; i < 3; i++) o.push(["dark", REC(x0 + w * (0.18 + i * 0.3), y - 8 * s, 6 * s, 8 * s)]);
      }
    },
    // le port : quais, cargos à quai, grues
    port(o, q) {
      const s = q.s, x0 = q.x - q.w / 2, y0 = q.y - q.h / 2;
      for (let i = 0; i < 3; i++) {
        const y = y0 + q.h * (0.16 + i * 0.34);
        o.push(["stone", REC(x0 - 6 * s, y - 4 * s, q.w * (0.92 - i * 0.12), 8 * s)]);
        for (let k = 1; k < 6; k++) o.push(["thin", SEG(x0 + k * 16 * s, y - 4 * s, x0 + k * 16 * s, y + 4 * s)]);
        if (i < 2) {
          // cargo à quai (plan) : coque, conteneurs, château
          const L0 = q.w * (0.62 - i * 0.08), cx = x0 + 10 * s + L0 / 2, cy = y + 13 * s;
          o.push(["wall", POL([[cx - L0 / 2, cy - 6 * s], [cx + L0 / 2 - 8 * s, cy - 6 * s], [cx + L0 / 2 + 4 * s, cy], [cx + L0 / 2 - 8 * s, cy + 6 * s], [cx - L0 / 2, cy + 6 * s]])]);
          const nc = Math.floor((L0 - 22 * s) / (7 * s));
          for (let k = 0; k < nc; k++) o.push([["red", "slate", "glow", "roof"][(k + i) % 4], REC(cx - L0 / 2 + 12 * s + k * 7 * s, cy - 4 * s, 6 * s, 8 * s)]);
          o.push(["shade", REC(cx - L0 / 2 + 2 * s, cy - 4.5 * s, 8 * s, 9 * s)]);
        }
        // grue de quai (élévation) au bout du quai
        const gx = x0 + q.w * (0.92 - i * 0.12) - 18 * s, gy = y - 2 * s;
        o.push(["line", SEG(gx - 5 * s, gy, gx - 1.5 * s, gy - 26 * s) + SEG(gx + 5 * s, gy, gx + 1.5 * s, gy - 26 * s) + SEG(gx - 3.5 * s, gy - 12 * s, gx + 3.5 * s, gy - 12 * s)]);
        o.push(["line", SEG(gx - 10 * s, gy - 26 * s, gx + 22 * s, gy - 28 * s) + SEG(gx + 16 * s, gy - 27.5 * s, gx + 16 * s, gy - 14 * s)]);
        o.push(["metal", REC(gx - 4 * s, gy - 31 * s, 8 * s, 5 * s)]);
        o.push(["red", REC(gx + 13 * s, gy - 14 * s, 6 * s, 4 * s)]);
      }
    },
    // la corbeille (CFM) : la salle des marchés, en plan
    corbeille(o, q) {
      const r = Math.min(q.w, q.h * 1.25) * 0.42, x = q.x, y = q.y;
      const oct = (k) => POL(ARCP(x, y, r * k, r * k * 0.8, Math.PI / 8, Math.PI / 8 + TAU, 8).slice(0, 8));
      o.push(["stone", oct(1)]);
      o.push(["wall", oct(0.72)]);
      o.push(["dark", oct(0.4)]);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        o.push([i % 4 ? "glow" : "red", REC(x + Math.cos(a) * r * 0.56 - 1.6, y + Math.sin(a) * r * 0.45 - 1.2, 3.2, 2.4)]);
      }
      o.push(["thin", oct(0.86)]);
    },
    // forteresse en étoile (bastions à la Vauban), fossé en eau, glacis
    fort(o, q) {
      const x = q.x, y = q.y, r = q.r, n = 6;
      const star = (k) => {
        const p = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU - Math.PI / 2;
          const da = TAU / n;
          p.push([x + Math.cos(a - da * 0.5) * r * 1.42 * k, y + Math.sin(a - da * 0.5) * r * 1.42 * k * 0.92]);
          p.push([x + Math.cos(a - da * 0.2) * r * 1.6 * k, y + Math.sin(a - da * 0.2) * r * 1.6 * k * 0.92]);
          p.push([x + Math.cos(a) * r * 1.95 * k, y + Math.sin(a) * r * 1.95 * k * 0.92]);
          p.push([x + Math.cos(a + da * 0.2) * r * 1.6 * k, y + Math.sin(a + da * 0.2) * r * 1.6 * k * 0.92]);
        }
        return p;
      };
      o.push(["water", POL(star(1.1))]);
      o.push(["stone", POL(star(1))]);
      o.push(["shade", POL(star(0.86))]);
      o.push(["thin", POL(star(1.04))]);
      // glacis hachuré
      let d = "";
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * TAU;
        d += SEG(x + Math.cos(a) * r * 1.22, y + Math.sin(a) * r * 1.22 * 0.92, x + Math.cos(a) * r * 1.38, y + Math.sin(a) * r * 1.38 * 0.92);
      }
      o.push(["thin", d]);
    },
    // l'anneau des 72 forges (une par GPU) autour du grand fourneau
    forges(o, q) {
      const x = q.x, y = q.y, r = q.r, n = q.n;
      const R = r / 0.86;
      o.push(["shade", CIR(x, y, R * 1.12)]);
      o.push(["stone", CIR(x, y, R * 0.66)]);
      let fu = "", gl = "", ch = "";
      const fs = Math.min(3.4, (TAU * r) / n / 2.1);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        const fx = x + Math.cos(a) * r, fy = y + Math.sin(a) * r;
        fu += CIR(fx, fy, fs);
        gl += CIR(fx, fy, fs * 0.5);
        ch += SEG(x + Math.cos(a) * (r + fs), y + Math.sin(a) * (r + fs), x + Math.cos(a) * (r + fs * 2.6), y + Math.sin(a) * (r + fs * 2.6));
      }
      o.push(["dark", fu]);
      o.push(["lava", gl]);
      o.push(["line", ch]);
      // le grand fourneau central et son enclume
      o.push(["lava", CIR(x, y, R * 0.34)]);
      o.push(["glow", CIR(x, y, R * 0.18)]);
      const s = R / 60;
      o.push(["dark", POL([[x - 14 * s, y + R * 0.5], [x + 14 * s, y + R * 0.5], [x + 9 * s, y + R * 0.43], [x + 16 * s, y + R * 0.37], [x - 10 * s, y + R * 0.37], [x - 7 * s, y + R * 0.43]])]);
    },
    smithy(o, q) {
      const s = q.s, y = q.y + q.h / 2;
      o.push(["wall", REC(q.x - q.w / 2, y - 18 * s, q.w * 0.7, 18 * s)]);
      o.push(["slate", POL([[q.x - q.w / 2 - 2 * s, y - 18 * s], [q.x - q.w / 2 + q.w * 0.35, y - 30 * s], [q.x - q.w / 2 + q.w * 0.7 + 2 * s, y - 18 * s]])]);
      o.push(["lava", REC(q.x - q.w / 2 + 6 * s, y - 9 * s, 10 * s, 9 * s) + REC(q.x - q.w / 2 + 24 * s, y - 9 * s, 10 * s, 9 * s)]);
      chimney(o, q.x + q.w * 0.32, y, s, 34 * s);
    },
    barracks(o, q) {
      const s = q.s;
      for (let r = 0; r < 3; r++) {
        const y = q.y - q.h / 2 + (r + 1) * (q.h / 3), x0 = q.x - q.w / 2 + (r % 2) * 6 * s;
        o.push(["wall", REC(x0, y - 8 * s, q.w - 6 * s, 8 * s)]);
        o.push(["roof", POL([[x0 - 1, y - 8 * s], [x0 + 3 * s, y - 13 * s], [x0 + q.w - 9 * s, y - 13 * s], [x0 + q.w - 5 * s, y - 8 * s]])]);
      }
      o.push(["line", SEG(q.x + q.w / 2, q.y + q.h / 2, q.x + q.w / 2, q.y - q.h / 2 - 8 * s)]);
      o.push(["red", POL([[q.x + q.w / 2, q.y - q.h / 2 - 8 * s], [q.x + q.w / 2 + 10 * s, q.y - q.h / 2 - 5 * s], [q.x + q.w / 2, q.y - q.h / 2 - 2 * s]])]);
    },
    // académie (X-HEC) : coupole, colonnade, cour
    academy(o, q) {
      const s = Math.min(q.w / 60, q.h / 48), x = q.x, y = q.y + q.h * 0.36;
      o.push(["wall", REC(x - 24 * s, y - 16 * s, 48 * s, 16 * s)]);
      for (let i = 0; i < 6; i++) o.push(["thin", SEG(x - 20 * s + i * 8 * s, y - 15 * s, x - 20 * s + i * 8 * s, y - 2 * s)]);
      o.push(["slate", POL(ARCP(x, y - 16 * s, 12 * s, 14 * s, Math.PI, TAU, 10))]);
      o.push(["line", SEG(x, y - 30 * s, x, y - 36 * s)]);
      o.push(["red", POL([[x, y - 36 * s], [x + 7 * s, y - 34 * s], [x, y - 32 * s]])]);
    },
    // le grand palais (la halle du supercalculateur), en plan : nef vitrée, dôme
    palace(o, q) {
      const b = q.box;
      o.push(["stone", REC(b.x - 6, b.y - 6, b.w + 12, b.h + 12)]);
      o.push(["wall", REC(b.x, b.y, b.w, b.h)]);
      const rows = Math.max(4, Math.round(b.h / 20));
      const rh = (b.h - 16) / rows;
      for (let i = 0; i < rows; i++) o.push(["glass", REC(b.x + 10, b.y + 8 + i * rh + rh * 0.18, b.w - 20, rh * 0.6)]);
      let d = "";
      for (let x = b.x + 18; x < b.x + b.w - 12; x += 12) d += SEG(x, b.y + 8, x, b.y + b.h - 8);
      o.push(["thin", d]);
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2, r = Math.min(b.h * 0.3, 30);
      o.push(["slate", CIR(cx, cy, r)]);
      o.push(["thin", CIR(cx, cy, r * 0.62) + SEG(cx - r, cy, cx + r, cy) + SEG(cx, cy - r, cx, cy + r)]);
      o.push(["glow", CIR(cx, cy, r * 0.2)]);
      for (const [px, py] of [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]]) o.push(["stone", CIR(px, py, 7)]);
    },
    // citadelle : fort à cinq bastions, donjon
    citadel(o, q) {
      const x = q.x, y = q.y, r = Math.min(q.w, q.h) * 0.36;
      const p = [];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU - Math.PI / 2, da = TAU / 5;
        p.push([x + Math.cos(a - da * 0.5) * r * 0.72, y + Math.sin(a - da * 0.5) * r * 0.72]);
        p.push([x + Math.cos(a - da * 0.16) * r * 0.85, y + Math.sin(a - da * 0.16) * r * 0.85]);
        p.push([x + Math.cos(a) * r * 1.25, y + Math.sin(a) * r * 1.25]);
        p.push([x + Math.cos(a + da * 0.16) * r * 0.85, y + Math.sin(a + da * 0.16) * r * 0.85]);
      }
      o.push(["water", POL(p.map(([px, py]) => [x + (px - x) * 1.16, y + (py - y) * 1.16]))]);
      o.push(["stone", POL(p)]);
      o.push(["shade", REC(x - r * 0.32, y - r * 0.32, r * 0.64, r * 0.64)]);
      o.push(["slate", POL([[x - r * 0.32, y - r * 0.32], [x, y - r * 0.6], [x + r * 0.32, y - r * 0.32]])]);
      o.push(["red", POL([[x, y - r * 0.6], [x, y - r * 0.85], [x + r * 0.22, y - r * 0.78], [x, y - r * 0.72]])]);
    },
    // panthéon : coupole sur colonnade
    dome(o, q) {
      const s = q.s, x = q.x, y = q.y + q.h / 2;
      o.push(["stone", REC(x - 32 * s, y - 5 * s, 64 * s, 5 * s)]);
      o.push(["shade", REC(x - 26 * s, y - 24 * s, 52 * s, 19 * s)]);
      for (let i = 0; i < 6; i++) o.push(["wall", REC(x - 24 * s + i * 9.2 * s, y - 24 * s, 4.4 * s, 19 * s)]);
      o.push(["wall", REC(x - 22 * s, y - 31 * s, 44 * s, 7 * s)]);
      o.push(["slate", POL(ARCP(x, y - 31 * s, 18 * s, 20 * s, Math.PI, TAU, 12))]);
      o.push(["thin", SEG(x - 8 * s, y - 33 * s, x - 6 * s, y - 47 * s) + SEG(x + 8 * s, y - 33 * s, x + 6 * s, y - 47 * s)]);
      o.push(["wall", REC(x - 3 * s, y - 56 * s, 6 * s, 6 * s)]);
    },
    arch(o, q) {
      const s = q.s, x = q.x, y = q.y + q.h / 2;
      o.push(["stone", POL([[x - 16 * s, y], [x - 16 * s, y - 24 * s], [x + 16 * s, y - 24 * s], [x + 16 * s, y], [x + 7 * s, y], ...ARCP(x, y - 10 * s, 7 * s, 8 * s, 0, -Math.PI, 8), [x - 7 * s, y]])]);
      o.push(["wall", REC(x - 18 * s, y - 29 * s, 36 * s, 5 * s)]);
    },
    // remparts : double trait épais le long de la côte, tours rondes
    rampart(o, q) {
      const p = q.pts, n = p.length, s = q.s;
      o.push(["rampart", POL(p)]);
      let t = "";
      for (let i = 0; i < n; i += 3) t += CIR(p[i][0], p[i][1], 4.6 * s);
      o.push(["stone", t]);
    },
    avenues(o, q) {
      let d = "";
      for (const [a, b, c, e] of q.segs) d += SEG(a, b, c, e);
      o.push(["road", d]);
    },
    // amphithéâtre (écoles : FIDLE, DLO-JZ, Panoram'IA), en plan
    amphi(o, q) {
      const r = Math.min(q.w, q.h * 1.25) * 0.4, x = q.x, y = q.y + r * 0.25;
      o.push(["stone", POL(ARCP(x, y, r, r * 0.85, Math.PI, TAU, 14))]);
      let d = "";
      for (const k of [0.8, 0.62, 0.45]) d += POL(ARCP(x, y, r * k, r * k * 0.85, Math.PI, TAU, 12), 1);
      for (let i = 1; i < 6; i++) {
        const a = Math.PI + (i * Math.PI) / 6;
        d += SEG(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.26, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.85);
      }
      o.push(["thin", d]);
      o.push(["wood", REC(x - r * 0.35, y, r * 0.7, r * 0.22)]);
    },
    // les laboratoires (l'ancienne halle), en plan
    labs(o, q) {
      const b = q.box;
      o.push(["wall", REC(b.x, b.y, b.w, b.h)]);
      const rows = 3, rh = (b.h - 8) / rows;
      for (let i = 0; i < rows; i++) o.push(["shade", REC(b.x + 5, b.y + 4 + i * rh + rh * 0.2, b.w - 10, rh * 0.55)]);
      o.push(["glass", REC(b.x + b.w * 0.42, b.y - 4, b.w * 0.16, b.h + 8)]);
    },
    observatory(o, q) {
      const s = q.s, x = q.x, y = q.y + q.h / 2;
      o.push(["wall", REC(x - 14 * s, y - 24 * s, 28 * s, 24 * s)]);
      o.push(["slate", POL(ARCP(x, y - 24 * s, 17 * s, 17 * s, Math.PI, TAU, 12))]);
      o.push(["dark", POL([[x - 2 * s, y - 40 * s], [x + 3 * s, y - 40 * s], [x + 2.5 * s, y - 24 * s], [x - 1.5 * s, y - 24 * s]])]);
      o.push(["line", SEG(x, y - 34 * s, x + 14 * s, y - 50 * s)]);
      o.push(["dark", REC(x - 3 * s, y - 8 * s, 6 * s, 8 * s)]);
    },
    greenhouse(o, q) {
      const s = q.s, x0 = q.x - q.w / 2, y = q.y + q.h / 2, w = q.w;
      o.push(["glass", POL([[x0, y], [x0, y - 14 * s], [x0 + w / 2, y - 26 * s], [x0 + w, y - 14 * s], [x0 + w, y]])]);
      let d = "";
      for (let i = 1; i < 6; i++) d += SEG(x0 + (i * w) / 6, y, x0 + (i * w) / 6, y - 14 * s - (1 - Math.abs(i / 6 - 0.5) * 2) * 12 * s);
      d += SEG(x0, y - 7 * s, x0 + w, y - 7 * s);
      o.push(["thin", d]);
      o.push(["green", CIR(x0 + w * 0.3, y - 4 * s, 3 * s) + CIR(x0 + w * 0.65, y - 5 * s, 4 * s)]);
    },
    // jardin botanique : parterres rayonnants autour d'un bassin
    garden(o, q) {
      const x = q.x, y = q.y, r = q.w / 2;
      o.push(["green", CIR(x, y, r)]);
      let d = "";
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        d += SEG(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3, x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      o.push(["road", d]);
      o.push(["water", CIR(x, y, r * 0.28)]);
      o.push(["thin", CIR(x, y, r * 0.65)]);
    },
    // le phare (le faisceau part de la lanterne, en haut de la boîte)
    lighthouse(o, q) {
      const s = q.s, x = q.x, top = q.y - q.h / 2, y = q.y + q.h / 2;
      o.push(["stone", POL([[x - 13 * s, y], [x - 8 * s, y - 6 * s], [x + 8 * s, y - 6 * s], [x + 13 * s, y]])]);
      o.push(["wall", POL([[x - 7 * s, y - 6 * s], [x - 4.5 * s, top + 8 * s], [x + 4.5 * s, top + 8 * s], [x + 7 * s, y - 6 * s]])]);
      for (let k = 0; k < 3; k++) {
        const ya = y - 6 * s - (k * 2 + 1) * (y - 6 * s - top - 8 * s) / 6, yb = ya - (y - 6 * s - top - 8 * s) / 6;
        const wa = 7 * s - (2.5 * s * (y - 6 * s - ya)) / (y - top - 14 * s), wb = 7 * s - (2.5 * s * (y - 6 * s - yb)) / (y - top - 14 * s);
        o.push(["red", POL([[x - wa, ya], [x - wb, yb], [x + wb, yb], [x + wa, ya]])]);
      }
      o.push(["glow", REC(x - 4 * s, top - 2 * s, 8 * s, 10 * s)]);
      o.push(["dark", POL([[x - 6 * s, top - 2 * s], [x, top - 8 * s], [x + 6 * s, top - 2 * s]])]);
    },
    beltHall(o, q) {
      o.push(["wall", REC(q.x - q.w / 2, q.y - q.h / 2, q.w, q.h)]);
      o.push(["thin", REC(q.x - q.w / 2 + 3, q.y - q.h / 2 + 3, q.w - 6, q.h - 6)]);
    },
    chimneys(o, q) {
      const s = q.s, y = q.y + q.h / 2;
      o.push(["shade", REC(q.x - q.w / 2, y - 14 * s, q.w * 0.8, 14 * s)]);
      for (let i = 0; i < 3; i++) chimney(o, q.x - q.w / 2 + 10 * s + i * 21 * s, y - 12 * s, s, (40 - i * 6) * s);
    },
    // ateliers à sheds (dents de scie vitrées)
    workshop(o, q) {
      const s = q.s, x0 = q.x - q.w / 2, y = q.y + q.h / 2, n = 6, tw = q.w / n;
      o.push(["wall", REC(x0, y - 14 * s, q.w, 14 * s)]);
      for (let i = 0; i < n; i++) {
        o.push(["slate", POL([[x0 + i * tw, y - 14 * s], [x0 + (i + 0.7) * tw, y - 24 * s], [x0 + (i + 0.7) * tw, y - 14 * s]])]);
        o.push(["glass", POL([[x0 + (i + 0.7) * tw, y - 24 * s], [x0 + (i + 1) * tw, y - 14 * s], [x0 + (i + 0.7) * tw, y - 14 * s]])]);
      }
      o.push(["dark", REC(x0 + q.w * 0.45, y - 8 * s, 8 * s, 8 * s)]);
    },
    // laboratoire de chimie de l'atmosphère : fioles éclairées
    chemlab(o, q) {
      const s = q.s, x0 = q.x - q.w / 2, y = q.y + q.h / 2;
      house(o, x0 + q.w * 0.36, y, q.w * 0.64, 20 * s, "slate", s, "glow");
      for (let i = 0; i < 3; i++) {
        const fx = x0 + q.w * 0.78 + (i - 1) * 8 * s, fy = y - 2 * s, h = (12 + 3 * (i % 2)) * s;
        o.push(["glass", POL([[fx - 1.4 * s, fy - h], [fx + 1.4 * s, fy - h], [fx + 1.4 * s, fy - h * 0.55], [fx + 4.5 * s, fy], [fx - 4.5 * s, fy], [fx - 1.4 * s, fy - h * 0.55]])]);
        o.push(["glow", POL([[fx - 3.4 * s, fy - 2.5 * s], [fx + 3.4 * s, fy - 2.5 * s], [fx + 4.5 * s, fy], [fx - 4.5 * s, fy]])]);
      }
    },
    // abri météo (persiennes) sur pieds
    station(o, q) {
      const s = q.s, x = q.x, y = q.y + q.h / 2;
      o.push(["line", SEG(x - 5 * s, y, x - 4 * s, y - 9 * s) + SEG(x + 5 * s, y, x + 4 * s, y - 9 * s)]);
      o.push(["wall", REC(x - 6.5 * s, y - 20 * s, 13 * s, 11 * s)]);
      o.push(["thin", SEG(x - 5 * s, y - 17 * s, x + 5 * s, y - 17 * s) + SEG(x - 5 * s, y - 14 * s, x + 5 * s, y - 14 * s) + SEG(x - 5 * s, y - 11 * s, x + 5 * s, y - 11 * s)]);
      o.push(["roof", POL([[x - 8 * s, y - 20 * s], [x, y - 24 * s], [x + 8 * s, y - 20 * s]])]);
    },
    // mât (radio, mesures) haubané, feu au sommet
    mast(o, q) {
      const s = q.s, x = q.x, y = q.y + q.h / 2, top = q.y - q.h / 2 + 4 * s;
      o.push(["line", SEG(x, y, x, top) + SEG(x - 3 * s, y, x, top + 6 * s) + SEG(x + 3 * s, y, x, top + 6 * s)]);
      o.push(["thin", SEG(x, top + q.h * 0.3, x - 8 * s, y) + SEG(x, top + q.h * 0.3, x + 8 * s, y)]);
      o.push(["glow", CIR(x, top, 2.6 * s)]);
    },
    // anémomètre : le mât (les coupelles tournent sur le calque animé)
    anemo(o, q) {
      const s = q.s, x = q.x, y = q.y + q.h / 2;
      o.push(["line", SEG(x, y, x, q.y - q.h / 2 + 2 * s) + SEG(x - 4 * s, y, x + 4 * s, y)]);
      o.push(["dark", CIR(x, q.y - q.h / 2 + 2 * s, 1.8 * s)]);
    },
    // cale de construction : coque en membrures sur son ber, rampe vers la mer
    slipway(o, q) {
      const s = q.s, T = turn(q.x, q.y, q.a);
      o.push(["shade", POL([[-50 * s, -14 * s], [46 * s, -14 * s], [46 * s, 14 * s], [-50 * s, 14 * s]].map(T))]);
      let d = "";
      for (let x = -44; x <= 40; x += 8) d += POL([[x * s, -14 * s], [x * s, 14 * s]].map(T), 1);
      o.push(["thin", d]);
      const hull = [[-38, 0], [-34, -8], [-10, -11], [16, -10], [34, -5], [42, 0], [34, 5], [16, 10], [-10, 11], [-34, 8]].map(([a, b]) => [a * s, b * s]);
      o.push(["wall", POL(hull.map(T))]);
      let r = POL([[-36 * s, 0], [40 * s, 0]].map(T), 1);
      for (let x = -28; x <= 30; x += 6) {
        const hw = 11 * Math.sqrt(Math.max(0, 1 - ((x - 4) / 40) ** 2));
        r += POL([[x * s, -hw * s], [x * s, hw * s]].map(T), 1);
      }
      o.push(["line", r]);
      o.push(["dark", POL([[-46 * s, -16 * s], [-46 * s, -20 * s], [-30 * s, -20 * s]].map(T), 1)]);
    },
    sawmill(o, q) {
      const s = q.s, x0 = q.x - q.w / 2, y = q.y + q.h / 2;
      house(o, x0 + q.w * 0.42, y, q.w * 0.6, 18 * s, "roof", s, "glow");
      const wx = x0 + q.w * 0.86, wy = y - 10 * s, wr = 10 * s;
      o.push(["wood", CIR(wx, wy, wr)]);
      let d = "";
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        d += SEG(wx, wy, wx + Math.cos(a) * wr, wy + Math.sin(a) * wr);
      }
      o.push(["line", d + CIR(wx, wy, wr * 0.35)]);
    },
    logs(o, q) {
      const s = q.s, r = 3.2 * s;
      let d = "", c = "";
      for (let row = 0; row < 3; row++)
        for (let i = 0; i < 4 - row; i++) {
          const x = q.x - (3 - row) * r + i * 2 * r, y = q.y + q.h / 2 - r - row * 1.75 * r;
          d += CIR(x, y, r);
          c += CIR(x, y, r * 0.4);
        }
      o.push(["wood", d]);
      o.push(["thin", c]);
    },
    river(o, q) {
      o.push(["river", POL(q.pts, 1)]);
    },
  };
  function glyph(q) {
    const out = [];
    if (GLYPH[q.kind]) GLYPH[q.kind](out, q);
    return out;
  }
  // la forêt du chantier : conifères en élévation, rangés de l'arrière vers l'avant
  function forest(pts, s) {
    const out = [];
    const r = rng(99);
    pts.slice().sort((a, b) => a[1] - b[1]).forEach(([x, y]) => conifer(out, x, y, s, r()));
    return out;
  }

  window.GEO = {
    glyph, forest,
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
