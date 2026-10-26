"""Coaliciones parciales: lugares donde una coalición NO fue, aunque en el estado sí existía → E[ek]['sx'].

En los resultados del INE y de los institutos locales, los votos que marcan dos o más logos de una coalición van en
columnas de combinación (MORENA_PT, PAN_PRI…). Donde la coalición no se registró, esas combinaciones no reciben votos.
Por cada distrito (diputaciones) o municipio (ayuntamientos) se revisa qué combinaciones tuvieron votos; si los
partidos de una coalición estatal no quedan unidos por ninguna combinación con votos, ahí compitieron separados.

Con pocos votos una coalición real puede tener cero votos en sus combinaciones por azar. Para decidir se usa una prueba
de Poisson: en cada elección se mide qué parte del voto de los aliados cae en combinaciones donde la coalición sí fue
(tasa); en un lugar sin combinaciones se esperarían λ = tasa × votos de los aliados. Si la probabilidad de ver cero,
e^(−λ), es menor a 5 %, se marca que compitieron separados; si no, se deja como coalición (no se sabe).
Además, si el registro del INE dice que el ganador de ese lugar fue postulado por esa coalición, se deja como coalición.
Las candidaturas comunes (E.cc) no se tocan: no tienen columnas de combinación.

uso: python pipeline/coaliciones.py   (lee <temporal>/<estado>/*.csv y actualiza privado/<estado>.json)
"""
import collections
import csv
import glob
import io
import json
import math
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
    UC = collections.defaultdict(lambda: collections.defaultdict(float)); US = collections.defaultdict(set)
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
                UC[u][tuple(m)] += num(r[c])
    return UC, US


def generar(claves=None):
    res = {}
    for fj in sorted(PLANO.glob('*.json')):
        if fj.stem == 'claves' or (claves and fj.stem not in claves):
            continue
        d = json.loads(fj.read_text(encoding='utf-8')); P8 = d['P8']; ix = {p: j for j, p in enumerate(P8)}
        idx = {int(s[0]): i for i, s in enumerate(d['S'])}
        tmp = temporal(estado(fj.stem)); cambio = False; rep = {}
        porek = collections.defaultdict(lambda: (collections.defaultdict(lambda: collections.defaultdict(float)), collections.defaultdict(set)))
        # ganador de cada lugar según el registro del INE: (elección, municipio o distrito) → partidos que lo postularon
        GN = {}; g_ = d['meta'].get('gan') or {}
        for r in g_.get('r', []):
            if len(r) <= 9 and r[7] and r[7][0] in ('m', 'dl') and r[5]:
                GN[(r[7][2], r[7][0], str(r[7][1]))] = set(toks(str(r[5]).replace('-', '_')))
        for f in sorted(glob.glob(str(tmp) + '/*.csv')):
            b = f.split('/')[-1]
            for pre, t, ucols in TIPOS:
                if b.startswith(pre) and not (pre == 'LOC_AYUNTAMIENTOS_' and b.startswith('XLOC')):
                    y = int(re.search(r'(\d{4})', b).group(1)); ek = f'{t}_{y}'
                    if ek not in d['E']:
                        continue
                    UC, US = leer(f, ucols); A, B = porek[ek]
                    for u, v in UC.items():
                        for k_, n_ in v.items():
                            A[u][k_] += n_
                    for u, v in US.items():
                        B[u] |= v
        for ek, (UC, US) in porek.items():
            e = d['E'][ek]; ccg = {p for g in e.get('cc', []) for p in g}
            # todos los partidos del bloque (también los locales), con al menos un partido nacional
            grupos = [[m for m in b['members'] if m != 'OTROS'] for b in e['blocs']]
            grupos = [g for g in grupos if len(g) > 1 and any(m in MAIN for m in g) and not (set(g) & ccg)]
            sx = collections.defaultdict(list); n_sep = n_dud = n_tot = n_reg = 0; sd = set()
            casos = []; tasa = collections.defaultdict(lambda: [0.0, 0.0])
            for u, secs in US.items():
                ii = [idx[s] for s in secs if s in idx]
                if not ii:
                    continue
                for gi, g in enumerate(grupos):
                    n_tot += 1
                    par = {p: p for p in g}

                    def fnd(a):
                        while par[a] != a:
                            a = par[a]
                        return a
                    cv = 0.0
                    for cmb, n_ in UC.get(u, {}).items():
                        m = [p for p in cmb if p in par]
                        if len(m) > 1:
                            cv += n_
                        for p in m[1:]:
                            par[fnd(p)] = fnd(m[0])
                    comp = collections.defaultdict(list)
                    for p in g:
                        comp[fnd(p)].append(p)
                    vv = {p: sum(e['r'][i][ix[p]] for i in ii if e['r'][i]) if p in ix else 0 for p in g}
                    if len(comp) == 1:  # la coalición sí fue: sirve para medir la tasa de votos en combinaciones
                        tasa[gi][0] += cv; tasa[gi][1] += sum(vv.values()) - max(vv.values())
                        continue
                    casos.append((u, ii, gi, comp, vv))
            for u, ii, gi, comp, vv in casos:
                g = grupos[gi]
                top = max(comp.values(), key=lambda c: sum(vv[p] for p in c))
                otros = [c for c in comp.values() if c is not top]
                t_ = tasa[gi]; lam = (t_[0] / t_[1]) * sum(vv[p] for c in otros for p in c) if t_[1] > 0 else None
                seguro = (lam is not None and math.exp(-lam) < 0.05) or (lam is None and sum(vv.values()) >= MINV)
                s0 = d['S'][ii[0]]; w = GN.get((ek, 'm', str(s0[1]))) if ek.startswith('AYU') else GN.get((ek, 'dl', str(s0[2]))) if ek.startswith('DIPL') else None
                if w and sum(1 for c in comp.values() if w & set(c)) > 1:  # el ganador fue postulado por esa coalición
                    n_reg += 1
                    continue
                if not seguro:
                    n_dud += 1; sd.update(ii)
                    continue
                n_sep += 1
                sol = tuple(sorted(tuple(sorted(c)) for c in otros))  # grupos que fueron aparte
                sx[sol].extend(ii)
            nuevo = [[[list(c) for c in k], sorted(set(v))] for k, v in sorted(sx.items())] or None
            nsd = sorted(sd) or None  # secciones de lugares donde no se sabe si la coalición fue
            if e.get('sd') != nsd:
                cambio = True
                if nsd:
                    e['sd'] = nsd
                else:
                    e.pop('sd', None)
            if e.get('sx') != nuevo:
                cambio = True
                if nuevo:
                    e['sx'] = nuevo
                else:
                    e.pop('sx', None)
            if grupos:
                rep[ek] = (n_sep, n_dud, n_tot, n_reg)
        if cambio:
            fj.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        res[fj.stem] = rep
        print(f"[coaliciones] {fj.stem}: " + ', '.join(f'{k} {a} separados{f" ({b} sin saber)" if b else ""}{f" ({r_} confirmada por el ganador)" if r_ else ""} de {c}' for k, (a, b, c, r_) in sorted(rep.items())))
    return res


if __name__ == '__main__':
    generar(sys.argv[1:] or None)
