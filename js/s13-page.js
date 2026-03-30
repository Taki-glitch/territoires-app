import { loadRows, toTerritoires } from './data-service.js';

init();

async function init() {
  const tbody = document.querySelector('#s13Table tbody');

  try {
    const rows = await loadRows();
    const territoires = toTerritoires(rows);
    tbody.innerHTML = '';

    territoires.forEach((t) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.id}</td>
        <td>${t.zone || ''}</td>
        <td>${t.historique.length}</td>
        <td><button onclick="downloadS13('${t.id}')">Télécharger PDF</button></td>
      `;
      tbody.appendChild(tr);
    });

    window.__territoires = territoires;
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="4">Erreur de chargement: ${error.message}</td></tr>`;
  }
}

function downloadS13(id) {
  const territoire = (window.__territoires || []).find((t) => t.id === id);
  if (!territoire) return;

  const rowsHtml = territoire.historique.map((h, i) => `
    <tr>
      <td>${i + 1}</td>
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
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { margin-bottom: 6px; }
        .meta { margin: 3px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #777; padding: 8px; text-align: left; }
        th { background: #efefef; }
      </style>
    </head>
    <body>
      <h1>Fiche S-13</h1>
      <div class="meta"><strong>Territoire:</strong> ${territoire.id}</div>
      <div class="meta"><strong>Zone:</strong> ${territoire.zone || ''}</div>
      <div class="meta"><strong>Date génération:</strong> ${new Date().toLocaleDateString('fr-FR')}</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Personne</th>
            <th>Date sortie</th>
            <th>Date rentrée</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
  </html>`;

  const w = window.open('', '_blank');
  if (!w) {
    alert('Veuillez autoriser les popups pour exporter le PDF.');
    return;
  }

  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

window.downloadS13 = downloadS13;
