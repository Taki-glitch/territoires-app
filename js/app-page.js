import { COLUMNS } from './config.js';
import { loadRows, normalizeRow, upsertRow } from './data-service.js';

let sheetRows = [];

init();

async function init() {
  try {
    sheetRows = await loadRows();
    renderTable();
  } catch (error) {
    renderError(error.message);
  }
}

function renderError(message) {
  const tbody = document.querySelector('#sheetTable tbody');
  tbody.innerHTML = `<tr><td colspan="9">Erreur: ${message}</td></tr>`;
}

function renderTable() {
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
      input.addEventListener('input', onInput);
      input.addEventListener('blur', onBlurSave);
      td.appendChild(input);
      tr.appendChild(td);
    });

    const statusTd = document.createElement('td');
    statusTd.id = `save-status-${rowIndex}`;
    statusTd.textContent = '—';
    tr.appendChild(statusTd);

    tbody.appendChild(tr);
  });
}

function onInput(e) {
  const rowIndex = Number(e.target.dataset.rowIndex);
  const col = e.target.dataset.col;
  sheetRows[rowIndex][col] = e.target.value.trim();
  setStatus(rowIndex, 'Modifié…');
}

async function onBlurSave(e) {
  const rowIndex = Number(e.target.dataset.rowIndex);
  await saveRow(rowIndex);
}

function addRow() {
  sheetRows.push(normalizeRow({}));
  renderTable();
}

async function saveRow(rowIndex) {
  const row = sheetRows[rowIndex];

  if (!row?.id) {
    setStatus(rowIndex, 'ID requis');
    return;
  }

  try {
    setStatus(rowIndex, 'Sauvegarde…');
    const rowNumber = await upsertRow(row);
    row.__rowNumber = rowNumber || row.__rowNumber;
    setStatus(rowIndex, '✅ Enregistré');
  } catch (error) {
    setStatus(rowIndex, `❌ ${error.message}`);
  }
}

function setStatus(rowIndex, text) {
  const cell = document.getElementById(`save-status-${rowIndex}`);
  if (cell) cell.textContent = text;
}

window.addRow = addRow;
