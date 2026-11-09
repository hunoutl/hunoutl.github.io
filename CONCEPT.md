# La matière et le calcul

## Concept

Une seule simulation tourne sur les deux sites : quelques milliers de traceurs
transportés par un écoulement 2D, étage par étage. Chaque étage du portfolio
correspond à un régime de cet écoulement (tourbillon, source, rivière,
attracteurs, réseau initial, puits).

- **Façade (gitlab.io), « Matière »** : la simulation est peinte comme de
  l'encre sur du papier. Des traits de pigment fondus (indigo, sarcelle, ocre,
  vermillon), une typographie éditoriale (Fraunces), aucun jargon. Le calcul
  y apparaît comme un phénomène naturel.
- **Machine (github.io), « Calcul »** : le même état, au même instant, montré
  comme la simulation numérique qu'il est. Maillage, champ de vitesse u(x),
  découpage du domaine en 4 rangs/GPU avec bandes de halo et traceurs
  fantômes, quadtree AMR, isolignes, compteur de pas, charge par rang, modèle
  de coût jouet, en JetBrains Mono sur fond noir.

**Sens de la bascule** : en glissant, on ne change pas de dessin, on change de
regard. Le monde est **périodique en x, de période égale à la largeur de
l'écran**. Pendant le glissement, la page qui part (canvas décalé de `dx`) et
l'iframe qui arrive (décalée de `±W + dx`) montrent donc exactement le même
monde de part et d'autre de la couture : l'écoulement continue sans rupture
depuis le papier jusque dans le maillage. Le bord de l'iframe fonctionne comme
un scanner qui révèle le calcul sous la matière.

**La révélation centrale** : sur la Façade, la couleur d'un trait dépend de sa
position en x (quatre pigments fondus le long de la page). Côté Machine, ces
quatre zones sont les **domaines des 4 GPU** : le « dégradé naturel » était le
découpage du calcul. Le portrait (photo ronde) devient un champ scalaire 40×40
(colormap inferno) au même endroit ; chaque poste du parcours devient une
entrée de journal au même endroit, le long de la même ligne de courant.

## Étages (mêmes id, ordre et hauteurs des deux côtés)

| id | Façade | Machine | phénomène |
|---|---|---|---|
| hero | « Léo Hunout », portrait dans l'œil d'un tourbillon | `hunoutl`, portrait-champ, HUD `sim.status` (rangs 1/2/4/8, calques) | vortex autour du portrait |
| apropos | II · Diffusion, « Rendre la puissance accessible » | §1 `scatter()`, carte de densité ρ par cellule | source ponctuelle |
| experiences | III · Le cours, le parcours au fil d'une rivière | §2 `advect()`, `trajectory.log`, ligne de courant + quadtree AMR | rivière (le temps coule vers l'aval) |
| competences | IV · Les forces, 5 compétences = 5 attracteurs | §3 `forces()`, `stack.yaml`, isolignes du potentiel | attracteurs tourbillonnaires |
| formation | V · Conditions initiales | §4 `init()`, réseau initial + déplacements | réseau régulier advecté |
| contact | VI · Embouchure, liens | §5 `write()`, endpoints + README technique | puits |

Hauteurs (px) desktop / mobile (< 760 px) : hero 940/960, apropos 880/980,
experiences 2200/2200, competences 1000/1300, formation 760/980, contact
760/880. Elles sont codées en dur et identiques dans `facade.css` et
`machine.css`.

## Direction artistique

- **Façade** : papier `#f3ede2`, encre `#1d1b17`, pigments indigo `#263a8a`,
  sarcelle `#12807a`, ocre `#c98a12`, vermillon `#cf4126`, traits en
  `multiply`. Fraunces (3 instances statiques : display, italique, texte),
  grands titres serrés, numéros de chapitre romains, légendes en italique. Le
  texte flotte sur l'encre, avec un halo de papier. Sur desktop, une **loupe**
  suit la souris dans les zones vides et montre localement la vue Machine.
- **Machine** : fond `#05070b`, fenêtres de terminal semi-opaques, couleurs
  de rang en néon de la même famille que les pigments (`#4f7dff`, `#22e0c0`,
  `#ffb01f`, `#ff4f5e`), JetBrains Mono 400/700. Les réglages (nombre de rangs,
  calques) ne touchent qu'au rendu, jamais à l'état. Ils ne sont pas persistés,
  pour que l'aperçu et la page d'arrivée partent des mêmes valeurs.

## Choix techniques

- `scripts/sim-core.js` est **identique sur les deux sites**. Il contient
  l'état, la géométrie partagée (exposée au CSS via `--hero-x`, `--a0x`…),
  le canvas et la boucle. `render-facade.js` et `render-machine.js` ne font
  que dessiner.
- **Déterminisme** : temps = horloge murale quantifiée en ticks de 50 ms
  depuis une époque fixe, le rendu interpole entre deux ticks. Chaque traceur
  a une vie finie (110 ticks) dont le début dépend de son index, et sa
  position de naissance vient d'un hash entier seedé (`Math.imul`). La
  position à l'instant T est une fonction pure de T, calculée pas à pas ou
  réintégrée depuis la naissance (au plus 110 pas RK2) : même suite
  d'opérations, mêmes bits. L'état ne dépend ni de l'historique de scroll, ni
  du DPR, ni du débit d'images.
- **Écoulement** : fonction de courant ψ à modes entiers en x (∇·u = 0,
  périodique), plus un forçage propre à chaque étage. Coordonnées document,
  donc la synchro de scroll en pixels absolus suffit.
- **Premier rendu synchrone** (`SIM.start()` après `drag-swipe.js`, avant
  `#render-ready`) : le premier frame peint contient déjà la simulation, à la
  bonne position. Aucune animation d'entrée, aucune animation CSS.
- **Performance** : DPR plafonné à 1,5 sur mobile et 1,75 sur desktop, seuls
  les étages proches du viewport sont simulés, traits regroupés en Path2D
  (environ 150 strokes par frame). L'iframe miroir (`?embedded=1`) hors champ
  dessine à 6 i/s, puis à pleine cadence dès que l'IntersectionObserver la
  voit. Mettre la boucle complètement en pause a été essayé : Chrome glissait
  alors une iframe vide pendant environ 400 ms.
- `prefers-reduced-motion` : image fixe, mais la même des deux côtés (tick
  constant).
- Polices OFL subsettées en woff2 et inlinées en base64 par `build.mjs`, qui
  inline maintenant aussi les `url(../assets/…)` du CSS. `machine/tools/make-field.py`
  (Pillow) génère `me-field.png` à partir de la photo. Le moteur
  `drag-swipe.js` n'est pas modifié (seuls les libellés du lien de secours
  ont changé, dans `lang-switch.js`).
- Hook de test : si `window.__SIM_T` est défini (Playwright `addInitScript`),
  il fige l'horloge de la simulation dans tous les frames.

## Limites connues

- Seuls l'écoulement et ses traceurs se raccordent sans couture pendant le
  glissement. Les objets DOM (texte, portrait) glissent normalement.
- Avec l'horloge réelle, le monde continue de bouger pendant les ~100 à
  150 ms de la navigation : à l'arrivée, les traceurs ont avancé de quelques
  pixels. C'est un mouvement continu, pas un saut (il est nul à horloge
  figée).
- Un redimensionnement en largeur (rotation) reconstruit le monde, puisque la
  période vaut la largeur.
- Les métriques Machine (charge, halos, µs/pas) sont celles de la simulation
  jouet, avec un modèle de coût explicitement factice. Ce ne sont pas des
  mesures de cluster.
- Sur mobile, les deux simulations (page + iframe) tournent à pleine cadence
  seulement pendant un glissement.
