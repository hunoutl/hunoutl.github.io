// sim-core.js — LE MÊME FICHIER sur les deux sites (Façade et Machine).
//
// Une seule simulation, deux regards. Ce fichier contient l'ÉTAT (vent,
// houle, échanges de halo, caméra du hero) et le rendu WebGL de la mer,
// en deux modes : 0 = Façade (eaux, écume, ciel), 1 = Machine (rangs,
// maillage, halos, carte de hauteur). Les faces n'ajoutent que leurs
// dessins (render-facade.js / render-machine.js).
//
// Bascule sans saut : l'aperçu iframe et la page d'arrivée calculent
// EXACTEMENT le même état au même instant :
//  - temps = horloge murale (époque fixe), ticks de 50 ms pour les traceurs
//    de vent, interpolés au rendu ; la houle et les échanges sont des
//    fonctions pures du temps ;
//  - traceurs à vie finie, naissance par hash entier seedé (repris de la
//    proposition "matiere") : position à T = fonction pure de T ;
//  - géométrie en coordonnées document (geo.js), caméra du hero = fonction
//    pure du scroll et de la largeur, jamais de la hauteur de fenêtre.
(function () {
  const TICK_HZ = 20;
  const DT = 1 / TICK_HZ;
  const TICK_MS = 1000 / TICK_HZ;
  const EPOCH = Date.UTC(2026, 0, 1);
  const LIFE = 90; // ticks (4,5 s)
  const K = 20; // longueur de traînée (ticks)
  const KK = K + 3;
  const PSTEP = 12; // un pas de calcul = 12 ticks (0,6 s) : un échange de halo
  const HALO = 12; // demi-largeur de bande de halo (px)
  const TAU = Math.PI * 2;
  const FROZEN_T = 6.3e8 + 0.37; // prefers-reduced-motion : même image des deux côtés

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isEmbedded = window.self !== window.top;

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

  function tickFloat() {
    if (typeof window.__SIM_T === "number") return (window.__SIM_T - EPOCH) / TICK_MS; // hook de test
    if (reduceMotion) return FROZEN_T;
    return (performance.timeOrigin + performance.now() - EPOCH) / TICK_MS;
  }

  // --- houle : somme d'ondes planes, solution exacte de l'équation des
  // ondes (ω = c·|k|). Fonction pure du temps. ---
  const C_WAVE = 30; // px/s
  const WAVES = [
    [330, 1.42, 0.42],
    [220, 1.85, 0.3],
    [150, 1.12, 0.2],
    [105, 2.2, 0.13],
  ].map(([lam, ang, a]) => {
    const k = TAU / lam;
    return { kx: k * Math.cos(ang), ky: k * Math.sin(ang), a, om: C_WAVE * k };
  });
  function swell(x, y, tsec) {
    let h = 0;
    for (const w of WAVES) h += w.a * Math.cos(w.kx * x + w.ky * y - ((w.om * tsec) % TAU));
    return h;
  }

  // --- caméra : perspective au hero, carte vue de dessus ensuite ---
  // Le tangage passe de φ0 à 90° pendant que les nuages couvrent l'écran
  // (fenêtre [c0, c1] du scroll) ; avant, la caméra monte doucement.
  function camera(L, s) {
    const C = L.cam;
    const u = Math.min(1, Math.max(0, (s - C.c0) / (C.c1 - C.c0)));
    const e = u * u * (3 - 2 * u);
    const phi = C.phi0 + (Math.PI / 2 - C.phi0) * e;
    const c = C.yh + C.f * Math.tan(C.phi0) - Math.min(s, C.c0) * 0.45;
    const p = Math.min(1, s / C.end);
    return { p, flat: s >= C.c1, f: C.f, c, sin: Math.sin(phi), cos: Math.cos(phi), hz: c - C.f * Math.tan(phi), s, W: L.W };
  }
  // monde (x, y document) → écran ; renvoie null si derrière la caméra.
  function project(cam, x, y, out) {
    if (cam.flat) {
      out[0] = x;
      out[1] = y - cam.s;
      out[2] = 1;
      return out;
    }
    const Z = cam.s + cam.c - y;
    const den = Z * cam.cos + cam.f * cam.sin;
    if (den <= 1e-3) return null;
    const a = (cam.f * (cam.f * cam.cos - Z * cam.sin)) / den;
    const t = cam.f / (cam.f * cam.sin + a * cam.cos);
    out[0] = cam.W / 2 + (x - cam.W / 2) / t;
    out[1] = cam.c + a;
    out[2] = 1 / t;
    return out;
  }

  // --- terre / mer : champ de distance signé à la côte (px, > 0 en mer),
  // sur une grille (4 px mobile, 6 px desktop), calculé une fois par mise
  // en page (masque des polygones + distance de chanfrein). Même calcul des
  // deux côtés : la Façade y fait l'écume, la Machine les cellules masquées.
  // Calcul paresseux, étage par étage (fenêtre = ses îles + 80 px) : les
  // étages visibles d'abord (premier rendu), les autres au repos. Un étage
  // n'est simulé qu'une fois ses voisins calculés : l'état reste une
  // fonction pure du temps, quel que soit l'ordre de calcul.
  const DF = { g: 4, nx: 0, ny: 0, d: null, done: null, L: null };
  const CAP = 190;
  function buildDistance(L) {
    const g = L.m ? 4 : 6;
    DF.g = g;
    DF.nx = Math.ceil(L.W / g) + 1;
    DF.ny = Math.ceil(L.docH / g) + 1;
    DF.d = new Float32Array(DF.nx * DF.ny).fill(CAP);
    DF.done = new Uint8Array(L.floors.length);
    DF.L = L;
  }
  function needFloor(i) {
    if (i < 0 || i >= DF.L.floors.length || DF.done[i]) return;
    DF.done[i] = 1;
    computeFloor(DF.L, DF.L.floors[i]);
  }
  function computeFloor(L, fl) {
    const g = DF.g, nx = DF.nx, ny = DF.ny, d = DF.d;
    {
      const polys = L.isles.concat(L.annex).filter((o) => o.floor === fl.id).map((o) => o.pts.map(([x, y]) => [x / g, (y + fl.top) / g]));
      if (!polys.length) return;
      let y0 = Infinity, y1 = -Infinity;
      for (const P of polys) for (const q of P) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
      const j0 = Math.max(0, Math.floor(y0 - 80 / g));
      const j1 = Math.min(ny - 1, Math.ceil(y1 + 80 / g));
      const h = j1 - j0 + 1;
      const land = new Uint8Array(nx * h);
      // remplissage par balayage de lignes (parité des croisements)
      const xs = [];
      for (let j = j0; j <= j1; j++) {
        for (const P of polys) {
          xs.length = 0;
          for (let i = 0, k = P.length - 1; i < P.length; k = i++) {
            const [xi, yi] = P[i], [xk, yk] = P[k];
            if (yi > j !== yk > j) xs.push(xi + ((j - yi) * (xk - xi)) / (yk - yi));
          }
          xs.sort((a, b) => a - b);
          for (let q = 0; q + 1 < xs.length; q += 2)
            for (let i = Math.max(0, Math.ceil(xs[q])); i <= Math.min(nx - 1, Math.floor(xs[q + 1])); i++) land[(j - j0) * nx + i] = 1;
        }
      }
      const BIG = 1e9, A = 1, B = Math.SQRT2;
      const pass = (inv) => {
        const e = new Float32Array(nx * h);
        for (let k = 0; k < e.length; k++) e[k] = (land[k] ^ inv) ? 0 : BIG;
        for (let j = 0; j < h; j++)
          for (let i = 0; i < nx; i++) {
            const k = j * nx + i;
            let v = e[k];
            if (i > 0) v = Math.min(v, e[k - 1] + A);
            if (j > 0) {
              v = Math.min(v, e[k - nx] + A);
              if (i > 0) v = Math.min(v, e[k - nx - 1] + B);
              if (i < nx - 1) v = Math.min(v, e[k - nx + 1] + B);
            }
            e[k] = v;
          }
        for (let j = h - 1; j >= 0; j--)
          for (let i = nx - 1; i >= 0; i--) {
            const k = j * nx + i;
            let v = e[k];
            if (i < nx - 1) v = Math.min(v, e[k + 1] + A);
            if (j < h - 1) {
              v = Math.min(v, e[k + nx] + A);
              if (i < nx - 1) v = Math.min(v, e[k + nx + 1] + B);
              if (i > 0) v = Math.min(v, e[k + nx - 1] + B);
            }
            e[k] = v;
          }
        return e;
      };
      const out = pass(0);
      const inn = pass(1);
      for (let k = 0; k < land.length; k++) {
        const v = land[k] ? -(inn[k] - 0.5) * g : (out[k] - 0.5) * g;
        const K = j0 * nx + k;
        d[K] = Math.min(d[K], Math.min(CAP, v));
      }
      uploadDistRows(j0, h);
    }
  }
  function dist(x, y) {
    const D = DF;
    if (!D.d) return 999;
    const fx = Math.min(Math.max(x / D.g, 0), D.nx - 1.001);
    const fy = Math.min(Math.max(y / D.g, 0), D.ny - 1.001);
    const i = fx | 0, j = fy | 0, u = fx - i, v = fy - j;
    const k = j * D.nx + i;
    const a = D.d[k], b = D.d[k + 1], c = D.d[k + D.nx], e = D.d[k + D.nx + 1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + e) * u * v;
  }

  // --- vent : écoulement de fond (ψ, ∇·u = 0) + les 5 vents de la rose ---
  function makeModes(W) {
    const lam = [620, 340, 190];
    const spd = [20, 12, 7];
    const om = [0.23, 0.31, 0.43];
    const ph = [0.0, 1.7, 4.1];
    const sy = [1, -1, 1];
    return lam.map((l, j) => {
      const n = Math.max(1, Math.round((W * 0.6) / l));
      const kx = (TAU * n) / W;
      const ky = sy[j] * 0.8 * (TAU / l);
      return { kx, ky, a: spd[j] / Math.hypot(kx, ky), om: om[j], ph: ph[j] };
    });
  }
  const WIND_U = 11;
  function field(x, y, tau, g, o) {
    let u = 0;
    let v = 0;
    const md = g.modes;
    for (let j = 0; j < 3; j++) {
      const m = md[j];
      const c = Math.cos(m.kx * x + m.ky * y + m.om * tau + m.ph) * m.a;
      u += c * m.ky;
      v -= c * m.kx;
    }
    u = u * 0.8 + g.wx;
    v = v * 0.8 + g.wy;
    // îles = obstacles : près de la côte, on retire la composante qui entre
    // dans la terre et on accélère le long de la côte (contournement)
    const d = dist(x, y);
    if (d < 36) {
      const nx = dist(x + 3, y) - dist(x - 3, y);
      const ny = dist(x, y + 3) - dist(x, y - 3);
      const nn = Math.hypot(nx, ny) || 1;
      const ux = nx / nn, uy = ny / nn;
      const w = Math.min(1, Math.max(0, 1 - d / 36));
      const un = u * ux + v * uy;
      if (un < 0) {
        u -= un * ux * w * 1.15;
        v -= un * uy * w * 1.15;
      }
      u *= 1 + 0.3 * w;
      v *= 1 + 0.3 * w;
    }
    o[0] = u;
    o[1] = v;
  }

  function makeSystem(fl, L, modes, idx) {
    const W = L.W;
    const y0 = fl.id === "hero" ? -900 : fl.top;
    const y1 = fl.top + fl.h;
    // vent moyen de l'étage (direction seedée, régulière) + dérive d'ouest
    const wa = 0.25 + 0.9 * Math.sin(idx * 1.7);
    const wx = 10 + WIND_U * Math.cos(wa);
    const wy = WIND_U * Math.sin(wa);
    const H = y1 - y0;
    const dens = L.m ? 30 : 22;
    let N = Math.round((dens * W * H) / 1e5);
    N = Math.max(60, Math.min(900, N));
    const sys = {
      id: fl.id,
      seed: 31 + idx * 17,
      g: { W, y0, H, modes, wx, wy },
      top: y0,
      bot: y1,
      N,
      n: -1,
      hx: new Float64Array(N * KK),
      hy: new Float64Array(N * KK),
      sp: new Float64Array(N).fill(NaN),
      ph: new Float64Array(N),
    };
    for (let i = 0; i < N; i++) sys.ph[i] = hash3(sys.seed, i, 7) % LIFE;
    return sys;
  }
  const v1 = [0, 0];
  const v2 = [0, 0];
  function lifeStart(sys, i, T) {
    const ph = sys.ph[i];
    return Math.floor((T + ph) / LIFE) * LIFE - ph;
  }
  function spawn(sys, i, s) {
    const m = (s + sys.ph[i]) / LIFE;
    let x = 0;
    let y = 0;
    for (let t = 0; t < 6; t++) {
      x = (hash3(sys.seed, i, m + t * 7919) / 4294967296) * sys.g.W;
      y = sys.g.y0 + (hash3(sys.seed + 1, i, m + t * 7919) / 4294967296) * sys.g.H;
      if (dist(x, y) > 10) break;
    }
    const j = i * KK + (((s % KK) + KK) % KK);
    sys.hx[j] = x;
    sys.hy[j] = y;
    sys.sp[i] = s;
  }
  function stepParticle(sys, i, k) {
    const g = sys.g;
    const a = i * KK + (((k % KK) + KK) % KK);
    const b = i * KK + ((((k + 1) % KK) + KK) % KK);
    const x = sys.hx[a];
    const y = sys.hy[a];
    const tau = k * DT;
    field(x, y, tau, g, v1);
    field(x + v1[0] * DT * 0.5, y + v1[1] * DT * 0.5, tau + DT * 0.5, g, v2);
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
    if (sys.n < 0 || T < sys.n || T - sys.n >= LIFE) fullCompute(sys, T);
    else while (sys.n < T) stepAll(sys);
  }
  // Parcourt les traînées visibles : cb(sys, i, age01, k0) ; l'appelant lit
  // sys.hx/hy à l'indice i*KK + (k % KK) pour k de k0 à n0+1.
  function eachTracer(cb) {
    const v = SIM.view;
    for (const sys of v.visible) {
      for (let i = 0; i < sys.N; i++) {
        const s = sys.sp[i];
        const age = (v.n0 + 1 - s) / LIFE;
        cb(sys, i, age, Math.max(s, v.n0 + 1 - K));
      }
    }
  }

  // --- échanges de halo : aux 3 interfaces entre les 4 rangs, un paquet
  // par créneau (tous les 22 px) et par pas, s'il est tiré. Fonction pure. ---
  const SLOT = 22;
  function packets(y0, y1, cb) {
    const v = SIM.view;
    const st = v.tf / PSTEP;
    const n = Math.floor(st);
    const prog = st - n;
    const W = v.W;
    for (let j = 1; j <= 3; j++) {
      const xb = (W * j) / 4;
      for (let i = Math.floor(y0 / SLOT); i <= y1 / SLOT; i++) {
        const h = hash3(j * 977 + 3, i, n);
        if (h % 3 !== 0) continue;
        const dir = h & 8 ? 1 : -1;
        const yy = i * SLOT + ((h >>> 5) % 9) - 4;
        const x = xb + dir * HALO * (2 * prog - 1);
        cb(x, yy, dir, j, prog, h);
      }
    }
  }

  // --- WebGL : la mer (les deux modes) ---
  const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  const FS = `precision highp float;
uniform vec2 uView;uniform float uDpr,uCH,uScroll,uFlat,uDocH,uT,uMode,uHalo;
uniform vec4 uCam,uKx,uKy,uA,uPh;uniform vec3 uSun,uDG;
uniform vec3 uR0,uR1,uR2,uR3;uniform sampler2D uPal,uDist;
const vec3 PAPER=vec3(.957,.925,.855);const vec3 INK=vec3(.13,.16,.2);
const vec3 BG=vec3(.008,.024,.016);const vec3 PH=vec3(.22,1.,.5);
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
vec3 rk(float r){return r<.5?uR0:r<1.5?uR1:r<2.5?uR2:uR3;}
float dist(vec2 p){vec2 q=(p/uDG.x+.5)/uDG.yz;return texture2D(uDist,q).r*255.-64.;}
float swell(vec2 p,float fw,out vec2 g){vec4 ph=uKx*p.x+uKy*p.y-uPh;vec4 k=sqrt(uKx*uKx+uKy*uKy);
vec4 A=uA*clamp(1.6-fw*k*1.2,0.,1.);vec4 s=sin(ph);g=vec2(-dot(A*s,uKx),-dot(A*s,uKy));return dot(A,cos(ph));}
float line(float d,float w,float fw){return 1.-smoothstep(w*.5,w*.5+fw,abs(d));}
vec3 facade(vec2 p,float fw,float far){
float v=clamp(p.y/uDocH,0.,1.);vec4 pw=texture2D(uPal,vec2(.125,v));vec3 wash=pw.rgb;float nt=texture2D(uPal,vec2(.625,v)).r;
float d=dist(p);if(d<0.)return PAPER;
float pig=.62+.22*(vn(p*.0045+vec2(3.1,uT*.004))-.5)+.12*(vn(p*.021)-.5);
pig+=.38*exp(-d/9.);pig-=.14*vn(p*.42);
vec3 col=mix(PAPER,wash,clamp(pig+nt*.5,0.,1.));
vec2 g;float h=swell(p,fw,g);
float off=smoothstep(26.,60.,d)*(1.-far);
float n=vn(p*vec2(.03,.05)+vec2(uT*.06,0.));
float ink=line((h-.5)/(length(g)+1e-4),.9,fw)*smoothstep(.45,.7,n)*off;
ink+=line((h+.1)/(length(g)+1e-4),.7,fw)*smoothstep(.62,.8,n)*off*.6;
for(int i=1;i<4;i++){float fi=float(i);float wd=fi*8.+2.*sin(p.x*.05+fi+h*1.5);ink+=line(d-wd,.8,fw)*(.75-fi*.18)*step(.25,vn(p*.08+fi));}
float br=smoothstep(.15,.6,h)*(1.-smoothstep(1.,6.,d));col=mix(col,PAPER*1.02,br*.85);
col=mix(col,mix(INK,vec3(.86,.88,.97),nt*.85),clamp(ink,0.,1.)*.5*(1.-far));
col*=.975+.04*hash(floor(p*1.5));
return col;}
vec3 machine(vec2 p,float fw,float far){
float W=uView.x;vec3 col=BG;float r=clamp(floor(p.x/W*4.),0.,3.);vec3 rc=rk(r);
col+=rc*.025*uFlat;vec2 cl=(floor(p/24.)+.5)*24.;float dc=dist(cl);float d=dist(p);
vec2 q=abs(fract(p/24.+.5)-.5)*24.;float gm=1.-smoothstep(0.,fw*1.1,min(q.x,q.y));
if(dc<0.){col=mix(col,PH*.16,.6);float hx=line(fract((p.x+p.y)/8.)*8.-4.,1.,fw);col+=PH*.1*hx;col+=PH*.35*gm;}
else{col+=PH*.11*gm*clamp(2.2-fw*.35,0.,1.);}
vec2 Q=abs(fract(p/120.+.5)-.5)*120.;col+=PH*.16*(1.-smoothstep(0.,fw*1.2,min(Q.x,Q.y)))*clamp(2.5-fw*.15,0.,1.);
for(int j=1;j<4;j++){if(uFlat<.5)break;float fj=float(j);float xb=W*fj/4.;float dx=abs(p.x-xb);
vec3 hcol=p.x<xb?rk(fj-1.):rk(fj);col+=hcol*.04*(1.-smoothstep(uHalo-fw*.5,uHalo+fw*.5,dx));
col+=hcol*.2*line(dx-uHalo,1.,fw)*(1.-far);col+=mix(rk(fj-1.),rk(fj),.5)*.35*line(dx,1.,fw);}
return col;}
vec3 skyF(vec2 sp,float e){vec3 wash=texture2D(uPal,vec2(.375,0.)).rgb;
vec3 col=mix(PAPER,wash,.18+.4*smoothstep(0.,520.,e));
float hl=line(fract(sp.y/5.)*5.-2.5,.8,1.)*(1.-smoothstep(10.,140.,e))*step(.35,vn(vec2(sp.x*.02,floor(sp.y/5.))));
col=mix(col,INK,hl*.35);float sd=length(sp-uSun.xy);
col=mix(col,vec3(.98,.88,.6),(1.-smoothstep(uSun.z-1.,uSun.z+1.,sd))*.8);col=mix(col,INK,line(sd-uSun.z,1.6,1.));
for(int i=0;i<12;i++){float a=float(i)*.5236;vec2 dir=vec2(cos(a),sin(a));vec2 rel=sp-uSun.xy;float t=dot(rel,dir);
float o=length(rel-dir*t);col=mix(col,INK,line(o,1.,1.)*step(uSun.z+8.,t)*step(t,uSun.z+22.+6.*mod(float(i),2.)));}
col*=.975+.04*hash(floor(sp*1.5));
return mix(col,INK,line(e,1.6,1.));}
vec3 skyM(vec2 sp,float e){vec3 col=BG;vec2 gq=abs(fract(sp/32.)-.5)*32.;col+=PH*.05*(1.-smoothstep(0.,1.,min(gq.x,gq.y)));
return col+PH*line(e,1.2,1.)*.7;}
void main(){vec2 sp=vec2(gl_FragCoord.x,uCH-gl_FragCoord.y)/uDpr;float W=uView.x;float md=uMode;
vec2 p;float fw;float far=0.;float hz=uCam.y-uCam.x*uCam.z/max(uCam.w,1e-5);
if(uFlat>.5){p=vec2(sp.x,uScroll+sp.y);fw=1./uDpr;}else{
float a=sp.y-uCam.y;float den=uCam.x*uCam.z+a*uCam.w;
if(den<=0.){float e=hz-sp.y;gl_FragColor=vec4(md>.5?skyM(sp,e):skyF(sp,e),1.);return;}
float t=uCam.x/den;float Z=t*(uCam.x*uCam.w-a*uCam.z);p=vec2(W*.5+t*(sp.x-W*.5),uScroll+uCam.y-Z);
fw=max(t,t*t)/uDpr;far=1.-exp(-max(Z,0.)/2600.);}
vec3 col=md>.5?machine(p,fw,far):facade(p,fw,far);
if(uFlat<.5){col=mix(col,md>.5?BG:PAPER,far*.75);}
gl_FragColor=vec4(col,1.);}`;

  let gl = null;
  let prog = null;
  let U = {};
  let palTex = null;
  function initGL(cv) {
    try {
      gl = cv.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false });
    } catch (e) {
      gl = null;
    }
    if (!gl) return false;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s));
      return s;
    };
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(prog));
      gl = null;
      return false;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const u = gl.getActiveUniform(prog, i);
      U[u.name] = gl.getUniformLocation(prog, u.name);
    }
    palTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, palTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(U.uPal, 0);
    return true;
  }
  let distTex = null;
  function uploadDistRows(j0, h) {
    if (!gl || !distTex) return;
    const b = new Uint8Array(DF.nx * h);
    const o = j0 * DF.nx;
    for (let k = 0; k < b.length; k++) b[k] = Math.max(0, Math.min(255, Math.round(DF.d[o + k] + 64)));
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, distTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, j0, DF.nx, h, gl.LUMINANCE, gl.UNSIGNED_BYTE, b);
    gl.activeTexture(gl.TEXTURE0);
  }
  function uploadDistance() {
    if (!gl || !DF.d) return;
    const b = new Uint8Array(DF.nx * DF.ny).fill(CAP + 64);
    if (!distTex) distTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, distTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, DF.nx, DF.ny, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, b);
    gl.uniform1i(U.uDist, 1);
    gl.uniform3f(U.uDG, DF.g, DF.nx, DF.ny);
    gl.activeTexture(gl.TEXTURE0);
  }
  function uploadPalette() {
    if (!gl || !window.RENDER || !RENDER.palette) return;
    const rows = 256;
    const data = new Uint8Array(4 * rows * 4);
    RENDER.palette(SIM.layout, rows, data);
    gl.bindTexture(gl.TEXTURE_2D, palTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    const rc = RENDER.ranks || [[79, 125, 255], [34, 224, 192], [255, 176, 31], [255, 79, 94]];
    ["uR0", "uR1", "uR2", "uR3"].forEach((n, k) => gl.uniform3f(U[n], rc[k][0] / 255, rc[k][1] / 255, rc[k][2] / 255));
  }
  function drawGL() {
    if (!gl) return;
    const v = SIM.view;
    const cam = v.cam;
    const tsec = (v.tf * TICK_MS) / 1000;
    gl.viewport(0, 0, sea.width, sea.height);
    gl.uniform2f(U.uView, v.W, v.vh);
    gl.uniform1f(U.uDpr, sea.width / v.W);
    gl.uniform1f(U.uCH, sea.height);
    gl.uniform1f(U.uScroll, v.scrollY);
    gl.uniform1f(U.uFlat, cam.flat ? 1 : 0);
    gl.uniform1f(U.uDocH, SIM.layout.docH);
    gl.uniform1f(U.uT, tsec % 4096);
    gl.uniform1f(U.uMode, RENDER.mode || 0);
    gl.uniform1f(U.uHalo, HALO);
    gl.uniform4f(U.uCam, cam.f, cam.c, cam.sin, cam.cos);
    const ph = WAVES.map((w) => (w.om * tsec) % TAU);
    gl.uniform4f(U.uKx, WAVES[0].kx, WAVES[1].kx, WAVES[2].kx, WAVES[3].kx);
    gl.uniform4f(U.uKy, WAVES[0].ky, WAVES[1].ky, WAVES[2].ky, WAVES[3].ky);
    gl.uniform4f(U.uA, WAVES[0].a, WAVES[1].a, WAVES[2].a, WAVES[3].a);
    gl.uniform4f(U.uPh, ph[0], ph[1], ph[2], ph[3]);
    const sun = SIM.sunPos(cam);
    gl.uniform3f(U.uSun, sun[0], sun[1], sun[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // --- état global, canvas et boucle ---
  const SIM = {
    TICK_HZ, DT, TICK_MS, LIFE, K, KK, PSTEP, HALO,
    hash3, swell, camera, project, packets, eachTracer, field, dist,
    systems: [],
    layout: null,
    view: { scrollY: 0, vh: 0, W: 0, tf: 0, n0: 0, frac: 0, dpr: 1, visible: [], cam: null, tsec: 0 },
    embedded: isEmbedded,
    reduceMotion,
    sunPos(cam) {
      return [cam.W * (cam.W < GEO.BP ? 0.84 : 0.8), cam.hz - (cam.W < GEO.BP ? 64 : 300), cam.W < GEO.BP ? 22 : 46];
    },
  };
  window.SIM = SIM;

  let sea = null;
  let fx = null;
  let ctx = null;
  let running = false;
  let onScreen = true;
  let rafId = 0;
  let lastKey = "";

  function build() {
    const W = window.innerWidth;
    const L = GEO.layout(W);
    SIM.layout = L;
    buildDistance(L);
    uploadDistance();
    const modes = makeModes(W);
    SIM.systems = L.floors.map((fl, i) => makeSystem(fl, L, modes, i));
    lastKey = "";
    if (window.RENDER && RENDER.layout) RENDER.layout(SIM);
    uploadPalette();
  }

  function sizeCanvas() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const mob = W < GEO.BP;
    const dpr = window.devicePixelRatio || 1;
    const d2 = Math.min(dpr, mob ? 1.5 : 1.75);
    const d1 = Math.min(dpr, mob ? 1.25 : 1.5);
    SIM.view.dpr = d2;
    for (const [c, d] of [[fx, d2], [sea, d1]]) {
      if (!c) continue;
      c.style.width = `${W}px`;
      c.style.height = `${H}px`;
      c.width = Math.round(W * d);
      c.height = Math.round(H * d);
    }
    lastKey = "";
  }

  // Iframe miroir hors champ : dessin ralenti (pas arrêté : Chrome cesse
  // alors de présenter l'iframe cross-site, qui glisse vide — leçon de "matiere").
  const HIDDEN_FPS = 6;
  let lastHiddenDraw = 0;
  let wakeUntil = 0;
  let idleTick = 0;
  let parity = 0;
  function frame(ts) {
    rafId = 0;
    if (!running) return;
    // Page de départ pendant un glissement : une image sur deux, pour
    // laisser le processeur à l'iframe qui se révèle sous le doigt.
    const busy = !isEmbedded && document.body.classList.contains("dragging");
    if (busy && (parity++ & 1)) {
      schedule();
      return;
    }
    if (onScreen || ts < wakeUntil) draw();
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
    v.tsec = (v.tf * TICK_MS) / 1000;
    const key = `${v.n0}|${v.scrollY}|${v.vh}|${v.W}|${SIM.renderKey || ""}`;
    if ((reduceMotion || typeof window.__SIM_T === "number") && key === lastKey) return;
    lastKey = key;
    v.cam = camera(SIM.layout, v.scrollY);
    const top = v.cam.flat ? v.scrollY - 120 : -1e9;
    const bot = v.scrollY + v.vh + 120;
    v.visible.length = 0;
    for (let i = 0; i < SIM.systems.length; i++) {
      const sys = SIM.systems[i];
      if (sys.bot < top || sys.top > bot) continue;
      needFloor(i - 1);
      needFloor(i);
      needFloor(i + 1);
      ensure(sys, v.n0 + 1);
      v.visible.push(sys);
    }
    // îlots bâtis hors champ : distance calculée au repos (un étage par image)
    if (DF.done) {
      const k = DF.done.indexOf(0);
      if (k >= 0 && idleTick++ % 2 === 1) needFloor(k);
    }
    drawGL();
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    if (window.RENDER) RENDER.frame(ctx, SIM);
  }
  SIM.redraw = function () {
    lastKey = "";
    if (ctx) draw();
  };

  SIM.start = function () {
    sea = document.getElementById("sea");
    fx = document.getElementById("fx");
    if (!fx) return;
    ctx = fx.getContext("2d");
    if (!sea || !initGL(sea)) {
      if (sea) sea.style.display = "none";
      gl = null;
    }
    sizeCanvas();
    build();
    running = true;
    draw(); // premier rendu SYNCHRONE : présent dès le premier frame peint
    if (isEmbedded) {
      // Aperçu : annonce au parent qu'un état juste est affiché (le drag
      // peut démarrer sans attendre "load"), et réveil à pleine cadence
      // dès que le parent signale un contact du doigt.
      onScreen = false;
      try {
        window.parent.postMessage({ type: "mirror-ready" }, "*");
      } catch (e) {
        /* parent inaccessible */
      }
      window.addEventListener("message", (e) => {
        if (e.source !== window.parent || !e.data || e.data.type !== "wake") return;
        wakeUntil = performance.now() + 2500;
        draw();
      });
    }
    if (isEmbedded && "IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        const vis = entries[entries.length - 1].isIntersecting;
        if (vis && !onScreen) {
          onScreen = true;
          draw();
        } else if (!vis) onScreen = false;
      }).observe(fx);
    }
    schedule();
    let lastW = window.innerWidth;
    window.addEventListener("resize", () => {
      sizeCanvas();
      if (window.innerWidth !== lastW) {
        lastW = window.innerWidth;
        build();
      }
      SIM.redraw();
    });
    document.addEventListener("floors-rendered", () => {
      if (!SIM.layout) return;
      if (window.RENDER && RENDER.layout) RENDER.layout(SIM);
      SIM.redraw();
    });
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) SIM.redraw();
    });
  };
})();
