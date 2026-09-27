# ArchiZellige : site vitrine (code source)

Site one-page de **La Maison AZ – ArchiZellige** : zellige marocain traditionnel, fabriqué à la main à Fès.
HTML + CSS + JavaScript « vanille » (aucun framework, aucune bibliothèque). Le résultat tient en **un seul fichier HTML autonome** (~3,2 Mo, images incluses).

## Contenu du dossier

```
archizellige-source/
├─ dist/index.html     Site prêt à l'emploi (à déposer chez votre hébergeur)
├─ build.py            Assemble src/ + assets/ en un seul fichier (dist/index.html)
├─ src/
│  ├─ body.html        Structure et TEXTES de toutes les sections
│  ├─ css1.css         Variables, base, boutons, en-tête, menu, héros 3D
│  ├─ css2.css         À propos, collections (coverflow 3D), couleurs, galerie, atelier 3D
│  ├─ css3.css         Pourquoi nous, applications, compositeur, contact, pied de page, modales
│  ├─ css4.css         Compléments (toast, impression)
│  ├─ js1.js           Constantes (WhatsApp, e-mail), DONNÉES, sélection d'échantillons, menu, modales
│  ├─ js2.js           Héros 3D (mur de tuiles + niche), groupes 3D, coverflow
│  ├─ js3.js           Couleurs + visionneuse, galerie + lightbox, applications, atelier (scroll 3D)
│  └─ js4.js           Compositeur « sur mesure » (canvas), formulaire de contact, démarrage
└─ assets/             119 images WebP (photos, 41 couleurs, formes, arabesques, frises, logo)
```

## Générer le fichier

```bash
pip install pillow
python3 build.py          # -> dist/index.html
```

Vous pouvez aussi ouvrir `dist/index.html` directement dans un navigateur.

## Modifier le site

| Je veux changer…                         | Où                                                                                   |
|------------------------------------------|--------------------------------------------------------------------------------------|
| Un texte, un titre                       | `src/body.html`                                                                       |
| Le numéro WhatsApp / l'e-mail            | `src/js1.js` (constantes `WA_NUMBER`, `MAIL`, en haut) **et** le texte affiché dans `src/body.html` (actuellement `+212 661-316229`, affiché `06 61 31 62 29`) |
| L'indicatif du numéro                    | `WA_NUMBER` dans `src/js1.js` : `212…` = Maroc, `33…` = France (sans le 0 initial)   |
| Les couleurs de la marque                | variables en tête de `src/css1.css` : `--nuit`/`--nuit-2` (bleu profond, utilisé comme accent foncé), `--azur`/`--azur-pale` (bleu ciel), `--orange` (alias de `--azur`), `--or` (doré). `--dk-bg`/`--dk-fg` pilotent les sections claires ex-"sombres" (Collections, Réalisations, Sur mesure, Contact, pied de page, menu mobile) |
| La vidéo de la section "Le geste"        | déposer `dist/assets/video/atelier.mp4` (voir `dist/assets/video/LISEZ-MOI.txt`) ; la photo de secours est `assets/ph-video-poster.webp` |
| Ajouter / retirer une photo de galerie   | déposer `assets/ph-<nom>.webp`, puis ajouter une ligne dans `GAL` (`src/js1.js`)      |
| Les photos de la niche (page d'accueil)  | tableau `SL` dans `initHero()` (`src/js2.js`)                                         |
| Une couleur de zellige                   | `assets/sw-<famille>-<n>.webp` (visuel) + `assets/pt-<famille>-<n>.webp` (texture 160 px), puis `FAM` dans `src/js1.js` |
| Les collections du carrousel             | tableau `COLL` dans `src/js1.js`                                                      |
| Les 9 applications                       | tableau `APPS` dans `src/js1.js`                                                      |
| Les formes du compositeur                | `layout()` dans `initComposer()` (`src/js4.js`)                                       |

Après chaque modification : `python3 build.py`.

## Techniques 3D utilisées (CSS + un peu de JS)

- **Héros** : `perspective` + `transform-style: preserve-3d`, mur de tuiles générées en JS (déploiement en cascade, relief au pointeur), niche en arc (`clip-path` SVG) composée de couches à différentes profondeurs (`translateZ`).
- **Collections** : défilement natif (`scroll-snap`) + transformations `perspective()/rotateY()/translateZ()` calculées à chaque frame.
- **Couleurs / bandeaux** : inclinaison au pointeur avec reflet lumineux (variables CSS `--tx`, `--ty`).
- **Atelier** : tuile 3D (faces en terre cuite + émail) pilotée par la progression du défilement.
- **Applications** : tuiles réversibles (`backface-visibility`).
- **Sur mesure** : rendu `<canvas>` de vrais échantillons (textures issues du catalogue), incliné en 3D.

## Détails pratiques

- Accessible : navigation clavier, focus visibles, `aria-*`, mode « réduction des animations » respecté, thème clair et sombre.
- Les demandes (catalogue, échantillons, devis, infos couleurs, projet sur mesure) ouvrent **WhatsApp** ou l'**e-mail** avec un message prérempli, sélection d'échantillons incluse. Il n'y a pas de serveur : rien n'est stocké côté site (la sélection reste dans le navigateur du visiteur).
- Seule dépendance externe : les polices Google (Cormorant Garamond, Jost, Mrs Saint Delafield). Hors connexion, des polices de secours prennent le relais.
- Navigateurs récents (Chrome, Edge, Safari 16+, Firefox).
