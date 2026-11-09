// Contenu — Machine « le calcul qui fait la mer ». Mêmes ids, même ordre,
// mêmes hauteurs (geo.js) que la Façade ; positions des panneaux et
// étiquettes partagées (geo.js) : la radiographie tombe au même endroit.
// Faits : repris des content.js existants. Les métriques de simulation
// (pas, charge, paquets) sont celles de la simulation jouet du navigateur.

const ICON_LINKEDIN = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.48v6.26zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>`;
const ICON_GITHUB = `<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`;
const ICON_GITLAB = `<svg viewBox="0 0 24 22" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 21.6 16.2 8.7H7.8L12 21.6Z"/><path d="M4.6 8.7 3 13.6a.9.9 0 0 0 .33 1L12 21.6 4.6 8.7Z"/><path d="M4.6 8.7h3.2L6.4 2.9a.45.45 0 0 0-.86 0L4.6 8.7Z"/><path d="M19.4 8.7 21 13.6a.9.9 0 0 1-.33 1L12 21.6l7.4-12.9Z"/><path d="M19.4 8.7h-3.2l1.4-5.8a.45.45 0 0 1 .86 0l1 3.87v1.93Z"/></svg>`;

const SOCIAL = [
  { href: "https://www.linkedin.com/in/leo-hunout", name: "linkedin", handle: "in/leo-hunout", icon: ICON_LINKEDIN },
  { href: "https://github.com/hunoutl", name: "github", handle: "hunoutl", icon: ICON_GITHUB },
  { href: "https://gitlab.com/hunoutl", name: "gitlab", handle: "hunoutl", icon: ICON_GITLAB },
];

// Les 5 parties du navire de la Façade = les 5 couches de la stack (même ordre que GEO.ship().parts).
const STACK = {
  en: [
    ["ai_training", "PyTorch, TensorFlow, Transformers, Hugging Face, vLLM, Llama.cpp · FSDP, DDP, ZeRO, TP/PP, bf16, fp8, NCCL, DeepSpeed · MLflow, W&amp;B"],
    ["infra", "Proxmox, Slurm, Docker, Singularity, Kubernetes, Spack, CI/CD, Ray, Dask · OpenMP, MPI · AWS (Lambda, S3, EC2)"],
    ["teaching", "Fidle, DLO-JZ, Panoram'IA, X-HEC · workshops, hackathons, AI-DevTalks"],
    ["lang", "Python, C/C++, Bash, Julia, MATLAB, LaTeX"],
    ["human_lang", "fr: native · en: fluent"],
  ],
  fr: [
    ["ai_training", "PyTorch, TensorFlow, Transformers, Hugging Face, vLLM, Llama.cpp · FSDP, DDP, ZeRO, TP/PP, bf16, fp8, NCCL, DeepSpeed · MLflow, W&amp;B"],
    ["infra", "Proxmox, Slurm, Docker, Singularity, Kubernetes, Spack, CI/CD, Ray, Dask · OpenMP, MPI · AWS (Lambda, S3, EC2)"],
    ["teaching", "Fidle, DLO-JZ, Panoram'IA, X-HEC · ateliers, hackathons, AI-DevTalks"],
    ["lang", "Python, C/C++, Bash, Julia, MATLAB, LaTeX"],
    ["human_lang", "fr : natif · en : courant"],
  ],
};

const T = {
  en: {
    sub: "AI/HPC engineer · uptime 4+ yrs · large-scale AI &amp; HPC infra",
    lede: "Multi-node GPU training, supercomputer ops, hybrid cloud/on-prem orchestration. Distributed training internals (FSDP/DDP/ZeRO, NCCL, tensor/pipeline parallelism), Slurm, Kubernetes, MPI/OpenMP.",
    hint: "scroll → camera climbs through cloud.layer: pitch φ 9° → 90°, perspective → plan view",
    about: "Optimizing GPU clusters is only half the job — the other half is making that compute usable by people who aren't systems experts. 4 years supporting 3000+ researchers on Jean Zay (one of France's largest supercomputers) taught me as much about NCCL tuning and multi-node scaling as about writing docs and giving talks that don't assume prior HPC knowledge.",
    note: "Toy simulation running in your browser: same seed, same wall-clock tick, same positions as the human side. The sea is a domain split into 4 MPI-style ranks; islands are masked cells (boundary conditions); tracers within ±12 px of an interface are copied as ghosts (hollow squares) into the neighbour rank; numbers in cells are the live swell height h(x,t). Not a real cluster.",
    forcesP: "The human map draws a ship in cross-section; under it, the same drawing is the software stack, layer by layer. Currently applying the same infra instincts to a tighter, quant-research context.",
    readUp: "y axis = abstraction stack, cloud → metal (and time, read backwards).",
  },
  fr: {
    sub: "Ingénieur AI/HPC · uptime 4+ ans · infra IA &amp; HPC à grande échelle",
    lede: "Entraînement GPU multi-nœud, exploitation de supercalculateurs, orchestration cloud/on-prem hybride. Internals de l'entraînement distribué (FSDP/DDP/ZeRO, NCCL, parallélisme tenseur/pipeline), Slurm, Kubernetes, MPI/OpenMP.",
    hint: "scroll → la caméra traverse cloud.layer : φ 9° → 90°, perspective → vue en plan",
    about: "Optimiser des clusters GPU n'est que la moitié du travail — l'autre moitié consiste à rendre ce calcul utilisable par des gens qui ne sont pas experts systèmes. 4 ans à supporter plus de 3000 chercheurs sur Jean Zay (l'un des plus gros supercalculateurs français) m'ont autant appris sur le tuning NCCL et le scaling multi-nœud que sur la rédaction de docs et les talks accessibles sans prérequis HPC.",
    note: "Simulation jouet exécutée dans votre navigateur : même graine, même tick d'horloge, mêmes positions que la face humaine. La mer = un domaine découpé en 4 rangs façon MPI ; les îles sont des cellules masquées (conditions aux limites) ; les traceurs à moins de 12 px d'une interface sont copiés en fantômes (carrés creux) dans le rang voisin ; les nombres dans les cellules sont la hauteur de houle h(x,t), en direct. Pas un vrai cluster.",
    forcesP: "La carte humaine dessine un navire en coupe ; dessous, le même dessin est la stack logicielle, couche par couche. J'applique aujourd'hui les mêmes réflexes d'infra dans un contexte plus resserré, orienté recherche quantitative.",
    readUp: "axe y = pile d'abstraction, du cloud au métal (et le temps, lu à rebours).",
  },
};

const job = (when, title, where, text) => `
  <article class="job"><p class="when">${when}</p><h3>${title}</h3><p class="where">${where}</p>${text ? `<p>${text}</p>` : ""}</article>`;
const panel = (id, sheet, layer, h2, body) =>
  `<div class="card" data-card="${id}"><div class="bar"><span>${sheet}</span><span>${layer}</span></div><div class="body"><h2>${h2}</h2>${body}</div></div>`;
const tag = (key, txt, cls) => `<span class="tag${cls ? ` ${cls}` : ""}" data-tag="${key}">${txt}</span>`;
const layerMark = (txt) => `<p class="layer-mark" aria-hidden="true"><span>${txt}</span></p>`;

const F = {
  hero(l) {
    const t = T[l];
    return `
      ${layerMark("L7 · cloud.layer")}
      <div class="sky-title" data-card="hero">
        <p class="prompt">$ whoami --verbose</p>
        <h1>hunoutl</h1>
        <p class="sub">${t.sub}</p>
        <p class="lede">${t.lede}</p>
      </div>
      <p class="scroll-hint">${t.hint}</p>
      <div class="card about" data-card="hero2"><div class="bar"><span>SHEET 01/09 · README</span><span>sim.status</span></div><div class="body">
        <p>${t.about}</p>
        <div class="hud">
          <p><b>step</b> <span data-hud="step">0</span> · <b>t</b> <span data-hud="t">0</span> s · <b>dt</b> 50 ms</p>
          <p><b>tracers</b> <span data-hud="tr">0</span> · <b>halo ghosts</b> <span data-hud="pk">0</span></p>
          <div class="bars" data-hud="bars"><i></i><i></i><i></i><i></i></div>
          <p class="ranks"><span class="r0">rank0</span><span class="r1">rank1</span><span class="r2">rank2</span><span class="r3">rank3</span></p>
        </div>
        <p class="note">${t.note}</p>
      </div></div>`;
  },
  vents(l) {
    const t = T[l];
    const NAMES = ["sails", "hull", "helm", "saloon", "flags"];
    const list = STACK[l].map(([k, v], i) => `<li><b class="r${i % 4}">F${i} ${k} <em>← ${NAMES[i]}</em></b><span>${v}</span></li>`).join("");
    const labels = STACK[l].map(([k], i) => `<span class="part" data-part="${i}">${k}</span>`).join("");
    return (
      layerMark("stack.yaml") +
      panel("vents", "SHEET 02/09 · STACK", "stack.yaml", "stack.yaml", `<p>${t.forcesP}</p><ol class="winds">${list}</ol><p class="readup">${t.readUp}</p>`) +
      `<div class="inset"><p class="inset-title">wireframe · ship.svg → stack</p><div class="ship"></div>${labels}</div>`
    );
  },
  aujourdhui(l) {
    const fr = l === "fr";
    return (
      layerMark("L6 · hybrid cloud") +
      panel(
        "aujourdhui",
        "SHEET 03/09 · HYBRID",
        "L6",
        fr ? "cloud hybride" : "hybrid cloud",
        job(fr ? "2026-02 → auj." : "2026-02 → now", "AI/HPC Senior Consultant", fr ? "Aneo · CDI · Paris et périphérie, hybride" : "Aneo · full-time · Paris area, hybrid", fr ? "Infra cloud/on-prem hybride pour la recherche quantitative : orchestrateur répartissant les jobs entre AWS et Slurm. Le tourbillon = le scheduler." : "Hybrid cloud/on-prem infra for quant research: orchestrator scheduling compute across AWS and Slurm. The whirlpool = the scheduler.") +
          job(fr ? "2026-02 → auj." : "2026-02 → now", "Portfolio Platform Engineer", fr ? "Capital Fund Management (CFM) · intérimaire · Paris" : "Capital Fund Management (CFM) · contractor · Paris", "")
      ) +
      tag("aneo", "on-prem · slurm") + tag("sky", "aws · ec2 / s3 / lambda") + tag("whirl", "scheduler", "it") + tag("cfm", "cfm", "small")
    );
  },
  dalia(l) {
    const fr = l === "fr";
    return (
      layerMark("L5 · NVL72") +
      panel(
        "dalia",
        "SHEET 04/09 · NVL72",
        "L5",
        "dalia: NVL72",
        job("2025-08 → 2026-01", "Sr. AI/HPC Engineer", fr ? "MINERVA European Support Centre for Scalable AI Research and Deployment · CDD · Saclay" : "MINERVA European Support Centre for Scalable AI Research and Deployment · fixed-term · Saclay", fr ? "Déploiement et exploitation du supercalculateur Dalia — 360 PFlop/s (FP16), 72x NVIDIA GB200. Cratère = domaine NVLink, crêtes = NVSwitch, lave = trafic NVLink." : "Deployed and operated the Dalia supercomputer — 360 PFlop/s (FP16), 72x NVIDIA GB200. Crater = NVLink domain, ridges = NVSwitch, lava = NVLink traffic.") +
          job("2025-12", fr ? "Chargé de cours — Master Data Science &amp; AI for Business, X-HEC" : "Lecturer — MSc Data Science &amp; AI for Business, X-HEC", fr ? "École Polytechnique · indépendant · Palaiseau" : "École Polytechnique · independent · Palaiseau", "")
      ) +
      tag("volcano", "72× GB200 · nvlink") + tag("xhec", "x-hec", "small")
    );
  },
  jeanzay(l) {
    const fr = l === "fr";
    return (
      layerMark("L4 · supercomputer") +
      panel(
        "jeanzay",
        "SHEET 05/09 · JEAN ZAY",
        "L4",
        fr ? "jean zay : supercalculateur" : "jean zay: supercomputer",
        job("2024-03 → 2026-01", fr ? "Ingénieur en intelligence artificielle" : "Artificial Intelligence Engineer", fr ? "CNRS · CDD · Saclay" : "CNRS · fixed-term · Saclay", fr ? "Support de 2000 utilisateurs de Jean Zay (125 PFlop/s, 1456x NVIDIA H100) — du reset de mot de passe au pré-entraînement de LLM. Environnements IA &amp; HPC, benchmarking multi-GPU/multi-nœud, entraînement/finetuning à grande échelle (BLOOM, LLaMA, ViT). Formateur Fidle, DLO-JZ, Panoram'IA." : "2000-user support on Jean Zay (125 PFlop/s, 1456x NVIDIA H100) — password resets to LLM pre-training. AI &amp; HPC software stacks, multi-GPU/multi-node benchmarking, large-scale training/finetuning (BLOOM, LLaMA, ViT). AI trainer for Fidle, DLO-JZ, Panoram'IA.") +
          job("2022-03 → 2024-02", fr ? "Ingénieur en intelligence artificielle" : "Artificial Intelligence Engineer", fr ? "Inria · CDD · Saclay" : "Inria · fixed-term · Saclay", fr ? "Jean Zay, génération précédente — 37 PFlop/s." : "Jean Zay, previous generation — 37 PFlop/s.") +
          job("2022-03 → 2025-09", fr ? "Formateur — Deep Learning &amp; HPC" : "Lecturer — Deep Learning &amp; HPC", fr ? "FIDLE · à distance" : "FIDLE · remote", "")
      ) +
      tag("jeanzay", "1456× H100 · 125 PFlop/s") + tag("newCity", "cnrs · 52×28 = 1456 gpu", "it") + tag("oldCity", fr ? "inria · gén. préc. · 37 PFlop/s" : "inria · prev gen · 37 PFlop/s", "it") +
      tag("fidle", "fidle", "small") + tag("dlojz", "dlo-jz", "small") + tag("panoramia", "panoram'ia", "small")
    );
  },
  atos(l) {
    const fr = l === "fr";
    return (
      layerMark("L2 · edge") +
      panel(
        "atos",
        "SHEET 06/09 · EDGE",
        "L2",
        fr ? "edge : inférence" : "edge: inference",
        job("2021-02 → 2021-08", fr ? "Ingénieur IA embarquée (stage)" : "Embedded AI Engineer (intern)", "Atos, Toulouse", fr ? "Vision embarquée pour le contrôle qualité temps réel : YOLOv4/Faster R-CNN sur Jetson Nano, −80 % de latence (quantization &amp; pruning). Le faisceau = la boucle d'inférence." : "Embedded CV for real-time quality inspection: YOLOv4/Faster R-CNN on Jetson Nano, −80% latency via quantization &amp; pruning. The beam = the inference loop.")
      ) + tag("atos", "jetson nano") + tag("light", "inference loop", "it") + tag("belt", "qc pipeline", "it")
    );
  },
  spascia(l) {
    const fr = l === "fr";
    return (
      layerMark("L1 · bare metal") +
      panel(
        "spascia",
        "SHEET 07/09 · BARE METAL",
        "L1",
        "bare metal: 110 × arm",
        job("2020-04 → 2020-08", fr ? "Ingénieur infrastructure (stage)" : "Infrastructure Engineer (intern)", "SPASCIA, Ramonville-Saint-Agne", fr ? "Cluster ARM-SBC 110 nœuds (440 cœurs CPU) pour RL asynchrone — OS sur mesure, automatisation, monitoring, services web. 1 cabane = 1 nœud : les 110 sont dessinés." : "110-node ARM-SBC cluster (440 CPU cores) for async RL training — custom OS, automation, monitoring, web services. 1 hut = 1 node: all 110 are drawn.")
      ) + tag("spascia", "110 nodes · 440 cores")
    );
  },
  origines(l) {
    const fr = l === "fr";
    const edu = fr
      ? [["2016–2021", "Ingénierie des Systèmes Industriels / Data Science", "INSA Centre Val de Loire, Blois"], ["2019", "échange · Master Génie Électrique", "École de Technologie Supérieure, Montréal"], ["2020-10", "TOEIC C1 (965/990)", "émis"]]
      : [["2016–2021", "Industrial Systems Engineering / Data Science", "INSA Centre Val de Loire, Blois"], ["2019", "exchange · MSc Electrical Engineering", "École de Technologie Supérieure, Montréal"], ["2020-10", "TOEIC C1 (965/990)", "issued"]];
    return (
      layerMark("L0 · boot") +
      panel("origines", "SHEET 08/09 · BOOT", "L0", "init()", `<p>${fr ? "Conditions initiales : BIOS, puis le reste du système." : "Initial conditions: BIOS, then the rest of the system."}</p>` + edu.map(([a, b, c]) => job(a, b, c, "")).join("")) +
      tag("port", "insa · blois") + tag("yard", "bios · init()", "it") + tag("ets", "éts · montréal", "small")
    );
  },
  contact(l) {
    const fr = l === "fr";
    const links = SOCIAL.map((s) => `<a href="${s.href}" target="_blank" rel="noopener">${s.icon}<span>${s.name}</span><small>${s.handle}</small></a>`).join("");
    return (
      layerMark("./launch") +
      panel("contact", "SHEET 09/09 · ENDPOINTS", "./launch", "./launch", `<p class="big">$ ssh hunoutl@next-voyage</p><p>${fr ? "Endpoints :" : "Endpoints:"}</p><div class="links">${links}</div>`) +
      tag("quay", "launch rail", "it")
    );
  },
};

const FLOORS = GEO.IDS.map((id) => ({ id, fr: () => F[id]("fr"), en: () => F[id]("en") }));
