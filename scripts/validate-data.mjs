import fs from 'node:fs';

const raw = fs.readFileSync('data.json', 'utf8');
const data = JSON.parse(raw);

if (!Array.isArray(data)) {
  throw new Error('data.json doit être un tableau.');
}

for (const territoire of data) {
  for (const key of ['id', 'zone', 'pdf', 'lien', 'historique']) {
    if (!(key in territoire)) {
      throw new Error(`Champ manquant (${key}) pour territoire ${territoire.id || 'inconnu'}`);
    }
  }

  if (!Array.isArray(territoire.historique)) {
    throw new Error(`historique doit être un tableau (${territoire.id})`);
  }
}

console.log(`✅ data.json valide (${data.length} territoires)`);
