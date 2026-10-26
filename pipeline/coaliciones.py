"""Coaliciones parciales: lugares donde una coalición NO fue, aunque en el estado sí existía → E[ek]['sx'].

En los resultados del INE y de los institutos locales, los votos que marcan dos o más logos de una coalición van en
columnas de combinación (MORENA_PT, PAN_PRI…). Donde la coalición no se registró, esas combinaciones no reciben votos.
Por cada distrito (diputaciones) o municipio (ayuntamientos) se revisa qué combinaciones tuvieron votos; si los
partidos de una coalición estatal no quedan unidos por ninguna combinación con votos, ahí compitieron separados.

Solo se marca cuando el bloque tiene al menos MINV votos en ese lugar: con pocos votos una coalición real puede tener
cero votos en sus combinaciones por azar, y ahí se deja como coalición (no se sabe).
Las candidaturas comunes (E.cc) no se tocan: no tienen columnas de combinación.

uso: python pipeline/coaliciones.py   (lee <temporal>/<estado>/*.csv y actualiza privado/<estado>.json)
"""
import collections
import csv
import glob
import io
import json
import re
import sys
import unicodedata

from comun import PLANO, estado, temporal

MAIN = ['MORENA', 'PAN', 'PRI', 'PRD', 'PVEM', 'PT', 'MC']
MINV = 1500
TIPOS = [('LOC_AYUNTAMIENTOS_', 'AYU', ('ID_MUNICIPIO',)), ('XLOC_AYUNTAMIENTOS_', 'AYU', ('ID_MUNICIPIO',)),
         ('LOC_DIPUTACIONES_LOC_MR_', 'DIPL', ('ID_DISTRITO_LOCAL', 'ID_DISTRITO')),
         ('FED_DIP_', 'DIPF', ('ID_DISTRITO_FEDERAL', 'ID_DISTRITO'))]
NONVOTE = re.compile(r'^(DEMARCACION|NO_REG|CNR|NULOS|VOTOS_NULOS|CIRCUNSCRIPCION|ID_|NOMBRE_|CABECERA|MUNICIPIO|SECCION|CASILLAS|ACTA|NUM_VOTOS|TOTAL_VOTOS|LISTA_NOMINAL|TIPO|DISTRITO|EXT|OBSERV|RUTA)')


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return 0.0


def _hk(k):
    if not k:
        return k
    k = unicodedata.normalize('NFD', k.strip()).encode('ascii', 'ignore').decode().upper()
    return 'SECCION' if k in ('SECCIONES', 'SECCIN') else k


ALIAS = {'ES': 'PES', 'FXMO': 'FXM', 'FXMV': 'FXM', 'FXMQROO': 'FXM', 'NAO': 'NA', 'NAY': 'NA', 'PNA': 'NA', 'PANAL': 'NA',
         'CXQROO': 'CQROO', 'PCU': 'PCHU', 'MVC': 'PMCH', 'ESQROO': 'PES'}  # mismos nombres que construir.py


def toks(c):
    c = re.sub(r'^C_(COMUN_)?', '', c.replace('NVA_ALIANZA', 'NA'))
    return [ALIAS.get(p, p) for p in c.split('_') if p and not p.isdigit()]


def leer(f, ucols):
    t = open(f, encoding='utf-8-sig', errors='ignore').read()
    d = '\t' if t.split('\n', 1)[0].count('\t') > t.split('\n', 1)[0].count(',') else ','
    rows = [{_hk(k): v for k, v in r.items()} for r in csv.DictReader(io.StringIO(t), delimiter=d)]
    if not rows:
        return {}, {}
    cols = [c for c in rows[0] if c and not NONVOTE.match(c.strip()) and '_' in c and not c.startswith('CAND_IND')]
    uc = next((c for c in ucols if c in rows[0]), None)
    if not uc:
        return {}, {}
    UC = collections.defaultdict(set); US = collections.defaultdict(set)
    for r in rows:
        try:
            s = int(float(r['SECCION'])); u = int(num(r[uc]))
        except (TypeError, ValueError, KeyError):
            continue
        if s <= 0 or not u:
            continue
        US[u].add(s)
        for c in cols:
            m = toks(c)
            if len(m) > 1 and num(r[c]) > 0:
                UC[u].add(tuple(m))
    return UC, US


def generar(claves=None):
    res = {}
    for fj in sorted(PLANO.glob('*.json')):
        if fj.stem == 'claves' or (claves and fj.stem not in claves):
            continue
        d = json.loads(fj.read_text(encoding='utf-8')); P8 = d['P8']; ix = {p: j for j, p in enumerate(P8)}
        idx = {int(s[0]): i for i, s in enumerate(d['S'])}
        tmp = temporal(estado(fj.stem)); cambio = False; rep = {}
        porek = collections.defaultdict(lambda: (collections.defaultdict(set), collections.defaultdict(set)))
        for f in sorted(glob.glob(str(tmp) + '/*.csv')):
            b = f.split('/')[-1]
            for pre, t, ucols in TIPOS:
                if b.startswith(pre) and not (pre == 'LOC_AYUNTAMIENTOS_' and b.startswith('XLOC')):
                    y = int(re.search(r'(\d{4})', b).group(1)); ek = f'{t}_{y}'
                    if ek not in d['E']:
                        continue
                    UC, US = leer(f, ucols); A, B = porek[ek]
                    for u, v in UC.items():
                        A[u] |= v
                    for u, v in US.items():
                        B[u] |= v
        for ek, (UC, US) in porek.items():
            e = d['E'][ek]; ccg = {p for g in e.get('cc', []) for p in g}
            # todos los partidos del bloque (también los locales), con al menos un partido nacional
            grupos = [[m for m in b['members'] if m != 'OTROS'] for b in e['blocs']]
            grupos = [g for g in grupos if len(g) > 1 and any(m in MAIN for m in g) and not (set(g) & ccg)]
            sx = collections.defaultdict(list); n_sep = n_dud = n_tot = 0
            for u, secs in US.items():
                ii = [idx[s] for s in secs if s in idx]
                if not ii:
                    continue
                for g in grupos:
                    n_tot += 1
                    par = {p: p for p in g}

                    def fnd(a):
                        while par[a] != a:
                            a = par[a]
                        return a
                    for cmb in UC.get(u, ()):
                        m = [p for p in cmb if p in par]
                        for p in m[1:]:
                            par[fnd(p)] = fnd(m[0])
                    comp = collections.defaultdict(list)
                    for p in g:
                        comp[fnd(p)].append(p)
                    if len(comp) == 1:
                        continue
                    vv = {p: sum(e['r'][i][ix[p]] for i in ii if e['r'][i]) if p in ix else 0 for p in g}
                    if sum(vv.values()) < MINV:
                        n_dud += 1
                        continue
                    n_sep += 1
                    top = max(comp.values(), key=lambda c: sum(vv[p] for p in c))
                    sol = tuple(sorted(tuple(sorted(c)) for c in comp.values() if c is not top))  # grupos que fueron aparte
                    sx[sol].extend(ii)
            nuevo = [[[list(c) for c in k], sorted(set(v))] for k, v in sorted(sx.items())] or None
            if e.get('sx') != nuevo:
                cambio = True
                if nuevo:
                    e['sx'] = nuevo
                else:
                    e.pop('sx', None)
            if grupos:
                rep[ek] = (n_sep, n_dud, n_tot)
        if cambio:
            fj.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        res[fj.stem] = rep
        print(f"[coaliciones] {fj.stem}: " + ', '.join(f'{k} {a} separados{f" ({b} sin saber)" if b else ""} de {c}' for k, (a, b, c) in sorted(rep.items())))
    return res


if __name__ == '__main__':
    generar(sys.argv[1:] or None)
