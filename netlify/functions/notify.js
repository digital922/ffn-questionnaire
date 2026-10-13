// OPTIONNEL — emails de confirmation (au contact) et d'alerte (digital@saintgervais.com) via Resend.
// Sans RESEND_API_KEY, cette fonction ne fait rien et n'affecte pas l'enregistrement des candidatures.
// Aucune dépendance npm.

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '' };
  let d;
  try { d = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: '' }; }
  if (d['bot-field']) return { statusCode: 200, body: '{}' };

  const key = process.env.RESEND_API_KEY;
  if (!key) return { statusCode: 200, body: JSON.stringify({ sent: false }) };

  const from = process.env.NOTIFY_FROM || 'Festival du Film Nature <onboarding@resend.dev>';
  const alertTo = process.env.ALERT_EMAIL || 'digital@saintgervais.com';
  const esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  const send = function (payload) {
    return fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { if (!r.ok) return r.text().then(function (t) { throw new Error(t); }); });
  };

  const rows = ['titre_film', 'duree_minutes', 'langue_originale', 'real1_prenom', 'real1_nom', 'pays_production', 'annee_production',
    'contact_prenom', 'contact_nom', 'contact_email', 'contact_telephone', 'lien_visionnage', 'mot_de_passe_visionnage']
    .filter(function (k) { return d[k]; })
    .map(function (k) { return '<tr><td style="color:#4B5A54;padding:3px 10px 3px 0;">' + k + '</td><td>' + esc(d[k]) + '</td></tr>'; }).join('');

  const jobs = [send({ from: from, to: alertTo, subject: 'Nouvelle candidature : ' + (d.titre_film || 'sans titre'),
    html: '<h2>Nouvelle candidature : ' + esc(d.titre_film || '') + '</h2><table>' + rows + '</table>' })];
  if (d.contact_email) {
    jobs.push(send({ from: from, to: d.contact_email, subject: 'Votre candidature est bien reçue — Festival du Film Nature 2027',
      html: '<p>Bonjour ' + esc(d.contact_prenom || '') + ',</p><p>Nous avons bien reçu la candidature de <strong>' + esc(d.titre_film || 'votre film') +
        '</strong> pour la 2ème édition du Festival du film nature de Saint-Gervais Mont-Blanc. Le comité de sélection reviendra vers vous par email.</p>' +
        '<p style="color:#4B5A54;font-size:13px;">Hello ' + esc(d.contact_prenom || '') + ' — we have received your entry. The selection committee will get back to you by email.</p>' }));
  }
  try { await Promise.all(jobs); return { statusCode: 200, body: JSON.stringify({ sent: true }) }; }
  catch (err) { console.warn('Emails non envoyés :', err.message); return { statusCode: 200, body: JSON.stringify({ sent: false }) }; }
};
