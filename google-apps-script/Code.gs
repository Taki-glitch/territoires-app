/**
 * Déploie ce script en Web App pour permettre à l'app web
 * d'écrire dans ton Google Sheet "territoires".
 */
const SHEET_NAME = 'territoires';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    if (!sheet) {
      return jsonResponse({ ok: false, error: `Onglet ${SHEET_NAME} introuvable` }, 404);
    }

    const values = sheet.getDataRange().getValues();
    const headers = values[0].map((h) => String(h).trim());
    const idx = mapHeaders(headers);

    if (payload.action === 'sortie') {
      sheet.appendRow([
        payload.id || '',
        findLastValue(values, idx.id, payload.id, idx.zone) || '',
        findLastValue(values, idx.id, payload.id, idx.pdf) || '',
        findLastValue(values, idx.id, payload.id, idx.lien) || '',
        payload.personne || '',
        payload.date_sortie || '',
        ''
      ]);
      return jsonResponse({ ok: true, action: 'sortie' });
    }

    if (payload.action === 'rentree') {
      for (let r = values.length; r >= 2; r--) {
        const row = values[r - 1];
        if (
          String(row[idx.id] || '').trim() === String(payload.id || '').trim() &&
          !String(row[idx.date_rentree] || '').trim()
        ) {
          sheet.getRange(r, idx.date_rentree + 1).setValue(payload.date_rentree || '');
          return jsonResponse({ ok: true, action: 'rentree' });
        }
      }
      return jsonResponse({ ok: false, error: 'Aucune sortie en cours trouvée' }, 404);
    }

    return jsonResponse({ ok: false, error: 'Action inconnue' }, 400);
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message }, 500);
  }
}

function mapHeaders(headers) {
  const map = {};
  ['id', 'zone', 'pdf', 'lien', 'personne', 'date_sortie', 'date_rentree'].forEach((name) => {
    map[name] = headers.indexOf(name);
  });

  Object.keys(map).forEach((k) => {
    if (map[k] === -1) {
      throw new Error(`Colonne obligatoire manquante: ${k}`);
    }
  });

  return map;
}

function findLastValue(values, idIndex, id, targetIndex) {
  for (let r = values.length - 1; r >= 1; r--) {
    if (String(values[r][idIndex] || '').trim() === String(id || '').trim()) {
      return values[r][targetIndex] || '';
    }
  }
  return '';
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
