"""Paso 2b. Genera las bases adicionales registradas en pipeline/capas.json para un estado.

Cada base se une a las secciones del estado:
  nivel "seccion":   por número de sección (columna_clave = columna con el número de sección)
  nivel "municipio": por nombre de municipio (cada sección toma el valor de su municipio)
Cada variable puede ser una columna o una expresión entre columnas, p. ej. "P15YM_SE / P_15YMAS * 100".

Salida: data/<clave>/capas/<base>.json  →  {"variables": {"<id>": [valor por sección, en el orden de data/<clave>.json]}}
uso: python pipeline/lab.py capas chis   (también se corre dentro de "todo")
"""
import csv
import json
import re
import unicodedata

from comun import BASE, PIPE, REPO, PLANO

NRM = lambda x: re.sub(r'[^A-Z0-9 ]', '', unicodedata.normalize('NFKD', str(x)).encode('ascii', 'ignore').decode().upper()).strip()


def num(x):
    try:
        return float(str(x).replace(',', ''))
    except (TypeError, ValueError):
        return None


def evaluar(expr, fila):
    """Evalúa una expresión aritmética simple con nombres de columna. Devuelve None si falta un dato."""
    vals, out = {}, expr
    for k, tok in enumerate(sorted(set(re.findall(r'[A-Za-z_][A-Za-z0-9_.]*', expr)), key=len, reverse=True)):
        v = num(fila.get(tok))
        if v is None:
            return None
        vals[f'_v{k}'] = v
        out = re.sub(rf'(?<![A-Za-z0-9_.]){re.escape(tok)}(?![A-Za-z0-9_.])', f'_v{k}', out)
    if re.search(r'[^0-9_v.+\-*/() ]', out):
        raise SystemExit(f'Expresión no permitida: {expr}')
    try:
        return eval(out, {'__builtins__': {}}, vals)  # solo aritmética con números (verificado arriba)
    except ZeroDivisionError:
        return None


def capas(e):
    reg = json.loads((PIPE / 'capas.json').read_text(encoding='utf-8'))['bases']
    d = json.loads((PLANO / f'{e["clave"]}.json').read_text(encoding='utf-8'))
    S, mun = d['S'], d['meta']['municipios']
    idx = {r[0]: i for i, r in enumerate(S)}
    mnorm = {NRM(v): int(k) for k, v in mun.items()}
    outdir = REPO / 'data' / e['clave'] / 'capas'
    outdir.mkdir(parents=True, exist_ok=True)
    for b in reg:
        src = BASE / b['archivo'].replace('{ent}', str(e['ent'])).replace('{ent2}', f'{e["ent"]:02d}')
        if not src.exists():
            print(f'  [{b["id"]}] sin archivo para {e["nombre"]}: {src}'); continue
        vals = {v['id']: [None] * len(S) for v in b['variables']}
        ok = 0
        with open(src, encoding='utf-8-sig', errors='ignore') as f:
            for fila in csv.DictReader(f):
                fila = {(k or '').strip(): v for k, v in fila.items()}
                if b.get('columna_estado') and int(num(fila.get(b['columna_estado'])) or 0) != e['ent']:
                    continue
                if b['nivel'] == 'seccion':
                    s = num(fila.get(b['columna_clave']))
                    ii = [idx[int(s)]] if s is not None and int(s) in idx else []
                else:
                    m = mnorm.get(NRM(fila.get(b['columna_clave'], '')))
                    ii = [i for i, r in enumerate(S) if r[1] == m] if m is not None else []
                if not ii:
                    continue
                ok += 1
                for v in b['variables']:
                    x = evaluar(v['expresion'], fila)
                    if x is not None:
                        x = round(x, v.get('decimales', 2) + 1)
                        for i in ii:
                            vals[v['id']][i] = x
        cub = sum(1 for x in next(iter(vals.values())) if x is not None)
        (outdir / f'{b["id"]}.json').write_text(json.dumps({'variables': vals}, separators=(',', ':')), encoding='utf-8')
        print(f'  [{b["id"]}] {ok} registros unidos · {cub:,} de {len(S):,} secciones con dato')
