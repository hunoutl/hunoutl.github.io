// Machine — « Le plan ». La même géographie que l'atlas de la Façade
// (geo.js, identique des deux côtés), révélée comme l'infrastructure
// qu'elle cache : villes → nœuds de service, forêts → partitions de
// calcul, fleuve → backbone, sommets → commutateurs, rose des vents →
// anneau all-reduce, côte → domaine d'administration. Planches façon
// blueprint, cotes, cartouches techniques. Ce fichier ne fait que
// DESSINER et ÉCRIRE : toute position vient de geo.js.

const ICON_LINKEDIN = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.48v6.26zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>`;
const ICON_GITHUB = `<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`;
const ICON_GITLAB = `<svg viewBox="0 0 24 22" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 21.6 16.2 8.7H7.8L12 21.6Z"/><path d="M4.6 8.7 3 13.6a.9.9 0 0 0 .33 1L12 21.6 4.6 8.7Z"/><path d="M4.6 8.7h3.2L6.4 2.9a.45.45 0 0 0-.86 0L4.6 8.7Z"/><path d="M19.4 8.7 21 13.6a.9.9 0 0 1-.33 1L12 21.6l7.4-12.9Z"/><path d="M19.4 8.7h-3.2l1.4-5.8a.45.45 0 0 1 .86 0l1 3.87v1.93Z"/></svg>`;
const CONTACTS = `<div class="quick-contacts">
  <a href="https://www.linkedin.com/in/leo-hunout" target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn">${ICON_LINKEDIN}<span>in/leo-hunout</span></a>
  <a href="https://github.com/hunoutl" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub">${ICON_GITHUB}<span>gh/hunoutl</span></a>
  <a href="https://gitlab.com/hunoutl" target="_blank" rel="noopener" aria-label="GitLab" title="GitLab">${ICON_GITLAB}<span>gl/hunoutl</span></a>
</div>`;

// ------------------------------------------------------------------
// Textes
// ------------------------------------------------------------------
const T = {
  en: {
    plates: { hero: "sheet 01/05 · topology", apropos: "sheet 02/05 · all-reduce", competences: "sheet 03/05 · fat-tree", experiences: "sheet 04/05 · traceroute", formation: "sheet 05/05 · boot" },
    heroKicker: "SHEET 01/05 — SYSTEM TOPOLOGY",
    name: "Léo Hunout — AI/HPC Engineer",
    subtitle: "uptime: 4+ years · large-scale AI &amp; HPC infra",
    lede: "Multi-node GPU training, supercomputer ops, hybrid cloud/on-prem orchestration. Distributed training internals (FSDP/DDP/ZeRO, NCCL, tensor/pipeline parallelism), Slurm, Kubernetes, MPI/OpenMP.",
    legend: "<b>x-ray of the map</b> — same coordinates, pixel for pixel: town → service node · forest → compute partition · river → backbone · mountain → switch · coastline → admin domain.",
    photoAlt: "Photo of Léo Hunout",
    towns: { experiences: "login · traceroute", apropos: "ring · all-reduce", competences: "fabric · fat-tree", formation: "boot" },
    here: "$ ssh hunoutl@login",
    mapTitle: "FIG. 1 — system topology (illustrative)",
    scale: "1 hop",
    aproposTitle: "about",
    apropos: "Optimizing GPU clusters is only half the job — the other half is making that compute usable by people who aren't systems experts. 4 years supporting 3000+ researchers on Jean Zay (one of France's largest supercomputers) taught me as much about NCCL tuning and multi-node scaling as about writing docs and giving talks that don't assume prior HPC knowledge. Currently applying the same infra instincts to a tighter, quant-research context: hybrid cloud/on-prem orchestration instead of national-scale clusters.",
    ringNote: "The compass rose was a ring all along: 8 GPUs, one chunk each, reduce-scatter then all-gather. <i>Simulated, illustrative timings.</i>",
    values: [["north", "make_compute_usable"], ["east", "tune_gpu_clusters"], ["south", "explain_without_prereqs"], ["west", "support_researchers"]],
    skillsTitle: "stack.yaml",
    skillsIntro: "k=4 fat-tree. Each leaf is a skill domain; aggregation and core switches are where they meet. On the map these were villages, mountain passes and summits — same coordinates.",
    sideTitle: "human_lang &amp; teaching",
    side: "<p><b>fr</b> native · <b>en</b> fluent (TOEIC C1, 965/990)</p><p>AI trainer: Fidle, DLO-JZ, Panoram'IA · workshops, hackathons, AI-DevTalks</p>",
    skills: {
      ai: ["ai", "PyTorch, TensorFlow, Transformers, Hugging Face, vLLM, Llama.cpp, Gradio, Agents"],
      ml: ["ml", "Scikit-learn, NumPy, Pandas, Optuna"],
      monitoring: ["monitoring", "MLflow, W&amp;B"],
      dist: ["distributed_training", "FSDP, DDP, ZeRO, tensor/pipeline parallelism, bf16, fp8, NCCL, DeepSpeed"],
      hpc: ["hpc", "OpenMP, MPI, NCCL, multi-node, multi-GPU"],
      infra: ["infra", "Proxmox, Slurm, Docker, Singularity, Kubernetes, Spack, Git, CI/CD, DVC, Ray, Dask"],
      cloud: ["cloud", "AWS (Lambda, S3, EC2)"],
      lang: ["lang", "Python, C/C++, Bash, Julia, MATLAB, LaTeX"],
    },
    riverTitle: "traceroute → now",
    riverIntro: "Hops from today (top) back to the first job (bottom). Main path = backbone; side links = what ran in parallel. Same course as the river on the map.",
    span: "span",
    running: "running",
    stops: {
      aneo: ["aneo", "[2026-02 → now]", "AI/HPC Senior Consultant", "Aneo · full-time · Paris area, hybrid", "Hybrid cloud/on-prem infra for quant research: orchestrator scheduling compute across AWS and Slurm.", "", "slurm (on-prem) ⇄ orchestrator ⇄ aws"],
      cfm: ["cfm", "[2026-02 → now]", "Portfolio Platform Engineer", "Capital Fund Management (CFM) · contractor · Paris, on-site", "", "", ""],
      x: ["polytechnique", "[2025-12]", "Lecturer — MSc Data Science &amp; AI for Business, X-HEC", "École Polytechnique · independent · Palaiseau", "", "1 mo", ""],
      minerva: ["minerva", "[2025-08 → 2026-01]", "Sr. AI/HPC Engineer", "MINERVA European Support Centre for Scalable AI Research and Deployment · fixed-term · Saclay", "Deployed and operated Dalia supercomputer — 360 PFlop/s (FP16), 72x NVIDIA GB200.", "6 mo", "dalia · 72× GB200 · 360 PFlop/s FP16"],
      cnrs: ["cnrs", "[2024-03 → 2026-01]", "Artificial Intelligence Engineer", "CNRS · fixed-term · Saclay", "2000-user support on Jean Zay supercomputer (125 PFlop/s, 1456x NVIDIA H100) — password resets to LLM pre-training. Installed/maintained AI &amp; HPC software stacks, multi-GPU/multi-node benchmarking, trained/finetuned large-scale models (BLOOM, LLaMA, ViT). PNRIA network contributor. AI trainer for Fidle, DLO-JZ, Panoram'IA; workshops, hackathons, AI-DevTalks.", "23 mo", "jean-zay · 1456× H100 · 125 PFlop/s"],
      fidle: ["fidle", "[2022-03 → 2025-09]", "Lecturer — Deep Learning &amp; HPC", "FIDLE · remote", "", "43 mo", "multicast → trainees"],
      inria: ["inria", "[2022-03 → 2024-02]", "Artificial Intelligence Engineer", "Inria · fixed-term · Saclay", "Jean Zay supercomputer, previous generation — 37 PFlop/s.", "24 mo", "jean-zay (prev. gen) · 37 PFlop/s"],
      atos: ["atos", "[2021-02 → 2021-08]", "Embedded AI Engineer (intern)", "Atos, Toulouse", "Embedded computer vision for real-time quality inspection: YOLOv4/Faster R-CNN inference on Jetson Nano, -80% latency via quantization &amp; pruning.", "7 mo", "jetson nano · latency −80%"],
      spascia: ["spascia", "[2020-04 → 2020-08]", "Infrastructure Engineer (intern)", "SPASCIA, Ramonville-Saint-Agne", "110-node ARM-SBC cluster (440 CPU cores) for async RL training — custom OS, automation, monitoring, web services.", "5 mo", "110× ARM SBC · 440 cores"],
    },
    sourcesTitle: "boot sequence",
    sourcesIntro: "Where the backbone starts: education, and one transatlantic link.",
    insa: ["insa-cvl :: boot", "2016–2021 · Blois", "MSc Industrial Systems Engineering / Data Science", "INSA Centre Val de Loire"],
    ets: ["ets-mtl :: remote site", "2019 · Montréal", "Exchange — MSc Electrical Engineering", "École de Technologie Supérieure"],
    insetTitle: "remote site · montreal",
    wan: "WAN · transatlantic (illustrative)",
    toeic: ["cert :: TOEIC® C1", "965/990 · issued 2020-10"],
    coloTitle: "EOF",
    colo: "Single-file build · 0 external requests at runtime · same geometry as the illustrated map, drawn twice.",
    coloHint: "← swipe right to go back to the map",
  },
  fr: {
    plates: { hero: "planche 01/05 · topologie", apropos: "planche 02/05 · all-reduce", competences: "planche 03/05 · fat-tree", experiences: "planche 04/05 · traceroute", formation: "planche 05/05 · amorçage" },
    heroKicker: "PLANCHE 01/05 — TOPOLOGIE SYSTÈME",
    name: "Léo Hunout — Ingénieur AI/HPC",
    subtitle: "uptime : 4+ ans · infra IA &amp; HPC à grande échelle",
    lede: "Entraînement GPU multi-nœud, exploitation de supercalculateurs, orchestration cloud/on-prem hybride. Internals de l'entraînement distribué (FSDP/DDP/ZeRO, NCCL, parallélisme tenseur/pipeline), Slurm, Kubernetes, MPI/OpenMP.",
    legend: "<b>radiographie de la carte</b> — mêmes coordonnées, au pixel près : ville → nœud de service · forêt → partition de calcul · fleuve → backbone · montagne → commutateur · côte → domaine d'administration.",
    photoAlt: "Photo de Léo Hunout",
    towns: { experiences: "login · traceroute", apropos: "anneau · all-reduce", competences: "fabric · fat-tree", formation: "boot" },
    here: "$ ssh hunoutl@login",
    mapTitle: "FIG. 1 — topologie système (illustrative)",
    scale: "1 saut",
    aproposTitle: "about",
    apropos: "Optimiser des clusters GPU n'est que la moitié du travail — l'autre moitié consiste à rendre ce calcul utilisable par des gens qui ne sont pas experts systèmes. 4 ans à supporter plus de 3000 chercheurs sur Jean Zay (l'un des plus gros supercalculateurs français) m'ont autant appris sur le tuning NCCL et le scaling multi-nœud que sur la rédaction de docs et les talks accessibles sans prérequis HPC. J'applique aujourd'hui les mêmes réflexes d'infra dans un contexte plus resserré, orienté recherche quantitative : orchestration cloud/on-prem hybride plutôt que clusters à l'échelle nationale.",
    ringNote: "La rose des vents était un anneau : 8 GPU, un bloc chacun, reduce-scatter puis all-gather. <i>Simulation, temps illustratifs.</i>",
    values: [["nord", "rendre_le_calcul_utilisable"], ["est", "tuner_les_clusters_gpu"], ["sud", "expliquer_sans_prérequis"], ["ouest", "accompagner_les_chercheurs"]],
    skillsTitle: "stack.yaml",
    skillsIntro: "Fat-tree k=4. Chaque feuille est un domaine de compétence ; les commutateurs d'agrégation et de cœur sont là où ils se rejoignent. Sur la carte : villages, cols et sommets — mêmes coordonnées.",
    sideTitle: "human_lang &amp; transmission",
    side: "<p><b>fr</b> natif · <b>en</b> courant (TOEIC C1, 965/990)</p><p>Formateur IA : Fidle, DLO-JZ, Panoram'IA · ateliers, hackathons, AI-DevTalks</p>",
    skills: {
      ai: ["ai", "PyTorch, TensorFlow, Transformers, Hugging Face, vLLM, Llama.cpp, Gradio, Agents"],
      ml: ["ml", "Scikit-learn, NumPy, Pandas, Optuna"],
      monitoring: ["monitoring", "MLflow, W&amp;B"],
      dist: ["distributed_training", "FSDP, DDP, ZeRO, parallélisme tenseur/pipeline, bf16, fp8, NCCL, DeepSpeed"],
      hpc: ["hpc", "OpenMP, MPI, NCCL, multi-nœud, multi-GPU"],
      infra: ["infra", "Proxmox, Slurm, Docker, Singularity, Kubernetes, Spack, Git, CI/CD, DVC, Ray, Dask"],
      cloud: ["cloud", "AWS (Lambda, S3, EC2)"],
      lang: ["lang", "Python, C/C++, Bash, Julia, MATLAB, LaTeX"],
    },
    riverTitle: "traceroute → aujourd'hui",
    riverIntro: "Les sauts, d'aujourd'hui (en haut) au premier poste (en bas). Chemin principal = backbone ; liens secondaires = ce qui tournait en parallèle. Même tracé que le fleuve de la carte.",
    span: "durée",
    running: "en cours",
    stops: {
      aneo: ["aneo", "[2026-02 → aujourd'hui]", "AI/HPC Senior Consultant", "Aneo · CDI · Paris et périphérie, hybride", "Infra cloud/on-prem hybride pour la recherche quantitative : orchestrateur répartissant les jobs entre AWS et Slurm.", "", "slurm (on-prem) ⇄ orchestrateur ⇄ aws"],
      cfm: ["cfm", "[2026-02 → aujourd'hui]", "Portfolio Platform Engineer", "Capital Fund Management (CFM) · intérimaire · Paris, sur site", "", "", ""],
      x: ["polytechnique", "[2025-12]", "Chargé de cours — Master Data Science &amp; AI for Business, X-HEC", "École Polytechnique · indépendant · Palaiseau", "", "1 mois", ""],
      minerva: ["minerva", "[2025-08 → 2026-01]", "Sr. AI/HPC Engineer", "MINERVA European Support Centre for Scalable AI Research and Deployment · CDD · Saclay", "Déploiement et exploitation du supercalculateur Dalia — 360 PFlop/s (FP16), 72x NVIDIA GB200.", "6 mois", "dalia · 72× GB200 · 360 PFlop/s FP16"],
      cnrs: ["cnrs", "[2024-03 → 2026-01]", "Ingénieur en intelligence artificielle", "CNRS · CDD · Saclay", "Support de 2000 utilisateurs du supercalculateur Jean Zay (125 PFlop/s, 1456x NVIDIA H100) — du reset de mot de passe au pré-entraînement de LLM. Installation/maintenance des environnements IA &amp; HPC, benchmarking multi-GPU/multi-nœud, entraînement/finetuning de modèles à grande échelle (BLOOM, LLaMA, ViT). Contributeur au réseau PNRIA. Formateur pour Fidle, DLO-JZ, Panoram'IA ; ateliers, hackathons, AI-DevTalks.", "23 mois", "jean-zay · 1456× H100 · 125 PFlop/s"],
      fidle: ["fidle", "[2022-03 → 2025-09]", "Formateur — Deep Learning &amp; HPC", "FIDLE · à distance", "", "43 mois", "multicast → stagiaires"],
      inria: ["inria", "[2022-03 → 2024-02]", "Ingénieur en intelligence artificielle", "Inria · CDD · Saclay", "Supercalculateur Jean Zay, génération précédente — 37 PFlop/s.", "24 mois", "jean-zay (gén. préc.) · 37 PFlop/s"],
      atos: ["atos", "[2021-02 → 2021-08]", "Ingénieur IA embarquée (stage)", "Atos, Toulouse", "Vision par ordinateur embarquée pour le contrôle qualité en temps réel : inférence YOLOv4/Faster R-CNN sur Jetson Nano, -80% de latence via quantization &amp; pruning.", "7 mois", "jetson nano · latence −80 %"],
      spascia: ["spascia", "[2020-04 → 2020-08]", "Ingénieur infrastructure (stage)", "SPASCIA, Ramonville-Saint-Agne", "Cluster ARM-SBC 110 nœuds (440 cœurs CPU) pour entraînement RL asynchrone — OS sur mesure, automatisation, monitoring, services web.", "5 mois", "110× ARM SBC · 440 cœurs"],
    },
    sourcesTitle: "séquence d'amorçage",
    sourcesIntro: "Là où démarre le backbone : la formation, et un lien transatlantique.",
    insa: ["insa-cvl :: boot", "2016–2021 · Blois", "Master Ingénierie des Systèmes Industriels / Data Science", "INSA Centre Val de Loire"],
    ets: ["ets-mtl :: site distant", "2019 · Montréal", "Échange — Master Génie Électrique", "École de Technologie Supérieure"],
    insetTitle: "site distant · montréal",
    wan: "WAN · transatlantique (illustratif)",
    toeic: ["cert :: TOEIC® C1", "965/990 · émis 2020-10"],
    coloTitle: "EOF",
    colo: "Build en fichier unique · 0 requête externe à l'exécution · même géométrie que la carte illustrée, dessinée deux fois.",
    coloHint: "← glissez vers la droite pour revenir à la carte",
  },
};

// ------------------------------------------------------------------
// Primitives de plan
// ------------------------------------------------------------------
const R = GEO.r1;
const box = GEO.box;
const poly = (pts, closed) => "M" + pts.map((p) => `${R(p[0])} ${R(p[1])}`).join("L") + (closed ? "Z" : "");
function txt(x, y, s, cls, anchor) {
  return `<text class="${cls || "t"}" x="${R(x)}" y="${R(y)}" text-anchor="${anchor || "start"}">${s}</text>`;
}
function sw(x, y, w, h, ports, cls) {
  let s = `<rect class="${cls || "sw"}" x="${R(x - w / 2)}" y="${R(y - h / 2)}" width="${R(w)}" height="${R(h)}" rx="1.5"/>`;
  for (let i = 0; i < ports; i++) s += `<rect class="port" x="${R(x - w / 2 + 4 + (i * (w - 10)) / Math.max(1, ports - 1))}" y="${R(y + h / 2 - 5)}" width="2.4" height="2.4"/>`;
  return s;
}
function node(x, y, sz, cls) {
  return `<rect class="${cls || "nd"}" x="${R(x - sz / 2)}" y="${R(y - sz / 2)}" width="${R(sz)}" height="${R(sz)}"/><rect class="led" x="${R(x + sz / 2 - 3.2)}" y="${R(y - sz / 2 + 1.4)}" width="1.8" height="1.8"/>`;
}
function svc(x, y, big) {
  const s = big ? 26 : 18;
  return `<rect class="svc" x="${R(x - s / 2)}" y="${R(y - s / 2)}" width="${s}" height="${s}"/><rect class="svc-i" x="${R(x - s / 4)}" y="${R(y - s / 4)}" width="${R(s / 2)}" height="${R(s / 2)}"/><path class="cross" d="M${R(x - s)} ${R(y)}h${R(s * 0.35)}M${R(x + s * 0.65)} ${R(y)}h${R(s * 0.35)}M${R(x)} ${R(y - s)}v${R(s * 0.35)}M${R(x)} ${R(y + s * 0.65)}v${R(s * 0.35)}"/>`;
}
function gridCells(r, cols, rows, cls) {
  const cw = r.w / cols, ch = r.h / rows;
  let d = "";
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) d += `M${R(r.x + i * cw + 0.6)} ${R(r.y + j * ch + 0.6)}h${R(Math.max(0.8, cw - 1.6))}v${R(Math.max(0.8, ch - 1.6))}h${R(-Math.max(0.8, cw - 1.6))}Z`;
  return `<path class="${cls || "cell"}" d="${d}"/>`;
}
function zoneFrame(x0, y0, x1, y1) {
  let s = `<rect class="fr-o" x="${R(x0 - 6)}" y="${R(y0 - 6)}" width="${R(x1 - x0 + 12)}" height="${R(y1 - y0 + 12)}"/><rect class="fr-i" x="${R(x0)}" y="${R(y0)}" width="${R(x1 - x0)}" height="${R(y1 - y0)}"/>`;
  const nx = Math.max(2, Math.round((x1 - x0) / 120)), ny = Math.max(2, Math.round((y1 - y0) / 120));
  let d = "";
  for (let i = 1; i < nx; i++) d += `M${R(x0 + ((x1 - x0) * i) / nx)} ${R(y0 - 6)}v6M${R(x0 + ((x1 - x0) * i) / nx)} ${R(y1)}v6`;
  for (let j = 1; j < ny; j++) d += `M${R(x0 - 6)} ${R(y0 + ((y1 - y0) * j) / ny)}h6M${R(x1)} ${R(y0 + ((y1 - y0) * j) / ny)}h6`;
  s += `<path class="fr-t" d="${d}"/>`;
  for (let i = 0; i < nx; i++) s += txt(x0 + ((x1 - x0) * (i + 0.5)) / nx, y0 - 9, "ABCDEFGHIJ"[i], "t t-zone", "middle");
  for (let j = 0; j < ny; j++) s += txt(x0 - 10, y0 + ((y1 - y0) * (j + 0.5)) / ny + 3, String(j + 1), "t t-zone", "middle");
  return s;
}
function dim(x0, x1, y, label) {
  return `<path class="dim" d="M${R(x0)} ${R(y - 5)}v10M${R(x1)} ${R(y - 5)}v10M${R(x0)} ${R(y)}H${R(x1)}"/><path class="dim-a" d="M${R(x0)} ${R(y)}l6 -3v6zM${R(x1)} ${R(y)}l-6 -3v6z"/>${txt((x0 + x1) / 2, y - 6, label, "t t-dim", "middle")}`;
}
const packet = (cls) => `<div class="mover pkt ${cls || ""}"></div>`;
const trailPacket = (kind, k, cls) => `<div class="mover trail ${cls || ""}" data-m="${kind}" data-k="${k}"><i></i><i></i><i></i></div>`;

// ------------------------------------------------------------------
// Planches
// ------------------------------------------------------------------
function plateHero(L) {
  const g = GEO.geom("hero"), t = T[L];
  const { x0, x1, y0, y1 } = g.map;
  const { cx, cy } = g.c;
  let s = `<rect class="bp-fill" x="${R(x0)}" y="${R(y0)}" width="${R(x1 - x0)}" height="${R(y1 - y0)}"/>`;
  [1.1, 1.05].forEach((k) => (s += `<path class="ring-off" d="${poly(g.coastPts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]), true)}"/>`));
  s += `<path class="domain" d="${poly(g.coastPts, true)}"/>`;
  g.roads.forEach((r) => (s += `<path class="link" d="${poly(r)}"/>`));
  s += `<path class="bb-glow" d="${g.river.d}"/><path class="bb" d="${g.river.d}"/><path class="bb-core" d="${g.river.d}"/>`;
  const mk = g.m === "w" ? 1.35 : 0.75;
  g.mountains.forEach((mt) => (s += sw(mt.at[0], mt.at[1] - 10 * mk, 30 * mk, 12 * mk, 5)));
  g.forests.forEach((f) => f.forEach((p) => (s += node(p[0], p[1], g.m === "w" ? 11 : 7.5))));
  g.towns.forEach((tw) => {
    const [x, y] = tw.at;
    s += svc(x, y, tw.kind === "port");
    const port = tw.kind === "port";
    const dy = tw.kind === "source" ? 32 : port ? 6 : -18;
    s += `<a href="#${tw.id}" class="tlink">${txt(port ? x - 20 : x, y + dy, t.towns[tw.id], "t t-town", port ? "end" : "middle")}</a>`;
  });
  const port = g.towns[0].at;
  s += `<path class="here" d="M${R(port[0] + 16)} ${R(port[1] - 4)}h${R(18)}"/>${txt(port[0] + 38, port[1] + 2, t.here, "t t-here")}`;
  // rose des vents → mini-anneau de 8 GPU
  const ro = g.rose;
  s += `<circle class="ring-mini" cx="${R(ro.cx)}" cy="${R(ro.cy)}" r="${R(ro.r * 0.8)}"/>`;
  for (let k = 0; k < 8; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 4, rr = k % 2 ? ro.r * 0.62 : ro.r;
    s += `<path class="link" d="M${R(ro.cx)} ${R(ro.cy)}L${R(ro.cx + Math.cos(a) * rr)} ${R(ro.cy + Math.sin(a) * rr)}"/>` + node(ro.cx + Math.cos(a) * rr, ro.cy + Math.sin(a) * rr, g.m === "w" ? 8 : 6, "nd gpu");
  }
  s += txt(ro.cx, ro.cy + ro.r + 18, "ring×8", "t t-small", "middle");
  const sc = g.scale;
  s += dim(sc.x, sc.x + sc.w, sc.y, t.scale);
  s += zoneFrame(x0, y0, x1, y1);
  if (g.m === "w") s += txt((x0 + x1) / 2, y1 + 26, t.mapTitle, "t t-title", "middle");
  const big = g.m === "w";
  const html =
    box(
      g.card,
      "spec hero-card",
      `<div class="spec-h"><span>${t.heroKicker}</span><span>REV 26.11</span></div>
      <div class="hero-id">
        <div class="photo-wrap"><img class="profile-photo" src="assets/me.png" alt="${t.photoAlt}" width="${big ? 128 : 96}" height="${big ? 128 : 96}" decoding="sync" /></div>
        <div><h1>hunoutl</h1><p class="name">${t.name}</p><p class="subtitle">${t.subtitle}</p></div>
      </div>
      <p class="lede">${t.lede}</p>
      <p class="legend">${t.legend}</p>
      ${CONTACTS}`
    ) +
    trailPacket("orbit", 0, "amber") +
    trailPacket("down", 0) +
    trailPacket("down", 1) +
    trailPacket("down", 2);
  return GEO.plate("hero", s, html);
}

function plateApropos(L) {
  const g = GEO.geom("apropos"), t = T[L];
  const { cx, cy, R: Rr } = g.rose;
  let s = "";
  for (let k = 0; k < 3; k++) s += `<circle class="ring-guide" cx="${cx}" cy="${cy}" r="${R(Rr * (1.25 + k * 0.16))}"/>`;
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI) / 8;
    s += `<path class="ray-guide" d="M${cx} ${cy}L${R(cx + Math.cos(a) * Rr * 3)} ${R(cy + Math.sin(a) * Rr * 3)}"/>`;
  }
  s += `<circle class="ring-tl" cx="${cx}" cy="${cy}" r="${R(Rr * 1.04)}"/>`;
  let ticks = "";
  for (let k = 0; k < 72; k++) {
    const a = (k * Math.PI) / 36, l = k % 9 === 0 ? 0.1 : 0.05;
    ticks += `M${R(cx + Math.cos(a) * Rr * 1.04)} ${R(cy + Math.sin(a) * Rr * 1.04)}L${R(cx + Math.cos(a) * Rr * (1.04 - l))} ${R(cy + Math.sin(a) * Rr * (1.04 - l))}`;
  }
  s += `<path class="tick" d="${ticks}"/>`;
  // anneau NVLink : pointes de la rose reliées dans l'ordre
  const tips = g.tips;
  tips.forEach((tp, i) => {
    const nx = tips[(i + 1) % 8];
    s += `<path class="nvl" d="M${R(tp.x)} ${R(tp.y)}L${R(nx.x)} ${R(nx.y)}"/>`;
    s += `<path class="spoke" d="M${cx} ${cy}L${R(tp.x)} ${R(tp.y)}"/>`;
  });
  s += sw(cx, cy, Rr * 0.42, Rr * 0.16, 8, "sw nvsw") + txt(cx, cy - Rr * 0.12, "NVSwitch", "t t-small", "middle");
  const gw = g.m === "w" ? 50 : 34, gh = g.m === "w" ? 30 : 22;
  tips.forEach((tp) => {
    s += `<rect class="gpu-box" x="${R(tp.x - gw / 2)}" y="${R(tp.y - gh / 2)}" width="${gw}" height="${gh}"/>` + txt(tp.x, tp.y + 4, `gpu${tp.k}`, "t t-gpu", "middle");
  });
  let html = "";
  g.values.forEach((v, i) => (html += box(v, `value al-${v.al}`, `<span class="value-k">${t.values[i][0]}:</span><span class="value-t">${t.values[i][1].replace(/_/g, "_<wbr>")}</span>`)));
  html += box(g.card, "spec prose-card", `<div class="spec-h"><span>${t.plates.apropos}</span><span>cat about.md</span></div><h2>${t.aproposTitle}</h2><p class="prose">${t.apropos}</p><p class="note">${t.ringNote}</p><p class="ringstep" data-m="ringstep">&nbsp;</p>`);
  for (let k = 0; k < 8; k++) html += `<div class="mover chunk c${k}" data-m="chunk" data-k="${k}"></div>`;
  return GEO.plate("apropos", s, html);
}

function plateCompetences(L) {
  const g = GEO.geom("competences"), t = T[L];
  let s = "";
  // anneaux de niveau → domaines de panne (mêmes formes, polygones droits)
  g.cores.forEach((c) => {
    for (let k = 6; k >= 1; k -= 2) {
      const rr = (g.m === "w" ? 30 : 20) * k, pts = [];
      for (let j = 0; j < 18; j++) {
        const a = (j / 18) * Math.PI * 2;
        pts.push([c.x + Math.cos(a) * rr * (g.m === "w" ? 1.5 : 0.8), c.y + Math.sin(a) * rr * (g.m === "w" ? 0.8 : 1.4)]);
      }
      s += `<path class="fdomain" d="${poly(pts, true)}"/>`;
    }
  });
  if (g.m === "w") {
    [["CORE", g.cores[0].y], ["AGGREGATION", g.aggs[0].y], ["EDGE / LEAF", g.leaves[0].y]].forEach(([lb, y]) => (s += `<path class="tier" d="M10 ${R(y)}H${g.P - 10}"/>` + txt(12, y - 8, lb, "t t-tier")));
  } else {
    [["CORE", g.cores[0].x], ["AGG", g.aggs[0].x], ["LEAF", g.leaves[0].x]].forEach(([lb, x]) => (s += txt(x, g.head.y + g.head.h + 30, lb, "t t-tier", "middle")));
  }
  g.links.forEach((lk) => {
    const a = g.pt(lk.a), b = g.pt(lk.b);
    s += `<path class="fl t${lk.tier}" d="M${R(a.x)} ${R(a.y)}L${R(b.x)} ${R(b.y)}"/>`;
  });
  const W = g.m === "w";
  g.cores.forEach((c, i) => (s += sw(c.x, c.y, W ? 76 : 50, W ? 24 : 18, 8, "sw core") + txt(c.x, c.y - (W ? 18 : 14), `core-${i}`, "t t-sw", "middle")));
  g.aggs.forEach((a, i) => (s += sw(a.x, a.y, W ? 46 : 34, W ? 16 : 13, 4) + txt(a.x + (W ? 0 : 0), a.y - (W ? 13 : 11), `agg-${i}`, "t t-small", "middle")));
  g.leaves.forEach((lf) => (s += node(lf.x, lf.y, W ? 22 : 16, "nd leaf")));
  let html = box(g.head, "spec", `<div class="spec-h"><span>${t.plates.competences}</span><span>cat stack.yaml</span></div><h2>${t.skillsTitle}</h2><p class="prose small">${t.skillsIntro}</p>`);
  html += box(g.side, "spec side", `<div class="spec-h"><span>${t.sideTitle}</span></div>${t.side}`);
  g.leaves.forEach((lf) => {
    const [name, tools] = t.skills[lf.id];
    html += box(lf.card, "spec leafcard", `<p class="leaf-k">${name}:</p><p class="leaf-v">${tools
      .split(/, (?![^(]*\))/)
      .map((x) => `<span>- ${x}</span>`)
      .join("")}</p>`);
  });
  html += trailPacket("walker", 0, "amber") + trailPacket("walker", 1) + trailPacket("walker", 2);
  return GEO.plate("competences", s, html);
}

function vignette(id, st, t) {
  const v0 = st.vig;
  if (!v0) return "";
  const cap = t.stops[id][6];
  const v = { x: v0.x, y: v0.y, w: v0.w, h: v0.h - 18 };
  let s = `<path class="vig-rule" d="M${v0.x} ${R(v0.y - 6)}h${v0.w}"/>`;
  if (id === "minerva") s += gridCells(v, 24, 3, "cell gpu");
  else if (id === "spascia") s += gridCells(v, 22, 5, "cell arm");
  else if (id === "cnrs") s += gridCells(v, 104, 14, "cell h100");
  else if (id === "inria") s += gridCells({ x: v.x, y: v.y, w: v.w * 0.62, h: v.h }, 40, 8, "cell old");
  else if (id === "aneo") {
    const bw = v.w * 0.3;
    s += `<rect class="vbox" x="${R(v.x)}" y="${R(v.y + 4)}" width="${R(bw)}" height="${R(v.h - 8)}"/><rect class="vbox cloud" x="${R(v.x + v.w - bw)}" y="${R(v.y + 4)}" width="${R(bw)}" height="${R(v.h - 8)}"/>`;
    s += gridCells({ x: v.x + 6, y: v.y + 10, w: bw - 12, h: v.h - 20 }, 6, 3, "cell");
    s += gridCells({ x: v.x + v.w - bw + 6, y: v.y + 10, w: bw - 12, h: v.h - 20 }, 6, 3, "cell aws");
    s += sw(v.x + v.w / 2, v.y + v.h / 2, v.w * 0.22, 16, 4, "sw orch") + `<path class="fl t1" d="M${R(v.x + bw)} ${R(v.y + v.h / 2)}H${R(v.x + v.w / 2 - v.w * 0.11)}M${R(v.x + v.w / 2 + v.w * 0.11)} ${R(v.y + v.h / 2)}H${R(v.x + v.w - bw)}"/>`;
  } else if (id === "fidle") {
    const sx = v.x + 24, sy = v.y + v.h - 8;
    for (let k = 0; k < 12; k++) {
      const tx = v.x + v.w * 0.35 + (k % 6) * (v.w * 0.12), ty = v.y + 6 + Math.floor(k / 6) * (v.h * 0.45);
      s += `<path class="mc" d="M${R(sx)} ${R(sy)}L${R(tx)} ${R(ty)}"/>` + node(tx, ty, 6, "nd");
    }
    s += node(sx, sy, 12, "nd src");
  } else if (id === "atos") {
    s += `<rect class="vbox" x="${R(v.x)}" y="${R(v.y + 6)}" width="${R(v.w * 0.24)}" height="${R(v.h - 10)}"/>` + txt(v.x + v.w * 0.12, v.y + v.h / 2 + 4, "jetson", "t t-small", "middle");
    const bx = v.x + v.w * 0.32, bwid = v.w * 0.64;
    s += `<rect class="bar" x="${R(bx)}" y="${R(v.y + 8)}" width="${R(bwid)}" height="10"/><rect class="bar ok" x="${R(bx)}" y="${R(v.y + 28)}" width="${R(bwid * 0.2)}" height="10"/>`;
    s += txt(bx + bwid, v.y + 6, "baseline", "t t-small", "end") + txt(bx + bwid * 0.2 + 6, v.y + 37, "quant+prune", "t t-small");
  }
  if (cap) s += txt(v0.x, v0.y + v0.h - 3, cap, "t t-cap");
  return s;
}

function plateExperiences(L) {
  const g = GEO.geom("experiences"), t = T[L];
  const P = g.P;
  let s = `<defs><pattern id="wan-h" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 5h10" class="hatch"/></pattern></defs>`;
  const shore = [];
  for (let i = 0; i <= 16; i++) shore.push([(P * i) / 16, g.shoreY + Math.sin(i * 1.7) * 8]);
  s += `<path d="M${P} ${R(shore[16][1])}V0H0V${R(shore[0][1])}${poly(shore).replace(/^M/, "L")}Z" fill="url(#wan-h)" class="wan"/><path class="wan-edge" d="${poly(shore)}"/>`;
  s += txt(P - 16, g.shoreY - 14, L === "fr" ? "egress → aujourd'hui" : "egress → now", "t t-small", "end");
  g.decor.forEach((d) => {
    if (d.kind === "tree") s += node(d.x, d.y, 7);
    else if (d.kind === "hill") s += sw(d.x, d.y - 4, 18, 7, 3);
    else s += `<path class="dots" d="M${R(d.x - 5)} ${R(d.y)}h1M${R(d.x)} ${R(d.y)}h1M${R(d.x + 5)} ${R(d.y)}h1"/>`;
  });
  Object.values(g.branches).forEach((b) => (s += `<path class="bb2" d="${b.d}"/>`));
  s += `<path class="bb-glow" d="${g.river.d}"/><path class="bb" d="${g.river.d}"/><path class="bb-core" d="${g.river.d}"/>`;
  let html = box(g.head, "spec", `<div class="spec-h"><span>${t.plates.experiences}</span><span>traceroute -n</span></div><h2>${t.riverTitle}</h2><p class="prose small">${t.riverIntro}</p>`);
  g.stops.forEach((st, i) => {
    const [host, dates, role, meta, text, span] = t.stops[st.id];
    const c = st.card;
    const ex = st.side === "l" ? c.x + c.w : c.x;
    const mx = (st.x + ex) / 2;
    s += `<path class="leader" d="M${R(st.x)} ${R(st.y)}H${R(mx)}V${R(c.y + 26)}H${R(ex)}"/><circle class="leader-d" cx="${R(ex)}" cy="${R(c.y + 26)}" r="2.5"/>`;
    s += svc(st.x, st.y, st.main) + txt(st.x + (st.side === "l" ? 18 : -18), st.y - 14, String(i + 1).padStart(2, "0"), "t t-hop", st.side === "l" ? "start" : "end");
    html += box(c, `spec stop${st.main ? "" : " branch"}`, `<div class="spec-h"><span>hop ${String(i + 1).padStart(2, "0")} · ${host}</span><span>${t.span}: ${span || t.running}</span></div><p class="stop-dates">${dates}</p><h3>${role}</h3><p class="meta">${meta}</p>${text ? `<p class="stop-text">${text}</p>` : ""}`, st.vig ? `padding-bottom:${st.vh + 22}px` : "");
  });
  let over = "";
  g.stops.forEach((st) => (over += vignette(st.id, st, t)));
  html += `<svg class="plate-over" width="${P}" height="${g.H}" viewBox="0 0 ${P} ${g.H}" aria-hidden="true">${over}</svg>`;
  html += trailPacket("reader", 0, "amber big");
  return GEO.plate("experiences", s, html);
}

function plateFormation(L) {
  const g = GEO.geom("formation"), t = T[L];
  let s = `<path class="bb-glow" d="${g.river.d}"/><path class="bb" d="${g.river.d}"/><path class="bb-core" d="${g.river.d}"/>`;
  const mk = g.m === "w" ? 1.3 : 0.95;
  g.mountains.forEach((mt) => (s += sw(mt.at[0], mt.at[1] - 10 * mk, 30 * mk, 12 * mk, 5)));
  // source → puce d'amorçage
  const { x, y } = g.src;
  s += `<rect class="chip" x="${R(x - 14)}" y="${R(y - 14)}" width="28" height="28"/>`;
  let pins = "";
  for (let k = -2; k <= 2; k++) pins += `M${R(x + k * 5)} ${R(y - 14)}v-5M${R(x + k * 5)} ${R(y + 14)}v5M${R(x - 14)} ${R(y + k * 5)}h-5M${R(x + 14)} ${R(y + k * 5)}h5`;
  s += `<path class="pins" d="${pins}"/>` + txt(x, y + 4, "BIOS", "t t-chip", "middle");
  s += `<path class="wanl" d="${g.sea.d}"/>`;
  const sm = GEO.sampler(g.sea).at(0.5);
  if (g.m === "w") s += txt(sm.x, sm.y - 10, t.wan, "t t-small", "middle");
  const ins = g.inset;
  s += `<rect class="bp-fill" x="${ins.x}" y="${ins.y}" width="${ins.w}" height="${ins.h}"/>`;
  s += zoneFrame(ins.x, ins.y, ins.x + ins.w, ins.y + ins.h);
  const coast = [[ins.x, ins.y], [ins.x + ins.w * 0.58, ins.y], [ins.x + ins.w * 0.62, ins.y + ins.h * 0.25], [ins.x + ins.w * 0.54, ins.y + ins.h * 0.42], [ins.x + ins.w * 0.66, ins.y + ins.h * 0.62], [ins.x + ins.w * 0.6, ins.y + ins.h * 0.82], [ins.x + ins.w * 0.7, ins.y + ins.h], [ins.x, ins.y + ins.h]];
  s += `<path class="domain" d="${poly(coast, true)}"/>`;
  s += svc(g.mtl.x, g.mtl.y, true) + txt(ins.x + 14, ins.y + 24, t.insetTitle, "t t-title") + txt(g.mtl.x, g.mtl.y + 32, "mtl-01", "t t-town", "middle");
  const sc = g.seal;
  s += `<circle class="cert" cx="${R(sc.cx)}" cy="${R(sc.cy)}" r="${R(sc.r)}"/><circle class="cert-i" cx="${R(sc.cx)}" cy="${R(sc.cy)}" r="${R(sc.r * 0.78)}"/>`;
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    s += `<path class="tick" d="M${R(sc.cx + Math.cos(a) * sc.r)} ${R(sc.cy + Math.sin(a) * sc.r)}L${R(sc.cx + Math.cos(a) * sc.r * 1.12)} ${R(sc.cy + Math.sin(a) * sc.r * 1.12)}"/>`;
  }
  s += txt(sc.cx, sc.cy + sc.r * 0.1, "C1", "t t-cert", "middle") + txt(sc.cx, sc.cy + sc.r * 0.45, "965/990", "t t-small", "middle");
  let html = box(g.head, "spec", `<div class="spec-h"><span>${t.plates.formation}</span><span>dmesg | head</span></div><h2>${t.sourcesTitle}</h2><p class="prose small">${t.sourcesIntro}</p>`);
  html += box(g.insa, "spec stop", `<div class="spec-h"><span>${t.insa[0]}</span></div><p class="stop-dates">${t.insa[1]}</p><h3>${t.insa[2]}</h3><p class="meta">${t.insa[3]}</p>`);
  html += box(g.ets, "spec stop", `<div class="spec-h"><span>${t.ets[0]}</span></div><p class="stop-dates">${t.ets[1]}</p><h3>${t.ets[2]}</h3><p class="meta">${t.ets[3]}</p>`);
  html += box(g.toeic, "stop plain", `<p class="leaf-k">${t.toeic[0]}</p><p class="stop-dates">${t.toeic[1]}</p>`);
  html += box(g.colo, "spec colophon", `<h2>${t.coloTitle}</h2><p class="prose small">${t.colo}</p>${CONTACTS}<p class="note">${t.coloHint}</p>`);
  html += trailPacket("crossing", 0, "amber");
  return GEO.plate("formation", s, html);
}

const FLOORS = [
  { id: "hero", en: () => plateHero("en"), fr: () => plateHero("fr") },
  { id: "apropos", en: () => plateApropos("en"), fr: () => plateApropos("fr") },
  { id: "competences", en: () => plateCompetences("en"), fr: () => plateCompetences("fr") },
  { id: "experiences", en: () => plateExperiences("en"), fr: () => plateExperiences("fr") },
  { id: "formation", en: () => plateFormation("en"), fr: () => plateFormation("fr") },
];
const PLATE_NAMES = { fr: T.fr.plates, en: T.en.plates };

// ------------------------------------------------------------------
// Animations Machine. Positions partagées (GEO.motion) : le paquet ambré
// est exactement là où la Façade dessine son navire / son randonneur.
// Traîne = mêmes fonctions évaluées 90 et 180 ms plus tôt.
// ------------------------------------------------------------------
const SCROLL_ONLY = new Set(["reader"]);
function setTrail(el, fn) {
  const kids = el.children;
  for (let i = 0; i < kids.length; i++) {
    const p = fn(i * 90);
    kids[i].style.transform = `translate(${R(p.x)}px,${R(p.y)}px)`;
  }
}
const RING_STEP = 700;
const FACE_MOVE = {
  orbit: (el, g, t) => setTrail(el, (d) => GEO.motion.orbit(g, t - d * 3)),
  down: (el, g, t, ctx, k) => setTrail(el, (d) => GEO.motion.downstream(g, t - d, k)),
  walker: (el, g, t, ctx, k) => setTrail(el, (d) => GEO.motion.walker(g, t - d, k)),
  crossing: (el, g, t) => setTrail(el, (d) => GEO.motion.crossing(g, t - d * 1.5)),
  reader: (el, g, t, ctx) => setTrail(el, (d) => GEO.motion.reader(g, t, { sy: ctx.sy - d * 0.35, top: ctx.top, vh: ctx.vh })),
  // anneau all-reduce : 2×7 étapes (reduce-scatter puis all-gather) + pause
  chunk(el, g, t, ctx, k) {
    const cyc = Math.floor(t / RING_STEP) % 16;
    const f = (t % RING_STEP) / RING_STEP;
    const step = Math.min(cyc, 13);
    const moving = cyc < 14;
    const from = (k + step) % 8, to = (from + 1) % 8;
    const a = g.tips[from], b = g.tips[to];
    const e = moving ? 0.5 - 0.5 * Math.cos(Math.PI * f) : 0;
    el.style.transform = `translate(${R(a.x + (b.x - a.x) * e)}px,${R(a.y + (b.y - a.y) * e)}px)`;
  },
  ringstep(el, g, t) {
    const cyc = Math.floor(t / RING_STEP) % 16;
    const s = cyc < 7 ? `reduce-scatter ${cyc + 1}/7` : cyc < 14 ? `all-gather ${cyc - 6}/7` : "allreduce ✓ done";
    const txtv = `[nccl] ring 0 · ${s}`;
    if (el.textContent !== txtv) el.textContent = txtv;
  },
};
