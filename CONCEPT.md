# Grand Large — concept (v3, direction artistique)

Fusion de **matiere** (une simulation déterministe partagée ; des
gradients qui sont en réalité le découpage du domaine entre GPU ; les
échanges aux interfaces) et de **cartographie** (une géographie partagée ;
des éléments qui changent de forme d'un site à l'autre ; la bascule en
radiographie ; le fat-tree caché sous les montagnes).

## L'idée

> **Une carte marine où tout ce qui bouge est calculé.**
> Côté Façade, on navigue. Côté Machine, on voit le calcul qui fait la mer.

Le parcours de Léo est une traversée, d'île en île, sur une mer vivante.
Le vent, la houle et la couleur de l'eau ne sont pas des décors : c'est
une simulation qui tourne dans le navigateur. Passer d'un site à l'autre,
c'est passer la carte aux rayons X : **les mêmes éléments, aux mêmes
endroits, au même instant, changent de forme**.

Pourquoi c'est juste pour Léo : son métier, c'est précisément de faire
tourner les machines qui calculent ce genre de monde (simulation, IA à
grande échelle). Le visiteur RH voit un voyage ; le visiteur technique
découvre que ce voyage *est* un calcul distribué, découpé entre GPU, qui
s'échange des données aux frontières. Le site ne *décrit* pas le métier,
il en *est* une démonstration.

## Trois règles de mise en scène (ce qui rend le concept cohérent)

### 1. Un seul point de vue, et un seul mouvement de caméra

Tout le site est **vu de dessus**, comme une carte, sauf l'ouverture.

- **L'ouverture (hero)** est une vue en perspective : un ciel, des nuages,
  l'horizon, la mer qui s'étend vers le spectateur. C'est le seul plan
  « de côté ».
- **En scrollant, la caméra bascule** : la mer se couche et devient la
  carte vue de dessus. C'est un mouvement piloté par le scroll (donc
  déterministe, identique dans l'aperçu et à l'arrivée), qui dure le
  premier écran. On passe du paysage à la carte en un geste, et on ne
  reviendra plus à la perspective.

(Ce qui a été écarté : descendre « sous l'eau » au fil de la page. Ça
mélangeait vue de dessus et vue en coupe, et la carte perdait sa
lisibilité.)

### 2. L'axe vertical est le temps, rendu par la lumière

On lit **à rebours** : en descendant, on remonte la carrière. La couleur
de la mer le raconte, comme une seule journée qui se déroule à l'envers :

- en haut, **plein midi** : eaux turquoise, lumière crue (aujourd'hui) ;
- au milieu, **l'après-midi** puis la lumière dorée (les grandes années
  supercalculateurs) ;
- en bas, **l'aube** : violets, ors pâles, la mer qui sort de la nuit
  (les origines).

C'est le grand **gradient dynamique** du site : il dépend du scroll
(l'heure) et respire lentement avec l'horloge (le scintillement de l'eau,
les nuages qui passent).

Côté Machine, ce même axe vertical est la **pile d'abstraction**, du cloud
au métal. Des repères de couche dans la marge (`L6 cloud`, `L5
orchestration`, `L4 supercomputer`, …, `L0 bare metal / boot`)
s'alignent exactement sur les îles. C'est vrai factuellement : la
carrière de Léo, lue à rebours, part du cloud hybride (Aneo) et descend
jusqu'aux cartes ARM et à l'OS sur mesure (SPASCIA).

### 3. L'axe horizontal est le découpage du calcul

Sur toute la largeur, la mer est faite de **quatre eaux** de teintes
voisines (par exemple lagon, émeraude, saphir, indigo à midi ; les
mêmes, décalées, à l'aube), qui se fondent les unes dans les autres. Là
où deux eaux se rencontrent, il y a une **ligne d'écume et de courant**.

Aux rayons X, ces quatre eaux sont **les quatre rangs GPU** du domaine de
calcul, et les lignes d'écume sont les **bandes de halo** : on y voit des
paquets franchir l'interface à chaque pas de temps. C'est la révélation
centrale du site, reprise de matiere : *le dégradé naturel était le
découpage du calcul*.

## Les couches du monde

Une seule géométrie (`geo.js`, identique des deux côtés) et une seule
simulation (`sim-core.js`, identique, pilotée par l'horloge murale et le
scroll, aléatoire seedé). Chaque face ne fait que dessiner.

| Élément | Façade (on navigue) | Machine (on calcule) |
|---|---|---|
| Les 4 eaux | Gradients de mer fondus | 4 rangs GPU, maillage |
| L'écume entre les eaux | Courants, lignes d'écume | Bandes de halo, échanges de paquets |
| Le vent | Traînées blanches, risées sur l'eau | Champ de vitesse u(x), vecteurs, lignes de courant |
| La houle | Crêtes d'écume qui avancent | Équation des ondes sur la grille, stencil 5 points, carte de hauteur |
| Les îles | Silhouettes illustrées, chacune son caractère | Une île = une machine réelle du parcours, en plan technique |
| Les montagnes | Reliefs, cols, sommets | Commutateurs fat-tree / NVSwitch |
| Les arbres, les cabanes | Forêts, villages | Nœuds et GPU, en nombre réel quand il est connu |
| Les routes maritimes | Pointillés de navigation | Interconnexion, latence |
| Le bateau | Le voilier de Léo, qui suit la route au fil du scroll, voiles orientées par le vent simulé | Le job qui migre, avec ses checkpoints aux escales |
| La rose des vents | Légende de la carte | Les forces qui pilotent le champ |

Le **bateau** est un voilier stylisé, peu de détails, très lisible même
petit. Le **kitesurfeur** est une évolution prévue (aile = ressource qui
tire, lignes = connexions NCCL, sauts = checkpoints), à essayer quand le
reste sera en place.

## La traversée, étage par étage

Mêmes `id`, ordre et hauteurs des deux côtés. Les activités **annexes**
(enseignement, missions parallèles) sont des **îles plus petites et plus
lointaines, sur les côtés** de l'étage de leur époque, reliées à l'île
principale par une route en pointillés. Elles n'ont pas d'étage à elles.

| id | Heure | Façade | Machine (couche) | Faits utilisés |
|---|---|---|---|---|
| `hero` | midi | **Le large** : ciel, nuages, horizon, la mer en perspective ; le nom de Léo dans le ciel ; le voilier au loin. Le scroll couche la mer en carte | `L7 · cloud.layer` : les nuages sont des régions et instances cloud, l'horizon est la frontière du réseau | titre, accroche |
| `vents` | midi | **La rose des vents**, légende de la carte : 5 vents nommés = 5 savoir-faire. Ce sont ces vents qui génèrent le champ de vent de toute la page | `forces()` : 5 attracteurs du champ = la stack | compétences |
| `aujourdhui` | début d'après-midi | **L'île et le nuage** : une île amarrée à une île céleste, un tourbillon qui aiguille les embarcations entre les deux | `L6 · cloud hybride` : AWS ↔ Slurm, l'orchestrateur répartit les jobs (le tourbillon = le scheduler) | Aneo, CFM (2026) |
| `dalia` | après-midi | **L'île-volcan** : caldeira en anneau, coulées de lave. *Annexe :* cours X-HEC | `L5 · NVL72` : 72 GB200, 360 PFlop/s FP16 ; le cratère est le domaine NVLink, les crêtes sont les NVSwitch, la lave est le trafic NVLink | MINERVA (2025-26), École Polytechnique (2025-12) |
| `jeanzay` | lumière dorée | **La grande île**, deux villes : la nouvelle (CNRS) puis l'ancienne (Inria). *Annexes :* FIDLE, DLO-JZ, Panoram'IA | `L4 · supercomputer` : 125 PFlop/s, 1456 H100, file Slurm, 2000 utilisateurs, BLOOM / LLaMA / ViT ; puis la génération précédente, 37 PFlop/s | CNRS (2024-26), Inria (2022-24), FIDLE (2022-25) |
| `atos` | coucher | **Le phare** : son faisceau balaie la mer et repère les embarcations | `L2 · edge` : inférence sur Jetson Nano, YOLOv4 / Faster R-CNN, −80 % de latence (quantization, pruning) ; le faisceau est la boucle d'inférence | Atos (2021) |
| `spascia` | nuit | **L'île aux 110 cabanes**, petite, sur les hauts-fonds | `L1 · bare metal` : 110 nœuds ARM, 440 cœurs, RL asynchrone, OS sur mesure | SPASCIA (2020) |
| `origines` | aube | **Le port d'attache** : le chantier naval où le bateau a été construit (la formation) | `L0 · boot` : BIOS, conditions initiales, `init()` | formation (depuis `content.js`) |
| `contact` | aube | **L'embarcadère** : « Le prochain voyage commence ici », les liens | `./launch` : endpoints, ssh | LinkedIn, GitHub, GitLab |

Le texte de présentation (« à propos » actuel) se répartit entre le ciel
du hero et la légende de la rose des vents : pas d'étage dédié.

## La bascule : radiographie

On reprend la bascule de cartographie (`REVEAL = "scan"`) : la page ne
glisse pas, une ligne de scan suit le doigt et révèle **sur place**
l'autre face, au pixel près. Sous l'eau turquoise apparaît le maillage du
rang 2 ; sous la ligne d'écume, la bande de halo et ses paquets ; sous le
volcan, le domaine NVLink ; sous le voilier, le job. La ligne de scan est
dessinée comme un front d'onde côté Façade, et comme un balayage de
moniteur côté Machine.

Sur desktop, la **loupe** de matiere : au survol, un médaillon montre
localement la vue Machine.

## Direction artistique

**Façade, « carte de grande traversée ».** Énergique, lumineuse, faite à
la main, mais moderne (pas un parchemin ancien). Aplats et gradients de
mer saturés, trait d'encre épais et assuré pour les côtes, ombres portées
nettes sous les îles à midi qui s'allongent vers l'aube, vent en traînées
blanches. Palette de midi : lagon `#8fe3d8`, turquoise `#2fb7c4`, saphir
`#1d5fa6`, encre `#132238`, écume `#fffaf0`, corail `#ff6b4a` (repères,
route du voilier). Palette d'aube : or pâle `#f6c96b`, rose `#f08a7a`,
violet `#5b4b8a`, nuit `#1a1d3a`. Typographie : une serif display à fort
caractère pour les titres (Fraunces, OFL, déjà inlinée dans matiere), un
texte très lisible. Esprit grande aventure maritime, **sans reprendre
aucun élément d'une œuvre existante** (personnages, noms, emblèmes).

**Machine, « le calcul qui fait la mer ».** Fond nuit `#050b14`,
maillage `#12324f`, rangs en néon de la **même famille de teintes** que
les quatre eaux de la Façade (`#4f7dff`, `#22e0c0`, `#ffb01f`, `#ff4f5e`).
Échanges de halo qui pulsent aux interfaces, îles en plans techniques
(cotes, repères, cartouches `SHEET 05/09 · NVL72`), repères de couche
`L0`–`L7` dans la marge, compteur de pas et charge par rang (simulation
jouet, présentée comme telle). Police monospace (JetBrains Mono).

## Ce qui a changé par rapport aux demandes, et pourquoi

- **Pas de descente sous l'eau** : on garde la carte vue de dessus d'un
  bout à l'autre, et c'est la **lumière** (midi → aube) qui dit qu'on
  remonte le temps. Le « nuage → métal » vit côté Machine, dans les
  couches de la marge.
- **Le ciel et l'horizon** restent l'ouverture, mais comme un plan unique
  qui se couche en carte : c'est le moment le plus spectaculaire du site,
  et il reste simple à rendre déterministe.
- **Les 5 vents** sont juste au-dessus du parcours, comme demandé, et
  deviennent la légende de la carte. Ils ont un rôle réel : ce sont eux
  qui font souffler le vent de toute la page.
- **Le contact** devient l'embarcadère au lever du jour, plutôt qu'une
  bouteille à la mer : on finit sur une invitation à partir, pas sur un
  message perdu.
- **Bateau d'abord**, kitesurfeur ensuite.

## Garde-fous (repris du brief commun)

Fichier unique ≤ 400 Ko par face, mêmes étages et hauteurs, état calculé
depuis l'horloge murale et le scroll avec aléatoire seedé (aperçu =
arrivée), rien qui bouge après le premier affichage, aucune animation
d'entrée, deux simulations en même temps sur mobile (budget serré, DPR
limité, pause hors écran), aucun fait inventé (les chiffres de
simulation sont présentés comme une démo).

## Réalisation (ce qui a été fait, et ce qui a été adapté)

**Architecture.** Deux fichiers identiques des deux côtés : `scripts/geo.js`
(étages et hauteurs fixes par mode, îles et côtes seedées, route du
voilier, rose, cratère, villes, cabanes, massif) et `scripts/sim-core.js`
(horloge murale, caméra du hero, vent à traceurs seedés repris de
matiere, houle, échanges de halo, et le rendu WebGL de la mer en deux
modes : Façade et Machine). Chaque face n'ajoute que son dessin
(`render-facade.js`, `render-machine.js`) : îles en SVG statique (une fois
par mise en page) et un calque 2D animé (vent, écume/paquets, voilier/job,
tourbillon, lave, phare). La bascule est la radiographie de cartographie
(`REVEAL = "scan"`, `drag-swipe.js` repris tel quel) ; la ligne de scan est
une crête d'écume côté Façade, un balayage phosphore à lignes de trame côté
Machine.

**Adaptations.**
- *Houle* : pas d'intégration pas à pas d'un stencil (l'état dépendrait de
  l'historique, donc l'aperçu et l'arrivée divergeraient). La houle est
  une somme d'ondes planes avec ω = c·|k|, c'est-à-dire une solution exacte
  de l'équation des ondes, fonction pure du temps. La Machine en montre la
  carte de hauteur par cellule de 24 px, les isolignes, et le stencil
  5 points évalué sur une cellule tirée à chaque pas (`∇²h`, valeur réelle).
- *L'heure* suit le tableau des étages : midi → début d'après-midi →
  après-midi → lumière dorée → coucher → nuit → aube (→ aube claire au
  contact). Côté Machine, le fond reste nuit : l'axe vertical y est la pile
  `L7`…`L0` (repères verticaux dans la marge, alignés sur chaque île).
- *Caméra* : un seul plan WebGL, perspective vraie (hauteur = focale, donc
  échelle ≈ 1 en bas d'écran), tangage φ piloté linéairement par le scroll
  de 10° à 90° sur 560 px (mobile) / 620 px (desktop) ; à 90° la projection
  est exactement l'identité (la carte). Côté Machine, les quatre rangs sont
  quatre couloirs qui convergent vers l'horizon, puis quatre colonnes. Rien ne
  dépend de la hauteur de fenêtre (barre d'adresse mobile).
- *Ciel Machine* : les nuages sont des cellules d'« instances » sur le plan
  des nuages, sans noms de régions (aucun fait inventé, mention
  « illustrative »). De même la partition Slurm, les instances, le fat-tree
  et les poids des forces sont illustratifs ; les nombres réels sont
  dessinés en vrai : 72 GPU sur l'anneau de Dalia, 1456 cellules (52 × 28)
  dans la ville neuve de Jean Zay, 110 cabanes/nœuds à SPASCIA.
- *Annexes* : CFM (île annexe d'Aneo), X-HEC (Dalia), FIDLE, DLO-JZ,
  Panoram'IA (Jean Zay), Montréal (origines). TOEIC reste dans la légende.
- *Les 5 vents* portent des noms marins génériques (Alizé, Noroît, Brise de
  terre, Suroît, Zéphyr) ; chacun a une direction et un poids par étage,
  et leur somme est réellement le vent advecté par les traceurs.
- *Pas de portrait* (non demandé par le concept, économise ~20 Ko).
- *Kitesurfeur* : non fait (évolution prévue).

**Retours de Léo (itération 2), qui priment sur le concept ci-dessus.**
- *Plus de loupe* : la radiographie ne se vit que par la bascule (scan).
- *Façade : une mer unie.* Plus de quatre eaux ni de lignes d'écume
  verticales. Il reste le gradient vertical de la journée à l'envers (une
  couleur de mer par heure, interpolée entre les centres d'étage :
  turquoise de midi → bleu d'après-midi → vert-de-gris doré → rose du
  couchant → indigo de nuit → violet puis rose-or de l'aube), et une mer
  vivante : crêtes de houle en traits d'écume fins, scintillement, risées
  de vent. La révélation « cette mer était un domaine découpé en 4 rangs »
  n'existe plus que côté Machine : c'est la bascule qui la montre.
- *Machine : plus de stencil 5 points ni de paquets aléatoires.* Les
  échanges aux interfaces sont maintenant justes et sobres : une bande de
  halo fine (±12 px, filet continu de chaque côté, interface au centre),
  et les vrais **fantômes** : tout traceur à moins de 12 px d'une
  interface est dessiné, en carré creux à la couleur du rang voisin, dans
  ce rang (ce qui serait réellement copié à l'échange de halo). Ils
  apparaissent et disparaissent avec le mouvement continu des traceurs,
  donc sans clignotement. Le HUD compte ces fantômes (« halo ghosts »).
- Isolignes de houle et vecteurs u(x) atténués : moins d'éléments, mieux
  dessinés.

**Tests (Playwright, `scratchpad/pw/archipel/`).** `compare.mjs` (aperçu
entièrement révélé contre page d'arrivée, horloge figée) : pixels qui
diffèrent de plus de 24 niveaux ≤ 0,04 % dans les deux sens, Pixel 7 et
1440×900, au hero (0), pendant le basculement de caméra (300/320), sur
des étages animés (tourbillon, lave, phare) et en bas de page ; seuls le
lissage du texte du bandeau diffère. Horloge réelle : 0,9–2,6 % (la mer
a avancé pendant ~1,5 s entre les deux captures, mouvement continu, pas de
saut). Scroll et langue toujours conservés. `rec.mjs` (geste tactile/souris
réel, vidéo) : aucun frame vide (écart-type minimal ≥ 29), convergence vers
l'état d'arrivée. Builds : Façade ≈ 202 Ko, Machine ≈ 177 Ko.

## v4 — Refonte après les retours de Léo (prime sur tout ce qui précède)

**Constat.** La Façade a perdu le *dessin* de cartographie et ressemble à
un rendu numérique ; la Machine n'a pas d'identité propre. La mécanique
(simulation partagée, géographie partagée, bascule) reste ; le rendu des
deux faces est refait.

1. **Façade = carte dessinée à l'encre** (esprit cartographie : traits
   gravés, hachures, cartouches, papier), avec la couleur en **lavis
   aquarelle** qui suit la journée à l'envers (midi → aube). Plus de
   rendu « réaliste ». Ciel : nuages dessinés et hachurés, horizon en
   trait gravé, houle en traits d'encre.
2. **Ouverture : on monte à travers les nuages.** Plus de plan 3D qui
   bascule. Au scroll, des nuages dessinés passent au premier plan et
   grossissent (la caméra s'élève), masquent le changement d'angle, puis
   s'écartent sur la carte vue de dessus. Courbes d'accélération douces,
   rien de saccadé. Côté Machine, c'est la traversée de la couche cloud.
3. **La rose des vents est supprimée.** À sa place, juste avant la
   traversée : **le navire en plan de coupe** (dessin d'architecture
   navale). Chaque partie du voilier est un savoir-faire (voiles =
   entraînement IA, coque = infrastructure, barre = orchestration, etc.,
   à partir des compétences de `content.js`). Côté Machine : le même
   dessin est le **schéma de la stack logicielle**, couche par couche.
   Le vent de la page n'est plus défini par des « vents nommés ».
4. **Un archipel par époque** : l'île principale = l'expérience, entourée
   de ses îlots (annexes de la même époque), et non des îles lointaines
   sur les côtés.
5. **Des îles beaucoup plus dessinées, en mode ville**, avec des éléments
   qui ont un sens : rues, quartiers, port, monuments. Jean Zay : grande
   halle (le supercalculateur), rangées d'immeubles (baies), avenues
   (réseau). Atos : ville-usine au pied du phare, tapis roulant
   (contrôle qualité). Aneo/CFM : port marchand relié au nuage. SPASCIA :
   village de 110 cabanes. Origines : chantier naval. Dalia : volcan.
   Côté Machine, chaque bâtiment est la machine correspondante, chaque
   rue un câble.
6. **Physique cohérente.** Jamais d'eau, de vague ni de traceur sur la
   terre. Les îles sont des **obstacles** : le vent les contourne
   (écoulement autour d'obstacles), la houle déferle en écume sur les
   côtes. Les traceurs naissent et meurent en fondu : **aucun
   clignotement**. Côté Machine, les îles sont des **cellules masquées**
   (conditions aux limites du domaine).
7. **Le voilier accoste à l'embarcadère** au dernier écran : la route se
   termine au quai, c'est la fin du récit.
8. **Machine = le squelette non rendu de la carte.** Le même dessin que
   la Façade, avant rendu : tracés en fil de fer, points de contrôle et
   poignées de Bézier, maillages, boîtes englobantes ; par-dessus, le
   calcul (rangs GPU, halos, champ de vent, cellules masquées).
   Monochrome vert phosphore sur noir, couleurs de rangs en accent. Un
   côté « Matrix » obtenu par des **données qui ont un sens** (par exemple
   les vraies valeurs de hauteur de houle qui défilent dans les
   cellules), sans reprendre la pluie de caractères du film.
9. **Bascule à rendre immédiate.** Léo trouve que le passage
   Façade → Machine « n'est pas direct ». À diagnostiquer et corriger :
   délai avant le démarrage du drag (iframe longue à être prête), retard
   sur le doigt, saccades (iframe hors champ à 6 i/s qui se réveille
   mal, WebGL lourd), saut à la navigation.

## Réalisation v4 (ce qui a été fait pour la refonte)

**Bascule plus directe (priorité).** Diagnostic sous CPU ×4, Pixel 7 :
- *Démarrage tardif du drag* : le drag attendait le `load` de l'iframe, or
  son script de démarrage coûtait ~620 ms à ×4, dont 256 ms de champ de
  distance terre/mer. Le champ est maintenant calculé paresseusement, étage
  par étage (visibles d'abord, les autres au repos, un étage ne simulant
  qu'une fois ses voisins prêts : l'état reste une fonction pure du temps).
  `SIM.start` passe de 620 à ~300 ms à ×4 (de 215 à 135 ms sans
  ralentissement). L'iframe envoie en plus `mirror-ready` au parent dès son
  premier rendu complet (état juste affiché), sans attendre `load`.
- *Iframe endormie (6 i/s) qui se réveille mal* : le parent lui envoie
  `wake` dès le `touchstart`/`pointerdown`, avant même que l'intention
  horizontale soit tranchée ; elle redessine aussitôt l'état courant puis
  passe à pleine cadence pendant 2,5 s.
- *Retard sur le doigt* : pendant le glissement, la page de départ ne
  dessine qu'une image sur deux (le processeur va à l'iframe qui se
  révèle) ; la vitesse de vent/valeurs Machine a été allégée (densité des
  valeurs de houle réduite, durée de vie des traceurs 6 s → 4,5 s).
- *Saut à la navigation* : aucun (aperçu révélé = arrivée, ≤ 0,09 %).
Limite de mesure : le GPU logiciel de l'environnement de test domine le
temps par image (≈ 300 ms, même sans ralentir le CPU), donc la fluidité
réelle du geste n'est mesurable que sur téléphone. Coût JS par image à
×4 : Façade ≈ 8 ms, Machine ≈ 14–18 ms.

**Façade.** Mer en lavis aquarelle sur papier (pigment qui s'accumule au
bord des côtes, granulation, traits de houle gravés, lignes d'eau
concentriques autour des îles, écume là où la houle touche la côte),
couleur par heure (midi → aube). Îles à l'encre (double trait de côte,
hachures de relief côté ombre) et en mode ville : deux avenues qui se
croisent sur une place à fontaine, lotissements de 4 maisons, îlots
denses hachurés, parcs, plus les monuments qui ont un sens : port
marchand et amarre vers l'île-nuage (Aneo/AWS), cratère et coulées
(Dalia), grande halle à rangées de baies et ancienne halle reliées par
les avenues (Jean Zay), phare et ville-usine avec tapis roulant de
contrôle qualité (Atos), 110 cabanes (SPASCIA), chantier naval (origines),
quai (contact). Archipels : les îlots annexes sont collés à l'île
principale, reliés par un bac. Le vent (traits d'encre) contourne les
îles, naît et meurt en fondu, n'est jamais dessiné sur la terre. Le
voilier accoste au bout du quai (voiles ferlées) quelle que soit la
hauteur d'écran.

**Ouverture.** Le ciel et la mer en perspective sont à l'encre ; au
scroll, des nuages dessinés grossissent et s'écartent (la caméra monte),
un voile de nuage couvre l'écran pendant que l'angle passe à 90°, puis la
carte apparaît. Les textes de l'ouverture restent au-dessus des nuages
(toujours lisibles).

**Navire en plan de coupe** (étage `vents`) : voiles, coque, barre,
carré, pavillons = les 5 savoir-faire ; côté Machine, le même dessin en
fil de fer, chaque partie encadrée = une couche de `stack.yaml`.

**Machine.** Le squelette non rendu : côtes en fil de fer avec points de
contrôle et poignées de Bézier, boîtes englobantes, îlots en contours,
monuments = machines (anneau de 72 GPU, halle de 52 × 28 = 1456 cellules,
110 nœuds, Jetson, BIOS), îles en cellules masquées (conditions aux
limites), 4 rangs et fantômes de halo, vraies valeurs de h(x,t) dans une
cellule sur quatre. Vert phosphore, couleurs de rang en accent. Les nuages
de l'ouverture y sont des cercles de construction et leurs boîtes.

**Tests.** Aperçu révélé contre arrivée, horloge figée : ≤ 0,09 % de
pixels différents, dans les deux sens, Pixel 7 et 1440×900, au hero
(0), en pleine traversée des nuages (330), sur des étages animés et au
quai ; scroll et langue conservés. Builds : Façade 221 Ko, Machine 195 Ko.
