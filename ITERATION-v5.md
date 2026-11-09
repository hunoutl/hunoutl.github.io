# Grand Large — itération v5 (ciblée)

Base : l'état actuel de `proposals/archipel/` (v4), commité sur les branches
`proposal/grand-large` des deux dépôts. On **corrige et enrichit**, on ne
refait pas tout. Le concept (CONCEPT.md, y compris la section v4) reste
valable, sauf ce qui est précisé ici.

## 1. PRIORITÉ : la bascule quand on glisse vite

Constat de Léo, sur téléphone et même sur ordinateur : **si le geste est
rapide, la transition n'est pas fluide.** Causes probables, à vérifier et
corriger dans `scripts/drag-swipe.js` (identique des deux côtés à
`MIRROR_URL` et `NEIGHBOR_DIRECTION` près) :

- **Le seuil ne regarde que la distance** (`DRAG_THRESHOLD_RATIO = 0.22`).
  Un geste rapide mais court est annulé. Ajoute la **vitesse** : un coup
  sec vers le voisin (vitesse de lâcher au-dessus d'un seuil, mesurée sur
  les derniers ~80 ms du geste, et distance minimale raisonnable) suffit à
  basculer.
- **L'animation de fin a une durée et une courbe fixes** (260 ms,
  ralentissement). Après un geste rapide, la page freine brutalement au
  lâcher. La fin d'animation doit **partir à la vitesse du doigt** :
  durée calculée à partir de la distance restante et de la vitesse
  (bornée), courbe dont la pente initiale correspond à cette vitesse.
  Aucune rupture de vitesse, ni au lâcher ni à l'arrivée.
- Vérifie aussi que l'iframe est bien réveillée et à jour pendant un
  geste très court (le réveil `wake` est envoyé au `touchstart`).

Ce moteur sera ensuite reporté sur le site en production : garde les
changements **localisés, propres et commentés**, sans rien casser des
mesures de STATUS.md (rien au `pagehide`, payload, prefetch, `--vh`…).

Test : gestes rapides (≈ 80-150 ms) et lents, dans les deux sens, en
Pixel 7 (tactile) et desktop (souris). Mesure la position des calques
image par image : la vitesse doit être continue au lâcher, sans palier
ni recul, et l'aperçu doit rester identique à l'arrivée.

## 2. Écran d'accueil

- Le voilier au loin devient un **kitesurfeur** (silhouette stylisée,
  aile tirée par le vent, dans le style encre). **Seulement sur l'écran
  d'accueil** : dès la carte, c'est le voilier.
- **Traversée des nuages à refaire** : les nuages actuels sont géants,
  flous et pixelisés en plein écran. Il faut des nuages **vectoriels,
  nets à toute taille**, en **plusieurs couches de profondeur**
  (parallaxe), dans le style gravure/encre de la carte, avec un mouvement
  doux et continu. Les textes du hero restent lisibles.
- Côté Machine : **retirer les lignes diagonales colorées des rangs** qui
  convergent vers l'horizon (pas beau).

## 3. Un thème par île, comme les mondes d'un jeu vidéo

Chaque île a son univers : architecture, végétation, palette, et des
monuments qui racontent l'expérience. Indices de Léo :

| Île | Thème | Idées de monuments (Façade) | Côté Machine |
|---|---|---|---|
| **Aneo** (cabinet de conseil, aujourd'hui) + **CFM** (mission chez un hedge fund) | **Commerce et bourse** : une cité marchande | Palais de la Bourse (colonnes, tableau des cours), comptoirs, entrepôts, port de cargos, grues. CFM = îlot de la « corbeille », la salle des marchés. L'île céleste (le cloud AWS), amarrée à la cité, reste | Orchestrateur hybride AWS ↔ Slurm, flux de jobs de recherche quantitative |
| **Dalia** (MINERVA) | **La Forge**, avec un côté militaire | Forteresse en étoile (bastions à la Vauban), forges, coulées de lave canalisées, enceinte. L'anneau des 72 = 72 forges/fourneaux en cercle. X-HEC = îlot-académie | NVL72 : 72 GB200, NVSwitch, domaine NVLink |
| **Jean Zay** (CNRS) | **La Capitale** : le supercalculateur français, très imposant | Une grosse ville monumentale : citadelle, grand palais central (la halle du supercalculateur), avenues, quartiers denses, remparts. Îlots FIDLE / DLO-JZ / Panoram'IA = écoles, amphithéâtres | 125 PFlop/s, 1456 H100, file Slurm, 2000 utilisateurs |
| **Inria** | **L'île des savants** : plus petite, côté science, distincte de Jean Zay (même archipel, plus loin dans le temps) | Observatoire, laboratoires, serre, jardin botanique | Génération précédente de Jean Zay, 37 PFlop/s |
| **Atos** | (inchangé) **L'île-usine** | Cheminées, ateliers, tapis roulant du contrôle qualité, le phare qui inspecte | Jetson Nano, inférence, −80 % de latence |
| **SPASCIA** (startup en chimie de l'atmosphère) | **L'île des airs** : étude de l'atmosphère | Ballons-sondes, stations de mesure, anémomètres, mâts, laboratoire de chimie, fioles ; les 110 cabanes. C'est l'étage de **nuit** : il doit devenir beau (lanternes, ballons lumineux, fenêtres éclairées, lueur douce sur un bleu nuit profond, plutôt qu'un fond sombre terne) | 110 nœuds ARM, 440 cœurs, RL asynchrone |
| **Origines** (formation) | **Le chantier naval dans la forêt** | Coque sur sa cale, bois coupé, scierie, grande forêt | Boot, BIOS, conditions initiales |
| **Embarcadère** (contact) | (inchangé, il fonctionne bien) | | |

Les îles doivent être **nettement plus riches et lisibles** que la v4 :
silhouettes reconnaissables au premier coup d'œil, reliefs hachurés,
toponymie dans le style de la carte. Moins de mer vide entre elles.

## 4. Machine épurée

- **Supprimer la représentation des vagues** (isolignes de houle, etc.).
- Remplacer les chiffres qui changent aux intersections de la grille par
  des **valeurs fixes, comme les sondes de profondeur d'une carte
  marine** (les nombres qu'on voit sur les cartes nautiques), clairsemés
  et lisibles.
- Garder : squelette non rendu (fil de fer, points de contrôle), rangs et
  halos sobres, cellules masquées des îles, champ de vent discret.
