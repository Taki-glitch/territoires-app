import { loadRows, toTerritoires } from './data-service.js';

let territoires = [];

init();

async function init() {
  try {
    const rows = await loadRows();
    territoires = toTerritoires(rows);
    renderCards();
  } catch (error) {
    document.getElementById('s13Container').innerHTML = `<p>Erreur: ${error.message}</p>`;
  }
}

function renderCards() {
  const container = document.getElementById('s13Container');
  container.innerHTML = '';

  territoires.forEach((t) => {
    const lines = t.historique.map((h, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${h.personne || ''}</td>
        <td>${h.date_sortie || ''}</td>
        <td>${h.date_rentree || ''}</td>
        <td>${h.date_rentree ? 'Terminé' : 'En cours'}</td>
      </tr>
    `).join('');

    const card = document.createElement('article');
    card.className = 's13-card';
    card.innerHTML = `
      <div class="s13-head">
        <div>
          <h3>Fiche S-13 — ${t.id}</h3>
          <p>Zone: ${t.zone || ''}</p>
        </div>
        <button onclick="printOne('${t.id}')">Imprimer PDF</button>
      </div>
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
        <tbody>${lines}</tbody>
      </table>
    `;

    container.appendChild(card);
  });
}

function printOne(id) {
  const card = [...document.querySelectorAll('.s13-card')].find((el) => el.querySelector('h3')?.textContent.includes(id));
  if (!card) return;
  openPrintWindow(card.outerHTML, `S-13 ${id}`);
}

function printAll() {
  const html = [...document.querySelectorAll('.s13-card')].map((el) => el.outerHTML).join('<div style="page-break-after:always"></div>');
  openPrintWindow(html, 'Toutes les fiches S-13');
}

function openPrintWindow(content, title) {
  const w = window.open('', '_blank');
  if (!w) {
    alert('Veuillez autoriser les popups pour imprimer.');
    return;
  }

  w.document.open();
  w.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .s13-card { border: 1px solid #999; padding: 14px; margin-bottom: 20px; }
          .s13-head { display:flex; justify-content:space-between; align-items:center; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #777; padding: 8px; text-align: left; }
          th { background: #efefef; }
          button { display: none; }
        </style>
      </head>
      <body>${content}</body>
    </html>
  `);
  w.document.close();
  w.focus();
  w.print();
}

window.printOne = printOne;
window.printAll = printAll;
