#!/usr/bin/env python3
import argparse
import datetime as dt
import json
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {
    'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
    'rel': 'http://schemas.openxmlformats.org/package/2006/relationships'
}

REQUIRED_COLUMNS = ['id', 'zone', 'pdf', 'lien']


def col_letters(cell_ref: str) -> str:
    letters = []
    for ch in cell_ref:
        if ch.isalpha():
            letters.append(ch)
        else:
            break
    return ''.join(letters)


def load_shared_strings(zf: zipfile.ZipFile):
    try:
      data = zf.read('xl/sharedStrings.xml')
    except KeyError:
      return []

    root = ET.fromstring(data)
    out = []
    for si in root.findall('main:si', NS):
        parts = []
        for t in si.findall('.//main:t', NS):
            parts.append(t.text or '')
        out.append(''.join(parts))
    return out


def load_date_style_indexes(zf: zipfile.ZipFile):
    try:
        styles_xml = zf.read('xl/styles.xml')
    except KeyError:
        return set()

    root = ET.fromstring(styles_xml)
    date_numfmts = {14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47}

    numfmts = root.find('main:numFmts', NS)
    if numfmts is not None:
        for fmt in numfmts.findall('main:numFmt', NS):
            num_fmt_id = int(fmt.attrib.get('numFmtId', '0'))
            code = (fmt.attrib.get('formatCode') or '').lower()
            if any(token in code for token in ['yy', 'mm', 'dd', 'h', 's']):
                date_numfmts.add(num_fmt_id)

    date_styles = set()
    cellxfs = root.find('main:cellXfs', NS)
    if cellxfs is not None:
        for idx, xf in enumerate(cellxfs.findall('main:xf', NS)):
            if int(xf.attrib.get('numFmtId', '0')) in date_numfmts:
                date_styles.add(idx)

    return date_styles


def excel_serial_to_date(serial_value: float) -> str:
    base = dt.datetime(1899, 12, 30)
    date = base + dt.timedelta(days=serial_value)
    return date.strftime('%Y-%m-%d')


def read_cell_value(cell, shared_strings, date_styles):
    ctype = cell.attrib.get('t')
    style_idx = int(cell.attrib.get('s', '0'))
    v = cell.find('main:v', NS)
    if ctype == 'inlineStr':
        t = cell.find('.//main:t', NS)
        return (t.text or '').strip() if t is not None else ''
    if ctype == 's' and v is not None:
        index = int(float(v.text or 0))
        return str(shared_strings[index]).strip() if index < len(shared_strings) else ''
    if v is None:
        return ''

    raw = (v.text or '').strip()
    if raw == '':
        return ''

    if style_idx in date_styles:
        try:
            return excel_serial_to_date(float(raw))
        except ValueError:
            return raw

    return raw


def get_first_sheet_path(zf: zipfile.ZipFile):
    wb = ET.fromstring(zf.read('xl/workbook.xml'))
    sheets = wb.find('main:sheets', NS)
    if sheets is None or not list(sheets):
        raise ValueError('Aucun onglet trouvé dans le fichier Excel.')

    first_sheet = list(sheets)[0]
    rel_id = first_sheet.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
    rels = ET.fromstring(zf.read('xl/_rels/workbook.xml.rels'))
    for rel in rels.findall('rel:Relationship', NS):
        if rel.attrib.get('Id') == rel_id:
            target = rel.attrib.get('Target', '')
            return f"xl/{target}" if not target.startswith('xl/') else target

    raise ValueError('Impossible de résoudre le premier onglet.')


def parse_rows(input_path: Path):
    with zipfile.ZipFile(input_path, 'r') as zf:
        shared_strings = load_shared_strings(zf)
        date_styles = load_date_style_indexes(zf)
        sheet_path = get_first_sheet_path(zf)
        root = ET.fromstring(zf.read(sheet_path))

        data_rows = root.findall('.//main:sheetData/main:row', NS)
        if not data_rows:
            return []

        parsed = []
        headers = {}

        for idx, row in enumerate(data_rows):
            row_map = {}
            for cell in row.findall('main:c', NS):
                ref = cell.attrib.get('r', '')
                col = col_letters(ref)
                row_map[col] = read_cell_value(cell, shared_strings, date_styles)

            if idx == 0:
                headers = {k: (v or '').strip() for k, v in row_map.items()}
                continue

            item = {}
            for col, name in headers.items():
                if not name:
                    continue
                item[name] = (row_map.get(col) or '').strip()

            if any(str(v).strip() for v in item.values()):
                parsed.append(item)

        return parsed


def to_territoires(rows):
    if not rows:
        raise ValueError("L'onglet est vide.")

    missing = [c for c in REQUIRED_COLUMNS if c not in rows[0]]
    if missing:
        raise ValueError(
            'Colonnes manquantes: ' + ', '.join(missing) + '\n'
            'Colonnes attendues: id, zone, pdf, lien, personne, date_sortie, date_rentree'
        )

    by_id = {}
    for row in rows:
        tid = str(row.get('id', '')).strip()
        if not tid:
            continue

        if tid not in by_id:
            by_id[tid] = {
                'id': tid,
                'zone': str(row.get('zone', '')).strip(),
                'pdf': str(row.get('pdf', '')).strip(),
                'lien': str(row.get('lien', '')).strip(),
                'historique': []
            }

        h = {
            'personne': str(row.get('personne', '')).strip(),
            'date_sortie': str(row.get('date_sortie', '')).strip(),
            'date_rentree': str(row.get('date_rentree', '')).strip()
        }

        if any(h.values()):
            by_id[tid]['historique'].append(h)

    territoires = list(by_id.values())
    for territoire in territoires:
        if not territoire['historique']:
            territoire['historique'].append({'personne': '', 'date_sortie': '', 'date_rentree': ''})
        territoire['historique'].sort(key=lambda x: x.get('date_sortie', ''))

    return territoires


def main():
    parser = argparse.ArgumentParser(description='Convertit un fichier Excel en data.json')
    parser.add_argument('--input', default='data/territoires.xlsx')
    parser.add_argument('--output', default='data.json')
    args = parser.parse_args()

    in_path = Path(args.input).resolve()
    out_path = Path(args.output).resolve()

    if not in_path.exists():
        print(f'❌ Fichier Excel introuvable: {in_path}', file=sys.stderr)
        print('Ajoute ton fichier puis relance: npm run export:excel', file=sys.stderr)
        sys.exit(1)

    rows = parse_rows(in_path)
    territoires = to_territoires(rows)
    out_path.write_text(json.dumps(territoires, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    print(f'✅ JSON généré: {out_path}')
    print(f'✅ Territoires exportés: {len(territoires)}')


if __name__ == '__main__':
    main()
