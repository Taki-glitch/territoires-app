/**
 * Apps Script pour gérer l'app web "territoires" depuis Google Sheets.
 * - doGet?action=list : renvoie toutes les lignes
 * - doPost action=upsert : ajoute/met à jour une ligne
 */
const SHEET_NAME = 'territoires';
const REQUIRED_HEADERS = ['id', 'zone', 'pdf', 'lien', 'personne', 'date_sortie', 'date_rentree'];

function doGet(e) {
  try {
    const action = (e.parameter.action || 'list').toLowerCase();
    if (action !== 'list') {
      return jsonResponse({ ok: false, error: 'Action GET inconnue' });
    }

    const sheet = getSheet();
    const values = sheet.getDataRange().getValues();
    if (!values.length) {
      return jsonResponse({ ok: true, rows: [] });
    }

    const headers = values[0].map((h) => String(h).trim());
    const idx = mapHeaders(headers);

    const rows = [];
    for (let r = 1; r < values.length; r++) {
      const line = values[r];
      const rowObj = { __rowNumber: r + 1 };
      REQUIRED_HEADERS.forEach((h) => {
        rowObj[h] = String(line[idx[h]] || '').trim();
      });
      rows.push(rowObj);
    }

    return jsonResponse({ ok: true, rows });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const action = String(payload.action || '').toLowerCase();

    if (action !== 'upsert') {
      return jsonResponse({ ok: false, error: 'Action POST inconnue' });
    }

    const sheet = getSheet();
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map((h) => String(h).trim());
    const idx = mapHeaders(headers);

    const row = payload.row || {};
    const rowValues = REQUIRED_HEADERS.map((h) => String(row[h] || '').trim());

    if (!rowValues[0]) {
      return jsonResponse({ ok: false, error: 'id obligatoire' });
    }

    const rowNumber = Number(payload.rowNumber || 0);
    if (rowNumber >= 2) {
      sheet.getRange(rowNumber, 1, 1, headers.length).setValues([fullRow(headers, idx, rowValues)]);
      return jsonResponse({ ok: true, rowNumber });
    }

    sheet.appendRow(fullRow(headers, idx, rowValues));
    return jsonResponse({ ok: true, rowNumber: sheet.getLastRow() });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function getSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error(`Onglet '${SHEET_NAME}' introuvable`);
  }
  return sheet;
}

function mapHeaders(headers) {
  const idx = {};
  REQUIRED_HEADERS.forEach((h) => {
    idx[h] = headers.indexOf(h);
    if (idx[h] === -1) {
      throw new Error(`Colonne obligatoire manquante: ${h}`);
    }
  });
  return idx;
}

function fullRow(headers, idx, values) {
  const out = new Array(headers.length).fill('');
  REQUIRED_HEADERS.forEach((h, i) => {
    out[idx[h]] = values[i];
  });
  return out;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
