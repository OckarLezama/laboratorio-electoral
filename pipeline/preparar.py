"""Paso 1. Extrae de las bases crudas los insumos de un estado.

Genera en <temporal>/<clave>/:
  FED_PRE_<año>.csv, FED_SEN_<año>.csv, FED_DIP_<año>.csv   (filtrados del archivo nacional)
  LOC_GUBERNATURA_<año>.csv, LOC_DIPUTACIONES_LOC_MR_<año>.csv, LOC_AYUNTAMIENTOS_<año>.csv
  PADRON.csv                                                 (padrón y lista nominal por sección)
  conteos.json                                               (conteos censales por sección y edad)
  bgd/                                                       (capas de la Base Geográfica Digital)

uso: python pipeline/lab.py preparar chis
"""
import csv
import glob
import io
import json
import os
import re
import shutil
import tempfile
import zipfile

from comun import CFG, ruta, temporal

FED = [('PRESIDENCIA', 'FED_PRE'), ('SENADURIAS_MR', 'FED_SEN'), ('DIPUTACIONES_FED_MR', 'FED_DIP')]
LOC = {'GUBERNATURA': 'LOC_GUBERNATURA', 'DIPUTACIONES_LOC_MR': 'LOC_DIPUTACIONES_LOC_MR', 'AYUNTAMIENTOS': 'LOC_AYUNTAMIENTOS'}
# nombres de carpeta equivalentes (Ciudad de México usa jefatura de gobierno y alcaldías)
LOC_ALIAS = {'GUBERNATURA': ('GUBERNATURA', 'JEFATURA_GOBIERNO'), 'DIPUTACIONES_LOC_MR': ('DIPUTACIONES_LOC_MR',), 'AYUNTAMIENTOS': ('AYUNTAMIENTOS', 'ALCALDIAS', 'JEFE_DELEGACIONAL')}


def _sec(d, carpetas):
    """Archivo *_SEC.csv de la primera carpeta que exista (sin distinguir mayúsculas en la extensión)."""
    for c in carpetas:
        fs = [f for f in glob.glob(f'{d}/{c}/*') if f.upper().endswith('_SEC.CSV') and 'EXT' not in os.path.basename(f).upper()]
        if fs:
            return sorted(fs)
    return []
CAPAS = ('SECCION', 'MUNICIPIO', 'DISTRITO_LOCAL', 'DISTRITO_FEDERAL', 'ENTIDAD')


def _filtrar(src, dst, ent, key='ID_ESTADO'):
    n = 0
    with open(src, encoding='utf-8-sig', errors='ignore') as f, open(dst, 'w', encoding='utf-8', newline='') as g:
        r = csv.reader(f); h = next(r); w = csv.writer(g); w.writerow(h); k = h.index(key)
        for row in r:
            try:
                if int(float(row[k])) == ent:
                    w.writerow(row); n += 1
            except (ValueError, IndexError):
                pass
    return n


def resultados(e, out):
    ent, amin = e['ent'], CFG.get('anio_minimo', 2015)
    for f in glob.glob(str(out / 'FED_*.csv')) + glob.glob(str(out / 'LOC_*.csv')):
        try:
            os.remove(f)          # limpia corridas anteriores
        except OSError:
            pass
    for cargo, tag in FED:
        for d in sorted(glob.glob(str(ruta('federal') / cargo / '*'))):
            y = os.path.basename(d)
            if not y.isdigit() or int(y) < amin:
                continue
            fs = [f for f in glob.glob(d + '/*') if f.upper().endswith('NAL_SEC.CSV') and 'EXT' not in os.path.basename(f).upper()]
            if fs:
                print(f'  {tag} {y}: {_filtrar(fs[0], out / f"{tag}_{y}.csv", ent):,} filas')
    for d in sorted(glob.glob(str(ruta('local') / e['carpeta_local'] / '*'))):
        for cargo, tag in LOC.items():
            fs = _sec(d, LOC_ALIAS[cargo])
            if fs:
                y = re.match(r'(\d{4})', os.path.basename(fs[0])).group(1)
                if int(y) < amin:
                    continue
                shutil.copyfile(fs[0], out / f'{tag}_{y}.csv'); print(f'  {tag} {y}: copiado')


def padron(e, out):
    import openpyxl
    wb = openpyxl.load_workbook(ruta('padron'), read_only=True)
    it = wb.worksheets[0].iter_rows(values_only=True); h = None
    limpia = lambda c: str(c).replace('\n', ' ').strip() if c is not None else ''
    for row in it:
        if row and 'SECCION' in [limpia(c) for c in row]:
            h = [limpia(c) for c in row]; break
    k = h.index('CLAVE ENTIDAD'); n = 0
    with open(out / 'PADRON.csv', 'w', newline='', encoding='utf-8') as g:
        w = csv.writer(g); w.writerow(h)
        for row in it:
            try:
                if int(row[k]) == e['ent']:
                    w.writerow(row); n += 1
            except (TypeError, ValueError):
                pass
    print(f'  padrón: {n:,} filas')


def conteos(e, out):
    grupo = lambda a: 0 if a < 25 else 1 if a < 30 else 2 if a < 40 else 3 if a < 50 else 4 if a < 60 else 5 if a < 65 else 6
    res = {}
    for z in sorted(glob.glob(str(ruta('conteos') / 'DatosAbiertos_DECEyEC_ConteosCensales*.zip'))):
        y = re.search(r'(\d{4})', os.path.basename(z)).group(1)
        if int(y) < CFG.get('conteos_desde', 2018):
            continue
        zf = zipfile.ZipFile(z)
        m = [i.filename for i in zf.infolist() if re.search(rf'(^|[/_]){e["conteos"]}\.csv$', i.filename.lower())]
        if not m:
            print(f'  conteos {y}: sin archivo para {e["conteos"]}'); continue
        d = {}
        with zf.open(m[0]) as f:
            for x in csv.DictReader(io.TextIOWrapper(f, encoding='utf-8-sig', errors='ignore')):
                try:
                    s = int(x['SECCION']); a = int(x['EDAD']); ln = int(x['LN'] or 0); sv = int(x['SV'] or 0)
                except (ValueError, KeyError, TypeError):
                    continue
                v = d.setdefault(s, [0] * 14); g = grupo(a); v[g] += ln; v[7 + g] += sv
        res[y] = {str(k): v for k, v in d.items()}; print(f'  conteos {y}: {len(d):,} secciones')
    (out / 'conteos.json').write_text(json.dumps(res, separators=(',', ':')), encoding='utf-8')


def cartografia(e, out):
    """Extrae del ZIP de la BGD (que trae un .7z por estado) solo las capas necesarias."""
    import py7zr
    z = ruta('bgd') / f'bgd_{e["ent"]}_Shapefile.zip'
    dst = out / 'bgd'
    shutil.rmtree(dst, ignore_errors=True); dst.mkdir(exist_ok=True)
    with zipfile.ZipFile(z) as zf:
        siete = [n for n in zf.namelist() if n.lower().endswith('.7z')]
        if siete:
            with tempfile.TemporaryDirectory() as tmp:     # el .7z completo no se queda en disco
                zf.extract(siete[0], tmp)
                with py7zr.SevenZipFile(os.path.join(tmp, siete[0])) as a:
                    nn = [n for n in a.getnames() if os.path.basename(n).split('.')[0].upper() in CAPAS]
                    a.extract(path=dst, targets=nn)
        else:   # ZIP con los shapefiles directos
            for n in zf.namelist():
                if os.path.basename(n).split('.')[0].upper() in CAPAS:
                    zf.extract(n, dst)
    shp = glob.glob(str(dst / '**' / 'SECCION.shp'), recursive=True)
    if not shp:
        raise SystemExit(f'No encontré SECCION.shp dentro de {z}')
    print(f'  cartografía: {os.path.dirname(shp[0])}')


def preparar(e):
    out = temporal(e)
    print(f'[1/2] Preparando {e["nombre"]} en {out}')
    resultados(e, out); padron(e, out); conteos(e, out); cartografia(e, out)
