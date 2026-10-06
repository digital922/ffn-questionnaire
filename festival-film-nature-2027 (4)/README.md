# Festival du Film Nature — Saint-Gervais Mont-Blanc — Appel à films 2027

Application prête à héberger sur Netlify. Le stockage des candidatures utilise désormais
**Netlify Blobs** (plus de dépendance à Netlify Forms), et l'envoi des emails et
l'enregistrement se font dans la même fonction serveur pour plus de fiabilité.

- `index.html` — le formulaire public en plein écran, une question à la fois.
- `admin.html` — le tableau de bord protégé par le code **1955**.
- `netlify/functions/submit.js` — reçoit chaque candidature, l'enregistre dans Netlify Blobs, puis tente d'envoyer les emails.
- `netlify/functions/submissions.js` — relit les candidatures stockées dans Netlify Blobs pour les afficher dans `admin.html`.
- `reglement/reglement-fr.pdf` et `reglement/reglement-en.pdf` — règlement officiel (la version anglaise est une traduction de travail, à relire avant diffusion officielle).
- `package.json` — déclare la dépendance `@netlify/blobs`.
- `netlify.toml` — configuration de déploiement.

## ⚠️ Point important : ce déploiement doit passer par `npm install`

Netlify Blobs a besoin du paquet `@netlify/blobs`, installé automatiquement par la commande
`npm install` définie dans `netlify.toml`. **Cette installation ne se fait pas sur un
déploiement par glisser-déposer** (drag & drop sur app.netlify.com/drop) : ce mode envoie vos
fichiers tels quels, sans jamais exécuter `npm install`, donc la fonction échouera avec une
erreur "Cannot find module '@netlify/blobs'".

**Il faut donc déployer via un dépôt Git connecté** (GitHub, GitLab ou Bitbucket), pour que
Netlify exécute lui-même la commande de build définie dans `netlify.toml`. C'est l'occasion
d'avoir aussi l'historique des déploiements et un rollback facile. Étapes :

1. Créez un dépôt (par exemple sur GitHub), poussez-y tout le contenu de ce dossier.
2. Sur Netlify : **Add new site > Import an existing project**, choisissez le dépôt.
3. Build command : `npm install` (déjà dans `netlify.toml`, Netlify devrait le reprendre automatiquement).
4. Publish directory : `.`
5. Déployez.

Si vous avez déjà un site Netlify créé par glisser-déposer, vous pouvez le reconnecter à un
dépôt Git depuis **Site settings > Build & deploy > Link repository**, sans perdre l'URL actuelle.

## 1. Variables nécessaires (important)

Netlify Blobs promet une "auto-configuration" sans jeton — mais celle-ci ne fonctionne qu'avec
les fonctions au nouveau format "v2" (`export default`). Nos fonctions utilisent le format
classique (`exports.handler`), plus répandu et plus simple à lire, qui **ne reçoit pas** cette
configuration automatique (c'est un comportement connu et documenté de Netlify, pas un bug de
cette application). On fournit donc le site et le jeton explicitement :

1. **User settings > Applications > Personal access tokens** : créez un jeton.
2. **Site settings > General > Site details** : copiez le **Site ID**.
3. **Site settings > Environment variables**, ajoutez :
   - `NETLIFY_SITE_ID` = le Site ID copié
   - `NETLIFY_API_TOKEN` = le jeton créé
   - `ADMIN_PIN` = `1955` (optionnel, déjà la valeur par défaut)
4. Redéployez (**Deploys > Trigger deploy**) pour que les nouvelles variables soient prises en compte.

Sans ces deux variables, `submit.js` et `submissions.js` renvoient maintenant une erreur
explicite qui le rappelle, plutôt que d'échouer silencieusement.

Ouvrez ensuite `https://votre-site.netlify.app/admin.html`, entrez **1955** : recherche, filtre
par pays de production, fiche détaillée, export CSV.

## 2. Emails automatiques (confirmation + alerte)

À chaque candidature : un email de confirmation part vers la personne contact, et une alerte
part vers **digital@saintgervais.com**, via [Resend](https://resend.com) (gratuit à ce volume).

1. Créez un compte sur resend.com, générez une clé API.
2. **Site settings > Environment variables**, ajoutez :
   - `RESEND_API_KEY` = la clé créée
   - `ALERT_EMAIL` = `digital@saintgervais.com` (optionnel, déjà la valeur par défaut)
   - `NOTIFY_FROM` = optionnel — pour une adresse `@saintgervais.com`, vérifiez d'abord ce domaine dans Resend (**Domains**), sinon les emails partent de `onboarding@resend.dev` (fonctionnelle, mais non personnalisée).
3. Redéployez.

Sans `RESEND_API_KEY`, les candidatures continuent d'être enregistrées normalement — seuls les
emails ne partent pas. Si les emails ne partent toujours pas après avoir configuré la clé,
le plus rapide est de regarder les **Function logs** du site dans Netlify (onglet *Logs* de la
fonction `submit`) : la fonction y écrit explicitement `Emails non envoyés : <raison>` quand
Resend refuse l'envoi (domaine non vérifié, clé invalide, etc.).

## 3. Historique : pourquoi ça ne fonctionnait pas

- **Version Netlify Forms** : reposait sur la détection automatique d'un formulaire HTML par
  Netlify au moment du build. Ce mécanisme pouvait échouer silencieusement selon le mode de
  déploiement, sans message d'erreur exploitable.
- **Première version Blobs** : utilisait l'auto-configuration "zero-config" de Netlify Blobs,
  qui ne fonctionne qu'avec les fonctions au format "v2" (`export default`). Nos fonctions sont
  au format classique (`exports.handler`), donc cette auto-configuration échouait avec l'erreur
  *"The environment has not been configured to use Netlify Blobs"* — confirmé par plusieurs
  retours d'utilisateurs Netlify rencontrant exactement la même erreur avec ce format de fonction.
- **Version actuelle** : fournit explicitement `NETLIFY_SITE_ID` et `NETLIFY_API_TOKEN` à chaque
  appel (voir section 1 ci-dessus), ce qui contourne complètement cette limitation. Si
  l'enregistrement échoue malgré tout, le message d'erreur réel remonte jusque dans le
  formulaire — plus d'échec silencieux.

## 4. Intégrer le formulaire en widget sur votre site

```html
<iframe
  id="sgfilmfest-form"
  src="https://votre-site.netlify.app/"
  style="width:100%; border:0; min-height:800px;"
  title="Déposer un film — Festival du Film Nature Saint-Gervais Mont-Blanc">
</iframe>

<script>
  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'sgfilmfest-resize') {
      var frame = document.getElementById('sgfilmfest-form');
      if (frame) frame.style.height = event.data.height + 'px';
    }
  });
</script>
```

## 5. Structure du formulaire

1. **Le film** — titre, durée, langue, sous-titres, synopsis court (500 caractères).
2. **Réalisation** — un·e réalisateur·ice obligatoire, jusqu'à deux de plus via "+ Ajouter".
3. **Production** — année, pays, société (optionnel), autoproduction (optionnel).
4. **Contact** — coordonnées + droits certifiés + règlement accepté (liens FR/EN).
5. **Lien de visionnage** — lien de visionnage + mot de passe (optionnel). Remplace l'envoi
   via Smash, que votre règlement ne prévoit qu'après sélection (fichiers finaux DCP/master).
6. **Données personnelles** — consentement RGPD obligatoire.
7. Récapitulatif, puis envoi.

Pour ajouter un champ : dupliquez un bloc dans `index.html`, donnez-lui un `name` unique, puis
ajoutez la même clé dans `fieldLabels`/`fieldOrder` de `admin.html` et, si besoin, dans
`fieldRows()` de `netlify/functions/submit.js`. Un redéploiement suffit — plus besoin que
Netlify "redétecte" quoi que ce soit, puisqu'il n'y a plus de formulaire Netlify Forms à parser.
