# Mes apps

Hub statique pour retrouver les apps deployees sur GitHub Pages et les projets presents dans `DEV`.

Le bouton **Ajouter** permet d'ajouter une app a la main. Ces ajouts sont gardes dans le `localStorage` du navigateur utilise.

Apps GitHub Pages listees :

- Club 33
- Dragon Quiz
- Grand Line Quiz
- re:trouve
- Framed
- CineQuizz
- habitude

Lancement local sans listing de dossier :

```powershell
cd C:\Users\crima\OneDrive\Bureau\DEV\mes-apps
python server.py
```

Puis ouvrir http://127.0.0.1:3344/.

Le serveur local ne sert que `index.html`, `app.js` et `style.css`. Les autres chemins renvoient 404.
