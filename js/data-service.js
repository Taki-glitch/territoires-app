import { APPS_SCRIPT_WEBAPP_URL, COLUMNS, GOOGLE_SHEET_URL, SHEET_NAME } from './config.js';

const SHEET_ID = GOOGLE_SHEET_URL.split('/d/')[1]?.split('/')[0];

export function normalizeRow(row) {
  const base = { __rowNumber: row.__rowNumber ? Number(row.__rowNumber) : null };
  COLUMNS.forEach((col) => {
    base[col] = (row[col] || '').toString().trim();
  });
  return base;
}

export async function loadRows() {
  if (APPS_SCRIPT_WEBAPP_URL) {
    try {
      return await loadRowsFromAppsScript();
    } catch (error) {
      console.warn('Apps Script indisponible, fallback GViz:', error.message);
    }
  }

  try {
    return await loadRowsFromGviz();
  } catch (error) {
    console.warn('GViz indisponible, fallback CSV:', error.message);
    return loadRowsFromCsvExport();
  }
}

async function loadRowsFromAppsScript() {
  const res = await fetch(`${APPS_SCRIPT_WEBAPP_URL}?action=list`);
  if (!res.ok) throw new Error(`Apps Script indisponible (${res.status})`);
  const data = await res.json();
  if (!data.ok || !Array.isArray(data.rows)) throw new Error(data.error || 'Réponse Apps Script invalide');
  return data.rows.map(normalizeRow);
}

async function loadRowsFromGviz() {
  if (!SHEET_ID) throw new Error('ID du Google Sheet introuvable');

  const sheetQuery = SHEET_NAME ? `&sheet=${encodeURIComponent(SHEET_NAME)}` : '';
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json${sheetQuery}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Lecture GViz impossible (${res.status})`);

  const text = await res.text();
  const jsonText = text.match(/google\.visualization\.Query\.setResponse\((.*)\);?$/s)?.[1];
  if (!jsonText) throw new Error('Format GViz non reconnu');

  const payload = JSON.parse(jsonText);
  const table = payload?.table;
  if (!table?.cols || !table?.rows) throw new Error('Structure de table invalide');

  const headers = table.cols.map((c) => (c.label || c.id || '').trim());

  return table.rows
    .map((r) => {
      const obj = {};
      r.c.forEach((cell, idx) => {
        obj[headers[idx]] = (cell?.f ?? cell?.v ?? '').toString().trim();
      });
      return normalizeRow(obj);
    })
    .filter((row) => row.id || row.zone || row.personne);
}

async function loadRowsFromCsvExport() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Lecture CSV impossible (${res.status})`);

  const csv = await res.text();
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (values[i] || '').trim();
    });
    return normalizeRow(obj);
  }).filter((row) => row.id || row.zone || row.personne);
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export async function upsertRow(row) {
  if (!APPS_SCRIPT_WEBAPP_URL) {
    throw new Error('APPS_SCRIPT_WEBAPP_URL non configurée. Mode lecture seule.');
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
  if (!res.ok || !out.ok) throw new Error(out.error || `HTTP ${res.status}`);

  return out.rowNumber;
}

export function pickRowFields(row) {
  const out = {};
  COLUMNS.forEach((col) => {
    out[col] = row[col] || '';
  });
  return out;
}

export function toTerritoires(rows) {
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
    t.historique.sort((a, b) => (a.date_sortie || '').localeCompare(b.date_sortie || ''));
    return t;
  });
}
