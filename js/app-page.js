import { COLUMNS } from './config.js';
import { loadRows, normalizeRow, toTerritoires, upsertRow } from './data-service.js';

let sheetRows = [];

init();

async function init() {
  try {
    sheetRows = await loadRows();
    render();
  } catch (error) {
    afficherErreur(error.message);
  }
}

function afficherErreur(message) {
  const tbody = document.querySelector('#sheetTable tbody');
  tbody.innerHTML = `<tr><td colspan="8">Erreur: ${message}</td></tr>`;
}

function render() {
  renderSheet();
  renderQuickSummary();
}

function renderSheet() {
  const tbody = document.querySelector('#sheetTable tbody');
  tbody.innerHTML = '';

  sheetRows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');

    COLUMNS.forEach((col) => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.value = row[col] || '';
      input.placeholder = col;
      input.dataset.rowIndex = String(rowIndex);
      input.dataset.col = col;
      input.addEventListener('input', handleInput);
      td.appendChild(input);
      tr.appendChild(td);
    });

    const actions = document.createElement('td');
    actions.innerHTML = `<button onclick="saveRow(${rowIndex})">Sauvegarder</button>`;
    tr.appendChild(actions);
    tbody.appendChild(tr);
  });
}

function renderQuickSummary() {
  const tbody = document.querySelector('#resumeTable tbody');
  tbody.innerHTML = '';

  const territoires = toTerritoires(sheetRows);
  territoires.forEach((t) => {
    const last = t.historique[t.historique.length - 1] || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.id}</td>
      <td>${t.zone || ''}</td>
      <td>${t.historique.length}</td>
      <td>${last.personne || ''}</td>
      <td>${last.date_rentree ? 'Disponible' : 'En cours'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function handleInput(e) {
  const rowIndex = Number(e.target.dataset.rowIndex);
  const col = e.target.dataset.col;
  sheetRows[rowIndex][col] = e.target.value.trim();
}

function addRow() {
  sheetRows.push(normalizeRow({}));
  render();
}

async function saveRow(rowIndex) {
  const row = sheetRows[rowIndex];
  if (!row.id) {
    alert('ID obligatoire');
    return;
  }

  try {
    const rowNumber = await upsertRow(row);
    row.__rowNumber = rowNumber || row.__rowNumber;
    renderQuickSummary();
    alert('Sauvegardé dans Google Sheet ✅');
  } catch (error) {
    alert(`Erreur de sauvegarde: ${error.message}`);
  }
}

window.saveRow = saveRow;
window.addRow = addRow;
