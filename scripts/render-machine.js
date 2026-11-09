// render-machine.js — la même simulation, montrée comme un calcul :
// maillage, champ de vitesse, découpage du domaine entre rangs/GPU,
// halos, quadtree AMR, isolignes, métriques. Ne modifie JAMAIS l'état.
//
// Couleur d'un traceur = rang propriétaire = floor(x / Lx * R). Avec
// R = 4 (défaut), ce sont exactement les zones où la Façade fond ses
// quatre pigments : le "dégradé naturel" était le découpage du calcul.
(function () {
  const BG = "#05070b";
  const RANKP = [
    [79, 125, 255],
    [34, 224, 192],
    [255, 176, 31],
    [255, 79, 94],
  ];
  const HALO = 10; // px de part et d'autre d'une frontière de rang
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  function smooth(t) {
    return t * t * (3 - 2 * t);
  }
  function cycleColor(u) {
    const p = u * 4 - 0.5;
    const f0 = Math.floor(p);
    const f = smooth(p - f0);
    const a = RANKP[((f0 % 4) + 4) % 4];
    const b = RANKP[(((f0 + 1) % 4) + 4) % 4];
    return [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * f));
  }

  const ui = typeof UI !== "undefined" ? UI : { ranks: 4, layers: { mesh: true, vec: true, halo: true, trail: true } };
  let rankCol = [];
  function setRanks(R) {
    ui.ranks = R;
    rankCol = [];
    for (let r = 0; r < R; r++) rankCol.push(cycleColor((r + 0.5) / R));
  }
  setRanks(ui.ranks);

  // --- géométrie dérivée (recalculée au layout) ---
  let iso = null; // segments d'isolignes de l'étage compétences
  let heat = null; // grille de densité (étage à propos)
  let hud = {};

  function layout(SIM) {
    const L = SIM.layout;
    // isolignes du potentiel des attracteurs (marching squares, une fois)
    const sys = SIM.systems.find((s) => s.id === "competences");
    iso = null;
    if (sys) {
      const W = L.W;
      const H = sys.g.H;
      const cs = 16;
      const nx = Math.ceil(W / cs) + 1;
      const ny = Math.ceil(H / cs) + 1;
      const sig = L.mobile ? 95 : 150;
      const phi = new Float32Array(nx * ny);
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          let s = 0;
          for (const a of L.att) {
            const dx = SIM.wrapD(i * cs - a.x, W);
            const dy = j * cs - a.y;
            s += Math.exp(-(dx * dx + dy * dy) / (2 * sig * sig));
          }
          phi[j * nx + i] = s;
        }
      }
      const segs = [];
      for (const lv of [0.12, 0.25, 0.4, 0.55, 0.7, 0.85]) {
        for (let j = 0; j < ny - 1; j++) {
          for (let i = 0; i < nx - 1; i++) {
            const v0 = phi[j * nx + i];
            const v1 = phi[j * nx + i + 1];
            const v2 = phi[(j + 1) * nx + i + 1];
            const v3 = phi[(j + 1) * nx + i];
            const pts = [];
            const ed = (va, vb, xa, ya, xb, yb) => {
              if (va < lv !== vb < lv) {
                const t = (lv - va) / (vb - va);
                pts.push(xa + (xb - xa) * t, ya + (yb - ya) * t);
              }
            };
            const x0 = i * cs;
            const y0 = j * cs;
            ed(v0, v1, x0, y0, x0 + cs, y0);
            ed(v1, v2, x0 + cs, y0, x0 + cs, y0 + cs);
            ed(v2, v3, x0 + cs, y0 + cs, x0, y0 + cs);
            ed(v3, v0, x0, y0 + cs, x0, y0);
            for (let k = 0; k + 3 < pts.length; k += 4) segs.push(pts[k], pts[k + 1], pts[k + 2], pts[k + 3]);
          }
        }
      }
      iso = new Float32Array(segs);
    }
    // étiquettes de rang en haut de chaque étage (DOM : police déjà prête)
    for (const s of SIM.systems) {
      const el = document.getElementById(s.id);
      if (!el) continue;
      const inner = el.querySelector(".floor-inner") || el;
      let row = inner.querySelector(".ranks-row");
      if (!row) {
        row = document.createElement("div");
        row.className = "ranks-row";
        row.setAttribute("aria-hidden", "true");
        inner.prepend(row);
      }
      let html = "";
      for (let r = 0; r < ui.ranks; r++) {
        const c = rankCol[r];
        html += `<span style="left:${(((r + 0.5) / ui.ranks) * 100).toFixed(3)}%;color:${rgba(c, 1)}">GPU${r} · rank ${r}</span>`;
      }
      if (L.mobile) html = html.replace(/ · rank \d/g, "");
      row.innerHTML = html;
    }
    // tags du monde (étage formation)
    const fo = document.querySelector("#formation .floor-inner");
    if (fo && !fo.querySelector(".lat-tag")) {
      const t = document.createElement("p");
      t.className = "tag lat-tag";
      fo.appendChild(t);
    }
    const lt = document.querySelector("#formation .lat-tag");
    const fs = SIM.systems.find((s) => s.id === "formation");
    if (lt && fs) lt.textContent = `lattice ${fs.g.lat.nx}×${fs.g.lat.ny} · Δ = ${fs.g.lat.sx.toFixed(1)} px`;
    // références HUD + état des boutons
    hud = {};
    document.querySelectorAll("[data-hud]").forEach((el) => (hud[el.dataset.hud] = el));
    document.querySelectorAll("[data-ranks]").forEach((b) => {
      const on = +b.dataset.ranks === ui.ranks;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on);
    });
    document.querySelectorAll("[data-layer]").forEach((b) => {
      const on = !!ui.layers[b.dataset.layer];
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on);
    });
    if (hud.bars) {
      hud.bars.innerHTML = rankCol.map((c) => `<i style="--c:${rgba(c, 1)}"></i>`).join("");
    }
    document.querySelectorAll(".prompt").forEach((p) => {
      p.textContent = p.textContent.replace(/--ranks \d+/, `--ranks ${ui.ranks}`);
    });
    lastHudTick = -1;
  }

  // --- interactions (ne touchent qu'au rendu, jamais à l'état) ---
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-ranks], [data-layer]");
    if (!b || !window.SIM) return;
    if (b.dataset.ranks) setRanks(+b.dataset.ranks);
    else ui.layers[b.dataset.layer] = !ui.layers[b.dataset.layer];
    SIM.renderKey = `${ui.ranks}${Object.values(ui.layers).join("")}`;
    layout(SIM);
    SIM.redraw();
  });

  const fmtInt = (n) => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  let lastHudTick = -1;

  function frame(ctx, SIM) {
    const v = SIM.view;
    const W = v.W;
    const vh = v.vh;
    const sy = v.scrollY;
    const R = ui.ranks;
    const lay = ui.layers;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, vh);

    // teinte des domaines
    for (let r = 0; r < R; r++) {
      ctx.fillStyle = rgba(rankCol[r], 0.035);
      ctx.fillRect((r * W) / R, 0, W / R, vh);
    }

    // maillage
    if (lay.mesh) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(130,160,200,0.07)";
      ctx.beginPath();
      for (let x = 0; x <= W; x += 24) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, vh);
      }
      for (let y = Math.ceil(sy / 24) * 24; y <= sy + vh; y += 24) {
        ctx.moveTo(0, y - sy + 0.5);
        ctx.lineTo(W, y - sy + 0.5);
      }
      ctx.stroke();
      ctx.strokeStyle = "rgba(130,160,200,0.13)";
      ctx.beginPath();
      for (let x = 0; x <= W; x += 120) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, vh);
      }
      for (let y = Math.ceil(sy / 120) * 120; y <= sy + vh; y += 120) {
        ctx.moveTo(0, y - sy + 0.5);
        ctx.lineTo(W, y - sy + 0.5);
      }
      ctx.stroke();
    }

    // frontières de rang + bandes de halo
    for (let r = 1; r < R; r++) {
      const bx = (r * W) / R;
      if (lay.halo) {
        ctx.fillStyle = "rgba(255,255,255,0.045)";
        ctx.fillRect(bx - HALO, 0, HALO * 2, vh);
      }
      ctx.strokeStyle = "rgba(220,235,255,0.35)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(Math.round(bx) + 0.5, 0);
      ctx.lineTo(Math.round(bx) + 0.5, vh);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // surcouches par étage
    for (const sys of v.visible) overlay(ctx, sys, sys.g.top - sy, SIM);

    // champ de vitesse
    if (lay.vec) {
      const sp = SIM.layout.mobile ? 34 : 40;
      const tau = v.tf * SIM.DT;
      const out = [0, 0];
      const buckets = [new Path2D(), new Path2D(), new Path2D()];
      for (const sys of v.visible) {
        const top = sys.g.top;
        const y0 = Math.max(top, sy - 20);
        const y1 = Math.min(top + sys.g.H, sy + vh + 20);
        for (let y = Math.ceil((y0 - top) / sp) * sp + sp / 2; y + top <= y1; y += sp) {
          for (let x = sp / 2; x < W; x += sp) {
            sys.def.field(x, y, tau, sys.g, out);
            const m = Math.hypot(out[0], out[1]);
            if (m < 0.5) continue;
            const len = Math.min(sp * 0.8, 4 + m * 0.22);
            const ux = out[0] / m;
            const uy = out[1] / m;
            const X = x - ux * len * 0.5;
            const Y = y + top - sy - uy * len * 0.5;
            const X2 = X + ux * len;
            const Y2 = Y + uy * len;
            const p = buckets[m < 25 ? 0 : m < 60 ? 1 : 2];
            p.moveTo(X, Y);
            p.lineTo(X2, Y2);
            p.lineTo(X2 - ux * 3.5 - uy * 2.2, Y2 - uy * 3.5 + ux * 2.2);
          }
        }
      }
      ctx.lineWidth = 1;
      ["rgba(90,120,170,0.45)", "rgba(130,175,235,0.6)", "rgba(200,225,255,0.75)"].forEach((s, k) => {
        ctx.strokeStyle = s;
        ctx.stroke(buckets[k]);
      });
    }

    // traceurs
    const KK = SIM.KK;
    const n0 = v.n0;
    const fr = v.frac;
    const halfW = W / 2;
    const trails = rankCol.map(() => new Path2D());
    const heads = rankCol.map(() => new Path2D());
    const ghosts = rankCol.map(() => new Path2D());
    const counts = new Array(R).fill(0);
    const haloCounts = new Array(R).fill(0);
    let heroCounts = null;
    let total = 0;
    let haloTotal = 0;
    for (const sys of v.visible) {
      const oy = sys.g.top - sy;
      const local = sys.id === "hero" ? (heroCounts = new Array(R).fill(0)) : null;
      for (let i = 0; i < sys.N; i++) {
        const spn = sys.sp[i];
        if (!(spn <= n0)) continue;
        const base = i * KK;
        const a0 = base + (n0 % KK);
        const a1 = base + ((n0 + 1) % KK);
        let x0 = sys.hx[a0];
        let x1 = sys.hx[a1];
        if (x1 - x0 > halfW) x1 -= W;
        else if (x0 - x1 > halfW) x1 += W;
        let hx = x0 + (x1 - x0) * fr;
        if (hx < 0) hx += W;
        else if (hx >= W) hx -= W;
        const hy = sys.hy[a0] + (sys.hy[a1] - sys.hy[a0]) * fr + oy;
        const r = Math.min(R - 1, Math.floor((hx / W) * R));
        if (local) local[r]++;
        if (hy < -40 || hy > vh + 40) continue;
        const age = v.tf - spn;
        if (age > SIM.LIFE - 1) continue;
        total++;
        counts[r]++;
        if (lay.trail) {
          const p = trails[r];
          p.moveTo(hx, hy);
          const kmin = Math.max(spn, n0 - 6);
          let px = hx;
          for (let k = n0; k >= kmin; k--) {
            const j = base + (k % KK);
            const X = sys.hx[j];
            const Y = sys.hy[j] + oy;
            if (Math.abs(X - px) > halfW) p.moveTo(X, Y);
            else p.lineTo(X, Y);
            px = X;
          }
        }
        heads[r].rect(hx - 1.2, hy - 1.2, 2.4, 2.4);
        // copie fantôme dans le halo du rang voisin
        if (R > 1) {
          const lx = hx - (r * W) / R;
          const rx = ((r + 1) * W) / R - hx;
          let nb = -1;
          if (lx < HALO) nb = (r + R - 1) % R;
          else if (rx < HALO) nb = (r + 1) % R;
          if (nb >= 0) {
            haloCounts[r]++;
            haloTotal++;
            if (lay.halo) {
              ghosts[nb].moveTo(hx + 3, hy);
              ghosts[nb].arc(hx, hy, 3, 0, Math.PI * 2);
            }
          }
        }
      }
    }
    ctx.lineWidth = 1;
    for (let r = 0; r < R; r++) {
      if (lay.trail) {
        ctx.strokeStyle = rgba(rankCol[r], 0.42);
        ctx.stroke(trails[r]);
      }
      ctx.fillStyle = rgba(rankCol[r], 0.95);
      ctx.fill(heads[r]);
      if (lay.halo) {
        ctx.strokeStyle = rgba(rankCol[r], 0.8);
        ctx.stroke(ghosts[r]);
      }
    }

    // HUD : une mise à jour par tick (valeurs déterministes)
    if (n0 !== lastHudTick) {
      lastHudTick = n0;
      if (hud.step) hud.step.textContent = `#${fmtInt(n0)}`;
      if (hud.barstep) hud.barstep.textContent = `step #${fmtInt(n0)}`;
      if (hud.t) hud.t.textContent = `${fmtInt(n0 * SIM.DT)}.${String(Math.round((n0 % 20) * 5)).padStart(2, "0")} s`;
      const all = SIM.systems.reduce((s, x) => s + x.N, 0);
      if (hud.n) hud.n.textContent = `${fmtInt(total)} on screen / ${fmtInt(all)}`;
      if (hud.dom) hud.dom.textContent = `x-periodic · Lx = ${Math.round(W)} px`;
      const ld = heroCounts || counts;
      const mx = Math.max(1, ...ld);
      if (hud.bars) {
        const bars = hud.bars.children;
        for (let r = 0; r < bars.length && r < ld.length; r++) bars[r].style.setProperty("--h", `${Math.round((ld[r] / mx) * 100)}%`);
      }
      if (hud.halo) hud.halo.textContent = `${haloTotal} ghost tracers / step`;
      // modèle de coût JOUET (pas une mesure) : max_r(n_r·a + h_r·b) + c·log2(R)
      const sum = ld.reduce((a, b) => a + b, 0) || 1;
      let tmax = 0;
      for (let r = 0; r < R; r++) tmax = Math.max(tmax, ld[r] * 0.8 + haloCounts[r] * 3);
      tmax += R > 1 ? 12 * Math.log2(R) : 0;
      const t1 = sum * 0.8;
      const imb = (mx / (sum / R) - 1) * 100;
      if (hud.cost) hud.cost.textContent = `${tmax.toFixed(0)} µs/step · ×${(t1 / tmax).toFixed(2)} · imbalance ${imb.toFixed(0)}% (toy model)`;
    }
  }

  function overlay(ctx, sys, oy, SIM) {
    const L = SIM.layout;
    const v = SIM.view;
    const W = v.W;
    const vh = v.vh;
    // limite d'étage
    if (oy > -2 && oy < vh) {
      ctx.strokeStyle = "rgba(57,208,255,0.35)";
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(0, Math.round(oy) + 0.5);
      ctx.lineTo(W, Math.round(oy) + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    switch (sys.id) {
      case "hero": {
        const A = L.hero;
        const y = A.y + oy;
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.setLineDash([3, 5]);
        for (const rr of [A.r * 1.414 + 8, A.r + 30 + A.r * 0.9, A.r * 3.2]) {
          ctx.beginPath();
          ctx.arc(A.x, y, rr, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        break;
      }
      case "apropos": {
        const cs = 24;
        const H = sys.g.H;
        const nx = Math.ceil(W / cs);
        const ny = Math.ceil(H / cs);
        if (!heat || heat.length !== nx * ny) heat = new Uint16Array(nx * ny);
        else heat.fill(0);
        const KK = SIM.KK;
        const n0 = v.n0;
        for (let i = 0; i < sys.N; i++) {
          if (!(sys.sp[i] <= n0)) continue;
          const j = i * KK + (n0 % KK);
          const cx = Math.floor(sys.hx[j] / cs);
          const cy = Math.floor(sys.hy[j] / cs);
          if (cx >= 0 && cx < nx && cy >= 0 && cy < ny) heat[cy * nx + cx]++;
        }
        for (let cy = 0; cy < ny; cy++) {
          const Y = cy * cs + oy;
          if (Y < -cs || Y > vh) continue;
          for (let cx = 0; cx < nx; cx++) {
            const c = heat[cy * nx + cx];
            if (!c) continue;
            const t = Math.min(1, c / 7);
            ctx.fillStyle = `rgba(${Math.round(120 + 135 * t)},${Math.round(40 + 120 * t * t)},${Math.round(110 - 80 * t)},${(0.1 + 0.32 * t).toFixed(3)})`;
            ctx.fillRect(cx * cs + 1, Y + 1, cs - 1, cs - 1);
          }
        }
        const S = L.src;
        cross(ctx, S.x, S.y + oy, 9, "rgba(255,255,255,0.9)");
        break;
      }
      case "experiences": {
        // ligne de courant centrale
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        const y0 = Math.max(0, -oy - 20);
        const y1 = Math.min(sys.g.H, vh - oy + 20);
        for (let y = y0; y <= y1; y += 8) {
          const x = SIM.riverX(y, sys.g);
          if (y === y0) ctx.moveTo(x, y + oy);
          else ctx.lineTo(x, y + oy);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        amr(ctx, sys, oy, SIM, y0, y1);
        break;
      }
      case "competences": {
        if (iso) {
          ctx.strokeStyle = "rgba(160,200,255,0.22)";
          ctx.beginPath();
          for (let k = 0; k < iso.length; k += 4) {
            const Y1 = iso[k + 1] + oy;
            if (Y1 < -20 || Y1 > vh + 20) continue;
            ctx.moveTo(iso[k], Y1);
            ctx.lineTo(iso[k + 2], iso[k + 3] + oy);
          }
          ctx.stroke();
        }
        for (const a of L.att) cross(ctx, a.x, a.y + oy, 8, "rgba(255,255,255,0.9)");
        break;
      }
      case "formation": {
        const Z = sys.g.lat;
        ctx.strokeStyle = "rgba(200,220,255,0.35)";
        ctx.beginPath();
        for (let r = 0; r < Z.ny; r++) {
          const Y = Z.y0 + (r + 0.5) * Z.sy + oy;
          if (Y < -10 || Y > vh + 10) continue;
          for (let c = 0; c < Z.nx; c++) {
            const X = Z.x0 + (c + 0.5) * Z.sx;
            ctx.moveTo(X - 2, Y);
            ctx.lineTo(X + 2, Y);
            ctx.moveTo(X, Y - 2);
            ctx.lineTo(X, Y + 2);
          }
        }
        ctx.stroke();
        // déplacement depuis la condition initiale
        ctx.strokeStyle = "rgba(255,176,31,0.22)";
        ctx.beginPath();
        const KK = SIM.KK;
        const n0 = v.n0;
        for (let i = 0; i < sys.N; i++) {
          if (!(sys.sp[i] <= n0)) continue;
          const j = i * KK + (n0 % KK);
          const X = sys.hx[j];
          const Y = sys.hy[j] + oy;
          if (Math.abs(X - sys.sx[i]) > W / 2) continue;
          ctx.moveTo(sys.sx[i], sys.sy[i] + oy);
          ctx.lineTo(X, Y);
        }
        ctx.stroke();
        break;
      }
      case "contact": {
        const C = L.sink;
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.arc(C.x, C.y + oy, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        cross(ctx, C.x, C.y + oy, 9, "rgba(255,255,255,0.9)");
        break;
      }
    }
  }

  function cross(ctx, x, y, s, c) {
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.lineTo(x + s, y);
    ctx.moveTo(x, y - s);
    ctx.lineTo(x, y + s);
    ctx.stroke();
  }

  // Quadtree AMR sur la portion visible : cellules racines alignées sur
  // l'origine de l'étage (déterministe), division tant que n > 5.
  function amr(ctx, sys, oy, SIM, y0, y1) {
    const v = SIM.view;
    const W = v.W;
    const S0 = SIM.layout.mobile ? W / 4 : 192;
    const D = SIM.layout.mobile ? 3 : 4;
    const fine = S0 / (1 << D);
    const r0 = Math.max(0, Math.floor(y0 / S0));
    const r1 = Math.ceil(y1 / S0);
    const cols = Math.ceil(W / S0);
    const fx = cols << D;
    const fy = (r1 - r0) << D;
    if (fy <= 0) return;
    const grid = new Uint16Array(fx * fy);
    const KK = SIM.KK;
    const n0 = v.n0;
    for (let i = 0; i < sys.N; i++) {
      if (!(sys.sp[i] <= n0)) continue;
      const j = i * KK + (n0 % KK);
      const cx = Math.floor(sys.hx[j] / fine);
      const cy = Math.floor(sys.hy[j] / fine) - (r0 << D);
      if (cx >= 0 && cx < fx && cy >= 0 && cy < fy) grid[cy * fx + cx]++;
    }
    const count = (cx, cy, size) => {
      let s = 0;
      for (let y = cy; y < cy + size; y++) for (let x = cx; x < cx + size; x++) s += grid[y * fx + x];
      return s;
    };
    const path = new Path2D();
    const fill = new Path2D();
    const rec = (cx, cy, lvl) => {
      const size = 1 << (D - lvl);
      const n = count(cx, cy, size);
      if (n > 5 && lvl < D) {
        const h = size >> 1;
        rec(cx, cy, lvl + 1);
        rec(cx + h, cy, lvl + 1);
        rec(cx, cy + h, lvl + 1);
        rec(cx + h, cy + h, lvl + 1);
        return;
      }
      const X = cx * fine;
      const Y = (cy + (r0 << D)) * fine + oy;
      const s = size * fine;
      if (Y > v.vh || Y + s < 0) return;
      path.rect(X + 0.5, Y + 0.5, s - 1, s - 1);
      if (lvl === D && n > 0) fill.rect(X + 1, Y + 1, s - 2, s - 2);
    };
    for (let r = 0; r < r1 - r0; r++) for (let c = 0; c < cols; c++) rec(c << D, r << D, 0);
    ctx.fillStyle = "rgba(57,208,255,0.10)";
    ctx.fill(fill);
    ctx.strokeStyle = "rgba(57,208,255,0.28)";
    ctx.stroke(path);
  }

  window.RENDER = { frame, layout };
})();
