// Fonction Netlify : renvoie la liste des candidatures enregistrées dans Netlify Blobs
// (magasin "candidatures-2027"), pour alimenter admin.html.
//
// Variables d'environnement :
//   NETLIFY_SITE_ID  -> Site settings > General > Site details > Site ID
//   NETLIFY_API_TOKEN -> User settings > Applications > Personal access tokens
//   ADMIN_PIN        -> optionnel, code d'accès admin, par défaut "1955"

const { getBlobStore } = require('./lib/blobStore');

exports.handler = async function (event) {
  const pin = event.headers['x-admin-pin'] || (event.queryStringParameters && event.queryStringParameters.pin) || '';
  const expectedPin = process.env.ADMIN_PIN || '1955';

  if (pin !== expectedPin) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Code incorrect' }) };
  }

  try {
    const store = getBlobStore('candidatures-2027');
    const { blobs } = await store.list();

    const records = await Promise.all(
      blobs.map((b) => store.get(b.key, { type: 'json' }).catch(() => null))
    );

    const submissions = records
      .filter(Boolean)
      .map((r) => ({ created_at: r.created_at, data: r.data }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissions: submissions })
    };
  } catch (err) {
    var extra = '';
    if (err && err.message && err.message.indexOf('has not been configured') !== -1) {
      extra = ' — configurez NETLIFY_SITE_ID et NETLIFY_API_TOKEN dans Site settings > Environment variables (voir README, section "Variables nécessaires").';
    }
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Impossible de lire Netlify Blobs : " + err.message + extra })
    };
  }
};
