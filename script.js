let territoires = [];

fetch('data.json')
  .then((res) => {
    if (!res.ok) {
      throw new Error(`Impossible de charger data.json (${res.status})`);
    }
    return res.json();
  })
  .then((data) => {
    territoires = data;
    afficherTerritoires();
  })
  .catch((error) => {
    const tbody = document.querySelector('#territoiresTable tbody');
    tbody.innerHTML = `<tr><td colspan="9">Erreur de chargement: ${error.message}</td></tr>`;
  });

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

function sortie(id) {
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
}

function rentree(id) {
  const date = new Date().toISOString().split('T')[0];
  const territoire = territoires.find((t) => t.id === id);
  const dernier = territoire.historique[territoire.historique.length - 1];

  if (!dernier || dernier.date_rentree) {
    alert('Pas de sortie en cours !');
    return;
  }

  dernier.date_rentree = date;
  afficherTerritoires();
}
