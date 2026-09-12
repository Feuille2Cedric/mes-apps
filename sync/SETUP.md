# Retrouver ses données sur tous ses appareils

Curio et mes-apps restent hébergés sur GitHub Pages. Supabase fournit la connexion par e-mail et mot de passe, une base privée et le stockage des images. Les deux applications utilisent le même compte mais des documents distincts. Une connexion par mot de passe n’envoie aucun e-mail.

## Première connexion

1. Ouvre l’application dans le navigateur contenant déjà tes données.
2. Clique sur **Se connecter** : utilise ton e-mail et ton mot de passe, ou **Créer un compte** si tu n’en as pas. Confirme ton adresse si Supabase te le demande.
3. Dans Curio, termine l’édition avec **Enregistrer**. Attends **✓ Synchronisé**.
4. Sur un autre appareil, ouvre l’application et connecte-toi avec le même e-mail et le même mot de passe.
5. Répète la première connexion dans l’autre application pour envoyer ses données existantes.

**Tu utilisais les liens de connexion par e-mail ?** Si tu es déjà connecté, ouvre **Mon compte → Définir ou changer mon mot de passe**. Choisis et confirme un mot de passe d’au moins 8 caractères. Ton compte et tes données sont conservés. Si tu es déconnecté et n’as jamais défini de mot de passe, utilise **Mot de passe oublié ?** une fois pour en créer un sur ton compte existant.

**Mot de passe oublié :** saisis ton adresse, ouvre le lien de récupération reçu dans le navigateur puis enregistre un nouveau mot de passe dans le formulaire affiché. Ce parcours nécessite un e-mail ; les connexions ordinaires suivantes utilisent uniquement le mot de passe.

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

Le service d’e-mail par défaut de Supabase est limité à 2 envois par heure et aux adresses de l’équipe du projet. Cette limite concerne la confirmation de compte et la récupération, **pas la connexion par mot de passe**. Pour un usage ouvert à d’autres personnes, configure un fournisseur dans **Authentication → Email → SMTP Settings** : active Custom SMTP, renseigne l’adresse d’expédition, le nom de l’expéditeur, l’hôte, le port, l’utilisateur et le mot de passe fournis par ton service d’envoi. Configure ensuite son domaine et les enregistrements DNS demandés. Ces identifiants restent dans Supabase, jamais dans GitHub. Garde la confirmation des adresses activée. Voir la [documentation SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

Aucune nouvelle table ni modification SQL n’est nécessaire pour la connexion par mot de passe. Le fournisseur Email déjà activé suffit. Les mots de passe sont transmis directement à Supabase Auth via HTTPS et ne sont jamais enregistrés dans les documents de l’application, ses exports ou le stockage navigateur. Seule la session de connexion est conservée par le SDK.

## Données et conflits

- `personal_app_state` : document courant par compte et application, protégé par RLS.
- `personal_app_history` : jusqu’à 20 documents précédents. Leur restauration n’est pas encore proposée dans l’interface.
- `personal_app_save` : écrit uniquement pour l’utilisateur connecté et refuse une version obsolète. Le navigateur recommence alors une fusion.
- `personal-app-images` : fichiers privés et immuables, rangés par compte et application. Images PNG, JPEG, GIF ou WebP, jusqu’à 12 Mio ; document jusqu’à 10 Mio. Les quotas du projet Supabase s’appliquent également.

Les modifications sur des champs distincts sont fusionnées. Un changement concurrent du même contenu demande de choisir une version après téléchargement d’un JSON contenant `local` et `remote`. Chaque section contient une sauvegarde complète ; pour Curio, une section enregistrée séparément en JSON peut être importée avec l’import habituel. Les images devenues inutilisées ne sont pas supprimées automatiquement, pour préserver les anciennes versions.

Une déconnexion masque le cache local sans l’effacer. Pour utiliser un autre compte, emploie un profil de navigateur distinct : cela évite de transférer accidentellement les données du compte précédent. Sur un même domaine, les deux applications partagent leur session de connexion. Ce mécanisme ne remplace pas le verrouillage de ton appareil : le stockage local reste accessible à quelqu’un ayant accès à ton profil de navigateur.

## Vérifications

`culture-generale/test_sync.py` utilise le SDK Supabase réel avec un serveur simulé et des profils de navigateur isolés. Il teste la migration locale, les modifications croisées, les conflits, les reprises réseau, les versions concurrentes, la déconnexion et le transfert des images. `test_auth.py` teste les deux applications : inscription, connexion par mot de passe sans envoi d’e-mail, erreurs, changement du mot de passe, récupération via redirection et affichage mobile. Ces tests ne remplacent pas un essai de connexion réel après configuration du projet.

Le SDK officiel est livré localement avec sa licence ; `vendor.json` indique sa version et la provenance de l’archive. Aucun contenu personnel n’est inclus dans le déploiement GitHub Pages.
