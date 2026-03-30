# territoires-app

Application web de gestion des territoires connectée à Google Sheets.

## Base de données Google Sheet

Feuille utilisée :
`https://docs.google.com/spreadsheets/d/1hlMhtRHQh_Lel95LXjYP7dReuma_Q4ikc-6fHgCgwwI/edit?usp=sharing`

### Onglet attendu

Nom d’onglet : `territoires`

Colonnes (ligne 1) :

- `id`
- `zone`
- `pdf`
- `lien`
- `personne`
- `date_sortie`
- `date_rentree`

Chaque ligne représente un passage (historique).

## Fonctionnement

- L’application lit les données depuis Google Sheets (API GViz en lecture).
- Les boutons **Sortie/Rentrée** mettent à jour l’interface immédiatement.
- Pour enregistrer réellement dans Google Sheets, il faut configurer un Web App Apps Script.

## Activer l’écriture dans Google Sheets (recommandé)

1. Ouvre ton tableur Google.
2. Va dans **Extensions > Apps Script**.
3. Copie le contenu de `google-apps-script/Code.gs`.
4. Déploie en **Web app** :
   - Exécuter en tant que : toi.
   - Accès : toute personne ayant le lien (ou selon ton besoin).
5. Copie l’URL du Web App.
6. Dans `script.js`, renseigne `APPS_SCRIPT_WEBAPP_URL`.

Ensuite, les actions Sortie/Rentrée seront aussi persistées dans le tableur.

## Déploiement GitHub Pages

Le workflow `.github/workflows/deploy.yml` déploie automatiquement le site sur GitHub Pages à chaque push sur `main`.

## Vérification locale

```bash
npm install
npm run check:data
```

Puis ouvre `index.html`.
