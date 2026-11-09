# Portfolio double site — état du développement et roadmap

> Dernière mise à jour : 9 novembre 2026.
> Ce README est identique dans les deux dépôts (`hunoutl.gitlab.io` et
> `hunoutl.github.io`), sur `main` et sur `proposal/grand-large`.

## Le projet

Le portfolio de Léo Hunout (ingénieur infrastructure IA/HPC) est un
**double site sur deux vrais domaines** :

- **Façade**, sur [hunoutl.gitlab.io](https://hunoutl.gitlab.io) : pour un
  public non technique, en français par défaut ;
- **Machine**, sur [hunoutl.github.io](https://hunoutl.github.io) : pour des
  pairs techniques, en anglais par défaut.

On passe de l'un à l'autre en **glissant horizontalement**. L'autre site,
préchargé dans une iframe, apparaît à l'écran, puis une vraie navigation
cross-site a lieu, sans flash. Le visiteur doit voir qu'il change de site
(l'URL et l'interface du navigateur changent), mais le contenu ne doit
jamais flasher ni sauter.

## Où en est-on

### En production (`main`)

- **La bascule cross-site optimisée est en ligne et validée sur
  téléphone.** Elle repose sur un fichier unique tout-inline, le prefetch
  Speculation Rules, un payload d'arrivée via `window.name` ou un fragment,
  une initialisation synchrone avec `blocking="render"`, et un `--vh`
  synchronisé dans l'iframe.
- Les contraintes navigateur, les mesures retenues et les essais abandonnés
  sont documentés dans **`STATUS.md`** (dépôt gitlab), à lire avant de
  toucher à `drag-swipe.js`.
- Le contenu actuel reste un CV en ligne classique, en attendant la refonte
  graphique.

### Propositions de refonte graphique (branches, non déployées)

Chaque proposition est un double site complet. La face Façade est dans
`hunoutl.gitlab.io`, la face Machine dans `hunoutl.github.io`, sur la même
branche.

| Branche | Concept | Statut |
|---|---|---|
| `proposal/grand-large` | **Grand Large** : une carte marine où tout ce qui bouge est calculé. La fusion des deux suivantes | **Direction retenue**, itération v5 terminée |
| `proposal/matiere` | La matière et le calcul : simulation d'écoulement partagée, encre ↔ calcul | Conservée pour référence |
| `proposal/cartographie` | La carte et le territoire : atlas illustré ↔ plan du supercalculateur, bascule radiographie | Conservée pour référence |
| `poc/seamless-switch` | Le POC de la bascule, déjà fusionné dans `main` | Historique |

Deux autres pistes ont été abandonnées : *edition* (magazine ↔ source), qui
ne plaisait pas, et *orchestre* (la vie d'un job HPC), interrompue en cours
de route.

## Grand Large (v5) en détail

**L'idée.** Le parcours de Léo est une traversée d'île en île sur une mer
vivante. Le vent et la houle sont une vraie simulation qui tourne dans le
navigateur. Aux rayons X (la Machine), on découvre que cette mer est un
domaine de calcul découpé entre 4 GPU, et que chaque île est une machine
réelle du parcours.

**La mise en scène :**
- L'ouverture montre un ciel et un horizon, avec un kitesurfeur. Au scroll,
  on monte à travers les nuages jusqu'à la carte vue de dessus.
- En descendant, on remonte le temps : la mer passe de midi à l'aube, en
  lavis aquarelle.
- La traversée, du haut vers le bas :
  1. le navire en plan de coupe (les savoir-faire) ;
  2. la cité marchande (Aneo, CFM) ;
  3. la forge en étoile (Dalia) ;
  4. la Capitale (Jean Zay) ;
  5. l'île des savants (Inria) ;
  6. l'île-usine (Atos) ;
  7. l'île des airs, de nuit (SPASCIA) ;
  8. le chantier naval dans la forêt (origines) ;
  9. l'embarcadère, où le voilier accoste (contact).
- **Façade** : carte dessinée à l'encre, au lavis aquarelle.
- **Machine** : le squelette non rendu de la même carte. On y voit les
  tracés en fil de fer, les points de contrôle et les cellules masquées,
  plus les 4 rangs GPU, les halos et des sondes fixes. Les nombres réels
  (72 GB200, 1456 H100, 110 nœuds ARM) sont dessinés en vrai.
- **La bascule** est une radiographie : une ligne de scan révèle sur place
  l'autre face, au pixel près.

**Architecture.** Deux fichiers sont identiques des deux côtés :
- `scripts/geo.js` : la géographie, les monuments et les hauteurs d'étage ;
- `scripts/sim-core.js` : l'horloge murale, le vent, la houle, la caméra et
  le rendu WebGL de la mer.

Chaque face n'ajoute que son dessin (`render-facade.js` ou
`render-machine.js`). `drag-swipe.js` est le moteur de bascule. La v5 y a
ajouté le commit à la vitesse du geste, une fin d'animation qui part à la
vitesse du doigt, le mode scan et le réveil de l'iframe. Le concept complet
et le journal des réalisations sont dans `CONCEPT.md`, la spécification de
la v5 dans `ITERATION-v5.md`.

**Mesures v5 :**
- aperçu contre arrivée : au plus 0,09 % de pixels différents, dans les deux
  sens, en mobile et en desktop ;
- un geste de 100 ms suffit à basculer ;
- la vitesse de départ de l'animation vaut 1 à 1,3 fois celle du doigt ;
- builds : Façade 276 Ko, Machine 245 Ko (limite fixée à 400 Ko).

## Construire et tester

```bash
# Production : la CI lance ce build sur main
node tools/build.mjs                 # → dist/index.html, fichier unique

# Réseau local / téléphone : il faut deux *sites* différents
# (deux ports sur la même IP forment un seul site)
cd <façade> && MIRROR_URL=http://192-168-1-100.nip.io:8861/ node tools/build.mjs
cd <machine> && MIRROR_URL=http://192.168.1.100:8862/ node tools/build.mjs
(cd <façade>/dist  && python3 -m http.server 8862 --bind 0.0.0.0) &
(cd <machine>/dist && python3 -m http.server 8861 --bind 0.0.0.0) &
# → http://192.168.1.100:8862/   (ajouter ?debug=1 pour le panneau de mesures)
```

Le prefetch ne s'active qu'en HTTPS. En local, `deliveryType=""` est donc
normal. Pour les tests automatisés Playwright, il faut rétablir le bfcache
et le paint holding, que Playwright désactive par défaut. L'environnement
de développement n'a pas de vrai GPU : la fluidité ressentie se vérifie sur
un vrai téléphone.

## Roadmap

### Court terme : finir Grand Large

1. **Valider la v5 sur téléphone** : fluidité de la bascule au geste rapide,
   rendu des nuages, nuit de SPASCIA, lisibilité.
2. **Lisibilité mobile** : les monuments et le kitesurfeur sont trop petits
   en Pixel 7. Il faut une mise en page mobile dédiée (îles agrandies ou
   recadrées), en gardant des hauteurs d'étage identiques des deux côtés.
3. **Retouches visuelles** au fil des retours : densité des îles,
   toponymie, détails des villes, épuration de la Machine.
4. **Relire le contenu** (dates, libellés) et vérifier qu'aucun fait n'a
   été inventé dans les textes thématiques.

### Moyen terme : passer en production

5. **Reporter le correctif du geste rapide sur la production** (commit à la
   vitesse, fin d'animation à la vitesse du doigt). Point d'attention : en
   mode glissement (celui de la production), écrire `--drag-x` sur `:root`
   force un recalcul de style de toute la page à chaque mouvement. Il faut
   plutôt déplacer un seul conteneur par `transform`.
6. **Test en ligne sous `/poc/`** de Grand Large sur les vrais domaines,
   pour vérifier le prefetch en HTTPS et la performance sur vrai GPU.
7. **Fusionner `proposal/grand-large` dans `main`** une fois validé. La CI
   build déjà le fichier unique.
8. **Mettre à jour `STATUS.md`** avec les nouvelles mesures (mode scan,
   réveil de l'iframe, commit à la vitesse).

### Plus tard

9. **Le code dupliqué entre les deux dépôts** (`drag-swipe.js`, `geo.js`,
   `sim-core.js`, `build.mjs`) : prévoir un script de synchronisation ou
   une source unique, pour éviter les divergences.
10. **Accessibilité** : bascule au clavier, `prefers-reduced-motion`
    (rendu figé, déjà en place), contraste des textes sur le lavis.
11. **Référencement et aperçus de liens** : contenu dans le HTML statique,
    balises Open Graph, version sans JavaScript.
12. **Le kitesurfeur** : animation plus riche à l'accueil (sauts, aile qui
    suit le vent simulé).
13. **CV** : le PDF n'existe pas dans les dépôts. Décider si on remet un
    bouton de téléchargement.
