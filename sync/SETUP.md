# Retrouver ses données sur tous ses appareils

Curio et mes-apps restent hébergés sur GitHub Pages. Supabase fournit le compte par e-mail, une base privée et le stockage des images. Les deux applications utilisent le même compte mais des documents distincts.

## Première connexion

1. Ouvre l’application dans le navigateur contenant déjà tes données.
2. Clique sur **Synchroniser**, saisis ton e-mail et ouvre le lien reçu dans ce même navigateur.
3. Dans Curio, termine l’édition avec **Enregistrer**. Attends **✓ Synchronisé**.
4. Sur un autre appareil, ouvre l’application et connecte-toi avec le même e-mail.
5. Répète la première connexion dans l’autre application pour envoyer ses données existantes.

Ne réimporte pas ta sauvegarde sur chaque appareil : la synchronisation reprend les mêmes pages et leurs identifiants. Un import manuel crée des copies.

Les écritures locales restent possibles sans connexion réseau lorsque la page est déjà chargée. Le chargement initial de l’application nécessite Internet. La synchronisation vérifie les changements toutes les 15 secondes avec la page ouverte, au retour sur la fenêtre et après les modifications. Elle attend la fermeture de l’éditeur ou du formulaire. L’indicateur « enregistré dans ce navigateur » de Curio concerne la copie locale ; **✓ Synchronisé** confirme la copie distante.

## Configurer Supabase

1. Dans SQL Editor, exécute tout le contenu de [schema.sql](schema.sql), une seule fois pour les deux applications.
2. Dans Authentication → URL Configuration, ajoute les adresses de retour :

   ```text
   https://feuille2cedric.github.io/culture-generale/
   https://feuille2cedric.github.io/mes-apps/
   ```

3. Dans Authentication → Sign In / Providers, active Email.
4. Dans `config.js` de chaque application, renseigne l’URL du projet et sa clé **publishable** ou **anon**. Ne mets jamais de clé secrète ou `service_role` dans ce fichier public.
5. Publie les deux applications. Pour une copie locale ou un autre domaine, ajoute aussi son URL exacte aux redirections autorisées.

Le service d’e-mail par défaut de Supabase est limité : pour envoyer à des adresses autres que celles autorisées par le projet, configure un fournisseur SMTP dans Authentication. Voir la [documentation SMTP](https://supabase.com/docs/guides/auth/auth-smtp) et les [liens de connexion](https://supabase.com/docs/guides/auth/auth-email-passwordless).

## Données et conflits

- `personal_app_state` : document courant par compte et application, protégé par RLS.
- `personal_app_history` : jusqu’à 20 documents précédents. Leur restauration n’est pas encore proposée dans l’interface.
- `personal_app_save` : écrit uniquement pour l’utilisateur connecté et refuse une version obsolète. Le navigateur recommence alors une fusion.
- `personal-app-images` : fichiers privés et immuables, rangés par compte et application. Images PNG, JPEG, GIF ou WebP, jusqu’à 12 Mio ; document jusqu’à 10 Mio. Les quotas du projet Supabase s’appliquent également.

Les modifications sur des champs distincts sont fusionnées. Un changement concurrent du même contenu demande de choisir une version après téléchargement d’un JSON contenant `local` et `remote`. Chaque section contient une sauvegarde complète ; pour Curio, une section enregistrée séparément en JSON peut être importée avec l’import habituel. Les images devenues inutilisées ne sont pas supprimées automatiquement, pour préserver les anciennes versions.

Une déconnexion masque le cache local sans l’effacer. Pour utiliser un autre compte, emploie un profil de navigateur distinct : cela évite de transférer accidentellement les données du compte précédent. Sur un même domaine, les deux applications partagent leur session de connexion. Ce mécanisme ne remplace pas le verrouillage de ton appareil : le stockage local reste accessible à quelqu’un ayant accès à ton profil de navigateur.

## Vérifications

`culture-generale/test_sync.py` utilise le SDK Supabase réel avec un serveur simulé et des profils de navigateur isolés. Il teste la migration locale, les modifications croisées, les conflits, les reprises réseau, les versions concurrentes, la déconnexion et le transfert des images. Il ne remplace pas un essai de connexion réel après configuration du projet.

Le SDK officiel est livré localement avec sa licence ; `vendor.json` indique sa version et la provenance de l’archive. Aucun contenu personnel n’est inclus dans le déploiement GitHub Pages.
