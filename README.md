# territoires-app

Version complète prête à copier/coller pour :

1. **gérer les territoires** dans une page web statique,
2. **générer automatiquement `data.json` depuis un fichier Excel**,
3. **publier automatiquement le projet sur GitHub Pages**.

---

## 1) Structure attendue du fichier Excel

Place ton fichier ici : `data/territoires.xlsx`

Un exemple de contenu est disponible dans `data/territoires-template.csv` (à ouvrir dans Excel puis enregistrer en `.xlsx`).

Premier onglet, avec ces colonnes :

- `id`
- `zone`
- `pdf`
- `lien`
- `personne`
- `date_sortie` (format conseillé `YYYY-MM-DD`)
- `date_rentree` (vide si la sortie est en cours)

> Chaque ligne = un passage (historique) pour un territoire.

Exemple logique :

- `T01` / `Nantes Nord` / `T01.pdf` / `https://...` / `Jean Dupont` / `2026-03-01` / `2026-03-05`
- `T01` / `Nantes Nord` / `T01.pdf` / `https://...` / `Marie Martin` / `2026-03-10` / ``

---

## 2) Lancer en local

```bash
npm install
npm run export:excel
npm run check:data
```

Puis ouvre `index.html` dans ton navigateur.

---

## 3) Mise en ligne automatique sur GitHub

### Étapes (une seule fois)

1. Crée un repo GitHub et pousse ce projet sur la branche `main`.
2. Dans GitHub > **Settings > Pages** :
   - Source : **GitHub Actions**.
3. Ajoute ton fichier `data/territoires.xlsx` dans le repo.

### Ce qui se passe ensuite

À chaque `git push` sur `main`, le workflow `.github/workflows/deploy.yml` va :

1. installer les dépendances,
2. convertir Excel -> `data.json`,
3. valider `data.json`,
4. committer automatiquement `data.json` si modifié,
5. déployer le site sur GitHub Pages.

Ton app sera accessible via l'URL Pages du repo.

---

## 4) Commandes utiles

- Export manuel JSON :
  ```bash
  npm run export:excel
  ```
- Validation du JSON :
  ```bash
  npm run check:data
  ```
- Export avec chemins personnalisés :
  ```bash
  python3 scripts/excel_to_json.py --input data/territoires.xlsx --output data.json
  ```

---

## 5) Notes

- Les boutons **Sortie / Rentrée** dans l'interface modifient les données **en mémoire navigateur uniquement** (pas de sauvegarde disque automatique côté front).
- La source officielle pour GitHub reste ton fichier Excel, converti par script/workflow.
