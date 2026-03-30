# territoires-app

Site web connecté à Google Sheets avec **3 pages** :

1. **Accueil tableur** (`index.html`) : grand tableau modifiable (territoires + personnes) synchronisé avec Google Sheet.
2. **Sortis +4 mois** (`stats.html`) : liste des territoires sortis depuis plus de 4 mois + statistiques.
3. **S-13 imprimables** (`s13.html`) : fiches S-13 prêtes à imprimer / exporter en PDF.

## 1) Source de données Google Sheet

Google Sheet :
`https://docs.google.com/spreadsheets/d/1hlMhtRHQh_Lel95LXjYP7dReuma_Q4ikc-6fHgCgwwI/edit?usp=drivesdk`

Onglet requis : `territoires` (ou laisse vide dans config pour prendre le 1er onglet)

Colonnes obligatoires :
- `id`
- `zone`
- `pdf`
- `lien`
- `personne`
- `date_sortie`
- `date_rentree`

## 2) Synchronisation site <-> tableur

## Voir les données du tableur sur le site

Si tu veux **juste voir les données** sur le site, il suffit que le Google Sheet soit partagé en lecture (ou publié).
Le site tente automatiquement: Apps Script -> GViz -> CSV export.


### Lecture
- Sans Apps Script: lecture via GViz (lecture seule).
- Avec Apps Script: lecture via `doGet?action=list`.

### Écriture (modification directe du tableur)
1. Ouvrir **Extensions > Apps Script** dans le Google Sheet.
2. Copier `google-apps-script/Code.gs`.
3. Déployer en Web App.
4. Copier l'URL et la coller dans `js/config.js` (`APPS_SCRIPT_WEBAPP_URL`).

Ensuite, la page d’accueil enregistre les modifications directement dans le tableur (à la perte de focus d’une cellule).

## 3) Pages

### `index.html` — Accueil tableur
- Grand tableau éditable.
- Ajout de ligne.
- Statut de synchronisation par ligne (enregistré/erreur).

### `stats.html` — Territoires sortis > 4 mois
- KPI : total territoires, nombre sortis >4 mois, durée moyenne.
- Tableau des territoires concernés.

### `s13.html` — Fiches S-13
- Fiches mises en forme comme un tableau imprimable.
- Impression PDF unitaire ou globale.

## 4) Déploiement GitHub Pages

Workflow: `.github/workflows/deploy.yml` (déploiement auto sur push `main`).

## 5) Vérification locale

```bash
npm install
npm run check:data
```
