// Petit utilitaire partagé : ouvre le magasin Netlify Blobs utilisé par le site.
//
// Note technique : l'auto-configuration "zero-config" de Netlify Blobs ne fonctionne
// qu'avec les fonctions au format "v2" (export default). Nos fonctions utilisent le
// format classique (exports.handler), qui ne reçoit pas automatiquement le contexte
// Blobs — c'est documenté et confirmé par Netlify (voir issues netlify/blobs sur GitHub).
// On fournit donc toujours siteID + token explicitement, à partir des variables
// d'environnement NETLIFY_SITE_ID et NETLIFY_API_TOKEN (voir README).

const { getStore } = require('@netlify/blobs');

function getBlobStore(name) {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_BLOBS_TOKEN;

  if (siteID && token) {
    return getStore({ name: name, siteID: siteID, token: token });
  }

  // Dernier recours : tente l'auto-configuration (fonctionne sur certains runtimes).
  return getStore(name);
}

module.exports = { getBlobStore: getBlobStore };
