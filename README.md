# Mes Apps

Mes Apps est un cockpit personnel pour regrouper les applications créées dans le dossier `DEV`, ouvrir rapidement leurs versions GitHub Pages, garder une vue propre des projets locaux, et ajouter manuellement les apps qui ne sont pas encore listées dans le code.

## App en ligne

**https://feuille2cedric.github.io/mes-apps/**

## Repo GitHub

**https://github.com/Feuille2Cedric/mes-apps**

## Objectif

L'objectif est simple : arrêter de chercher les apps à la main dans les dossiers, les repos GitHub ou les URLs GitHub Pages.

`mes-apps` sert de page d'accueil unique pour :

1. voir les apps déjà déployées ;
2. ouvrir leur site en un clic ;
3. ouvrir leur repo GitHub ;
4. garder une trace des projets encore seulement locaux ;
5. ajouter une app à la main depuis l'interface.

## Fonctionnalités

- Dashboard centralisé de tes apps.
- Cartes propres avec nom, catégorie, description, repo et lien public.
- Bouton `Ouvrir` pour lancer l'app déployée.
- Bouton `GitHub` pour accéder au repo.
- Recherche par nom, description, catégorie, repo ou URL.
- Filtres rapides : `Tout`, `Pages`, `Local`.
- Section dédiée aux apps GitHub Pages.
- Section dédiée aux apps ajoutées manuellement.
- Section dédiée aux projets locaux.
- Ajout manuel d'une app depuis une fenêtre de formulaire.
- Suppression des apps ajoutées manuellement.
- Sauvegarde automatique des ajouts dans le navigateur via `localStorage`.
- Serveur local sécurisé qui évite le listing brut des fichiers.

## Apps intégrées

Les apps suivantes sont présentes dans le dashboard par défaut :

| App | Catégorie | Lien |
| --- | --- | --- |
| Club 33 | Musique | https://feuille2cedric.github.io/club-33/ |
| Dragon Quiz | Jeu | https://feuille2cedric.github.io/dragon-ball/ |
| Grand Line Quiz | Jeu | https://feuille2cedric.github.io/one-piece/ |
| re:trouve | Shopping | https://feuille2cedric.github.io/retrouve-vinted/ |
| Framed | Cinéma | https://feuille2cedric.github.io/Framed/ |
| CineQuizz | Cinéma | https://feuille2cedric.github.io/CineQuizz/ |
| habitude | Perso | https://feuille2cedric.github.io/habitude/ |

## Projets locaux listés

Le dashboard référence aussi des projets présents localement dans `DEV` :

- `absolutDirector`
- `framed`
- `one`

Ces entrées servent de rappel pour les projets qui ne sont pas encore forcément propres, terminés ou déployés.

## Ajout manuel d'une app

Depuis l'interface :

1. cliquer sur `Ajouter` ;
2. saisir le nom de l'app ;
3. ajouter l'URL publique ;
4. ajouter le lien GitHub si disponible ;
5. choisir une catégorie ;
6. écrire une description courte ;
7. enregistrer.

L'app apparaît immédiatement dans le dashboard.

Les ajouts manuels sont conservés dans le navigateur et synchronisés avec ton compte. Clique sur **Synchroniser**, utilise ton adresse e-mail et ouvre le lien reçu dans ce navigateur. Commence sur l’appareil contenant tes liens, attends **✓ Synchronisé**, puis connecte-toi avec la même adresse ailleurs.

## Stockage

Supabase conserve une copie privée des liens ajoutés manuellement. La synchronisation se lance après la fermeture du formulaire et vérifie les autres appareils toutes les 15 secondes tant que la page est ouverte. Sans compte, les données restent locales. Le dashboard ne synchronise pas les données internes des applications vers lesquelles il pointe.

Les données ajoutées manuellement sont stockées dans :

```text
localStorage
```

Clé utilisée :

```text
mes-apps-manual
```

En cas de coupure réseau, tes changements restent dans le navigateur et sont envoyés au retour de la connexion. Attends **✓ Synchronisé** avant d’effacer les données du site. Si deux appareils modifient le même champ, un export des deux versions précède le choix de celle à conserver. Les 20 versions précédentes sont gardées en base.

Configuration et fonctionnement : **[guide Supabase](sync/SETUP.md)**.

## Lancement local

Prérequis : Python 3.8 ou plus récent.

Depuis PowerShell :

```powershell
cd C:\Users\crima\OneDrive\Bureau\DEV\mes-apps
python server.py
```

Puis ouvrir :

```text
http://127.0.0.1:3344/
```

## Serveur local sécurisé

Le serveur local ne sert que les fichiers nécessaires à l'app :

- `index.html`
- `app.js`
- `style.css`

Tout autre chemin renvoie `404`.

Cela évite le problème classique où le navigateur affiche l'index brut du dossier avec tous les fichiers visibles.

## Déploiement

Le site est publié avec GitHub Pages.

Chaque push sur `main` déclenche le workflow de déploiement et publie uniquement les fichiers statiques nécessaires.

URL publique :

**https://feuille2cedric.github.io/mes-apps/**

## Sécurité

L'app ne contient pas de mot de passe, pas de clé privée et pas de secret.

Les liens intégrés sont publics. Les données manuelles synchronisées sont accessibles uniquement au compte connecté grâce aux règles RLS de Supabase. La clé publique présente dans le code ne donne pas accès à ces données. Une déconnexion masque les liens privés conservés dans le navigateur.

Le serveur local est volontairement limité pour ne pas exposer le contenu complet du dossier `mes-apps`.

## Limites actuelles

- La synchronisation nécessite de se connecter au même compte sur chaque appareil.
- Les projets locaux ne sont pas scannés automatiquement en temps réel.
- Les apps déployées par défaut sont listées dans `app.js`.
- Il n'y a pas encore de pourcentage d'avancement projet dans cette app.

Pour un vrai suivi d'avancement jusqu'à 100%, le projet dédié est `dev-dashboard`.

## Structure

```text
mes-apps/
├── .github/
│   └── workflows/           # déploiement GitHub Pages
├── index.html               # interface principale
├── app.js                   # liste des apps, filtres, ajout manuel
├── style.css                # design du dashboard
├── server.py                # serveur local verrouillé
├── README.md
└── .gitignore
```

## Statut

Mes Apps est fonctionnel avec :

- dashboard d'applications ;
- apps GitHub Pages intégrées ;
- projets locaux visibles ;
- recherche ;
- filtres ;
- ajout manuel ;
- suppression des ajouts manuels ;
- stockage navigateur ;
- lancement local sécurisé ;
- déploiement GitHub Pages.
