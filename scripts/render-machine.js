// render-machine.js — Machine : le SQUELETTE non rendu de la même carte.
// Mêmes tracés que la Façade (geo.js), mais avant rendu : fil de fer,
// points de contrôle et poignées de Bézier, boîtes englobantes, grilles ;
// et par-dessus, le calcul (4 rangs, halos et fantômes, champ u(x), houle
// h(x,t) dont les vraies valeurs s'affichent dans les cellules, îles en
// cellules masquées). Vert phosphore, couleurs de rangs en accent.
// Ne modifie JAMAIS l'état.
(function () {
  const RANKS = [[79, 125, 255], [34, 224, 192], [255, 176, 31], [255, 79, 94]];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const PH = "#39ff88";
  const DIM = "#1d8a4c";
  const AMBER = "#ffb01f";
  const f1 = (v) => Math.round(v * 10) / 10;
  const P = GEO.pathD;
  const MONO = "'JB Mono', ui-monospace, monospace";

  const RENDER = {
    mode: 1,
    ranks: RANKS,
    palette(L, rows, data) {
      data.fill(0);
    },
  };
  const rankOf = (x, W) => Math.max(0, Math.min(3, Math.floor((x / W) * 4)));

  // ---------- squelette (SVG statique) ----------
  function skeleton(o, opt) {
    opt = opt || {};
    const ctrl = [];
    const d = P(o.pts, false, ctrl);
    let s = `<path d="${d}" fill="none" stroke="${PH}" stroke-width="1.2"/>`;
    let h = "";
    let a = "";
    ctrl.forEach(([p1, c1, c2, p2], i) => {
      if (i % (opt.every || 1)) return;
      h += `M${f1(p1[0])} ${f1(p1[1])}L${f1(c1[0])} ${f1(c1[1])}M${f1(p2[0])} ${f1(p2[1])}L${f1(c2[0])} ${f1(c2[1])}`;
      a += `<rect x="${f1(p1[0] - 2)}" y="${f1(p1[1] - 2)}" width="4" height="4"/>`;
      a += `<circle cx="${f1(c1[0])}" cy="${f1(c1[1])}" r="1.6"/>`;
    });
    s += `<path d="${h}" stroke="${DIM}" stroke-width=".7"/><g fill="#020604" stroke="${PH}" stroke-width=".8">${a}</g>`;
    if (!opt.nobox) {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const [x, y] of o.pts) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
      s += `<rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(x1 - x0)}" height="${f1(y1 - y0)}" fill="none" stroke="${DIM}" stroke-width=".8" stroke-dasharray="3 4"/>`;
      s += `<text x="${f1(x0)}" y="${f1(y0 - 5)}" class="dim" text-anchor="start">bbox ${Math.round(x1 - x0)}×${Math.round(y1 - y0)} · ${o.pts.length} ctrl</text>`;
    }
    return s;
  }
  function blocks(c) {
    if (!c) return "";
    const b = c.sp * 0.8;
    const deg = f1((c.ang * 180) / Math.PI);
    let a = "";
    let pk = "";
    let px = 0, py = 0, pn = 0;
    for (const [x, y, i, j, type] of c.blocks) {
      if (type === "plaza") {
        px += x; py += y; pn++;
        continue;
      }
      const r = `<rect x="${f1(x - b / 2)}" y="${f1(y - b / 2)}" width="${f1(b)}" height="${f1(b)}" transform="rotate(${deg} ${f1(x)} ${f1(y)})"/>`;
      if (type === "park") pk += r;
      else a += r;
      if (type === "res") a += `<path d="M${f1(x)} ${f1(y - b / 2)}v${f1(b)}M${f1(x - b / 2)} ${f1(y)}h${f1(b)}" transform="rotate(${deg} ${f1(x)} ${f1(y)})" stroke-opacity=".5"/>`;
    }
    let s = `<g fill="none" stroke="${PH}" stroke-opacity=".5" stroke-width=".8">${a}</g><g fill="none" stroke="${DIM}" stroke-dasharray="2 2" stroke-width=".8">${pk}</g>`;
    if (pn) s += `<circle cx="${f1(px / pn)}" cy="${f1(py / pn)}" r="${f1(c.sp * 0.9)}" fill="none" stroke="${PH}" stroke-dasharray="2 2"/><rect x="${f1(px / pn - 2)}" y="${f1(py / pn - 2)}" width="4" height="4" fill="${PH}"/>`;
    return s;
  }
  function label(x, y, txt, cls, anchor) {
    return `<text x="${f1(x)}" y="${f1(y)}" class="${cls || "lbl"}"${anchor ? ` text-anchor="${anchor}"` : ""}>${txt}</text>`;
  }
  function routeSeg(L, fl) {
    const pts = [];
    const y1 = Math.min(fl.top + fl.h, L.dock.y);
    for (let y = fl.top; y <= y1; y += 14) pts.push([GEO.routeX(L, y), y - fl.top]);
    if (pts.length < 2) return "";
    let s = `<path d="${P(pts, true)}" fill="none" stroke="${AMBER}" stroke-opacity=".7" stroke-width="1.2" stroke-dasharray="5 5"/>`;
    for (const [x, y] of L.route) {
      if (y < fl.top || y >= fl.top + fl.h) continue;
      s += `<path d="M${f1(x)} ${f1(y - fl.top - 5)}l5 5l-5 5l-5 -5z" fill="#020604" stroke="${AMBER}" stroke-width="1.2"/>`;
    }
    return s;
  }
  function islets(L, fl) {
    return L.annex
      .filter((a) => a.floor === fl.id)
      .map((a) => `<path d="M${f1(a.x)} ${f1(a.y)}L${f1(a.to.x)} ${f1(a.to.y)}" stroke="${DIM}" stroke-dasharray="2 4"/>` + skeleton(a, { nobox: true, every: 2 }))
      .join("");
  }

  function floorSvg(L, fl) {
    const W = L.W;
    const M = L.marks;
    const k = L.m ? 0.72 : 1;
    let s = (fl.id === "hero" ? "" : routeSeg(L, fl)) + islets(L, fl);
    for (const o of L.isles.filter((q) => q.floor === fl.id)) {
      s += skeleton(o);
      if (o.kind !== "spascia") s += blocks(o.city);
      if (o.kind === "aneo") {
        const [hx, hy] = o.harbor;
        s += `<rect x="${f1(hx - 30 * k)}" y="${f1(hy - 16 * k)}" width="${f1(36 * k)}" height="${f1(26 * k)}" fill="none" stroke="${AMBER}"/>` + label(hx - 12 * k, hy + 26 * k, "slurm · on-prem");
        const sky = L.isles.find((q) => q.kind === "sky");
        s += `<path d="M${f1(o.x + o.rx * 0.2)} ${f1(o.y - o.ry * 0.6)}Q${f1((sky.x + o.x) / 2 + 30)} ${f1((sky.y + o.y) / 2)} ${f1(sky.x - sky.rx * 0.25)} ${f1(sky.y + sky.ry * 0.7)}" fill="none" stroke="${AMBER}" stroke-width="1.2" stroke-dasharray="6 3"/>`;
      } else if (o.kind === "sky") {
        s += label(o.x, o.y + 4, "aws · ec2 / s3 / lambda");
      } else if (o.kind === "volcano") {
        const c = M.crater;
        s += `<circle cx="${f1(c.x)}" cy="${f1(c.y)}" r="${f1(c.r * 1.12)}" fill="#020604" stroke="${PH}"/>`;
        for (let i = 0; i < 72; i++) {
          const a = (i / 72) * Math.PI * 2;
          s += `<rect x="${f1(c.x + Math.cos(a) * c.r * 0.86 - 1.6)}" y="${f1(c.y + Math.sin(a) * c.r * 0.86 - 1.6)}" width="3.2" height="3.2" fill="${PH}" fill-opacity=".8"/>`;
        }
        for (const pts of M.lava) s += `<path d="${P(pts, true)}" fill="none" stroke="${PH}" stroke-width="1.4"/>`;
        s += label(c.x, c.y + 4, "NVLink", "lbl") + label(c.x, c.y + 16, "72 × GB200", "dim");
      } else if (o.kind === "jeanzay") {
        const n = M.newCity;
        const od = M.oldCity;
        const cw = n.w / 52;
        const ch = n.h / 28;
        s += `<defs><pattern id="h100" x="${f1(n.x)}" y="${f1(n.y)}" width="${cw}" height="${ch}" patternUnits="userSpaceOnUse"><rect x=".4" y=".4" width="${Math.max(0.6, cw - 1)}" height="${Math.max(0.6, ch - 1)}" fill="${PH}" fill-opacity=".6"/></pattern><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v6" stroke="${PH}" stroke-opacity=".35"/></pattern></defs>`;
        s += `<rect x="${f1(n.x)}" y="${f1(n.y)}" width="${f1(n.w)}" height="${f1(n.h)}" fill="#020604" stroke="${PH}"/><rect x="${f1(n.x)}" y="${f1(n.y)}" width="${f1(n.w)}" height="${f1(n.h)}" fill="url(#h100)"/>`;
        s += `<rect x="${f1(od.x)}" y="${f1(od.y)}" width="${f1(od.w)}" height="${f1(od.h)}" fill="url(#hatch)" stroke="${PH}" stroke-dasharray="4 3"/>`;
        s += `<path d="M${f1(n.x + n.w / 2)} ${f1(n.y + n.h)}V${f1(od.y)}M${f1(n.x)} ${f1(n.y + n.h / 2)}H${f1(o.x - o.rx * 0.8)}M${f1(n.x + n.w)} ${f1(n.y + n.h / 2)}H${f1(o.x + o.rx * 0.8)}" stroke="${AMBER}" stroke-width="1.2"/>`;
        s += label(n.x + n.w + 4, n.y + n.h + 12, L.m ? "" : "cables = interconnect (illustrative)", "dim", "end");
      } else if (o.kind === "atos") {
        const l = M.light;
        s += `<rect x="${f1(l.x - 14)}" y="${f1(l.y - 9)}" width="28" height="18" fill="#020604" stroke="${PH}"/>` + label(l.x, l.y + 3.5, "jetson");
        const b = M.belt;
        s += `<path d="M${f1(b.x0)} ${f1(b.y0)}H${f1(b.x1)}" stroke="${PH}" stroke-width="1.2"/>` + label((b.x0 + b.x1) / 2, b.y0 - 16 * k, "frame → YOLOv4 → ok / defect", "dim");
      } else if (o.kind === "spascia") {
        const sz = L.m ? 7 : 10;
        M.cabins.forEach(([x, y], i) => {
          const c = RANKS[rankOf(x, W)];
          s += `<rect x="${f1(x - sz / 2)}" y="${f1(y - sz / 2)}" width="${sz}" height="${sz}" fill="none" stroke="${rgba(c, 0.9)}" stroke-width=".9"/>${i % 11 === 0 ? `<text x="${f1(x + sz)}" y="${f1(y + 3)}" class="tiny">n${String(i).padStart(3, "0")}</text>` : ""}`;
        });
      } else if (o.kind === "port") {
        const yd = M.yard;
        s += `<rect x="${f1(yd.x - 38 * k)}" y="${f1(yd.y - 20 * k)}" width="${f1(76 * k)}" height="${f1(40 * k)}" fill="#020604" stroke="${AMBER}" stroke-width="1.4"/>`;
        for (let i = 0; i < 8; i++) s += `<path d="M${f1(yd.x - 32 * k + i * 9 * k)} ${f1(yd.y - 20 * k)}v-5M${f1(yd.x - 32 * k + i * 9 * k)} ${f1(yd.y + 20 * k)}v5" stroke="${AMBER}"/>`;
        s += label(yd.x, yd.y + 4, "BIOS · init()");
      } else if (o.kind === "quay") {
        const p = M.pier;
        s += `<path d="M${f1(p.x0)} ${f1(p.y0)}L${f1(p.x1)} ${f1(p.y1)}" stroke="${AMBER}" stroke-width="1.6"/><path d="M${f1(p.x0)} ${f1(p.y0 + 7)}L${f1(p.x1)} ${f1(p.y1 + 7)}" stroke="${AMBER}" stroke-dasharray="3 3"/><circle cx="${f1(p.x1)}" cy="${f1(p.y1)}" r="4" fill="${AMBER}"/>`;
      }
    }
    return `<svg class="isle-layer" width="${W}" height="${fl.h}" viewBox="0 0 ${W} ${fl.h}" aria-hidden="true">${s}</svg>`;
  }

  // encart : le même navire, en schéma de stack (fil de fer, couches)
  function shipSvg(L) {
    const B = L.ship;
    const G = GEO.ship(B);
    const pl = (pts, close) => `${pts.map((q, i) => `${i ? "L" : "M"}${f1(q[0])} ${f1(q[1])}`).join("")}${close ? "Z" : ""}`;
    let s = `<path d="${pl(G.water)}" stroke="${DIM}" stroke-dasharray="6 4"/>`;
    for (const part of [G.main, G.jib, G.hull, G.keel, G.rudder, G.cabin, ...G.flags]) {
      s += `<path d="${pl(part, true)}" fill="none" stroke="${PH}" stroke-width="1.1"/>`;
      for (const [x, y] of part) s += `<rect x="${f1(x - 1.8)}" y="${f1(y - 1.8)}" width="3.6" height="3.6" fill="#020604" stroke="${PH}" stroke-width=".7"/>`;
    }
    s += `<path d="${pl(G.mast)}${pl(G.boom)}${pl(G.tiller)}" stroke="${PH}" stroke-width="1.1"/>`;
    for (const d of G.decks) s += `<path d="${pl(d)}" stroke="${DIM}" stroke-width=".8"/>`;
    // boîtes de couche autour de chaque partie
    const boxes = [G.main.concat(G.jib), G.hull, G.rudder.concat(G.tiller), G.cabin, G.flags[0].concat(G.flags[1])];
    boxes.forEach((pts, i) => {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const [x, y] of pts) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
      const c = RANKS[i % 4];
      s += `<rect x="${f1(x0 - 4)}" y="${f1(y0 - 4)}" width="${f1(x1 - x0 + 8)}" height="${f1(y1 - y0 + 8)}" fill="none" stroke="${rgba(c, 0.85)}" stroke-dasharray="4 3"/>`;
    });
    G.parts.forEach(([x, y], i) => (s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="9" fill="#020604" stroke="${PH}"/><text x="${f1(x)}" y="${f1(y + 3.5)}" class="lbl">F${i}</text>`));
    return `<svg width="${f1(B.w)}" height="${f1(B.h)}" viewBox="0 0 ${f1(B.w)} ${f1(B.h)}" aria-hidden="true">${s}</svg>`;
  }
  function cloudSvg(c) {
    const R = c.s * 1.6;
    let s = "";
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y, r] of c.puffs) {
      s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}"/>`;
      x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, y - r); y1 = Math.max(y1, y + r);
    }
    s += `<rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(x1 - x0)}" height="${f1(y1 - y0)}" stroke-dasharray="3 3" stroke="${DIM}"/>`;
    return `<svg width="${f1(R * 2)}" height="${f1(R * 2)}" viewBox="${f1(-R)} ${f1(-R)} ${f1(R * 2)} ${f1(R * 2)}"><g fill="none" stroke="${PH}" stroke-width="1" vector-effect="non-scaling-stroke">${s.replace(/<rect([^>]*)stroke-dasharray/g, '<rect vector-effect="non-scaling-stroke"$1stroke-dasharray')}</g></svg>`;
  }

  function tagPos(L, key) {
    const M = L.marks;
    const isle = L.isles.find((o) => o.kind === key);
    const an = L.annex.find((a) => a.key === key);
    if (an) return [an.x, an.y + an.r + 12];
    if (key === "whirl") return [M.whirl.x, M.whirl.y + M.whirl.r + 14];
    if (key === "newCity") return [M.newCity.x + M.newCity.w / 2, M.newCity.y - 12];
    if (key === "oldCity") return [M.oldCity.x + M.oldCity.w / 2, M.oldCity.y + M.oldCity.h + 13];
    if (key === "yard") return [M.yard.x, M.yard.y + (L.m ? 26 : 34)];
    if (key === "belt") return [(M.belt.x0 + M.belt.x1) / 2, M.belt.y0 + (L.m ? 28 : 38)];
    if (key === "light") return [M.light.x, M.light.y - (L.m ? 24 : 30)];
    if (key === "sky") return [isle.x, isle.y - isle.ry - 14];
    if (key === "quay") return [(M.pier.x0 + M.pier.x1) / 2, (M.pier.y0 + M.pier.y1) / 2 + 26];
    if (isle) return [isle.x, isle.y + isle.ry + 16];
    return [0, 0];
  }

  let hud = {};
  let cloudEls = [];
  let fogEl = null;
  let cloudBox = null;
  RENDER.layout = function (SIM) {
    const L = SIM.layout;
    for (const fl of L.floors) {
      const el = document.getElementById(fl.id);
      if (!el) continue;
      el.style.height = `${fl.h}px`;
      const inner = el.querySelector(".floor-inner");
      const old = inner.querySelector(".isle-layer");
      if (old) old.remove();
      inner.insertAdjacentHTML("afterbegin", floorSvg(L, fl));
      inner.querySelectorAll("[data-card]").forEach((c) => {
        const b = L.cards[c.dataset.card];
        if (!b) return;
        c.style.left = `${b.x}px`;
        c.style.top = `${b.y}px`;
        c.style.width = `${b.w}px`;
      });
      inner.querySelectorAll("[data-tag]").forEach((t) => {
        const [x, y] = tagPos(L, t.dataset.tag);
        t.style.left = `${Math.round(x)}px`;
        t.style.top = `${Math.round(y)}px`;
      });
      const inset = inner.querySelector(".inset");
      if (inset) {
        const B = L.ship;
        inset.style.left = `${Math.round(B.x - B.w / 2)}px`;
        inset.style.top = `${Math.round(B.y - B.h / 2)}px`;
        inset.style.width = `${Math.round(B.w)}px`;
        inset.style.height = `${Math.round(B.h)}px`;
        inset.querySelector(".ship").innerHTML = shipSvg(L);
        const G = GEO.ship(B);
        inset.querySelectorAll("[data-part]").forEach((lab) => {
          const [x, y] = G.parts[+lab.dataset.part];
          lab.style.left = `${Math.round(x + 14)}px`;
          lab.style.top = `${Math.round(y - 9)}px`;
        });
      }
      const lm = inner.querySelector(".layer-mark");
      if (lm) {
        const is = L.isles.find((o) => o.floor === fl.id && o.kind !== "sky");
        const y = fl.id === "hero" ? L.cam.yh - 150 : fl.id === "vents" ? L.ship.y : fl.id === "contact" ? L.cards.contact.y + 20 : is ? is.y : fl.h / 2;
        lm.style.top = `${Math.round(y)}px`;
      }
    }
    cloudBox = document.getElementById("clouds");
    if (cloudBox) {
      cloudBox.innerHTML = '<div class="fog"></div>' + L.clouds.map((c) => `<div class="cloud">${cloudSvg(c)}</div>`).join("");
      fogEl = cloudBox.firstChild;
      cloudEls = Array.from(cloudBox.querySelectorAll(".cloud"));
      lastCloudS = -1;
    }
    hud = {};
    document.querySelectorAll("[data-hud]").forEach((e) => (hud[e.dataset.hud] = e));
    lastHud = "";
  };

  const cst = [];
  let lastCloudS = -1;
  function updateClouds(SIM) {
    if (!cloudBox) return;
    const v = SIM.view;
    const L = SIM.layout;
    const s = Math.max(0, v.scrollY);
    if (s === lastCloudS) return;
    lastCloudS = s;
    const C = L.cam;
    if (s > C.end + 4) {
      cloudBox.style.visibility = "hidden";
      return;
    }
    cloudBox.style.visibility = "visible";
    GEO.cloudState(L, s, cst);
    cst.forEach((q, i) => {
      const el = cloudEls[i];
      if (!el) return;
      const R = q.c.s * 1.6;
      el.style.transform = `translate(${(q.x - R).toFixed(2)}px,${(q.y - R).toFixed(2)}px) scale(${q.k.toFixed(4)})`;
      el.style.opacity = q.op.toFixed(3);
    });
    const sm = (a, b, x) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    fogEl.style.opacity = (sm(C.c0 - 170, C.c0 - 10, s) * (1 - sm(C.c1 + 10, C.c1 + 200, s))).toFixed(3);
  }

  // ---------- calque animé ----------
  const pt = [0, 0, 1];
  const fv = [0, 0];
  let lastHud = "";
  function diffAng(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }
  function floorVisible(L, v, id) {
    const fl = L.byId[id];
    return v.cam.flat && fl.top < v.scrollY + v.vh + 60 && fl.top + fl.h > v.scrollY - 60;
  }

  function drawTracers(ctx, SIM, count) {
    const v = SIM.view;
    const cam = v.cam;
    const paths = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    const heads = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    const ghosts = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    const H = SIM.HALO;
    SIM.eachTracer((sys, i, age, k0) => {
      const a = Math.min(1, age * 4, (1 - age) * 4);
      if (a <= 0.1) return;
      const base = i * SIM.KK;
      const jn = base + ((((v.n0 + 1) % SIM.KK) + SIM.KK) % SIM.KK);
      const jp = base + (((v.n0 % SIM.KK) + SIM.KK) % SIM.KK);
      let hx = sys.hx[jp] + (sys.hx[jn] - sys.hx[jp]) * v.frac;
      if (Math.abs(sys.hx[jn] - sys.hx[jp]) > v.W / 2) hx = sys.hx[jp];
      const hy = sys.hy[jp] + (sys.hy[jn] - sys.hy[jp]) * v.frac;
      if (SIM.dist(hx, hy) < 4) return;
      const r = rankOf(hx, v.W);
      const p = paths[r];
      let first = true;
      let px = -1;
      for (let k = Math.max(k0, v.n0 - 8); k <= v.n0; k++) {
        const j = base + (((k % SIM.KK) + SIM.KK) % SIM.KK);
        const x = sys.hx[j];
        if (SIM.dist(x, sys.hy[j]) < 3 || !SIM.project(cam, x, sys.hy[j], pt)) {
          first = true;
          continue;
        }
        if (!first && Math.abs(x - px) > v.W / 2) first = true;
        first ? p.moveTo(pt[0], pt[1]) : p.lineTo(pt[0], pt[1]);
        px = x;
        first = false;
      }
      if (SIM.project(cam, hx, hy, pt)) {
        if (!first && Math.abs(hx - px) < v.W / 2) p.lineTo(pt[0], pt[1]);
        const s = 1.4 * pt[2];
        heads[r].rect(pt[0] - s, pt[1] - s, 2 * s, 2 * s);
        if (pt[1] > 0 && pt[1] < v.vh) count[r]++;
        // halo : copie fantôme dans le rang voisin
        const j = Math.round((hx / v.W) * 4);
        if (j >= 1 && j <= 3) {
          const xb = (j * v.W) / 4;
          if (Math.abs(hx - xb) < H) {
            const nb = hx < xb ? j : j - 1;
            const g = 2.6 * pt[2];
            ghosts[nb].rect(pt[0] - g, pt[1] - g, 2 * g, 2 * g);
            if (pt[1] > 0 && pt[1] < v.vh) count[4]++;
          }
        }
      }
    });
    ctx.lineWidth = 1;
    for (let r = 0; r < 4; r++) {
      ctx.strokeStyle = rgba(RANKS[r], 0.9);
      ctx.stroke(ghosts[r]);
      ctx.strokeStyle = rgba(RANKS[r], 0.45);
      ctx.stroke(paths[r]);
      ctx.fillStyle = rgba(RANKS[r], 0.95);
      ctx.fill(heads[r]);
    }
  }

  // la houle, en données : la vraie valeur de h(x, t) dans une cellule sur trois
  function drawValues(ctx, SIM) {
    const v = SIM.view;
    if (!v.cam.flat) return;
    const cs = 24;
    const st = SIM.layout.m ? 4 : 5;
    ctx.font = `9px ${MONO}`;
    ctx.fillStyle = "rgba(57,255,136,.42)";
    const y0 = Math.ceil(v.scrollY / (cs * st)) * cs * st;
    for (let y = y0; y < v.scrollY + v.vh; y += cs * st)
      for (let x = cs * 1; x < v.W - cs; x += cs * st) {
        const cx = x + cs / 2;
        const cy = y + cs / 2;
        if (SIM.dist(cx, cy) < 14) continue;
        const h = SIM.swell(cx, cy, v.tsec);
        ctx.fillText(`${h >= 0 ? "+" : "−"}${Math.abs(h).toFixed(2).slice(1)}`, x + 2, cy - v.scrollY + 3);
      }
  }

  function drawVectors(ctx, SIM) {
    const v = SIM.view;
    if (!v.cam.flat) return;
    const sp = SIM.layout.m ? 48 : 60;
    ctx.strokeStyle = "rgba(57,255,136,.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const y0 = Math.ceil(v.scrollY / sp) * sp + sp / 2;
    for (let y = y0; y < v.scrollY + v.vh; y += sp) {
      const sys = SIM.systems.find((s) => y >= s.top && y < s.bot);
      if (!sys) continue;
      for (let x = sp; x < v.W; x += sp) {
        if (SIM.dist(x, y) < 8) continue;
        SIM.field(x, y, v.tf * SIM.DT, sys.g, fv);
        const m = Math.hypot(fv[0], fv[1]) + 1e-6;
        const l = Math.min(16, m * 0.55);
        const ux = fv[0] / m;
        const uy = fv[1] / m;
        const sy = y - v.scrollY;
        const ex = x + ux * l;
        const ey = sy + uy * l;
        ctx.moveTo(x - ux * l * 0.3, sy - uy * l * 0.3);
        ctx.lineTo(ex, ey);
        ctx.moveTo(ex - ux * 4 - uy * 3, ey - uy * 4 + ux * 3);
        ctx.lineTo(ex, ey);
        ctx.lineTo(ex - ux * 4 + uy * 3, ey - uy * 4 - ux * 3);
      }
    }
    ctx.stroke();
  }

  function tag(ctx, x, y, txt, col) {
    ctx.font = `10px ${MONO}`;
    const w = ctx.measureText(txt).width;
    ctx.fillStyle = "rgba(2,6,4,.85)";
    ctx.fillRect(x - 2, y - 9, w + 4, 12);
    ctx.fillStyle = col;
    ctx.fillText(txt, x, y);
  }

  function drawLocal(ctx, SIM) {
    const v = SIM.view;
    const L = SIM.layout;
    const t = v.tsec;
    const M = L.marks;
    if (floorVisible(L, v, "aujourdhui")) {
      const top = L.byId.aujourdhui.top - v.scrollY;
      const w = M.whirl;
      const cx = w.x;
      const cy = w.y + top;
      const rot = -t * 0.7;
      ctx.strokeStyle = "rgba(57,255,136,.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, w.r, w.r * 0.8, 0, 0, Math.PI * 2);
      for (let a = 0; a < 3; a++) {
        const ang = rot + (a * Math.PI * 2) / 3;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * w.r, cy + Math.sin(ang) * w.r * 0.8);
      }
      ctx.stroke();
      const isA = L.isles.find((o) => o.kind === "aneo");
      const isS = L.isles.find((o) => o.kind === "sky");
      for (let k = 0; k < 5; k++) {
        const per = 8;
        const tt = t + k * (per / 5);
        const n = Math.floor(tt / per);
        const u = tt / per - n;
        const toA = SIM.hash3(71, k, n) & 1;
        const dst = toA ? isA : isS;
        let x, y;
        if (u < 0.5) {
          const q = u / 0.5;
          const r = w.r * (1.1 - 0.75 * q);
          const ang = rot * 1.2 + k * 1.3 + q * 4;
          x = cx + Math.cos(ang) * r;
          y = cy + Math.sin(ang) * r * 0.8;
        } else {
          const q = (u - 0.5) / 0.5;
          const tx = toA ? dst.harbor[0] - 30 : dst.x + dst.rx * 0.6;
          const ty = (toA ? dst.harbor[1] + 20 : dst.y + dst.ry * 1.2) + top;
          x = cx + (tx - cx) * q;
          y = cy + (ty - cy) * q;
        }
        ctx.globalAlpha = Math.min(1, u * 10, (1 - u) * 10);
        ctx.fillStyle = toA ? rgba(RANKS[1], 1) : rgba(RANKS[2], 1);
        ctx.fillRect(x - 3.5, y - 3.5, 7, 7);
        if (u > 0.5 && k % 2 === 0) tag(ctx, x + 6, y + 3, toA ? "→ slurm" : "→ aws", toA ? rgba(RANKS[1], 1) : rgba(RANKS[2], 1));
        ctx.globalAlpha = 1;
      }
    }
    if (floorVisible(L, v, "dalia")) {
      const top = L.byId.dalia.top - v.scrollY;
      ctx.fillStyle = "#d8ffe6";
      M.lava.forEach((pts, li) => {
        for (let k = 0; k < 3; k++) {
          const u = (t * 0.1 + k / 3 + li * 0.21) % 1;
          const f = u * (pts.length - 1);
          const i = Math.floor(f);
          const q = f - i;
          const a = pts[i];
          const b = pts[Math.min(i + 1, pts.length - 1)];
          ctx.globalAlpha = Math.min(1, u * 8) * (1 - u);
          ctx.fillRect(a[0] + (b[0] - a[0]) * q - 2.5, a[1] + (b[1] - a[1]) * q + top - 2.5, 5, 5);
        }
      });
      ctx.globalAlpha = 1;
      const c = M.crater;
      const g = Math.floor(t * 18) % 72;
      for (let d = 0; d < 8; d++) {
        const a = (((g + d * 9) % 72) / 72) * Math.PI * 2;
        ctx.fillRect(c.x + Math.cos(a) * c.r * 0.86 - 2, c.y + Math.sin(a) * c.r * 0.86 + top - 2, 4, 4);
      }
    }
    if (floorVisible(L, v, "atos")) {
      const top = L.byId.atos.top - v.scrollY;
      const l = M.light;
      const ox = l.x;
      const oy = l.y + top;
      const ba = t * 0.6;
      const hw = 0.16;
      ctx.fillStyle = "rgba(57,255,136,.07)";
      ctx.strokeStyle = "rgba(57,255,136,.5)";
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.arc(ox, oy, l.R, ba - hw, ba + hw);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      const b = M.belt;
      const per = 1.6;
      const len = b.x1 - b.x0;
      for (let k = 0; k < 6; k++) {
        const u = ((t / per + k / 6) % 1 + 1) % 1;
        const x = b.x0 + len * u;
        const n = Math.floor(t / per + k / 6);
        const bad = SIM.hash3(9, k, n) % 7 === 0 && u > 0.5;
        ctx.globalAlpha = Math.min(1, u * 12, (1 - u) * 12);
        ctx.strokeStyle = bad ? rgba(RANKS[3], 1) : PH;
        ctx.strokeRect(x - 5, b.y0 + top - 5, 10, 10);
        if (u > 0.5 && k % 2 === 0) tag(ctx, x - 6, b.y0 + top - 9, bad ? "defect" : `ok ${(0.9 + (SIM.hash3(k, n, 3) % 9) / 100).toFixed(2)}`, bad ? rgba(RANKS[3], 1) : PH);
        ctx.globalAlpha = 1;
      }
    }
  }

  // le job qui migre, à la position du voilier ; il termine au quai
  function drawJob(ctx, SIM) {
    const v = SIM.view;
    const L = SIM.layout;
    const cam = v.cam;
    const e = cam.p;
    const yb = GEO.boatY(L, v.scrollY) - (1 - e) * (1 - e) * (L.m ? 1500 : 1700);
    const docked = yb >= L.dock.y - 0.5;
    const xb = GEO.routeX(L, yb);
    if (!SIM.project(cam, xb, yb, pt)) return;
    const s = pt[2] * (L.m ? 1 : 1.5);
    if (s < 0.05) return;
    const x = pt[0];
    const y = pt[1];
    ctx.strokeStyle = AMBER;
    ctx.fillStyle = "rgba(255,176,31,.15)";
    ctx.lineWidth = 1.4;
    ctx.fillRect(x - 14 * s, y - 14 * s, 28 * s, 28 * s);
    ctx.strokeRect(x - 14 * s, y - 14 * s, 28 * s, 28 * s);
    ctx.beginPath();
    ctx.moveTo(x - 22 * s, y);
    ctx.lineTo(x + 22 * s, y);
    ctx.moveTo(x, y - 22 * s);
    ctx.lineTo(x, y + 22 * s);
    ctx.stroke();
    if (s > 0.5) {
      const fl = L.floors.find((f) => yb >= f.top && yb < f.top + f.h) || L.floors[0];
      const ck = L.route.filter((q) => q[1] < yb).length;
      tag(ctx, x + 20 * s, y - 18 * s, docked ? "job 0x2a · docked · exit 0" : `job 0x2a · ${fl.id} · ckpt ${ck}`, AMBER);
    }
  }

  RENDER.frame = function (ctx, SIM) {
    const v = SIM.view;
    ctx.clearRect(0, 0, v.W, v.vh);
    const count = [0, 0, 0, 0, 0];
    drawValues(ctx, SIM);
    drawVectors(ctx, SIM);
    drawTracers(ctx, SIM, count);
    drawLocal(ctx, SIM);
    drawJob(ctx, SIM);
    updateClouds(SIM);
    const q = `${Math.floor(v.tf / 5)}|${v.scrollY}|${v.vh}|${v.W}`;
    if (q !== lastHud && hud.step) {
      lastHud = q;
      hud.step.textContent = String(Math.floor(v.tf / SIM.PSTEP)).slice(-7);
      hud.t.textContent = ((v.tsec % 100000) | 0).toString();
      const tot = count[0] + count[1] + count[2] + count[3] || 1;
      hud.tr.textContent = String(tot);
      hud.pk.textContent = String(count[4]);
      const bars = hud.bars.children;
      for (let r = 0; r < 4; r++) bars[r].style.width = `${((count[r] / tot) * 100).toFixed(1)}%`;
    }
  };

  window.RENDER = RENDER;
})();
