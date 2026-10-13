# Festival du Film Nature — Appel à candidature 2027 (2ème édition)

Version simplifiée : **aucune dépendance npm, aucun build**. Les candidatures sont stockées par
**Netlify Forms** et consultées dans l'espace organisation (`/admin.html`, code 1955).

Fichiers : `index.html` (formulaire) · `merci.html` (page de remerciement) · `admin.html` (espace organisation) ·
`netlify/functions/submissions.js` (lecture des candidatures) · `netlify/functions/notify.js` (emails, optionnel) ·
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
Variables déjà créées : `NETLIFY_SITE_ID` et `NETLIFY_API_TOKEN` (Site settings > Environment variables).
Ouvrez `/admin.html`, code **1955**. En cas de souci, le message d'erreur exact s'affiche sous le champ du code.

## Emails
- **Alerte à digital@saintgervais.com (sans code)** : Netlify > Forms > **Form notifications > Add notification > Email notification**,
  formulaire `candidature-film-2027`, adresse `digital@saintgervais.com`.
- **Confirmation au réalisateur (optionnel)** : variable `RESEND_API_KEY` (compte gratuit sur resend.com). Sans elle, rien n'est envoyé
  et la candidature est quand même enregistrée.

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
