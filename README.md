# territoires-app

Site web connecté à Google Sheets avec **2 pages** :

1. **Gestion tableur** (`index.html`) : importer les données du Google Sheet et modifier les lignes.
2. **S-13 PDF** (`s13.html`) : générer et télécharger les fiches S-13 en PDF.

## 1) Base de données Google Sheet

Google Sheet source :
`https://docs.google.com/spreadsheets/d/1hlMhtRHQh_Lel95LXjYP7dReuma_Q4ikc-6fHgCgwwI/edit?usp=sharing`

Onglet attendu : `territoires`

Colonnes obligatoires :

- `id`
- `zone`
- `pdf`
- `lien`
- `personne`
- `date_sortie`
- `date_rentree`

## 2) Import + modification synchronisée vers le tableur

La lecture des données fonctionne de 2 façons :

- **Sans Apps Script** : lecture GViz (lecture seule).
- **Avec Apps Script** : lecture + écriture (recommandé).

### Activer la synchro bidirectionnelle (lecture/écriture)

1. Ouvre ton Google Sheet.
2. Va dans **Extensions > Apps Script**.
3. Copie le fichier `google-apps-script/Code.gs`.
4. Déploie en **Web App**.
5. Copie l’URL du Web App.
6. Mets cette URL dans `js/config.js` dans `APPS_SCRIPT_WEBAPP_URL`.

Quand `APPS_SCRIPT_WEBAPP_URL` est renseignée :

- le site importe les lignes depuis le tableur,
- chaque clic sur **Sauvegarder** met à jour le tableur Google Sheet.

## 3) Page S-13 PDF

La page `s13.html` affiche les territoires et propose **Télécharger PDF**.

Le PDF est généré au format imprimable depuis le navigateur (popup d’impression).

## 4) Menu du site

- `Gestion tableur` -> `index.html`
- `S-13 PDF` -> `s13.html`

## 5) Déploiement GitHub Pages

Le workflow `.github/workflows/deploy.yml` publie automatiquement sur GitHub Pages à chaque push sur `main`.

## 6) Vérification locale

```bash
npm install
npm run check:data
```

Puis ouvre `index.html` ou `s13.html`.
