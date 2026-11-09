// Contenu — Machine ("Calcul") : le même monde que la Façade, révélé
// comme la simulation numérique qu'il est. Mêmes ids, même ordre, mêmes
// hauteurs (CSS) que la Façade ; positions clés partagées via sim-core.js.

const ICON_LINKEDIN = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.48v6.26zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>`;
const ICON_GITHUB = `<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`;
const ICON_GITLAB = `<svg viewBox="0 0 24 22" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 21.6 16.2 8.7H7.8L12 21.6Z"/><path d="M4.6 8.7 3 13.6a.9.9 0 0 0 .33 1L12 21.6 4.6 8.7Z"/><path d="M4.6 8.7h3.2L6.4 2.9a.45.45 0 0 0-.86 0L4.6 8.7Z"/><path d="M19.4 8.7 21 13.6a.9.9 0 0 1-.33 1L12 21.6l7.4-12.9Z"/><path d="M19.4 8.7h-3.2l1.4-5.8a.45.45 0 0 1 .86 0l1 3.87v1.93Z"/></svg>`;

const SOCIAL = [
  { href: "https://www.linkedin.com/in/leo-hunout", name: "linkedin", handle: "in/leo-hunout", icon: ICON_LINKEDIN },
  { href: "https://github.com/hunoutl", name: "github", handle: "hunoutl", icon: ICON_GITHUB },
  { href: "https://gitlab.com/hunoutl", name: "gitlab", handle: "hunoutl", icon: ICON_GITLAB },
];

const socialIcons = () =>
  `<div class="quick-contacts">${SOCIAL.map(
    (s) => `<a href="${s.href}" target="_blank" rel="noopener" aria-label="${s.name}" title="${s.name}">${s.icon}</a>`
  ).join("")}</div>`;

// fenêtre "terminal" : barre de titre + corps
const win = (cls, title, meta, body) => `
  <div class="win ${cls}">
    <div class="bar"><span><i class="dot"></i>${title}</span><span>${meta}</span></div>
    <div class="body">${body}</div>
  </div>`;

const sec = (n, name) => `<p class="sec"><b>§${n}</b> ${name}</p>`;

const JOBS = {
  en: [
    ["2026-02 → now", "AI/HPC Senior Consultant", "Aneo · full-time · Paris area, hybrid", "Hybrid cloud/on-prem infra for quant research: orchestrator scheduling compute across AWS and Slurm."],
    ["2026-02 → now", "Portfolio Platform Engineer", "Capital Fund Management (CFM) · contractor · Paris, on-site", ""],
    ["2025-08 → 2026-01", "Sr. AI/HPC Engineer", "MINERVA European Support Centre for Scalable AI Research and Deployment · fixed-term · Saclay", "Deployed and operated Dalia supercomputer — 360 PFlop/s (FP16), 72x NVIDIA GB200."],
    ["2024-03 → 2026-01", "Artificial Intelligence Engineer", "CNRS · fixed-term · Saclay", "2000-user support on Jean Zay (125 PFlop/s, 1456x NVIDIA H100) — password resets to LLM pre-training. AI &amp; HPC software stacks, multi-GPU/multi-node benchmarking, large-scale training/finetuning (BLOOM, LLaMA, ViT). PNRIA network contributor. AI trainer for Fidle, DLO-JZ, Panoram'IA; workshops, hackathons, AI-DevTalks."],
    ["2025-12", "Lecturer — MSc Data Science &amp; AI for Business, X-HEC", "École Polytechnique · independent · Palaiseau", ""],
    ["2022-03 → 2025-09", "Lecturer — Deep Learning &amp; HPC", "FIDLE · remote", ""],
    ["2022-03 → 2024-02", "Artificial Intelligence Engineer", "Inria · fixed-term · Saclay", "Jean Zay supercomputer, previous generation — 37 PFlop/s."],
    ["2021-02 → 2021-08", "Embedded AI Engineer (intern)", "Atos, Toulouse", "Embedded CV for real-time quality inspection: YOLOv4/Faster R-CNN on Jetson Nano, −80% latency via quantization &amp; pruning."],
    ["2020-04 → 2020-08", "Infrastructure Engineer (intern)", "SPASCIA, Ramonville-Saint-Agne", "110-node ARM-SBC cluster (440 CPU cores) for async RL training — custom OS, automation, monitoring, web services."],
  ],
  fr: [
    ["2026-02 → auj.", "AI/HPC Senior Consultant", "Aneo · CDI · Paris et périphérie, hybride", "Infra cloud/on-prem hybride pour la recherche quantitative : orchestrateur répartissant les jobs entre AWS et Slurm."],
    ["2026-02 → auj.", "Portfolio Platform Engineer", "Capital Fund Management (CFM) · intérimaire · Paris, sur site", ""],
    ["2025-08 → 2026-01", "Sr. AI/HPC Engineer", "MINERVA European Support Centre for Scalable AI Research and Deployment · CDD · Saclay", "Déploiement et exploitation du supercalculateur Dalia — 360 PFlop/s (FP16), 72x NVIDIA GB200."],
    ["2024-03 → 2026-01", "Ingénieur en intelligence artificielle", "CNRS · CDD · Saclay", "Support de 2000 utilisateurs de Jean Zay (125 PFlop/s, 1456x NVIDIA H100) — du reset de mot de passe au pré-entraînement de LLM. Environnements IA &amp; HPC, benchmarking multi-GPU/multi-nœud, entraînement/finetuning à grande échelle (BLOOM, LLaMA, ViT). Contributeur au réseau PNRIA. Formateur Fidle, DLO-JZ, Panoram'IA ; ateliers, hackathons, AI-DevTalks."],
    ["2025-12", "Chargé de cours — Master Data Science &amp; AI for Business, X-HEC", "École Polytechnique · indépendant · Palaiseau", ""],
    ["2022-03 → 2025-09", "Formateur — Deep Learning &amp; HPC", "FIDLE · à distance", ""],
    ["2022-03 → 2024-02", "Ingénieur en intelligence artificielle", "Inria · CDD · Saclay", "Supercalculateur Jean Zay, génération précédente — 37 PFlop/s."],
    ["2021-02 → 2021-08", "Ingénieur IA embarquée (stage)", "Atos, Toulouse", "Vision embarquée pour le contrôle qualité temps réel : YOLOv4/Faster R-CNN sur Jetson Nano, −80 % de latence (quantization &amp; pruning)."],
    ["2020-04 → 2020-08", "Ingénieur infrastructure (stage)", "SPASCIA, Ramonville-Saint-Agne", "Cluster ARM-SBC 110 nœuds (440 cœurs CPU) pour RL asynchrone — OS sur mesure, automatisation, monitoring, services web."],
  ],
};

// Les 5 attracteurs de la Façade, vus comme des clés de stack.yaml.
const STACK = {
  en: [
    ["ai_training", [["ai", "PyTorch, TensorFlow, Transformers, Hugging Face, vLLM, Llama.cpp, Gradio, Agents"], ["ml", "Scikit-learn, NumPy, Pandas, Optuna"], ["distributed", "FSDP, DDP, ZeRO, TP/PP, bf16, fp8, NCCL, DeepSpeed"], ["monitoring", "MLflow, W&amp;B"]]],
    ["infra", [["hpc", "OpenMP, MPI, NCCL, multi-node, multi-GPU"], ["infra", "Proxmox, Slurm, Docker, Singularity, Kubernetes, Spack, Git, CI/CD, DVC, Ray, Dask"], ["cloud", "AWS (Lambda, S3, EC2)"]]],
    ["teaching", [["courses", "Fidle, DLO-JZ, Panoram'IA, X-HEC"], ["events", "workshops, hackathons, AI-DevTalks"]]],
    ["lang", [["code", "Python, C/C++, Bash, Julia, MATLAB, LaTeX"]]],
    ["human_lang", [["fr", "native"], ["en", "fluent"]]],
  ],
  fr: [
    ["ai_training", [["ai", "PyTorch, TensorFlow, Transformers, Hugging Face, vLLM, Llama.cpp, Gradio, Agents"], ["ml", "Scikit-learn, NumPy, Pandas, Optuna"], ["distributed", "FSDP, DDP, ZeRO, TP/PP, bf16, fp8, NCCL, DeepSpeed"], ["monitoring", "MLflow, W&amp;B"]]],
    ["infra", [["hpc", "OpenMP, MPI, NCCL, multi-nœud, multi-GPU"], ["infra", "Proxmox, Slurm, Docker, Singularity, Kubernetes, Spack, Git, CI/CD, DVC, Ray, Dask"], ["cloud", "AWS (Lambda, S3, EC2)"]]],
    ["teaching", [["cours", "Fidle, DLO-JZ, Panoram'IA, X-HEC"], ["events", "ateliers, hackathons, AI-DevTalks"]]],
    ["lang", [["code", "Python, C/C++, Bash, Julia, MATLAB, LaTeX"]]],
    ["human_lang", [["fr", "natif"], ["en", "courant"]]],
  ],
};

const EDU = {
  en: [
    ["msc", "Industrial Systems Engineering / Data Science", "INSA Centre Val de Loire, Blois", "2016–2021"],
    ["exchange", "MSc Electrical Engineering", "École de Technologie Supérieure, Montréal", "2019"],
    ["toeic", "C1 (965/990)", "issued", "2020-10"],
  ],
  fr: [
    ["master", "Ingénierie des Systèmes Industriels / Data Science", "INSA Centre Val de Loire, Blois", "2016–2021"],
    ["echange", "Master Génie Électrique", "École de Technologie Supérieure, Montréal", "2019"],
    ["toeic", "C1 (965/990)", "émis", "2020-10"],
  ],
};

const T = {
  en: {
    title: "hunoutl",
    sub: "AI/HPC engineer · uptime 4+ yrs · large-scale AI &amp; HPC infra",
    lede: "Multi-node GPU training, supercomputer ops, hybrid cloud/on-prem orchestration. Distributed training internals (FSDP/DDP/ZeRO, NCCL, tensor/pipeline parallelism), Slurm, Kubernetes, MPI/OpenMP.",
    fieldCap: "portrait → scalar field ρ(x,y), 40×40 cells",
    note: "Toy simulation running in your browser — same seed, same wall-clock tick, same positions as the human side. Not a real cluster.",
    hud: "sim.status",
    layers: "layers",
    lMesh: "mesh",
    lVec: "u(x)",
    lHalo: "halos",
    lTrail: "trails",
    about: "Optimizing GPU clusters is only half the job — the other half is making that compute usable by people who aren't systems experts. 4 years supporting 3000+ researchers on Jean Zay (one of France's largest supercomputers) taught me as much about NCCL tuning and multi-node scaling as about writing docs and giving talks that don't assume prior HPC knowledge. Currently applying the same infra instincts to a tighter, quant-research context: hybrid cloud/on-prem orchestration instead of national-scale clusters.",
    srcTag: "S(x): point source · u<sub>r</sub> = Q·r/(r²+r<sub>0</sub>²)<br>overlay: ρ = tracers per 24×24 px cell",
    expCap: "streamline + AMR quadtree (split while n &gt; 5 tracers, min cell 12 px). Time flows downstream.",
    skillsCap: "5 attractors · vortex Γ<sub>k</sub> + radial pull, Gaussian envelope σ · isolines of φ",
    eduCap: "t = 0: tracers seeded on a regular lattice, then advected. Crosses = initial positions, segments = displacement.",
    contactCap: "sink · u<sub>r</sub> = −Q·r/(r²+r<sub>0</sub>²) · every trajectory ends here",
    how: [
      ["state", "pure function of the wall-clock tick (20 Hz, fixed epoch) — no history"],
      ["tracers", "finite lifetimes (5.5 s), spawn from a seeded integer hash, never Math.random()"],
      ["flow", "ψ-formulation (∇·u = 0) + per-floor forcing, RK2 midpoint, dt = 50 ms"],
      ["domain", "x-periodic, Lx = viewport width: the sliding mirror iframe is offset by exactly Lx, so both sites tile seamlessly"],
      ["swipe", "mirror prefetched (Speculation Rules) + live iframe preview, single-file inline build"],
    ],
  },
  fr: {
    title: "hunoutl",
    sub: "Ingénieur AI/HPC · uptime 4+ ans · infra IA &amp; HPC à grande échelle",
    lede: "Entraînement GPU multi-nœud, exploitation de supercalculateurs, orchestration cloud/on-prem hybride. Internals de l'entraînement distribué (FSDP/DDP/ZeRO, NCCL, parallélisme tenseur/pipeline), Slurm, Kubernetes, MPI/OpenMP.",
    fieldCap: "portrait → champ scalaire ρ(x,y), 40×40 cellules",
    note: "Simulation jouet exécutée dans votre navigateur — même graine, même tick d'horloge, mêmes positions que la face humaine. Pas un vrai cluster.",
    hud: "sim.status",
    layers: "calques",
    lMesh: "maillage",
    lVec: "u(x)",
    lHalo: "halos",
    lTrail: "traînées",
    about: "Optimiser des clusters GPU n'est que la moitié du travail — l'autre moitié consiste à rendre ce calcul utilisable par des gens qui ne sont pas experts systèmes. 4 ans à supporter plus de 3000 chercheurs sur Jean Zay (l'un des plus gros supercalculateurs français) m'ont autant appris sur le tuning NCCL et le scaling multi-nœud que sur la rédaction de docs et les talks accessibles sans prérequis HPC. J'applique aujourd'hui les mêmes réflexes d'infra dans un contexte plus resserré, orienté recherche quantitative : orchestration cloud/on-prem hybride plutôt que clusters à l'échelle nationale.",
    srcTag: "S(x) : source ponctuelle · u<sub>r</sub> = Q·r/(r²+r<sub>0</sub>²)<br>calque : ρ = traceurs par cellule 24×24 px",
    expCap: "ligne de courant + quadtree AMR (division tant que n &gt; 5 traceurs, cellule min. 12 px). Le temps coule vers l'aval.",
    skillsCap: "5 attracteurs · vortex Γ<sub>k</sub> + rappel radial, enveloppe gaussienne σ · isolignes de φ",
    eduCap: "t = 0 : traceurs posés sur un réseau régulier, puis advectés. Croix = positions initiales, segments = déplacement.",
    contactCap: "puits · u<sub>r</sub> = −Q·r/(r²+r<sub>0</sub>²) · toutes les trajectoires finissent ici",
    how: [
      ["état", "fonction pure du tick d'horloge murale (20 Hz, époque fixe) — aucun historique"],
      ["traceurs", "durée de vie finie (5,5 s), naissance par hash entier seedé, jamais Math.random()"],
      ["écoulement", "formulation en ψ (∇·u = 0) + forçage par étage, RK2 point milieu, dt = 50 ms"],
      ["domaine", "périodique en x, Lx = largeur du viewport : l'iframe miroir qui glisse est décalée d'exactement Lx, les deux sites se raccordent sans couture"],
      ["bascule", "miroir prefetché (Speculation Rules) + aperçu iframe vivant, build en fichier unique"],
    ],
  },
};

// État d'interface (non persistant : la page d'arrivée et l'aperçu
// partent toujours des mêmes valeurs par défaut).
const UI = { ranks: 4, layers: { mesh: true, vec: true, halo: true, trail: true } };

const btn = (kind, val, label, on) =>
  `<button type="button" class="tg${on ? " on" : ""}" data-${kind}="${val}" aria-pressed="${on}">${label}</button>`;

function heroFloor(l) {
  const t = T[l];
  const ranks = [1, 2, 4, 8].map((r) => btn("ranks", r, r, UI.ranks === r)).join("");
  const layers = [
    ["mesh", t.lMesh],
    ["vec", t.lVec],
    ["halo", t.lHalo],
    ["trail", t.lTrail],
  ]
    .map(([k, lab]) => btn("layer", k, lab, UI.layers[k]))
    .join("");
  return `
    <div class="field-wrap">
      <img class="field" src="assets/me-field.png" alt="" width="40" height="40" decoding="sync" />
      <p class="field-cap">${t.fieldCap}</p>
    </div>
    <div class="hero-stack">
      ${win(
        "hero-win",
        "~/hunoutl",
        "zsh · 80×24",
        `<p class="prompt">leo@hpc:~$ ./tracers --ranks ${UI.ranks} --dt 50ms</p>
         <h1>${t.title}</h1>
         <p class="subtitle">${t.sub}</p>
         <p class="lede">${t.lede}</p>
         ${socialIcons()}`
      )}
      ${win(
        "hud",
        t.hud,
        "live",
        `<dl class="kv">
           <dt>step</dt><dd data-hud="step">—</dd>
           <dt>t_sim</dt><dd data-hud="t">—</dd>
           <dt class="opt">dt</dt><dd class="opt">50 ms · RK2</dd>
           <dt>tracers</dt><dd data-hud="n">—</dd>
           <dt class="opt">domain</dt><dd class="opt" data-hud="dom">—</dd>
           <dt>ranks</dt><dd class="tgs">${ranks}</dd>
           <dt>load</dt><dd class="bars" data-hud="bars"></dd>
           <dt>halo</dt><dd data-hud="halo">—</dd>
           <dt>est.</dt><dd data-hud="cost">—</dd>
           <dt>${t.layers}</dt><dd class="tgs">${layers}</dd>
         </dl>
         <p class="note">${t.note}</p>`
      )}
    </div>`;
}

function aboutFloor(l) {
  const t = T[l];
  return `
    <p class="src-tag">${t.srcTag}</p>
    ${win("about-win", "about.md", "1 file · utf-8", `${sec(1, "scatter()")}<p class="prompt">$ cat about.md</p><p>${t.about}</p>`)}`;
}

function expFloor(l) {
  const t = T[l];
  return `
    ${win("exp-head", "trajectory.log", "tail -f", `${sec(2, "advect()")}<p class="prompt">$ tail -f trajectory.log</p><p class="cap">${t.expCap}</p>`)}
    <div class="jobs">${JOBS[l]
      .map(
        (j, k) => `
      <article class="job ${k % 2 ? "right" : "left"}">
        <p class="ts">[${j[0]}]</p>
        <h3>${j[1]}</h3>
        <p class="meta">${j[2]}</p>
        ${j[3] ? `<p class="job-text">${j[3]}</p>` : ""}
      </article>`
      )
      .join("")}</div>`;
}

function skillsFloor(l) {
  const t = T[l];
  return `
    ${win("skills-head", "stack.yaml", "5 attractors", `${sec(3, "forces()")}<p class="prompt">$ cat stack.yaml</p><p class="cap">${t.skillsCap}</p>`)}
    ${STACK[l]
      .map(
        (a, k) => `
      <div class="force f${k}">
        <p class="att">attractor[${k}] <b>${a[0]}:</b></p>
        ${a[1].map((kv) => `<p class="kvl"><span>${kv[0]}:</span> ${kv[1]}</p>`).join("")}
      </div>`
      )
      .join("")}`;
}

function eduFloor(l) {
  const t = T[l];
  return `
    ${win(
      "edu-win",
      "initial_conditions.yaml",
      "t = 0",
      `${sec(4, "init()")}<p class="prompt">$ cat initial_conditions.yaml</p><p class="cap">${t.eduCap}</p>
       ${EDU[l].map((e) => `<div class="edu"><p><span class="k">${e[0]}:</span> ${e[1]}</p><p class="meta">${e[2]} · ${e[3]}</p></div>`).join("")}`
    )}`;
}

function contactFloor(l) {
  const t = T[l];
  return `
    ${win("contact-head", "output/", "3 endpoints", `${sec(5, "write()")}<p class="prompt">$ ls output/</p><p class="cap">${t.contactCap}</p>`)}
    <div class="links">${SOCIAL.map(
      (s) => `<a href="${s.href}" target="_blank" rel="noopener">${s.icon}<span class="ln">${s.name}</span><span class="lh">/${s.handle}</span></a>`
    ).join("")}</div>
    ${win("how", "README — how this page works", "", `<dl class="kv">${t.how.map((h) => `<dt>${h[0]}</dt><dd>${h[1]}</dd>`).join("")}</dl>`)}`;
}

const FLOORS = [
  { id: "hero", en: () => heroFloor("en"), fr: () => heroFloor("fr") },
  { id: "apropos", en: () => aboutFloor("en"), fr: () => aboutFloor("fr") },
  { id: "experiences", en: () => expFloor("en"), fr: () => expFloor("fr") },
  { id: "competences", en: () => skillsFloor("en"), fr: () => skillsFloor("fr") },
  { id: "formation", en: () => eduFloor("en"), fr: () => eduFloor("fr") },
  { id: "contact", en: () => contactFloor("en"), fr: () => contactFloor("fr") },
];
