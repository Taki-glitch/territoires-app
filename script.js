const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1hlMhtRHQh_Lel95LXjYP7dReuma_Q4ikc-6fHgCgwwI/edit?usp=sharing';
const SHEET_ID = GOOGLE_SHEET_URL.split('/d/')[1]?.split('/')[0];
const SHEET_NAME = 'territoires';

// URL de Web App Apps Script pour mode édition + sauvegarde (fortement recommandé)
const APPS_SCRIPT_WEBAPP_URL = '';

const COLUMNS = ['id', 'zone', 'pdf', 'lien', 'personne', 'date_sortie', 'date_rentree'];

let sheetRows = [];

init();

async function init() {
  try {
    await chargerDonnees();
    render();
  } catch (error) {
    afficherErreur(error.message);
  }
}

function afficherErreur(message) {
  const tbody = document.querySelector('#sheetTable tbody');
  tbody.innerHTML = `<tr><td colspan="9">Erreur: ${message}</td></tr>`;
}

async function chargerDonnees() {
  if (APPS_SCRIPT_WEBAPP_URL) {
    sheetRows = await chargerDepuisAppsScript();
    return;
  }

  sheetRows = await chargerDepuisGoogleSheetLectureSeule();
}

async function chargerDepuisAppsScript() {
  const url = `${APPS_SCRIPT_WEBAPP_URL}?action=list`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Impossible de charger via Apps Script (${res.status})`);
  }

  const data = await res.json();
  if (!data.ok || !Array.isArray(data.rows)) {
    throw new Error(data.error || 'Réponse Apps Script invalide.');
  }

  return data.rows.map(normaliserLigne);
}

async function chargerDepuisGoogleSheetLectureSeule() {
  if (!SHEET_ID) {
    throw new Error('ID Google Sheet introuvable.');
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Lecture Google Sheet impossible (${res.status}).`);
  }

  const text = await res.text();
  const jsonText = text.match(/google\.visualization\.Query\.setResponse\((.*)\);?$/s)?.[1];

  if (!jsonText) {
    throw new Error('Format GViz non reconnu.');
  }

  const payload = JSON.parse(jsonText);
  const table = payload?.table;

  if (!table?.cols || !table?.rows) {
    throw new Error('Structure de feuille invalide.');
  }

  const headers = table.cols.map((c) => (c.label || c.id || '').trim());

  return table.rows.map((r) => {
    const obj = {};
    r.c.forEach((cell, idx) => {
      obj[headers[idx]] = (cell?.f ?? cell?.v ?? '').toString().trim();
    });
    return normaliserLigne(obj);
  }).filter((row) => row.id);
}

function normaliserLigne(row) {
  const base = { __rowNumber: row.__rowNumber ? Number(row.__rowNumber) : null };
  COLUMNS.forEach((col) => {
    base[col] = (row[col] || '').toString().trim();
  });
  return base;
}

function render() {
  renderSheetTable();
  renderResumeS13();
}

function renderSheetTable() {
  const tbody = document.querySelector('#sheetTable tbody');
  tbody.innerHTML = '';

  sheetRows.forEach((row, index) => {
    const tr = document.createElement('tr');

    COLUMNS.forEach((col) => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.value = row[col] || '';
      input.placeholder = col;
      input.dataset.index = String(index);
      input.dataset.column = col;
      input.addEventListener('input', onInputChange);
      td.appendChild(input);
      tr.appendChild(td);
    });

    const actionsTd = document.createElement('td');
    actionsTd.innerHTML = `
      <button onclick="saveRow(${index})">Sauvegarder</button>
      <button onclick="sortieDepuisLigne(${index})">Sortie</button>
      <button onclick="rentreeDepuisLigne(${index})">Rentrée</button>
    `;
    tr.appendChild(actionsTd);

    tbody.appendChild(tr);
  });
}

function onInputChange(e) {
  const index = Number(e.target.dataset.index);
  const column = e.target.dataset.column;
  sheetRows[index][column] = e.target.value.trim();
}

function ajouterLigne() {
  sheetRows.push(normaliserLigne({}));
  render();
}

async function saveRow(index) {
  const row = sheetRows[index];

  if (!row.id) {
    alert('Le champ id est obligatoire.');
    return;
  }

  if (!APPS_SCRIPT_WEBAPP_URL) {
    alert('Mode lecture seule: configure APPS_SCRIPT_WEBAPP_URL pour sauvegarder dans Google Sheet.');
    return;
  }

  const payload = {
    action: 'upsert',
    rowNumber: row.__rowNumber,
    row: pickRowFields(row)
  };

  const res = await fetch(APPS_SCRIPT_WEBAPP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const out = await res.json();
  if (!res.ok || !out.ok) {
    alert(`Sauvegarde impossible: ${out.error || res.status}`);
    return;
  }

  row.__rowNumber = out.rowNumber || row.__rowNumber;
  alert('Ligne sauvegardée dans Google Sheet ✅');
  renderResumeS13();
}

async function sortieDepuisLigne(index) {
  const row = sheetRows[index];
  const personne = prompt('Nom de la personne ?') || row.personne;
  if (!personne) return;

  row.personne = personne;
  row.date_sortie = new Date().toISOString().split('T')[0];
  row.date_rentree = '';

  render();
  await saveRow(index);
}

async function rentreeDepuisLigne(index) {
  const row = sheetRows[index];
  if (!row.date_sortie) {
    alert('Aucune date_sortie sur cette ligne.');
    return;
  }

  row.date_rentree = new Date().toISOString().split('T')[0];
  render();
  await saveRow(index);
}

function pickRowFields(row) {
  const out = {};
  COLUMNS.forEach((col) => {
    out[col] = row[col] || '';
  });
  return out;
}

function renderResumeS13() {
  const tbody = document.querySelector('#s13Table tbody');
  tbody.innerHTML = '';

  const territoires = toTerritoires(sheetRows);

  territoires.forEach((t) => {
    const dernier = t.historique[t.historique.length - 1] || { date_rentree: '', personne: '' };
    const statut = dernier.date_rentree ? 'Disponible' : 'En cours';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.id}</td>
      <td>${t.zone}</td>
      <td>${t.historique.length}</td>
      <td>${dernier.personne || ''}</td>
      <td>${statut}</td>
      <td><button onclick="telechargerS13('${t.id}')">Télécharger S-13 PDF</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function toTerritoires(rows) {
  const byId = new Map();

  rows.forEach((row) => {
    if (!row.id) return;

    if (!byId.has(row.id)) {
      byId.set(row.id, {
        id: row.id,
        zone: row.zone,
        pdf: row.pdf,
        lien: row.lien,
        historique: []
      });
    }

    const h = {
      personne: row.personne,
      date_sortie: row.date_sortie,
      date_rentree: row.date_rentree
    };

    if (h.personne || h.date_sortie || h.date_rentree) {
      byId.get(row.id).historique.push(h);
    }
  });

  return [...byId.values()].map((t) => {
    if (!t.historique.length) {
      t.historique.push({ personne: '', date_sortie: '', date_rentree: '' });
    }
    t.historique.sort((a, b) => (a.date_sortie || '').localeCompare(b.date_sortie || ''));
    return t;
  });
}

function telechargerS13(id) {
  const territoire = toTerritoires(sheetRows).find((t) => t.id === id);
  if (!territoire) return;

  const lignes = territoire.historique.map((h) => `
    <tr>
      <td>${h.personne || ''}</td>
      <td>${h.date_sortie || ''}</td>
      <td>${h.date_rentree || ''}</td>
      <td>${h.date_rentree ? 'Terminé' : 'En cours'}</td>
    </tr>
  `).join('');

  const html = `
    <html>
      <head>
        <title>S-13 ${territoire.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { margin-bottom: 4px; }
          .meta { margin-bottom: 16px; color: #444; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #999; padding: 8px; text-align: left; }
          th { background: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Résumé S-13</h1>
        <div class="meta">Territoire: <strong>${territoire.id}</strong> — ${territoire.zone || ''}</div>
        <div class="meta">Généré le ${new Date().toLocaleDateString('fr-FR')}</div>
        <table>
          <thead>
            <tr><th>Personne</th><th>Date sortie</th><th>Date rentrée</th><th>Statut</th></tr>
          </thead>
          <tbody>${lignes}</tbody>
        </table>
      </body>
    </html>
  `;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Autorise les popups pour générer le PDF S-13.');
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

window.ajouterLigne = ajouterLigne;
window.saveRow = saveRow;
window.sortieDepuisLigne = sortieDepuisLigne;
window.rentreeDepuisLigne = rentreeDepuisLigne;
window.telechargerS13 = telechargerS13;
