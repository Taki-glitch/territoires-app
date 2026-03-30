import { loadRows, toTerritoires } from './data-service.js';

init();

async function init() {
  const tbody = document.querySelector('#overdueTable tbody');

  try {
    const rows = await loadRows();
    const territoires = toTerritoires(rows);
    const overdue = computeOverdue(territoires, 4);

    renderStats(territoires, overdue);
    tbody.innerHTML = '';

    overdue.forEach((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.id}</td>
        <td>${item.zone || ''}</td>
        <td>${item.personne || ''}</td>
        <td>${item.date_sortie || ''}</td>
        <td>${item.days} jours</td>
      `;
      tbody.appendChild(tr);
    });

    if (!overdue.length) {
      tbody.innerHTML = '<tr><td colspan="5">Aucun territoire sorti depuis plus de 4 mois ✅</td></tr>';
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5">Erreur: ${error.message}</td></tr>`;
  }
}

function computeOverdue(territoires, months) {
  const thresholdDays = months * 30;
  const today = new Date();

  return territoires
    .map((t) => {
      const last = t.historique[t.historique.length - 1] || {};
      if (!last.date_sortie || last.date_rentree) return null;

      const sortieDate = new Date(last.date_sortie);
      if (Number.isNaN(sortieDate.getTime())) return null;

      const days = Math.floor((today - sortieDate) / (1000 * 60 * 60 * 24));
      if (days <= thresholdDays) return null;

      return {
        id: t.id,
        zone: t.zone,
        personne: last.personne,
        date_sortie: last.date_sortie,
        days
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.days - a.days);
}

function renderStats(territoires, overdue) {
  const avg = overdue.length
    ? Math.round(overdue.reduce((sum, t) => sum + t.days, 0) / overdue.length)
    : 0;

  document.getElementById('stat-total').textContent = String(territoires.length);
  document.getElementById('stat-overdue').textContent = String(overdue.length);
  document.getElementById('stat-avg').textContent = `${avg} jours`;
}
