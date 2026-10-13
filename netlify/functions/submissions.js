// Renvoie les candidatures reçues via Netlify Forms (formulaire "candidature-film-2027")
// pour alimenter admin.html. Aucune dépendance npm : utilise fetch (Node 18+).
//
// Variables d'environnement (Site settings > Environment variables) :
//   NETLIFY_SITE_ID   -> Site settings > General > Site ID
//   NETLIFY_API_TOKEN -> User settings > Applications > Personal access tokens
//   ADMIN_PIN         -> optionnel, par défaut "1955"

const FORM_NAME = 'candidature-film-2027';

exports.handler = async function (event) {
  const pin = event.headers['x-admin-pin'] || '';
  if (pin !== (process.env.ADMIN_PIN || '1955')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Code incorrect' }) };
  }

  const token = process.env.NETLIFY_API_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID;
  if (!token || !siteId) {
    return { statusCode: 500, body: JSON.stringify({ error: "Variables NETLIFY_API_TOKEN et NETLIFY_SITE_ID manquantes (Site settings > Environment variables)." }) };
  }

  try {
    const headers = { Authorization: 'Bearer ' + token };
    const formsRes = await fetch('https://api.netlify.com/api/v1/sites/' + siteId + '/forms', { headers });
    if (!formsRes.ok) throw new Error('Netlify API (liste des formulaires) : ' + formsRes.status);
    const forms = await formsRes.json();
    const form = forms.find(function (f) { return f.name === FORM_NAME; });
    if (!form) {
      return { statusCode: 200, body: JSON.stringify({ submissions: [], note: "Aucune candidature reçue pour le moment (le formulaire n'est pas encore détecté par Netlify)." }) };
    }

    let all = [];
    for (let page = 1; page <= 10; page++) {
      const r = await fetch('https://api.netlify.com/api/v1/forms/' + form.id + '/submissions?per_page=100&page=' + page, { headers });
      if (!r.ok) throw new Error('Netlify API (candidatures) : ' + r.status);
      const batch = await r.json();
      all = all.concat(batch);
      if (batch.length < 100) break;
    }

    const submissions = all.map(function (s) { return { created_at: s.created_at, data: s.data }; });
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submissions: submissions }) };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: err.message }) };
  }
};
