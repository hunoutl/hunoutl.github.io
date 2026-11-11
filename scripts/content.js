// Contenu — Machine « le calcul qui fait la mer ». Mêmes ids, même ordre,
// mêmes hauteurs (geo.js) que la Façade ; positions des panneaux et
// étiquettes partagées (geo.js) : la radiographie tombe au même endroit.
// Faits : repris des content.js existants. Les métriques de simulation
// (pas, charge, paquets) sont celles de la simulation jouet du navigateur.

const ICON_LINKEDIN = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.48v6.26zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>`;
const ICON_GITHUB = `<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`;
const ICON_GITLAB = `<svg viewBox="0 0 24 22" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 21.6 16.2 8.7H7.8L12 21.6Z"/><path d="M4.6 8.7 3 13.6a.9.9 0 0 0 .33 1L12 21.6 4.6 8.7Z"/><path d="M4.6 8.7h3.2L6.4 2.9a.45.45 0 0 0-.86 0L4.6 8.7Z"/><path d="M19.4 8.7 21 13.6a.9.9 0 0 1-.33 1L12 21.6l7.4-12.9Z"/><path d="M19.4 8.7h-3.2l1.4-5.8a.45.45 0 0 1 .86 0l1 3.87v1.93Z"/></svg>`;

const ICON_HF = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-3.5 6.2a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Zm7 0a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2ZM7.4 13.4h9.2a4.6 4.6 0 0 1-9.2 0Z"/></svg>`;

const SOCIAL = [
  { href: "https://www.linkedin.com/in/leo-hunout", name: "linkedin", handle: "in/leo-hunout", icon: ICON_LINKEDIN },
  { href: "https://github.com/hunoutl", name: "github", handle: "hunoutl", icon: ICON_GITHUB },
  { href: "https://gitlab.com/hunoutl", name: "gitlab", handle: "hunoutl", icon: ICON_GITLAB },
  { href: "https://huggingface.co/hunoutl", name: "huggingface", handle: "hunoutl", icon: ICON_HF },
];

// Les 5 parties du navire de la Façade = les 5 couches de la stack, dans le
// MÊME ordre que PARTS côté Façade et GEO.ship().parts : voiles = IA,
// coque = infra, barre = langages, carré = transmission, pavillons = langues.
const STACK = {
  en: [
    ["ai_training", "PyTorch, TensorFlow, Transformers, Hugging Face, vLLM, llama.cpp · FSDP, DDP, ZeRO, TP/PP, bf16, fp8, NCCL, DeepSpeed · MLflow, W&amp;B · agents, n8n"],
    ["infra", "Proxmox, Slurm, Docker, Apptainer (Singularity), Kubernetes, Argo CD, Spack, CI/CD, Ray, Dask, Airflow, DVC · OpenMP, MPI · AWS (EKS, EC2, S3, Lambda, IAM)"],
    ["lang", "Python, C/C++, Bash, Julia, MATLAB, LaTeX"],
    ["teaching", "Fidle, DLO-JZ, Panoram'IA, X-HEC · workshops, hackathons, AI-DevTalks"],
    ["human_lang", "fr: native · en: fluent"],
  ],
  fr: [
    ["ai_training", "PyTorch, TensorFlow, Transformers, Hugging Face, vLLM, llama.cpp · FSDP, DDP, ZeRO, TP/PP, bf16, fp8, NCCL, DeepSpeed · MLflow, W&amp;B · agents, n8n"],
    ["infra", "Proxmox, Slurm, Docker, Apptainer (Singularity), Kubernetes, Argo CD, Spack, CI/CD, Ray, Dask, Airflow, DVC · OpenMP, MPI · AWS (EKS, EC2, S3, Lambda, IAM)"],
    ["lang", "Python, C/C++, Bash, Julia, MATLAB, LaTeX"],
    ["teaching", "Fidle, DLO-JZ, Panoram'IA, X-HEC · ateliers, hackathons, AI-DevTalks"],
    ["human_lang", "fr : natif · en : courant"],
  ],
};

const T = {
  en: {
    sub: "AI/HPC engineer · uptime 5+ yrs · large-scale AI &amp; HPC infra",
    lede: "Multi-node GPU training, supercomputer ops, hybrid cloud/on-prem orchestration. Distributed training internals (FSDP/DDP/ZeRO, NCCL, tensor/pipeline parallelism), Slurm, Kubernetes, MPI/OpenMP.",
    hint: "scroll → camera climbs through cloud.layer: pitch φ 9° → 90°, perspective → plan view",
    about: "Optimizing GPU clusters is only half the job — the other half is making that compute usable by people who aren't systems experts. 4 years supporting ~3,000 researchers on Jean Zay (one of France's largest supercomputers) taught me as much about NCCL tuning and multi-node scaling as about writing docs and giving talks that don't assume prior HPC knowledge.",
    note: "Toy simulation running in your browser: same seed, same wall-clock tick, same positions as the human side. The sea is a domain split into 4 MPI-style ranks; islands are masked cells (boundary conditions); tracers within ±12 px of an interface are copied as ghosts (hollow squares) into the neighbour rank; numbers in cells are the live swell height h(x,t). Not a real cluster.",
    forcesP: "The human map draws a ship in cross-section; under it, the same drawing is the software stack, layer by layer. Currently applying the same infra instincts to a tighter, quant-research context.",
    readUp: "y axis = abstraction stack, cloud → metal (and time, read backwards).",
  },
  fr: {
    sub: "Ingénieur IA/HPC · uptime 5+ ans · infra IA &amp; HPC à grande échelle",
    lede: "Entraînement GPU multi-nœud, exploitation de supercalculateurs, orchestration cloud/on-prem hybride. Rouages de l'entraînement distribué (FSDP/DDP/ZeRO, NCCL, parallélisme tenseur/pipeline), Slurm, Kubernetes, MPI/OpenMP.",
    hint: "scroll → la caméra traverse cloud.layer : φ 9° → 90°, perspective → vue en plan",
    about: "Optimiser des clusters GPU n'est que la moitié du travail — l'autre moitié consiste à rendre ce calcul utilisable par des gens qui ne sont pas experts systèmes. 4 ans à accompagner ~3 000 chercheurs sur Jean Zay (l'un des plus gros supercalculateurs français) m'ont autant appris sur le réglage NCCL et le multi-nœud que sur l'écriture de docs et d'exposés sans prérequis HPC.",
    note: "Simulation jouet exécutée dans votre navigateur : même graine, même tick d'horloge, mêmes positions que la face humaine. La mer = un domaine découpé en 4 rangs façon MPI ; les îles sont des cellules masquées (conditions aux limites) ; les traceurs à moins de 12 px d'une interface sont copiés en fantômes (carrés creux) dans le rang voisin ; les nombres dans les cellules sont la hauteur de houle h(x,t), en direct. Pas un vrai cluster.",
    forcesP: "La carte humaine dessine un navire en coupe ; dessous, le même dessin est la stack logicielle, couche par couche. J'applique aujourd'hui les mêmes réflexes d'infra dans un contexte plus resserré, orienté recherche quantitative.",
    readUp: "axe y = pile d'abstraction, du cloud au métal (et le temps, lu à rebours).",
  },
};

const job = (when, title, where, text) => `
  <article class="job"><p class="when">${when}</p><h3>${title}</h3><p class="where">${where}</p>${text ? `<p>${text}</p>` : ""}</article>`;
const panel = (id, sheet, layer, h2, body) =>
  `<div class="card" data-card="${id}"><div class="bar"><span>${sheet}</span><span>${layer}</span></div><div class="body"><h2>${h2}</h2>${body}</div></div>`;
// Étiquettes posées sur la carte : décor (lues en vrac sinon par les lecteurs d'écran).
const tag = (key, txt, cls) => `<span aria-hidden="true" class="tag${cls ? ` ${cls}` : ""}" data-tag="${key}">${txt}</span>`;
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
        job(fr ? "2026-02 → auj." : "2026-02 → now", "Senior Consultant", fr ? "Aneo · CDI · Paris et périphérie, hybride" : "Aneo · full-time · Paris area, hybrid", fr ? "Conseil en infra cloud &amp; HPC évolutive pour le calcul intensif et la recherche quantitative. Chaque mission = un îlot amarré à la cité." : "Advising on scalable cloud &amp; HPC infra for compute-intensive workloads and quant research. Each assignment = an islet moored to the city.") +
          job(fr ? "mission · en cours" : "assignment · ongoing", fr ? "Agents IA &amp; automatisation" : "AI agents &amp; automation", "ABC Arbitrage", fr ? "Agents IA, workflows n8n. Les automates = les agents." : "AI agents, n8n workflows. The automatons = the agents.") +
          job(fr ? "mission" : "assignment", "ML Engineer", "ABC Arbitrage", fr ? "Infra AWS EKS + Ray partie de zéro pour l'expérimentation ML distribuée ; fondations d'un modèle CTA sur futures (expérimentation, évaluation). 1 moulin = 1 nœud Ray." : "AWS EKS + Ray infra from scratch for distributed ML experimentation; foundations of a CTA model for futures (experimentation, evaluation). 1 windmill = 1 Ray node.") +
          job(fr ? "mission" : "assignment", "Portfolio Platform Engineer", "Capital Fund Management (CFM)", fr ? "Infra cloud hybride sur AWS pour la recherche quantitative ; orchestrateur de DAG en Python soumettant les jobs sur AWS et sur Slurm on-prem. Le tourbillon = le scheduler. Support de 50 chercheurs quant (migration HPC → AWS, environnements, onboarding, prod)." : "Hybrid cloud infra on AWS for quant research; Python DAG orchestrator submitting jobs to AWS and on-prem Slurm. The whirlpool = the scheduler. Supported 50 quant researchers (HPC → AWS migration, environments, onboarding, prod troubleshooting).")
      ) +
      tag("aneo", "on-prem · slurm") + tag("sky", "aws · ec2 / s3 / lambda") + tag("whirl", "scheduler", "it") + tag("cfm", "cfm · dag → aws | slurm", "small") + tag("abc2", "abc · agents · n8n", "small") + tag("abc1", "abc · eks + ray", "small") + tag("bourse", "orchestrator", "it") + tag("harbor", "job ingress · illustrative", "it")
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
        job("2025-08 → 2026-01", "Sr. AI/HPC Engineer", fr ? "CNRS – IDRIS → projet européen MINERVA · CDD · Saclay" : "CNRS – IDRIS → EU project MINERVA · fixed-term · Saclay", fr ? "Tests de pré-production de Dalia — 360 PFlop/s FP16 (sparsité), 72 GPU Blackwell (36× GB200). Anneau des 72 forges = domaine NVLink, canaux de lave = trafic NVLink. + support IA Jean Zay, projets européens." : "Pre-production testing of Dalia — 360 PFlop/s FP16 (sparse), 72 Blackwell GPUs (36× GB200). Ring of 72 forges = NVLink domain, lava channels = NVLink traffic. + Jean Zay AI support, EU projects.") +
          job("2025-12", fr ? "Chargé de cours — Master Data Science &amp; AI for Business, X-HEC" : "Lecturer — MSc Data Science &amp; AI for Business, X-HEC", fr ? "École Polytechnique · indépendant · Palaiseau" : "École Polytechnique · freelance · Palaiseau", "")
      ) +
      tag("volcano", "36× GB200 · 72 gpu · nvlink") + tag("xhec", "x-hec", "small")
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
        job("2024-03 → 2025-07", fr ? "Ingénieur en intelligence artificielle" : "Artificial Intelligence Engineer", fr ? "CNRS – IDRIS · CDD · Saclay" : "CNRS – IDRIS · fixed-term · Saclay", fr ? "Support de ~3 000 utilisateurs IA &amp; HPC de Jean Zay (125 PFlop/s, 1456x NVIDIA H100) — de l'ouverture de compte au pré-entraînement et à l'affinage de LLM. Environnements IA &amp; HPC, benchmarking multi-GPU/multi-nœud, entraînement/affinage à grande échelle (BLOOM, Llama, ViT). Formateur Fidle, DLO-JZ, Panoram'IA." : "~3,000 AI &amp; HPC user support on Jean Zay (125 PFlop/s, 1456x NVIDIA H100) — account setup to LLM pre-training &amp; fine-tuning. AI &amp; HPC software stacks, multi-GPU/multi-node benchmarking, large-scale training/fine-tuning (BLOOM, Llama, ViT). AI trainer for Fidle, DLO-JZ, Panoram'IA.") +
          job("2022-03 → 2024-02", fr ? "Ingénieur en intelligence artificielle" : "Artificial Intelligence Engineer", fr ? "Inria @ IDRIS · CDD · Saclay" : "Inria @ IDRIS · fixed-term · Saclay", fr ? "Jean Zay, génération précédente (extension A100) — 37 PFlop/s. Support IA de ~2 500 chercheurs CNRS/Inria/CEA (ML classique → pré-entraînement LLM), environnements IA/HPC, benchmarks multi-GPU/multi-nœud. 20 % StarPU (runtime Inria)." : "Jean Zay, previous generation (A100 extension) — 37 PFlop/s. AI support for ~2,500 CNRS/Inria/CEA researchers (classical ML → LLM pre-training), AI/HPC environments, multi-GPU/multi-node benchmarks. 20% StarPU (Inria runtime).") +
          job("2022-03 → 2025-09", fr ? "Formateur — Deep Learning &amp; HPC" : "Lecturer — Deep Learning &amp; HPC", fr ? "FIDLE · à distance" : "FIDLE · remote", "")
      ) +
      tag("jeanzay", "1456× H100 · 125 PFlop/s") + tag("newCity", "cnrs · 52×28 = 1456 gpu", "it") + tag("oldCity", fr ? "inria · gén. préc. · 37 PFlop/s" : "inria · prev gen · 37 PFlop/s", "it") + tag("citadel", "slurm ctl · illustrative", "it") +
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
        job("2021-02 → 2021-08", fr ? "Ingénieur IA embarquée (stage)" : "Embedded AI Engineer (intern)", "Atos, Toulouse", fr ? "Système embarqué full-stack piloté par IA, détection de défauts de surface en temps réel : YOLOv4/Faster R-CNN sur Jetson Nano, −80 % de latence (quantification &amp; élagage). Le faisceau = la boucle d'inférence." : "Full-stack AI-powered embedded system for real-time surface defect detection: YOLOv4/Faster R-CNN on Jetson Nano, −80% latency via quantization &amp; pruning. The beam = the inference loop.")
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
        job("2020-03 → 2020-08", fr ? "Ingénieur infrastructure (stage)" : "Infrastructure Engineer (intern)", "SPASCIA, Ramonville-Saint-Agne", fr ? "Cluster ARM-SBC 110 nœuds (440 cœurs CPU) pour RL asynchrone — OS sur mesure, automatisation, monitoring, services web. 1 cabane = 1 nœud : les 110 sont dessinés." : "110-node ARM-SBC cluster (440 CPU cores) for async RL training — custom OS, automation, monitoring, web services. 1 hut = 1 node: all 110 are drawn.")
      ) + tag("spascia", "110 nodes · 440 cores") + tag("chemlab", "monitoring · web services", "it")
    );
  },
  origines(l) {
    const fr = l === "fr";
    const edu = fr
      ? [["2016–2021", "diplôme d'ingénieur (grade master) · Systèmes industriels / Data Science", "INSA Centre Val de Loire, Blois"], ["2019", "échange · Master Génie Électrique", "École de Technologie Supérieure, Montréal"], ["2020-10", "TOEIC C1 (965/990)", "obtenu"]]
      : [["2016–2021", "engineering degree (Master's level) · Industrial Systems / Data Science", "INSA Centre Val de Loire, Blois"], ["2019", "exchange · MSc Electrical Engineering", "École de Technologie Supérieure, Montréal"], ["2020-10", "TOEIC C1 (965/990)", "obtained"]];
    return (
      layerMark("L0 · boot") +
      panel("origines", "SHEET 08/09 · BOOT", "L0", "init()", `<p>${fr ? "Conditions initiales : BIOS, puis le reste du système." : "Initial conditions: BIOS, then the rest of the system."}</p>` + edu.map(([a, b, c]) => job(a, b, c, "")).join("")) +
      tag("port", "insa · blois") + tag("yard", "bios · init()", "it") + tag("ets", "éts · montréal", "small") + tag("forest", "rng seeds · initial conditions", "it")
    );
  },
  contact(l) {
    const fr = l === "fr";
    const links = SOCIAL.map((s) => `<a href="${s.href}" target="_blank" rel="me noopener">${s.icon}<span>${s.name}</span><small>${s.handle}</small></a>`).join("");
    return (
      layerMark("./launch") +
      panel("contact", "SHEET 09/09 · ENDPOINTS", "./launch", "./launch", `<p class="big">$ ssh hunoutl@next-voyage</p><p>${fr ? "Endpoints :" : "Endpoints:"}</p><div class="links">${links}</div>`) +
      tag("quay", "launch rail", "it")
    );
  },
};

const FLOORS = GEO.IDS.map((id) => ({ id, fr: () => F[id]("fr"), en: () => F[id]("en") }));
