# Mes Apps

Un cockpit personnel pour retrouver rapidement les applications créées dans le dossier `DEV`, ouvrir leurs versions GitHub Pages, et ajouter des projets manuellement quand ils ne sont pas détectés automatiquement.

## App en ligne

**https://feuille2cedric.github.io/mes-apps/**

## Objectif

`mes-apps` sert de page d’accueil pour les projets perso : une seule interface pour voir ce qui existe, ce qui est déjà en ligne, et ce qui reste seulement en local.

L’app est volontairement simple : elle tourne en statique sur GitHub Pages et garde les ajouts manuels dans le navigateur.

## Fonctionnalités

- Vue globale des applications.
- Séparation entre apps déployées et projets locaux.
- Recherche rapide par nom, description ou catégorie.
- Filtre `Tout`, `Pages`, `Local`.
- Ajout manuel d’une app depuis l’interface.
- Suppression des apps ajoutées à la main.
- Sauvegarde locale via `localStorage`.
- Déploiement GitHub Pages sans exposer les fichiers internes du dossier.

## Apps suivies

Le dashboard peut référencer notamment :

- Club 33
- Dragon Quiz
- Grand Line Quiz
- re:trouve
- Framed
- CineQuizz
- habitude

Les apps ajoutées à la main restent propres à ton navigateur tant qu’il n’y a pas de base partagée.

## Lancement local sécurisé

Depuis PowerShell :

```powershell
cd C:\Users\crima\OneDrive\Bureau\DEV\mes-apps
python server.py
```

Puis ouvrir :

```text
http://127.0.0.1:3344/
```

Le serveur local ne sert que les fichiers nécessaires à l’app :

- `index.html`
- `app.js`
- `style.css`

Les autres chemins renvoient `404`, ce qui évite l’affichage brut du contenu du dossier.

## Déploiement

Le site est publié avec GitHub Pages depuis le repo :

**https://github.com/Feuille2Cedric/mes-apps**

Chaque push sur `main` déclenche le workflow de publication.

## Notes techniques

Cette app ne contient pas de backend distant. Les données ajoutées à la main sont stockées dans le navigateur utilisé. Pour synchroniser les ajouts entre plusieurs appareils, il faudra ajouter plus tard une petite base partagée, par exemple Supabase ou un fichier JSON administré depuis GitHub.
