# Cartographie — « La carte et le territoire »

## Concept

Le parcours de Léo est **un territoire**. La Façade en est l'**atlas
illustré** : cinq planches gravées qu'on parcourt comme un voyage (une île,
une rose des vents, un massif, un fleuve, des sources). La Machine est
**exactement la même géographie**, révélée comme l'infrastructure qu'elle
cachait : un plan de supercalculateur façon blueprint.

Tout part d'un fichier commun, `scripts/geo.js` (identique des deux côtés).
Il calcule toutes les positions : villes, fleuve, forêts, sommets, sentiers.
Chaque face ne fait que **dessiner** ces coordonnées à sa manière :

| Atlas (Façade)                 | Plan (Machine)                               |
|--------------------------------|----------------------------------------------|
| ville                          | nœud de service                              |
| fleuve                         | backbone (même tracé Bézier)                 |
| bras secondaire                | lien parallèle (FIDLE, CFM, X)               |
| forêt / bosquet                | partition de calcul (1 arbre = 1 nœud/GPU)   |
| montagne, col, sommet          | commutateur, agrégation, cœur (fat-tree k=4) |
| rose des vents à 8 pointes     | anneau all-reduce à 8 GPU (NVLink)           |
| côte de l'île                  | domaine d'administration du cluster          |
| navire, randonneur, barque     | paquets (même position au même instant)      |
| cartouche, sceau               | cartouche technique, certificat              |

Quelques correspondances reposent sur des faits réels : le bosquet de
**72 arbres** est le Dalia de MINERVA (72 GB200), les **110 arbres** sont le
cluster de 110 cartes ARM de SPASCIA, la grande forêt de Jean Zay devient une
grille de **1456 cellules H100** côté Machine (chiffre tiré du `content.js`
Machine). Les durées affichées côté Machine (« span: 23 mo ») sont calculées
à partir des dates existantes. Les métriques ou animations qui ne sont pas
des faits (anneau NCCL, paquets, « WAN illustrative ») sont annoncées comme
illustratives.

## Les étages (mêmes `id`, même ordre, mêmes hauteurs)

1. `hero` : **Planche I, le territoire** / *sheet 01, topology*. Le
   cartouche avec le portrait d'un côté, la carte de l'île de l'autre ; le
   port « Vous êtes ici » devient `$ ssh hunoutl@login`.
2. `apropos` : **la boussole** / *all-reduce*. Quatre valeurs aux points
   cardinaux. Côté Machine, les 8 pointes de la rose sont 8 GPU, et des
   blocs de données tournent sur l'anneau (reduce-scatter puis all-gather).
3. `competences` : **les reliefs** / *fat-tree*. Huit provinces (savoir-faire),
   des sentiers qui montent aux cols puis aux sommets ; aux rayons X, c'est un
   fat-tree k=4 (feuilles, agrégation, cœur), et le randonneur est un paquet.
4. `experiences` : **le fleuve** / *traceroute*. On remonte le fleuve depuis
   l'embouchure (aujourd'hui) jusqu'aux débuts ; une barque suit la lecture
   (pilotée par le scroll). Côté Machine : des sauts traceroute, des
   vignettes de matériel.
5. `formation` : **les sources** / *boot sequence*. Le fleuve naît à l'INSA
   (une puce BIOS côté Machine), une route maritime (lien WAN) mène à
   Montréal, le sceau TOEIC est un certificat. Le colophon de fin donne les
   liens sociaux.

## Direction artistique

**Façade, l'atlas.** Papier ivoire grainé (bruit SVG en tuile), encre sépia,
vermillon pour les routes et les repères, eau vert-de-gris hachurée.
Titres et légendes « manuscrites » en *IM FELL English* (fontes gravées du
XVIIe siècle), texte en *EB Garamond*. Traits légèrement tremblés (bruit
seedé), cadres à graduations, cartouches à double filet, rose ornementale.
Mouvement lent et calme : un navire qui fait le tour de l'île, une aiguille
de boussole qui s'oriente au fil du scroll.

**Machine, le plan.** Bleu de Prusse sur papier millimétré (grille
20/100 px), trait blanc-cyan, ambre pour les paquets et les accents, vert
pour les LED. *Source Code Pro* partout. Cotes, repères de zone A–F / 1–8,
cartouches techniques à coins marqués, en-têtes `SHEET 03/05 · FAT-TREE`.
Le portrait passe en duotone cyan avec réticule. Mouvement dense mais
précis : paquets sur le backbone, ring all-reduce, trafic dans le fat-tree.

## La bascule : une radiographie

La bascule est le cœur du concept : **la page de départ ne glisse plus**.
Une ligne de balayage suit le doigt et révèle sur place l'autre face, au
pixel près à la même position. On croit passer un écran à rayons X sur la
carte : sous la ville apparaît le nœud, sous la forêt la grille de GPU, sous
la barque le paquet. Dans l'autre sens, la carte se « redéplie » par-dessus
le plan (ligne sépia).

Le mécanisme est celui de `drag-swipe.js`, inchangé dans sa logique (seuil,
prefetch, payload d'arrivée, `--vh`, debug, rien au `pagehide`). Seul
l'habillage des calques change (constante `REVEAL = "scan"` ; `"slide"`
rétablit le comportement d'origine) :

- `#mirror-window` (`overflow: hidden`) est translatée de +x et l'iframe à
  l'intérieur de −x : le contenu miroir reste immobile pendant que sa
  fenêtre s'ouvre. Ce sont deux transforms composités, sans `clip-path`
  animé.
- `#scan-line` est accrochée au bord de la fenêtre et dessinée du côté de la
  page quittée. Elle sort de l'écran quand la révélation est totale, et elle
  n'est visible que pendant le geste (`body.dragging/.settling`).
- L'état final (tout à 0) est identique au mode d'origine : la navigation
  part du même état visuel.

## Choix techniques

- **Fichier unique** : `tools/build.mjs` inline aussi les polices (woff2
  subsettées latin, OFL) via `url(assets/fonts/…)` → data URI. Façade
  **≈ 331 Ko** (dont ~205 Ko de polices Fell + Garamond), Machine **≈ 184 Ko**.
- **Hauteurs fixes** par mode (`GEO.HEIGHTS`, ≥ 1100 px : planches larges ;
  sinon colonne étroite, largeur ≤ 760 px), appliquées en px sur `.plate`.
  Elles sont identiques des deux côtés parce que c'est le même fichier.
- **Planches en px** calculées à partir de la largeur de mise en page,
  identique dans l'iframe et sur la page d'arrivée. Redessin seulement si
  la largeur change, jamais pour la hauteur (barre d'adresse mobile).
- **Animations** (`scripts/scene.js`, identique des deux côtés) : elles sont
  pilotées par l'horloge murale (`Date.now()`) et/ou le scroll, avec un
  aléatoire seedé (`GEO.rng`). Le premier état est calculé de façon
  synchrone après la restauration du scroll d'arrivée, donc sans aucune
  animation d'entrée. Les objets mobiles sont des éléments HTML déplacés
  par `transform`, et non des attributs SVG. Les planches hors écran sont
  en pause (IntersectionObserver), ce qui coupe aussi tout dans l'iframe
  cachée. Avec `prefers-reduced-motion`, l'horloge est figée à une valeur
  commune aux deux faces.
- Le repère de lecture de la barque est une constante (800 px), pas
  `innerHeight` : aperçu et arrivée calculent la même position même si la
  barre d'adresse mobile a bougé.

## Résultats de test (Playwright, `scratchpad/pw/cartographie/`)

- `compare.mjs` : aperçu entièrement révélé comparé à la page d'arrivée,
  dans les deux sens, 5 positions de scroll et 2 langues.
  - Pixel 7, horloge figée : Machine→Façade **0,0 %**, Façade→Machine
    **0,1 %** (lissage du texte du bandeau).
  - Desktop 1440×900, horloge figée : 0,3–1,4 %, uniquement du lissage de
    texte (LCD au premier plan, niveaux de gris dans l'iframe composité ;
    aucun décalage, le meilleur alignement est à (0,0)).
  - Pixel 7, horloge réelle (environ 1,3 s entre les deux captures) :
    0,0–0,5 %, ce sont les paquets qui ont avancé.
  - Scroll et langue toujours conservés.
- `rec.mjs` (screencast, geste tactile réel et lien de secours) : aucun
  frame vide (écart-type minimal 27), convergence monotone vers l'état
  d'arrivée, aucun saut après la navigation.

## Limites connues

- Desktop : le texte change de lissage (LCD → niveaux de gris) au moment où
  l'iframe devient la page. C'est imperceptible à l'œil, mais mesurable.
- Les traits « tremblés » et le bruit du papier coûtent un peu de
  rasterisation au premier rendu de la Façade (SVG lourd sur
  `experiences`). Les animations, elles, sont composités.
- La carte n'a que deux mises en page (large / étroite). Entre 1100 et
  ~1250 px, les cartes de compétences sont serrées.
- Les polices Fell pèsent lourd (2 × 56 Ko). On pourrait n'en garder que
  l'italique.
- Les liens de la carte du hero (villes → étages) sont de simples ancres
  natives.
