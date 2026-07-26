// Source de contenu — ton "Machine" (technique / pair), bilingue EN/FR.
// Les ids d'étage doivent rester identiques à ceux du site miroir
// (hunoutl.gitlab.io), c'est ce qui permet au drag-swipe de retomber
// au bon endroit en face.

// Icônes SVG inline (pas de dépendance externe) pour les liens sociaux.
const ICON_LINKEDIN = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.48v6.26zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>`;
const ICON_GITHUB = `<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`;
const ICON_GITLAB = `<svg viewBox="0 0 24 22" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 21.6 16.2 8.7H7.8L12 21.6Z"/><path d="M4.6 8.7 3 13.6a.9.9 0 0 0 .33 1L12 21.6 4.6 8.7Z"/><path d="M4.6 8.7h3.2L6.4 2.9a.45.45 0 0 0-.86 0L4.6 8.7Z"/><path d="M19.4 8.7 21 13.6a.9.9 0 0 1-.33 1L12 21.6l7.4-12.9Z"/><path d="M19.4 8.7h-3.2l1.4-5.8a.45.45 0 0 1 .86 0l1 3.87v1.93Z"/></svg>`;

const FLOORS = [
  {
    id: "hero",
    label: "root",
    en: () => `
      <p class="prompt">leo@hpc:~$ whoami</p>
      <div class="hero-layout">
        <img class="profile-photo" src="assets/me.webp" alt="Photo of Léo Hunout" width="176" height="176" fetchpriority="high" decoding="async" />
        <div class="hero-text">
          <h1>hunoutl — AI/HPC Engineer</h1>
          <p class="subtitle">uptime: 4+ years · large-scale AI &amp; HPC infra</p>
          <p class="lede">
            Multi-node GPU training, supercomputer ops, hybrid cloud/on-prem
            orchestration. Distributed training internals (FSDP/DDP/ZeRO,
            NCCL, tensor/pipeline parallelism), Slurm, Kubernetes, MPI/OpenMP.
          </p>
          <div class="quick-contacts">
            <a href="https://www.linkedin.com/in/leo-hunout" target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn">${ICON_LINKEDIN}</a>
            <a href="https://github.com/hunoutl" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub">${ICON_GITHUB}</a>
            <a href="https://gitlab.com/hunoutl" target="_blank" rel="noopener" aria-label="GitLab" title="GitLab">${ICON_GITLAB}</a>
          </div>
          <a class="cv-download" href="assets/CV_HUNOUT_LEO_2604.pdf" download>./download_cv.pdf</a>
        </div>
      </div>
    `,
    fr: () => `
      <p class="prompt">leo@hpc:~$ whoami</p>
      <div class="hero-layout">
        <img class="profile-photo" src="assets/me.webp" alt="Photo de Léo Hunout" width="176" height="176" fetchpriority="high" decoding="async" />
        <div class="hero-text">
          <h1>hunoutl — Ingénieur AI/HPC</h1>
          <p class="subtitle">uptime : 4+ ans · infra IA &amp; HPC à grande échelle</p>
          <p class="lede">
            Entraînement GPU multi-nœud, exploitation de supercalculateurs,
            orchestration cloud/on-prem hybride. Internals de l'entraînement
            distribué (FSDP/DDP/ZeRO, NCCL, parallélisme tenseur/pipeline),
            Slurm, Kubernetes, MPI/OpenMP.
          </p>
          <div class="quick-contacts">
            <a href="https://www.linkedin.com/in/leo-hunout" target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn">${ICON_LINKEDIN}</a>
            <a href="https://github.com/hunoutl" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub">${ICON_GITHUB}</a>
            <a href="https://gitlab.com/hunoutl" target="_blank" rel="noopener" aria-label="GitLab" title="GitLab">${ICON_GITLAB}</a>
          </div>
          <a class="cv-download" href="assets/CV_HUNOUT_LEO_2604.pdf" download>./telecharger_cv.pdf</a>
        </div>
      </div>
    `,
  },
  {
    id: "apropos",
    label: "about",
    en: () => `
      <p class="prompt">leo@hpc:~$ cat about.md</p>
      <h2>about</h2>
      <p>
        Optimizing GPU clusters is only half the job — the other half is
        making that compute usable by people who aren't systems experts.
        4 years supporting 3000+ researchers on Jean Zay (one of France's
        largest supercomputers) taught me as much about NCCL tuning and
        multi-node scaling as about writing docs and giving talks that
        don't assume prior HPC knowledge. Currently applying the same
        infra instincts to a tighter, quant-research context: hybrid
        cloud/on-prem orchestration instead of national-scale clusters.
      </p>
    `,
    fr: () => `
      <p class="prompt">leo@hpc:~$ cat about.md</p>
      <h2>about</h2>
      <p>
        Optimiser des clusters GPU n'est que la moitié du travail —
        l'autre moitié consiste à rendre ce calcul utilisable par des
        gens qui ne sont pas experts systèmes. 4 ans à supporter plus de
        3000 chercheurs sur Jean Zay (l'un des plus gros supercalculateurs
        français) m'ont autant appris sur le tuning NCCL et le scaling
        multi-nœud que sur la rédaction de docs et les talks accessibles
        sans prérequis HPC. J'applique aujourd'hui les mêmes réflexes
        d'infra dans un contexte plus resserré, orienté recherche
        quantitative : orchestration cloud/on-prem hybride plutôt que
        clusters à l'échelle nationale.
      </p>
    `,
  },
  {
    id: "experiences",
    label: "log",
    en: () => `
      <p class="prompt">leo@hpc:~$ tail -f experience.log</p>
      <h2>experience</h2>
      <div class="timeline">
        <article>
          <h3>[2026-02 → now] AI/HPC Senior Consultant</h3>
          <p class="meta">Aneo · full-time · Paris area, hybrid</p>
          <p>
            Hybrid cloud/on-prem infra for quant research: orchestrator
            scheduling compute across AWS and Slurm.
          </p>
        </article>
        <article>
          <h3>[2026-02 → now] Portfolio Platform Engineer</h3>
          <p class="meta">Capital Fund Management (CFM) · contractor · Paris, on-site</p>
        </article>
        <article>
          <h3>[2025-08 → 2026-01] Sr. AI/HPC Engineer</h3>
          <p class="meta">MINERVA European Support Centre for Scalable AI Research and Deployment · fixed-term · Saclay</p>
          <p>Deployed and operated Dalia supercomputer — 360 PFlop/s (FP16), 72x NVIDIA GB200.</p>
        </article>
        <article>
          <h3>[2024-03 → 2026-01] Artificial Intelligence Engineer</h3>
          <p class="meta">CNRS · fixed-term · Saclay</p>
          <p>
            2000-user support on Jean Zay supercomputer (125 PFlop/s,
            1456x NVIDIA H100) — password resets to LLM pre-training.
            Installed/maintained AI &amp; HPC software stacks,
            multi-GPU/multi-node benchmarking, trained/finetuned
            large-scale models (BLOOM, LLaMA, ViT). PNRIA network
            contributor. AI trainer for Fidle, DLO-JZ, Panoram'IA;
            workshops, hackathons, AI-DevTalks.
          </p>
        </article>
        <article>
          <h3>[2025-12] Lecturer — MSc Data Science &amp; AI for Business, X-HEC</h3>
          <p class="meta">École Polytechnique · independent · Palaiseau</p>
        </article>
        <article>
          <h3>[2022-03 → 2025-09] Lecturer — Deep Learning &amp; HPC</h3>
          <p class="meta">FIDLE · remote</p>
        </article>
        <article>
          <h3>[2022-03 → 2024-02] Artificial Intelligence Engineer</h3>
          <p class="meta">Inria · fixed-term · Saclay</p>
          <p>Jean Zay supercomputer, previous generation — 37 PFlop/s.</p>
        </article>
        <article>
          <h3>[2021-02 → 2021-08] Embedded AI Engineer (intern)</h3>
          <p class="meta">Atos, Toulouse</p>
          <p>
            Embedded computer vision for real-time quality inspection:
            YOLOv4/Faster R-CNN inference on Jetson Nano, -80% latency
            via quantization &amp; pruning.
          </p>
        </article>
        <article>
          <h3>[2020-04 → 2020-08] Infrastructure Engineer (intern)</h3>
          <p class="meta">SPASCIA, Ramonville-Saint-Agne</p>
          <p>110-node ARM-SBC cluster (440 CPU cores) for async RL training — custom OS, automation, monitoring, web services.</p>
        </article>
      </div>
    `,
    fr: () => `
      <p class="prompt">leo@hpc:~$ tail -f experience.log</p>
      <h2>experience</h2>
      <div class="timeline">
        <article>
          <h3>[2026-02 → aujourd'hui] AI/HPC Senior Consultant</h3>
          <p class="meta">Aneo · CDI · Paris et périphérie, hybride</p>
          <p>
            Infra cloud/on-prem hybride pour la recherche quantitative :
            orchestrateur répartissant les jobs entre AWS et Slurm.
          </p>
        </article>
        <article>
          <h3>[2026-02 → aujourd'hui] Portfolio Platform Engineer</h3>
          <p class="meta">Capital Fund Management (CFM) · intérimaire · Paris, sur site</p>
        </article>
        <article>
          <h3>[2025-08 → 2026-01] Sr. AI/HPC Engineer</h3>
          <p class="meta">MINERVA European Support Centre for Scalable AI Research and Deployment · CDD · Saclay</p>
          <p>Déploiement et exploitation du supercalculateur Dalia — 360 PFlop/s (FP16), 72x NVIDIA GB200.</p>
        </article>
        <article>
          <h3>[2024-03 → 2026-01] Ingénieur en intelligence artificielle</h3>
          <p class="meta">CNRS · CDD · Saclay</p>
          <p>
            Support de 2000 utilisateurs du supercalculateur Jean Zay
            (125 PFlop/s, 1456x NVIDIA H100) — du reset de mot de passe au
            pré-entraînement de LLM. Installation/maintenance des
            environnements IA &amp; HPC, benchmarking multi-GPU/multi-nœud,
            entraînement/finetuning de modèles à grande échelle (BLOOM,
            LLaMA, ViT). Contributeur au réseau PNRIA. Formateur pour
            Fidle, DLO-JZ, Panoram'IA ; ateliers, hackathons, AI-DevTalks.
          </p>
        </article>
        <article>
          <h3>[2025-12] Chargé de cours — Master Data Science &amp; AI for Business, X-HEC</h3>
          <p class="meta">École Polytechnique · indépendant · Palaiseau</p>
        </article>
        <article>
          <h3>[2022-03 → 2025-09] Formateur — Deep Learning &amp; HPC</h3>
          <p class="meta">FIDLE · à distance</p>
        </article>
        <article>
          <h3>[2022-03 → 2024-02] Ingénieur en intelligence artificielle</h3>
          <p class="meta">Inria · CDD · Saclay</p>
          <p>Supercalculateur Jean Zay, génération précédente — 37 PFlop/s.</p>
        </article>
        <article>
          <h3>[2021-02 → 2021-08] Ingénieur IA embarquée (stage)</h3>
          <p class="meta">Atos, Toulouse</p>
          <p>
            Vision par ordinateur embarquée pour le contrôle qualité en
            temps réel : inférence YOLOv4/Faster R-CNN sur Jetson Nano,
            -80% de latence via quantization &amp; pruning.
          </p>
        </article>
        <article>
          <h3>[2020-04 → 2020-08] Ingénieur infrastructure (stage)</h3>
          <p class="meta">SPASCIA, Ramonville-Saint-Agne</p>
          <p>Cluster ARM-SBC 110 nœuds (440 cœurs CPU) pour entraînement RL asynchrone — OS sur mesure, automatisation, monitoring, services web.</p>
        </article>
      </div>
    `,
  },
  {
    id: "competences",
    label: "stack",
    en: () => `
      <p class="prompt">leo@hpc:~$ cat stack.yaml</p>
      <h2>stack</h2>
      <ul class="skills">
        <li><strong>ai</strong> — PyTorch, TensorFlow, Transformers, Hugging Face, vLLM, Llama.cpp, Gradio, Agents</li>
        <li><strong>ml</strong> — Scikit-learn, NumPy, Pandas, Optuna</li>
        <li><strong>monitoring</strong> — MLflow, W&amp;B</li>
        <li><strong>distributed_training</strong> — FSDP, DDP, ZeRO, tensor/pipeline parallelism, bf16, fp8, NCCL, DeepSpeed</li>
        <li><strong>hpc</strong> — OpenMP, MPI, NCCL, multi-node, multi-GPU</li>
        <li><strong>infra</strong> — Proxmox, Slurm, Docker, Singularity, Kubernetes, Spack, Git, CI/CD, DVC, Ray, Dask</li>
        <li><strong>cloud</strong> — AWS (Lambda, S3, EC2)</li>
        <li><strong>lang</strong> — Python, C/C++, Bash, Julia, MATLAB, LaTeX</li>
        <li><strong>human_lang</strong> — fr (native), en (fluent)</li>
      </ul>
    `,
    fr: () => `
      <p class="prompt">leo@hpc:~$ cat stack.yaml</p>
      <h2>stack</h2>
      <ul class="skills">
        <li><strong>ai</strong> — PyTorch, TensorFlow, Transformers, Hugging Face, vLLM, Llama.cpp, Gradio, Agents</li>
        <li><strong>ml</strong> — Scikit-learn, NumPy, Pandas, Optuna</li>
        <li><strong>monitoring</strong> — MLflow, W&amp;B</li>
        <li><strong>distributed_training</strong> — FSDP, DDP, ZeRO, parallélisme tenseur/pipeline, bf16, fp8, NCCL, DeepSpeed</li>
        <li><strong>hpc</strong> — OpenMP, MPI, NCCL, multi-nœud, multi-GPU</li>
        <li><strong>infra</strong> — Proxmox, Slurm, Docker, Singularity, Kubernetes, Spack, Git, CI/CD, DVC, Ray, Dask</li>
        <li><strong>cloud</strong> — AWS (Lambda, S3, EC2)</li>
        <li><strong>lang</strong> — Python, C/C++, Bash, Julia, MATLAB, LaTeX</li>
        <li><strong>human_lang</strong> — fr (natif), en (courant)</li>
      </ul>
    `,
  },
  {
    id: "formation",
    label: "education",
    en: () => `
      <p class="prompt">leo@hpc:~$ cat education.log</p>
      <h2>education</h2>
      <div class="timeline">
        <article>
          <h3>MSc Industrial Systems Engineering / Data Science</h3>
          <p class="meta">INSA Centre Val de Loire, Blois · 2016-2021</p>
        </article>
        <article>
          <h3>Exchange — MSc Electrical Engineering</h3>
          <p class="meta">École de Technologie Supérieure, Montréal · 2019</p>
        </article>
        <article>
          <h3>TOEIC® — C1 (965/990)</h3>
          <p class="meta">issued 2020-10</p>
        </article>
      </div>
    `,
    fr: () => `
      <p class="prompt">leo@hpc:~$ cat education.log</p>
      <h2>formation</h2>
      <div class="timeline">
        <article>
          <h3>Master Ingénierie des Systèmes Industriels / Data Science</h3>
          <p class="meta">INSA Centre Val de Loire, Blois · 2016-2021</p>
        </article>
        <article>
          <h3>Échange — Master Génie Électrique</h3>
          <p class="meta">École de Technologie Supérieure, Montréal · 2019</p>
        </article>
        <article>
          <h3>TOEIC® — C1 (965/990)</h3>
          <p class="meta">émis 2020-10</p>
        </article>
      </div>
    `,
  },
];
