"""Coaliciones por lugar (E[ek].bx) y votos de candidaturas comunes, con los archivos de candidaturas del INE.

Por qué: en una elección local o federal una coalición puede ir en unos municipios o distritos y en otros no (o ir con
otros socios). Los resultados por sección no lo dicen; el archivo de candidaturas por municipio o distrito del INE
(*MUNCAND.csv, *DISCAND.csv: una columna por candidatura registrada, con sus votos) sí. Sin esto, en un municipio donde
la coalición no fue se sumaban partidos que compitieron separados (Tomatlán 2024 salía Morena; ganó MC).

Qué hace, por estado (lee privado/<estado>.json y lo actualiza):
  1. Candidatura común: construir.py junta el voto en el partido que la encabeza (E.cc). Donde el archivo de
     candidaturas dice que esos partidos fueron separados, devuelve a cada partido sus votos del archivo por sección.
  2. Cómo compitió cada lugar: E[ek].bx = [[bloques como compitieron ahí], [secciones]] para los lugares que no
     compitieron como el estado. La plataforma y el sitio lo usan cuando el territorio es un solo lugar.
  3. Revisión: cuenta en cuántos lugares el primer lugar calculado coincide con el ganador del archivo de candidaturas,
     antes y después. Si después acierta menos que antes, se detiene sin guardar.

Corre solo dentro de  python pipeline/lab.py construir|todo <estado>  (después de construir y antes de la proyección).
uso suelto: python pipeline/lugares.py chis [oax ...]   ·   python pipeline/lugares.py todos
"""
import collections
import csv
import glob
import io
import json
import os
import re
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun import CFG, ESTADOS, PLANO, estado, ruta, temporal  # noqa: E402

NONVOTE = re.compile(r'^(DEMARCACION|NO_REG|CNR|NULOS|VOTOS_NULOS|CIRCUNSCRIPCION|ID_|NOMBRE_|CABECERA|MUNICIPIO|SECCION|CASILLAS|ACTA|NUM_VOTOS|TOTAL_VOTOS|LISTA_NOMINAL|TIPO|DISTRITO|EXT|OBSERV|RUTA|CAND_IND|ESTADO)')
NONVOTE_S = re.compile(r'^(DEMARCACION|NO_REG|CNR|NULOS|VOTOS_NULOS|CIRCUNSCRIPCION|ID_|NOMBRE_|CABECERA|MUNICIPIO|SECCION|CASILLAS|ACTA|NUM_VOTOS|TOTAL_VOTOS|LISTA_NOMINAL|TIPO|DISTRITO|EXT|OBSERV|RUTA|ESTADO)')
ALIAS = {'ES': 'PES', 'FXMO': 'FXM', 'FXMV': 'FXM', 'FXMQROO': 'FXM', 'NAO': 'NA', 'NAY': 'NA', 'PNA': 'NA', 'PANAL': 'NA',
         'CXQROO': 'CQROO', 'PCU': 'PCHU', 'MVC': 'PMCH', 'ESQROO': 'PES'}   # mismos nombres que construir.py
# carpeta, tipo, columnas de la unidad (municipio o distrito), archivo de candidaturas
LOCALES = [('AYUNTAMIENTOS', 'AYU', ('ID_MUNICIPIO',), 'MUNCAND'),
           ('ALCALDIAS', 'AYU', ('ID_MUNICIPIO', 'ID_DELEGACION', 'ID_ALCALDIA', 'ID_DEMARCACION'), 'MUNCAND'),
           ('JEFE_DELEGACIONAL', 'AYU', ('ID_MUNICIPIO', 'ID_DELEGACION', 'ID_ALCALDIA', 'ID_DEMARCACION'), 'MUNCAND'),
           ('DIPUTACIONES_LOC_MR', 'DIPL', ('ID_DISTRITO_LOCAL', 'ID_DISTRITO'), 'DISCAND')]
UFED = ('ID_DISTRITO_FEDERAL', 'ID_DISTRITO')


# ---------- lectura ----------
def hk(k):
    if not k:
        return k
    k = unicodedata.normalize('NFD', k.strip()).encode('ascii', 'ignore').decode().upper()
    return 'SECCION' if k in ('SECCIONES', 'SECCIN') else k


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def leer(f):
    """Filas del CSV como diccionarios. Si el INE repite el nombre de una columna, se suman sus votos (antes se quedaba
    la última, casi siempre vacía, y se perdían votos: SLP 2018, MOR, OAX y PUE 2018, BCS 2015)."""
    t = open(f, encoding='utf-8-sig', errors='ignore').read()
    l0 = t.split('\n', 1)[0]
    d = '\t' if l0.count('\t') > l0.count(',') else (';' if l0.count(';') > l0.count(',') else ',')
    rd = csv.reader(io.StringIO(t), delimiter=d)
    h = [hk(x) for x in next(rd, [])]
    out = []
    for row in rd:
        if not row:
            continue
        r = {}
        for k, c in enumerate(h):
            if not c:
                continue
            v = (row[k] if k < len(row) else '').strip()
            if c not in r or r[c] == '':
                r[c] = v
            elif v != '':
                a, b = num(r[c]), num(v)
                if a is not None and b is not None:
                    s = a + b
                    r[c] = str(int(s)) if s == int(s) else str(s)
        out.append(r)
    return out


def uno(patrones):
    for p in patrones:
        g = sorted(glob.glob(p))
        if g:
            return g[0]
    return None


def _unidad(R, RC, ucs, ent=None):
    """Mapa sección → lugar, qué combinaciones tuvieron votos en cada lugar y los votos por candidatura de cada lugar."""
    if not R:
        return None
    uc = next((c for c in ucs if c in R[0]), None)
    if not uc:
        return None
    cols = [c for c in R[0] if '_' in c and not NONVOTE.match(c)]
    S = {}
    st = collections.defaultdict(lambda: collections.defaultdict(lambda: [0, 0, 0.0]))   # vacías, con dato, votos
    for r in R:
        s, u = num(r.get('SECCION')), num(r.get(uc))
        if not s or not u:
            continue
        s, u = int(s), int(u)
        S[s] = u
        for c in cols:
            v = r.get(c, '')
            if v == '':
                st[u][c][0] += 1
            else:
                st[u][c][1] += 1
                st[u][c][2] += num(v) or 0
    C = {}
    if RC:
        uc2 = next((c for c in ucs if c in RC[0]), None)
        for r in RC:
            u = num(r.get(uc2)) if uc2 else None
            if not u:
                continue
            C[int(u)] = {c: num(r[c]) for c in r if c and (not NONVOTE.match(c) or c.startswith('CAND_IND')) and r[c] != '' and c != 'PARTIDO'}
    U = {u: {c: ('b' if v[1] == 0 else ('v' if v[2] > 0 else 'z')) for c, v in d.items()} for u, d in st.items()}
    rg = collections.defaultdict(list)
    for s in sorted(S):
        L = rg[S[s]]
        if L and L[-1][1] == s - 1:
            L[-1][1] = s
        else:
            L.append([s, s])
    return {'U': U, 'C': C, 'S': rg}


def _del_estado(R, ent):
    return [r for r in R if (r.get('ID_ESTADO') or '').split('.')[0] == str(ent)]


def extraer(e):
    """Lee de la carpeta del INE (config.json) los archivos por sección y de candidaturas de cada elección del estado."""
    amin = CFG.get('anio_minimo', 2015)
    X, SECF = {}, {}
    for yd in sorted(glob.glob(str(ruta('local') / e['carpeta_local'] / '*'))):
        y = os.path.basename(yd)
        if not y.isdigit() or int(y) < amin:
            continue
        for sub, t, ucs, cn in LOCALES:
            sec = uno([f'{yd}/{sub}/*_SEC.[cC][sS][vV]'])
            if not sec:
                continue
            cand = uno([f'{yd}/{sub}/*{cn}.[cC][sS][vV]'])
            x = _unidad(leer(sec), leer(cand) if cand else [], ucs)
            if x:
                X[f'{t}_{y}'] = x; SECF[f'{t}_{y}'] = sec
    for yd in sorted(glob.glob(str(ruta('federal') / 'DIPUTACIONES_FED_MR' / '*'))):
        y = os.path.basename(yd)
        if not y.isdigit() or int(y) < amin:
            continue
        tf = temporal(e) / f'FED_DIP_{y}.csv'     # el paso preparar ya lo dejó filtrado al estado
        if tf.exists():
            R = _del_estado(leer(str(tf)), e['ent']) or leer(str(tf))
        else:
            sec = uno([f'{yd}/*_NAL_SEC.[cC][sS][vV]'])
            R = _del_estado(leer(sec), e['ent']) if sec else []
        cand = uno([f'{yd}/*_NAL_DISCAND.[cC][sS][vV]'])
        x = _unidad(R, _del_estado(leer(cand), e['ent']) if cand else [], UFED)
        if x:
            X[f'DIPF_{y}'] = x
    return X, SECF


# ---------- coaliciones ----------
def toks(c):
    if c.startswith('CAND_IND'):
        return ['IND']
    c = re.sub(r'^C_(COMUN_)?', '', c.replace('NVA_ALIANZA', 'NA'))
    return [ALIAS.get(p, p) for p in c.split('_') if p and not p.isdigit()]


def unidades(info, idx, S, r, t):
    U = collections.defaultdict(list); de = {}
    for u, rg in info['S'].items():
        for a, b in rg:
            for s in range(a, b + 1):
                if s in idx:
                    U[int(u)].append(idx[s]); de[idx[s]] = int(u)
    # secciones nuevas (reseccionamiento) que recibieron votos de las dadas de baja: van al lugar que tiene la
    # mayoría de las secciones de su mismo municipio y distrito
    c2 = 2 if t == 'DIPL' else 3
    k1 = collections.defaultdict(collections.Counter); k2 = collections.defaultdict(collections.Counter)
    for i, u in de.items():
        k1[(S[i][1], S[i][c2])][u] += 1; k2[S[i][1]][u] += 1
    for i in range(len(S)):
        if i in de or not r[i]:
            continue
        c = k1.get((S[i][1], S[i][c2])) or k2.get(S[i][1])
        if c:
            U[c.most_common(1)[0][0]].append(i)
    return U


def particion(members, groups):
    par = {p: p for p in members}

    def f(a):
        while par[a] != a:
            a = par[a]
        return a
    for g in groups:
        m = [p for p in g if p in par]
        for p in m[1:]:
            par[f(p)] = f(m[0])
    comp = collections.defaultdict(list)
    for p in members:
        comp[f(p)].append(p)
    return list(comp.values())


def grupos_unidad(Cu, base_comp):
    """candidaturas del lugar; un partido que aparece en dos columnas se queda en la que más comparte con su bloque"""
    gs = [toks(c) for c in Cu if not c.startswith('CAND_IND') and (Cu[c] or 0) > 0]
    cnt = collections.Counter(p for g in gs for p in set(g))
    out = []
    for g in gs:
        h = []
        for p in g:
            if cnt[p] > 1:
                cand = [x for x in gs if p in x]
                mejor = max(cand, key=lambda x: (len(set(x) & base_comp.get(p, {p})), -len(x)))
                if mejor is g:
                    h.append(p)
            else:
                h.append(p)
        out.append(h)
    return out


def votos_seccion(r):
    v = collections.Counter()
    for c, x in r.items():
        if not c or NONVOTE_S.match(c) or c.startswith('CAND_IND'):
            continue
        n = num(x)
        if not n:
            continue
        ps = toks(c) if '_' in c else [c]
        for p in ps:
            v[p] += n / len(ps)
    return v


def aplicar(D, X, SECF, cab=''):
    """Repara candidaturas comunes y arma E[ek].bx. Devuelve el reporte por elección."""
    P = D['P8']; ix = {p: j for j, p in enumerate(P)}
    idx = {int(s[0]): i for i, s in enumerate(D['S'])}
    rep = []
    for ek, info in X.items():
        if ek not in D['E'] or not info or 'S' not in info:
            continue
        e = D['E'][ek]; U = unidades(info, idx, D['S'], e['r'], ek.split('_')[0])
        C = {int(k): v for k, v in (info.get('C') or {}).items()}
        cand = any('_' in c and not c.startswith('CAND_IND') for v in C.values() for c in v)
        partidos = [p for p in P if p not in ('OTROS', 'IND')]
        base = [b for b in ([m for m in b['members'] if m in partidos] for b in e['blocs']) if b]
        base_comp = {p: set(b) for b in base for p in b}
        # 1) candidatura común juntada donde en realidad fueron separados: cada partido recupera sus votos
        reparados = 0
        if e.get('cc') and cand:
            rows = None
            for u, ii in U.items():
                if u not in C:
                    continue
                gs = grupos_unidad(C[u], base_comp)
                for g in e['cc']:
                    if len(particion(g, gs)) > 1:
                        if rows is None:
                            rows = {}
                            if SECF.get(ek):
                                for r in leer(SECF[ek]):
                                    s = num(r.get('SECCION'))
                                    if s:
                                        rows.setdefault(int(s), collections.Counter()).update(votos_seccion(r))
                        for i in ii:
                            v = rows.get(D['S'][i][0])
                            if v is None or not e['r'][i]:
                                continue
                            for p in g:
                                if p in ix:
                                    e['r'][i][ix[p]] = round(v.get(p, 0))
                            reparados += 1
        # 2) cómo compitió cada lugar
        bx = collections.defaultdict(list); ok0 = ok1 = n = 0
        EXT = [[p] for p in ('IND', 'OTROS') if p in ix]
        for u, ii in U.items():
            v = [0.0] * len(P)
            for i in ii:
                r = e['r'][i]
                if r:
                    for j in range(len(P)):
                        v[j] += r[j]
            if cand and u in C:
                comp = particion(partidos, grupos_unidad(C[u], base_comp))
            elif not cand:
                st = info['U'].get(u) or info['U'].get(str(u)) or {}
                blank = any(s == 'b' for vv in info['U'].values() for s in vv.values())
                gs = [toks(c) for c, s in st.items() if (s != 'b' if blank else s == 'v')]
                comp = []
                for b in base:
                    comp += particion(b, gs) if len(b) > 1 else [b]
            else:
                comp = base
            comp = [c for c in comp if c]
            if {frozenset(c) for c in comp if sum(v[ix[p]] for p in c) > 0} != {frozenset(b) for b in base if sum(v[ix[p]] for p in b) > 0}:
                bl = sorted(([sum(v[ix[p]] for p in c), sorted(c, key=lambda p: -v[ix[p]])] for c in comp), key=lambda x: -x[0])
                bx[json.dumps([m for _, m in bl])].extend(ii)
                vb1 = bl
            else:
                vb1 = sorted(([sum(v[ix[p]] for p in c), c] for c in base), key=lambda x: -x[0])
            vb0 = sorted(([sum(v[ix[p]] for p in c), c] for c in base + EXT), key=lambda x: -x[0])
            vb1 = sorted(vb1 + [[sum(v[ix[p]] for p in c), c] for c in EXT], key=lambda x: -x[0])
            Cu = C.get(u)
            if Cu:
                n += 1
                wc = max(Cu, key=lambda c: Cu[c] or 0); wt = set(toks(wc)); wt = wt if any(p in ix for p in wt) else {'OTROS'}
                ok0 += bool(wt & set(vb0[0][1])); ok1 += bool(wt & set(vb1[0][1]))
        if bx:
            e['bx'] = [[json.loads(k) + EXT, sorted(set(ii))] for k, ii in bx.items()]
        else:
            e.pop('bx', None)
        rep.append({'ek': ek, 'n': n, 'antes': ok0, 'despues': ok1, 'lugares': len(bx), 'reparados': reparados})
    return rep


def publico(D, cab):
    """data/bx/<estado>.json: cómo compitió cada lugar, por número de sección y sin votos (el sitio lo pega a sus datos)."""
    S = D['S']; E = {}
    for ek, e in D['E'].items():
        if not e.get('bx'):
            continue
        L = []
        for bl, ii in e['bx']:
            rg = []
            for s in sorted(int(S[i][0]) for i in ii):
                if rg and isinstance(rg[-1], list) and rg[-1][1] == s - 1:
                    rg[-1][1] = s
                elif rg and not isinstance(rg[-1], list) and rg[-1] == s - 1:
                    rg[-1] = [rg[-1], s]
                else:
                    rg.append(s)
            L.append([bl, rg])
        E[ek] = L
    d = PLANO.parent / 'data' / 'bx'
    d.mkdir(parents=True, exist_ok=True)
    (d / f'{cab}.json').write_text(json.dumps({'E': E}, separators=(',', ':'), ensure_ascii=False), encoding='utf-8')


def lugares(e):
    fn = PLANO / f'{e["clave"]}.json'
    if not fn.exists():
        raise SystemExit(f'Falta privado/{e["clave"]}.json: corre primero  python pipeline/lab.py construir {e["clave"]}')
    D = json.loads(fn.read_text(encoding='utf-8'))
    X, SECF = extraer(e)
    rep = aplicar(D, X, SECF, e['clave'])
    n = sum(r['n'] for r in rep); a = sum(r['antes'] for r in rep); d = sum(r['despues'] for r in rep)
    for r in rep:
        if r['lugares'] or r['reparados']:
            print(f"  {r['ek']:10} {r['lugares']:3} arreglos distintos al del estado · ganador {r['antes']}→{r['despues']} de {r['n']}" + (f" · {r['reparados']} secciones con votos de candidatura común devueltos" if r['reparados'] else ''))
    if d < a:
        raise SystemExit(f'Coaliciones por lugar: {e["nombre"]} acierta menos que antes ({d} contra {a}); no se guardó.')
    fn.write_text(json.dumps(D, separators=(',', ':'), ensure_ascii=False), encoding='utf-8')
    publico(D, e['clave'])
    print(f'  ganador por municipio y distrito: {d:,} de {n:,} ({100 * d / max(1, n):.1f} %; sin coaliciones por lugar {100 * a / max(1, n):.1f} %)')
    return n, a, d


if __name__ == '__main__':
    a = sys.argv[1:]
    est = ESTADOS if a == ['todos'] else [estado(x) for x in a]
    if not est:
        print(__doc__); sys.exit()
    T = [0, 0, 0]
    for e in est:
        print(f'[lugares] {e["nombre"]}')
        T = [x + y for x, y in zip(T, lugares(e))]
    if len(est) > 1:
        print(f'[lugares] total: {T[2]:,} de {T[0]:,} ({100 * T[2] / max(1, T[0]):.1f} %)')
