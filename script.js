const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1hlMhtRHQh_Lel95LXjYP7dReuma_Q4ikc-6fHgCgwwI/edit?usp=sharing';
const SHEET_ID = GOOGLE_SHEET_URL.split('/d/')[1]?.split('/')[0];
const SHEET_NAME = 'territoires';

// Optionnel: colle ici l'URL de ton Apps Script publié en Web App pour activer l'écriture.
// Exemple: const APPS_SCRIPT_WEBAPP_URL = 'https://script.google.com/macros/s/.../exec';
const APPS_SCRIPT_WEBAPP_URL = '';

let territoires = [];

init();

async function init() {
  const tbody = document.querySelector('#territoiresTable tbody');

  try {
    territoires = await chargerDepuisGoogleSheet();
    afficherTerritoires();
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="9">Erreur Google Sheet: ${error.message}. Vérifie que l'onglet est bien partagé (lecture) ou publié.</td></tr>`;
  }
}

async function chargerDepuisGoogleSheet() {
  if (!SHEET_ID) {
    throw new Error('ID du Google Sheet introuvable.');
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Chargement impossible (${res.status}).`);
  }

  const text = await res.text();
  const jsonText = text.match(/google\.visualization\.Query\.setResponse\((.*)\);?$/s)?.[1];

  if (!jsonText) {
    throw new Error('Réponse Google Sheet non reconnue.');
  }

  const payload = JSON.parse(jsonText);
  const table = payload?.table;

  if (!table?.cols || !table?.rows) {
    throw new Error('Format de feuille invalide.');
  }

  const headers = table.cols.map((c) => (c.label || c.id || '').trim());
  const rows = table.rows.map((r) => {
    const obj = {};
    r.c.forEach((cell, idx) => {
      const key = headers[idx];
      obj[key] = (cell?.f ?? cell?.v ?? '').toString().trim();
    });
    return obj;
  });

  return convertirLignesVersTerritoires(rows);
}

function convertirLignesVersTerritoires(rows) {
  const byId = new Map();

  rows.forEach((row) => {
    const id = (row.id || '').trim();
    if (!id) return;

    if (!byId.has(id)) {
      byId.set(id, {
        id,
        zone: (row.zone || '').trim(),
        pdf: (row.pdf || '').trim(),
        lien: (row.lien || '').trim(),
        historique: []
      });
    }

    const historiqueEntry = {
      personne: (row.personne || '').trim(),
      date_sortie: (row.date_sortie || '').trim(),
      date_rentree: (row.date_rentree || '').trim()
    };

    if (historiqueEntry.personne || historiqueEntry.date_sortie || historiqueEntry.date_rentree) {
      byId.get(id).historique.push(historiqueEntry);
    }
  });

  const result = [...byId.values()];
  result.forEach((territoire) => {
    if (!territoire.historique.length) {
      territoire.historique.push({ personne: '', date_sortie: '', date_rentree: '' });
    }

    territoire.historique.sort((a, b) => (a.date_sortie || '').localeCompare(b.date_sortie || ''));
  });

  return result;
}

function afficherTerritoires() {
  const tbody = document.querySelector('#territoiresTable tbody');
  tbody.innerHTML = '';

  territoires.forEach((t) => {
    const dernierPassage = t.historique?.[t.historique.length - 1] || {
      personne: '',
      date_sortie: '',
      date_rentree: ''
    };

    const statut = dernierPassage.date_rentree ? 'Disponible' : 'En cours';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.id}</td>
      <td>${t.zone}</td>
      <td><a href="${t.pdf}" target="_blank" rel="noreferrer">PDF</a></td>
      <td><a href="${t.lien}" target="_blank" rel="noreferrer">Maps</a></td>
      <td>${dernierPassage.personne || ''}</td>
      <td>${dernierPassage.date_sortie || ''}</td>
      <td>${dernierPassage.date_rentree || ''}</td>
      <td>${statut}</td>
      <td>
        <button onclick="sortie('${t.id}')">Sortie</button>
        <button onclick="rentree('${t.id}')">Rentrée</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function sortie(id) {
  const personne = prompt('Nom de la personne ?');
  if (!personne) return;

  const date = new Date().toISOString().split('T')[0];
  const territoire = territoires.find((t) => t.id === id);

  territoire.historique.push({
    personne,
    date_sortie: date,
    date_rentree: ''
  });

  afficherTerritoires();
  await synchroniserGoogleSheet({ action: 'sortie', id, personne, date_sortie: date });
}

async function rentree(id) {
  const date = new Date().toISOString().split('T')[0];
  const territoire = territoires.find((t) => t.id === id);
  const dernier = territoire.historique[territoire.historique.length - 1];

  if (!dernier || dernier.date_rentree) {
    alert('Pas de sortie en cours !');
    return;
  }

  dernier.date_rentree = date;
  afficherTerritoires();
  await synchroniserGoogleSheet({ action: 'rentree', id, date_rentree: date });
}

async function synchroniserGoogleSheet(payload) {
  if (!APPS_SCRIPT_WEBAPP_URL) {
    console.info('Mode lecture seule: aucune URL Apps Script configurée.');
    return;
  }

  try {
    const res = await fetch(APPS_SCRIPT_WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Sync impossible (${res.status})`);
    }
  } catch (error) {
    alert(`Mise à jour locale OK, mais sync Google Sheet KO: ${error.message}`);
  }
}
