// Fonction Netlify : reçoit une candidature (JSON), l'enregistre dans Netlify Blobs,
// puis tente d'envoyer les emails (confirmation + alerte) sans jamais faire échouer
// l'enregistrement si l'envoi d'email rencontre un problème.
//
// Stockage : Netlify Blobs (magasin "candidatures-2027"), natif à Netlify — aucune
// base de données externe à configurer. Nécessite que le site soit déployé avec le
// paquet @netlify/blobs installé (voir package.json + README, section déploiement).
//
// Variables d'environnement optionnelles pour les emails (Site settings > Environment variables) :
//   RESEND_API_KEY  -> active l'envoi d'emails via https://resend.com
//   NOTIFY_FROM     -> adresse d'expédition (nécessite un domaine vérifié sur Resend)
//   ALERT_EMAIL     -> adresse d'alerte interne, par défaut digital@saintgervais.com

const { getBlobStore } = require('./lib/blobStore');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Corps de requête invalide' }) };
  }

  // Piège à robots : si rempli, on répond succès sans rien enregistrer.
  if (data['bot-field']) {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  if (!data.titre_film || !data.contact_email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Candidature incomplète (titre du film ou email de contact manquant).' }) };
  }

  const id = new Date().toISOString().replace(/[:.]/g, '-') + '-' + Math.random().toString(36).slice(2, 8);
  const record = { id: id, created_at: new Date().toISOString(), data: data };

  try {
    const store = getBlobStore('candidatures-2027');
    await store.setJSON(id, record);
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Impossible d'enregistrer la candidature (Netlify Blobs) : " + err.message + hint(err) })
    };
  }

  try {
    await sendNotifications(data);
  } catch (err) {
    // On ne fait jamais échouer l'enregistrement à cause d'un problème d'email.
    console.warn('Emails non envoyés :', err.message);
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true, id: id }) };
};

async function sendNotifications(data) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const fromAddr = process.env.NOTIFY_FROM || 'Festival du Film Nature <onboarding@resend.dev>';
  const alertTo = process.env.ALERT_EMAIL || 'digital@saintgervais.com';

  const confirmationHtml = `
    <div style="font-family:Arial,sans-serif;color:#12241F;line-height:1.5;max-width:520px;">
      <p>Bonjour ${escapeHtml(data.contact_prenom || '')},</p>
      <p>Nous avons bien reçu la candidature de <strong>${escapeHtml(data.titre_film || 'votre film')}</strong>
      pour l'édition 2027 du Festival du Film Nature de Saint-Gervais Mont-Blanc.</p>
      <p>L'équipe de sélection va étudier votre film et reviendra vers vous par email.</p>
      <p>Merci, et à bientôt en Haute-Savoie !<br>L'équipe du Festival du Film Nature</p>
      <hr style="border:none;border-top:1px solid #D8D4C4;margin:18px 0;">
      <p style="color:#4B5A54;font-size:13px;">
      Hello ${escapeHtml(data.contact_prenom || '')} — we have received the entry for
      <strong>${escapeHtml(data.titre_film || 'your film')}</strong> for the 2027 edition of the
      Saint-Gervais Mont-Blanc Nature Film Festival. Our selection committee will review it and get back to you by email.</p>
    </div>`;

  const alertHtml = `
    <div style="font-family:Arial,sans-serif;color:#12241F;line-height:1.5;">
      <h2 style="font-size:18px;">Nouvelle candidature : ${escapeHtml(data.titre_film || 'sans titre')}</h2>
      <table cellpadding="4" style="border-collapse:collapse;font-size:14px;">
        ${fieldRows(data)}
      </table>
    </div>`;

  const jobs = [
    sendEmail(apiKey, {
      from: fromAddr,
      to: alertTo,
      subject: `Nouvelle candidature : ${data.titre_film || 'sans titre'}`,
      html: alertHtml
    })
  ];
  if (data.contact_email) {
    jobs.push(sendEmail(apiKey, {
      from: fromAddr,
      to: data.contact_email,
      subject: 'Votre candidature est bien reçue — Festival du Film Nature 2027',
      html: confirmationHtml
    }));
  }
  await Promise.all(jobs);
}

function sendEmail(apiKey, payload) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then((res) => {
    if (!res.ok) return res.text().then((t) => { throw new Error(t); });
  });
}

function fieldRows(data) {
  const labels = {
    titre_film: 'Titre du film', duree_minutes: 'Durée (min)', langue_originale: 'Langue',
    synopsis_court: 'Synopsis court',
    real1_prenom: 'Réalisateur 1 — Prénom', real1_nom: 'Réalisateur 1 — Nom', real1_pays: 'Réalisateur 1 — Pays',
    real1_email: 'Réalisateur 1 — Email',
    real2_prenom: 'Réalisateur 2 — Prénom', real2_nom: 'Réalisateur 2 — Nom',
    real3_prenom: 'Réalisateur 3 — Prénom', real3_nom: 'Réalisateur 3 — Nom',
    annee_production: 'Année de production', pays_production: 'Pays de production',
    societe_production: 'Société de production',
    contact_prenom: 'Contact — Prénom', contact_nom: 'Contact — Nom', contact_email: 'Contact — Email',
    contact_telephone: 'Contact — Téléphone', contact_fonction: 'Contact — Fonction',
    lien_visionnage: 'Lien de visionnage', mot_de_passe_visionnage: 'Mot de passe visionnage'
  };
  return Object.keys(labels)
    .filter((k) => data[k])
    .map((k) => `<tr><td style="color:#4B5A54;">${labels[k]}</td><td>${escapeHtml(data[k])}</td></tr>`)
    .join('');
}

function hint(err) {
  if (err && err.message && err.message.indexOf('has not been configured') !== -1) {
    return ' — configurez NETLIFY_SITE_ID et NETLIFY_API_TOKEN dans Site settings > Environment variables (voir README, section "Variables nécessaires").';
  }
  return '';
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
