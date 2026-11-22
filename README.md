# Léo Hunout — Machine

CV en ligne de Léo Hunout, AI/HPC Engineer (supercalculateurs, clusters GPU,
entraînement de modèles à grande échelle).

Le site existe en deux faces, sur deux domaines :

- **Machine** — [hunoutl.github.io](https://hunoutl.github.io/) (ce dépôt) : le squelette filaire de la carte et le calcul qui la fait vivre, en anglais par défaut ;
- **Façade** — [hunoutl.gitlab.io](https://hunoutl.gitlab.io/) : la carte marine dessinée à l’encre, en français par défaut.

Glisser horizontalement (vers la droite) fait passer d’une face à l’autre ; le lien
en haut à droite fait de même. Les deux faces partagent la même
géométrie (`scripts/geo.js`) et la même simulation (`scripts/sim-core.js`),
réglées sur l’horloge : on retrouve la même mer au même endroit.

## Construire

```sh
node tools/build.mjs      # → dist/index.html, un fichier unique tout-inline
```

Aucune dépendance. À chaque push sur `main`, la CI vérifie la syntaxe des
scripts (`node --check`), construit le fichier unique et publie
`dist/index.html`, `assets/`, `robots.txt` et `sitemap.xml`.

## Code partagé avec [hunoutl.gitlab.io](https://hunoutl.gitlab.io/)

Les fichiers listés dans `tools/shared.mjs` (moteur de bascule, géographie,
simulation, build…) sont identiques octet pour octet dans les deux dépôts ;
ce qui distingue les deux faces vit dans `scripts/site.js`, `content.js`,
`render-*.js`, les styles et `index.html`.

```sh
node tools/shared.mjs check   # échoue si le dépôt frère (dossier voisin) diverge
node tools/shared.mjs sync    # copie les fichiers partagés d'ici vers le frère
git config core.hooksPath tools/hooks   # lance `check` à chaque commit
```

Pour tester la bascule en réseau local, servir les deux `dist/` sur deux
origines distinctes et construire avec
`MIRROR_URL=http://<hôte>:<port>/ node tools/build.mjs`.

## Licence

Code sous licence MIT ; textes du CV et images : tous droits réservés ;
polices sous SIL OFL 1.1. Détails dans [LICENSE](LICENSE).
