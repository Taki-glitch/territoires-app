# territoires-app

Application web connectée à Google Sheets pour gérer les territoires, compléter les informations type **S-13** et générer un **PDF récapitulatif** par territoire.

## 1) Objectif

- Avoir une interface web qui ressemble à un tableur (édition ligne par ligne).
- Utiliser Google Sheets comme base de données.
- Générer un résumé S-13 imprimable en PDF.

## 2) Feuille Google attendue

Lien utilisé :
`https://docs.google.com/spreadsheets/d/1hlMhtRHQh_Lel95LXjYP7dReuma_Q4ikc-6fHgCgwwI/edit?usp=sharing`

Nom de l’onglet : `territoires`

Colonnes obligatoires (ligne d’en-tête) :

- `id`
- `zone`
- `pdf`
- `lien`
- `personne`
- `date_sortie`
- `date_rentree`

## 3) Connexion Google Sheets

### Lecture seule (sans Apps Script)

- L’app lit le Google Sheet via l’API GViz.
- Tu visualises les lignes dans la vue tableur.
- Les modifications ne sont pas persistées côté Google Sheet.

### Lecture + écriture (recommandé)

1. Ouvre ton Google Sheet.
2. Va dans **Extensions > Apps Script**.
3. Copie `google-apps-script/Code.gs`.
4. Déploie en **Web App**.
5. Copie l’URL de déploiement.
6. Dans `script.js`, renseigne `APPS_SCRIPT_WEBAPP_URL`.

Avec cette config, les boutons **Sauvegarder / Sortie / Rentrée** écrivent directement dans le sheet.

## 4) Générer les PDF S-13

Dans la section **Résumé S-13 par territoire** :

1. Clique **Télécharger S-13 PDF** sur le territoire voulu.
2. Une vue imprimable s’ouvre.
3. Choisis **Imprimer > Enregistrer en PDF**.

## 5) Déploiement GitHub Pages

Le workflow `.github/workflows/deploy.yml` déploie automatiquement le site sur GitHub Pages à chaque push sur `main`.

## 6) Vérification locale

```bash
npm install
npm run check:data
```

Puis ouvre `index.html`.
