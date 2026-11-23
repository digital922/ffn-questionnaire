# Festival du Film Nature — Appel à candidature 2027 (2ème édition)

Version simplifiée : **aucune dépendance npm, aucun build**. Les candidatures sont stockées par
**Netlify Forms** et consultées dans l'espace organisation (`/admin.html`, protégé par la variable `ADMIN_CODE`).

Fichiers : `index.html` (formulaire) · `merci.html` (page de remerciement) · `admin.html` (espace organisation) ·
`netlify/functions/submissions.js` (lecture des candidatures) ·
`reglement/` (PDF FR/EN) · `netlify.toml`.

## Déploiement
1. **Remplacez tous les fichiers** de votre dépôt GitHub par ceux de cette archive (supprimez `package.json`,
   `netlify/functions/submit.js` et le dossier `netlify/functions/lib`, qui ne servent plus), en validant avec
   **"Commit directly to the main branch"**.
2. Netlify > **Site configuration > Build & deploy > Build settings** : **Build command : vide** (supprimez `npm install`),
   **Publish directory : `.`**.
3. Netlify > onglet **Forms** : si un bouton **"Enable form detection"** apparaît, cliquez dessus, puis relancez un déploiement
   (**Deploys > Trigger deploy**). Le formulaire `candidature-film-2027` doit apparaître dans l'onglet Forms.

(Alternative sans GitHub : glissez-déposez le dossier décompressé sur app.netlify.com/drop.)

## Espace organisation
Variables Netlify nécessaires (Site settings > Environment variables) :
- `ADMIN_CODE` : le code d'accès à l'espace organisation (à saisir sur `/admin.html`)
- `NETLIFY_SITE_ID` et `NETLIFY_API_TOKEN` : pour lire les candidatures reçues par Netlify Forms
(`SESSION_SECRET` n'est pas utilisée par cette application, elle peut rester sans effet.)
Après toute modification de variable : **Deploys > Trigger deploy**.
Si l'accueil de l'admin affiche « fonction introuvable », le dossier `netlify/functions` n'est pas dans le dépôt :
l'onglet **Functions** de Netlify doit lister `submissions`.

## Emails
Aucun email n'est envoyé aux candidats (la page de remerciement l'indique). Pour être alerté à chaque candidature :
Netlify > Forms > **Form notifications > Add notification > Email notification**, formulaire `candidature-film-2027`.

## Image d'accueil
L'affiche est chargée depuis `saintgervais.com`. Si elle disparaissait un jour, téléchargez-la, déposez-la à la racine du dépôt
et remplacez l'adresse dans la balise `<img>` de `index.html`.

## Widget
```html
<iframe id="sgfilmfest-form" src="https://film-festival-du-film-nature.netlify.app/" style="width:100%;border:0;min-height:800px;" title="Appel à candidature — Festival du film nature"></iframe>
<script>
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'sgfilmfest-resize') document.getElementById('sgfilmfest-form').style.height = e.data.height + 'px';
  });
</script>
```
