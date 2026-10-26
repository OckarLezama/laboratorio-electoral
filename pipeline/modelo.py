"""Paso 5. Modelo de proyección con resultados históricos (sin encuestas) y su validación.

Método (estándar de pronóstico electoral sin encuestas):
  1. Base histórica ponderada por sección: promedio de todas las elecciones anteriores, con más peso a las del
     mismo cargo, a las del mismo tipo de año (intermedia / presidencial / no concurrente) y a las recientes.
  2. Tendencia amortiguada: se suma una fracción (lam) del cambio entre la elección más reciente y la base.
  3. Agregación por unidad (municipio, distrito local o federal, estado) ponderando cada sección por su votación
     esperada (lista nominal x participación esperada del mismo tipo de año).
  4. Incertidumbre calibrada con errores reales: el error del margen se separa en un componente común a todo el
     estado (cuando un partido sube o baja en todas partes) y uno local. Con eso se calcula la probabilidad de ganar.
Los pesos (wt, wc, decay, lam) se eligen con validación cruzada: se ajustan prediciendo 2021 y se prueban
prediciendo 2024, y al revés. Nada se ajusta con el mismo resultado contra el que se mide.

uso:  python pipeline/modelo.py            → validación de los 32 estados y reporte en pipeline/insumos/validacion.json
"""
import itertools
import json
import math
import statistics
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parent.parent
PLANO = REPO / 'privado'  # datos completos sin cifrar (solo local)
TARGETS = {'AYU': 'm', 'DIPL': 'dl', 'DIPF': 'df', 'GOB': None}
CYCLE = lambda y: 'mid' if y in (2015, 2021, 2027) else 'pres' if y in (2018, 2024) else 'off'
GRID = {'wt': [0.25, 0.5, 1.0], 'wc': [1.0, 2.0, 4.0], 'decay': [0.6, 0.8, 1.0], 'lam': [0.0, 0.3, 0.6]}


ETR = 0.7  # en la proyección, los aliados aportan 70 % de sus votos (lo que usa la plataforma; ver 82_estrategia.js)


def _grupos(e, S):
    """Por sección, los grupos de partidos que compitieron fuera de su coalición estatal (E.sx de coaliciones.py y
    E.so de las candidaturas federales 2024). None si la elección no tiene coaliciones parciales."""
    if not e.get('sx') and not e.get('so'):
        return None
    g = [set() for _ in S]
    for gs, ii in e.get('sx') or []:
        for i in ii:
            g[i].update(tuple(x) for x in gs)
    for i, s in enumerate(S):
        for p in (e.get('so') or {}).get(str(s[3]), []):
            g[i].add((p,))
    return g


def bl_lugar(e, ii):
    """Bloques de una unidad: la coalición estatal, separando los grupos que en todas sus secciones fueron aparte."""
    gs = e.get('gs')
    if not gs:
        return e['bl']
    G = None
    for i in ii:
        G = set(gs[i]) if G is None else G & gs[i]
        if not G:
            return e['bl']
    out = []
    for b in e['bl']:
        keep = list(b)
        for g in sorted(G):
            o = [m for m in keep if m in g]
            if o and len(o) < len(keep):
                keep = [m for m in keep if m not in o]; out.append(o)
        out.append(keep)
    return out


def cargar(cab):
    d = json.loads((PLANO / f'{cab}.json').read_text(encoding='utf-8'))
    P = d['P8']; NP = len(P); N = len(d['S'])
    E = {}
    for ek, e in d['E'].items():
        V = np.full((N, NP), np.nan); T = np.full(N, np.nan); L = np.full(N, np.nan)
        for i, r in enumerate(e['r']):
            if r:
                V[i] = r[:NP]; T[i] = r[NP]; L[i] = r[NP + 1]
        val = V.sum(1)
        with np.errstate(invalid='ignore', divide='ignore'):
            sh = V / val[:, None]
            tp = np.where(L > 0, T / L, np.nan)
        sh[~(val > 0)] = np.nan
        E[ek] = {'t': e['type'], 'y': int(e['year']), 'sh': sh, 'val': val, 'tp': tp,
                 'bl': [[m for m in b['members'] if m != 'OTROS'] for b in e['blocs'] if b['lead'] != 'OTROS'],
                 'cc': e.get('cc', []), 'gs': _grupos(e, d['S'])}
    S = d['S']
    return {'cab': cab, 'P': P, 'N': N, 'E': E, 'S': S, 'ln': np.array([s[5] or 0 for s in S], float),
            'unit': {'m': np.array([s[1] for s in S]), 'dl': np.array([s[2] for s in S]), 'df': np.array([s[3] for s in S])}}


def base(st, Y, T, wt, wc, decay, lam):
    """Proporción esperada por sección y partido para el cargo T en el año Y, con lo disponible antes de Y."""
    num = np.zeros((st['N'], len(st['P']))); den = np.zeros((st['N'], 1))
    last = None
    for ek, e in st['E'].items():
        if e['y'] >= Y:
            continue
        w = (1.0 if e['t'] == T else wt) * (wc if CYCLE(e['y']) == CYCLE(Y) else 1.0) * decay ** (Y - e['y'])
        ok = ~np.isnan(e['sh'][:, 0])
        num[ok] += w * e['sh'][ok]; den[ok] += w
        if last is None or e['y'] > last[0] or (e['y'] == last[0] and e['t'] == T):
            last = (e['y'], ek)
    with np.errstate(invalid='ignore'):
        b = num / den
    if lam and last:
        rec = st['E'][last[1]]['sh']
        ok = ~np.isnan(rec[:, 0]) & ~np.isnan(b[:, 0])
        b[ok] = b[ok] + lam * (rec[ok] - b[ok])
    b = np.clip(b, 0, None)
    s = b.sum(1, keepdims=True)
    with np.errstate(invalid='ignore'):
        return b / s


def base_proy(st, Y, T, a, sw):
    """El mismo cálculo que usa la plataforma (Estrategia y tarjeta de proyección, ver pipeline/proyeccion.py):
    a × última elección del mismo cargo (con oscilación estatal si sw) + (1−a) × promedio de las elecciones del año
    más reciente. Los parámetros (a, sw) de cada estado se eligen con la otra elección de prueba (validación cruzada)."""
    E = st['E']
    prev = [k for k, e in E.items() if e['t'] == T and e['y'] < Y]
    yrs = [e['y'] for e in E.values() if e['y'] < Y]
    if not prev or not yrs:
        return None
    L = max(prev, key=lambda k: E[k]['y']); ry = max(yrs); rec = [k for k, e in E.items() if e['y'] == ry]
    with np.errstate(invalid='ignore'):
        R = np.nanmean(np.stack([E[k]['sh'] for k in rec]), 0)
    B = E[L]['sh'].copy()
    miss = np.isnan(B[:, 0]); B[miss] = R[miss]
    missR = np.isnan(R[:, 0]); R[missR] = B[missR]
    if sw:
        def est(k):
            v = np.nan_to_num(E[k]['val']); sh = np.nan_to_num(E[k]['sh'])
            return (sh * v[:, None]).sum(0) / max(1, v.sum())
        sL = est(L); sR = np.mean([est(k) for k in rec], 0)
        f = np.where(sL > 1e-4, np.clip(sR / np.where(sL > 1e-4, sL, 1), .2, 5), 0)
        B = B * f; B = B / np.where(B.sum(1, keepdims=True) > 0, B.sum(1, keepdims=True), 1)
    p = a * B + (1 - a) * R
    with np.errstate(invalid='ignore'):
        return p / p.sum(1, keepdims=True)


def turnout(st, Y):
    """Participación esperada por sección: promedio de las elecciones del mismo tipo de año (o todas si no hay)."""
    xs = [e['tp'] for e in st['E'].values() if e['y'] < Y and CYCLE(e['y']) == CYCLE(Y)] or [e['tp'] for e in st['E'].values() if e['y'] < Y]
    with np.errstate(invalid='ignore'):
        m = np.nanmean(np.vstack(xs), 0)
    return np.where(np.isnan(m), np.nanmean(m), m)


def unidades(st, T):
    k = TARGETS[T]
    return np.zeros(st['N'], int) if k is None else st['unit'][k]


def bloques_unidad(st, sh, w, T, bl, ek=None, pred=False):
    """Participación de cada bloque por unidad, ponderando secciones por w. Con ek, los bloques de cada unidad
    respetan las coaliciones parciales de esa elección (bl_lugar). pred=True: los aliados cuentan al ETR."""
    P = st['P']; ix = {p: j for j, p in enumerate(P)}; U = unidades(st, T)
    ok = ~np.isnan(sh[:, 0]) & (w > 0)
    out = {}
    for u in np.unique(U[ok]):
        m = ok & (U == u); ww = w[m]; s = (sh[m] * ww[:, None]).sum(0) / ww.sum()
        blu = bl_lugar(st['E'][ek], np.where(U == u)[0]) if ek else bl
        v = []
        for b in blu:
            xs = [s[ix[p]] for p in b if p in ix]
            v.append((max(xs) + ETR * (sum(xs) - max(xs))) if pred and len(xs) > 1 else sum(xs))
        out[int(u)] = v
    return out


def blu_de(st, ek, T):
    U = unidades(st, T)
    return {int(u): bl_lugar(st['E'][ek], np.where(U == u)[0]) for u in np.unique(U)}


def estatal(st, sh, w, bl):
    P = st['P']; ix = {p: j for j, p in enumerate(P)}; ok = ~np.isnan(sh[:, 0]) & (w > 0); ww = w[ok]
    s = (sh[ok] * ww[:, None]).sum(0) / ww.sum()
    return [sum(s[ix[p]] for p in b if p in ix) for b in bl]


def ganador_previo(st, T, Y):
    """Partido que encabezó al ganador de cada unidad en la elección anterior del mismo cargo (incumbencia)."""
    prev = [k for k, x in st['E'].items() if x['t'] == T and x['y'] < Y]
    if not prev:
        return {}
    e = st['E'][max(prev, key=lambda k: st['E'][k]['y'])]
    pk = max(prev, key=lambda k: st['E'][k]['y'])
    R = bloques_unidad(st, e['sh'], np.nan_to_num(e['val']), T, e['bl'], ek=pk); B = blu_de(st, pk, T)
    return {u: max(B[u][max(range(len(v)), key=lambda j: v[j])], key=lambda p: -MAIN_ORD.get(p, 99)) for u, v in R.items() if v and not any(math.isnan(x) for x in v)}


MAIN_ORD = {p: -i for i, p in enumerate(['MORENA', 'PAN', 'PRI', 'MC', 'PVEM', 'PT', 'PRD'])}


def evaluar(st, ek, prm, encuesta=None, rng=None, inc=0.0):
    """Predice la elección ek con datos anteriores y compara por unidad. Devuelve lista de casos.
    encuesta=None: solo resultados. encuesta=e (puntos): se simula una encuesta estatal con error e (0 = perfecta),
    que corrige el nivel estatal de cada bloque; el reparto territorial sigue saliendo del histórico."""
    e = st['E'][ek]; T, Y = e['t'], e['y']
    pr = base_proy(st, Y, T, *prm[st['cab']][Y]) if 'proy' in prm else base(st, Y, T, **prm)
    if pr is None:
        return []
    w_pred = st['ln'] * turnout(st, Y)
    w_true = np.nan_to_num(e['val'])
    P = bloques_unidad(st, pr, w_pred, T, e['bl'], ek=ek, pred=True)
    R = bloques_unidad(st, e['sh'], w_true, T, e['bl'], ek=ek)
    BU = blu_de(st, ek, T)
    if inc and T in ('AYU', 'GOB'):
        gp = ganador_previo(st, T, Y)
        P = {u: [v + (inc / 100 if gp.get(u) in BU[u][j] else 0) for j, v in enumerate(p)] for u, p in P.items()}
    if encuesta is not None:
        # la encuesta corrige el nivel estatal de cada bloque; la corrección se reparte entre sus partidos según su peso
        pe = estatal(st, pr, w_pred, e['bl']); re_ = estatal(st, e['sh'], w_true, e['bl'])
        enc = [x + (rng.normal(0, encuesta / 100) if encuesta else 0) for x in re_]
        sp = estatal(st, pr, w_pred, [[p] for p in st['P']]); adj = {}
        for j, b in enumerate(e['bl']):
            tot = sum(sp[st['P'].index(p)] for p in b if p in st['P']) or 1
            for p in b:
                if p in st['P']:
                    adj[p] = (enc[j] - pe[j]) * sp[st['P'].index(p)] / tot
        P = {u: [v + sum(adj.get(p, 0) for p in BU[u][j]) for j, v in enumerate(p)] for u, p in P.items()}
    out = []
    for u, p in P.items():
        if u not in R or any(math.isnan(x) for x in p):
            continue
        r = R[u]; o = sorted(range(len(p)), key=lambda j: -p[j])
        a, b = o[0], o[1] if len(o) > 1 else o[0]
        out.append({'u': u, 'ok': int(max(range(len(r)), key=lambda j: r[j]) == a), 'pm': 100 * (p[a] - p[b]),
                    'rm': 100 * (r[a] - r[b]), 'mae': 100 * statistics.mean(abs(p[j] - r[j]) for j in o[:3])})
    return out


def ingenuo(st, ek):
    """Referencia: repetir la última elección del mismo cargo."""
    e = st['E'][ek]; T, Y = e['t'], e['y']
    prev = [k for k, x in st['E'].items() if x['t'] == T and x['y'] < Y]
    if not prev:
        return []
    pk = max(prev, key=lambda k: st['E'][k]['y']); sh = st['E'][pk]['sh']
    P = bloques_unidad(st, sh, st['ln'] * turnout(st, Y), T, e['bl'], ek=ek)
    R = bloques_unidad(st, e['sh'], np.nan_to_num(e['val']), T, e['bl'], ek=ek)
    out = []
    for u, p in P.items():
        if u not in R or any(math.isnan(x) for x in p):
            continue
        r = R[u]; o = sorted(range(len(p)), key=lambda j: -p[j]); a, b = o[0], o[1] if len(o) > 1 else o[0]
        out.append({'ok': int(max(range(len(r)), key=lambda j: r[j]) == a), 'mae': 100 * statistics.mean(abs(p[j] - r[j]) for j in o[:3]),
                    'pm': 100 * (p[a] - p[b]), 'rm': 100 * (r[a] - r[b])})
    return out


def objetivos(st, Y):
    return [k for k, e in st['E'].items() if e['y'] == Y and e['t'] in TARGETS]


def resumen(casos):
    if not casos:
        return None
    return {'n': len(casos), 'acierto': round(100 * sum(c['ok'] for c in casos) / len(casos), 1),
            'mae': round(statistics.mean(c['mae'] for c in casos), 1),
            'err_margen': round(statistics.mean(abs(c['pm'] - c['rm']) for c in casos), 1)}


def main():
    cabs = [x['cab'] for x in json.loads((REPO / 'data' / 'estados.json').read_text(encoding='utf-8'))]
    ST = [cargar(c) for c in cabs]
    # 1) parámetros de cada estado (a, sw) con el método de pipeline/proyeccion.py, elegidos con la OTRA elección
    #    de prueba: para medir 2024 se eligen con 2021 y al revés. Nada se mide contra lo mismo con que se ajustó.
    import proyeccion as PY
    PRM = {'proy': 1}; POOL = {}
    for st in ST:
        d, P_, S_, E_ = PY.carga(st['cab']); objs = PY.objetivos(E_); cache = {}
        def err(g, o):
            if (g, o[0]) not in cache:
                R, Rks = PY.reciente(E_, o[2]); pr = PY.predice(E_, o[1], R, Rks, *g); act = E_[o[0]]; niv = PY.NIV[act['t']]
                cache[(g, o[0])] = (PY.errores(S_, act, pr, 'est')[0], PY.errores(S_, act, pr, niv)[0] if niv != 'est' else [])
            return cache[(g, o[0])]
        for Y in (2021, 2024):  # errores juntando los 32 estados: se elige UNA combinación nacional (igual que proyeccion.py)
            for o in objs:
                if E_[o[0]]['y'] != Y:
                    for g in PY.GRID:
                        es, un = err(g, o); POOL.setdefault((Y, g), ([], [])); POOL[(Y, g)][0].extend(es); POOL[(Y, g)][1].extend(un)
    for Y in (2021, 2024):
        gY = min(PY.GRID, key=lambda g: (statistics.mean(POOL[(Y, g)][0]) if POOL.get((Y, g)) and POOL[(Y, g)][0] else 0) + (statistics.mean(POOL[(Y, g)][1]) if POOL.get((Y, g)) and POOL[(Y, g)][1] else 0))
        print('combinación nacional para medir', Y, gY)
        for st in ST:
            PRM.setdefault(st['cab'], {})[Y] = gY
    best = {2021: PRM, 2024: PRM}; INC = {2021: 0, 2024: 0}; final = {'proy': 'una combinación nacional, ver privado/<estado>.json meta.proy'}
    # 2) validación cruzada: pesos de un año aplicados al otro
    rep = {'metodo': 'mismo cálculo de la Estrategia (última elección del cargo + promedio del año más reciente, con oscilación estatal opcional; parámetros por estado) + incertidumbre común/local; validación cruzada 2021↔2024',
           'pesos': {}, 'por_tipo': {}, 'por_estado': {}, 'calibracion': {}}
    todos = []
    for Y, prmY in ((2024, best[2021]), (2021, best[2024])):
        rep['pesos'][str(Y)] = {c: v[Y] for c, v in prmY.items() if c != 'proy'}
        for st in ST:
            for ek in objetivos(st, Y):
                for c in evaluar(st, ek, prmY, inc=INC[2021 if Y == 2024 else 2024]):
                    c.update(cab=st['cab'], t=st['E'][ek]['t'], y=Y); todos.append(c)
                for c in ingenuo(st, ek):
                    c.update(cab=st['cab'], t=st['E'][ek]['t'], y=Y, naive=1); todos.append(c)
    M = [c for c in todos if not c.get('naive')]; NV = [c for c in todos if c.get('naive')]
    for t in TARGETS:
        for Y in (2021, 2024):
            rep['por_tipo'][f'{t}_{Y}'] = {'modelo': resumen([c for c in M if c['t'] == t and c['y'] == Y]),
                                           'repetir_ultima': resumen([c for c in NV if c['t'] == t and c['y'] == Y])}
    for st in ST:
        rep['por_estado'][st['cab']] = {'modelo': resumen([c for c in M if c['cab'] == st['cab']]), 'repetir_ultima': resumen([c for c in NV if c['cab'] == st['cab']])}
    # 3) incertidumbre: error del margen = común (estado-elección) + local
    sig = {}
    for t in TARGETS:
        cs = [c for c in M if c['t'] == t]
        if not cs:
            continue
        grp = {}
        for c in cs:
            grp.setdefault((c['cab'], c['y']), []).append(c['rm'] - c['pm'])
        com = [statistics.mean(v) for v in grp.values()]
        loc = [x - statistics.mean(v) for v in grp.values() for x in v]
        sig[t] = {'comun': round(statistics.pstdev(com), 2), 'local': round(statistics.pstdev(loc), 2) if len(loc) > 1 else 0}
    rep['sigma'] = sig
    # 4) calibración: probabilidad de que gane el que va adelante vs. lo que pasó
    # probabilidad calibrada: logística P(gana el favorito) = 1/(1+exp(-a·margen)), a ajustada con el otro año
    def fit_a(cs):
        best_a, best_l = 0.05, 1e9
        for a in [x / 1000 for x in range(5, 300, 5)]:
            l = -sum(math.log(max(1e-9, (1 / (1 + math.exp(-a * c['pm']))) if c['ok'] else 1 - 1 / (1 + math.exp(-a * c['pm'])))) for c in cs)
            if l < best_l: best_a, best_l = a, l
        return best_a
    A = {(t, Y): fit_a([c for c in M if c['t'] == t and c['y'] != Y]) for t in TARGETS for Y in (2021, 2024) if any(c['t'] == t and c['y'] != Y for c in M)}
    rep['logistica'] = {f'{t}_{Y}': a for (t, Y), a in A.items()}
    rep['logistica_final'] = {t: fit_a([c for c in M if c['t'] == t]) for t in TARGETS if any(c['t'] == t for c in M)}
    bins = [(50, 60), (60, 70), (70, 80), (80, 90), (90, 101)]
    cal = {f'{a}-{b}': [0, 0] for a, b in bins}
    brier = []
    for c in M:
        s = sig.get(c['t'])
        if not s:
            continue
        a = A.get((c['t'], c['y']))
        if a is None: continue
        p = 100 / (1 + math.exp(-a * c['pm']))
        brier.append((p / 100 - c['ok']) ** 2)
        for a, b in bins:
            if a <= p < b:
                cal[f'{a}-{b}'][0] += 1; cal[f'{a}-{b}'][1] += c['ok']
    rep['calibracion'] = {k: {'casos': v[0], 'gano_el_favorito_%': round(100 * v[1] / v[0], 1) if v[0] else None} for k, v in cal.items()}
    rep['brier'] = round(statistics.mean(brier), 3) if brier else None
    rep['global'] = {'modelo': resumen(M), 'repetir_ultima': resumen(NV)}
    rep['final'] = final
    rep['por_estado_tipo'] = {st['cab']: {t: resumen([c for c in M if c['cab'] == st['cab'] and c['t'] == t]) for t in TARGETS} for st in ST}
    rep['por_estado_tipo_ingenuo'] = {st['cab']: {t: resumen([c for c in NV if c['cab'] == st['cab'] and c['t'] == t]) for t in TARGETS} for st in ST}
    # 5) cuánto mejora con encuesta estatal (perfecta y con error típico de ±3 pts)
    rng = np.random.default_rng(7); enc = {}
    for err in (0, 3):
        cs = []
        for Y, prmY in ((2024, best[2021]), (2021, best[2024])):
            for st in ST:
                for ek in objetivos(st, Y):
                    for c in evaluar(st, ek, prmY, encuesta=err, rng=rng):
                        c.update(t=st['E'][ek]['t']); cs.append(c)
        enc[f'encuesta_error_{err}'] = {'global': resumen(cs), **{t: resumen([c for c in cs if c['t'] == t]) for t in TARGETS}}
    rep['con_encuesta'] = enc
    print('con encuesta', json.dumps(enc, ensure_ascii=False))
    # 6) parámetros para la plataforma (data/modelo.json): la proyección se calcula en el navegador con estos valores
    fin = {'proy': 1}
    pe = {}
    for st in ST:
        d = {}
        for t in TARGETS:
            m_ = [c for c in M if c['cab'] == st['cab'] and c['t'] == t]; n_ = [c for c in NV if c['cab'] == st['cab'] and c['t'] == t]
            if m_:
                em = sorted(abs(c['pm'] - c['rm']) for c in m_)  # error del margen (validación cruzada): el 80 % fue menor a q80
                d[t] = {'n': len(m_), 'acierto': round(100 * statistics.mean(c['ok'] for c in m_)), 'repetir': round(100 * statistics.mean(c['ok'] for c in n_)) if n_ else None,
                        'mae': round(statistics.mean(c['mae'] for c in m_), 1), 'q80': round(em[min(len(em) - 1, int(.8 * len(em)))], 1)}
        m_ = [c for c in M if c['cab'] == st['cab']]; n_ = [c for c in NV if c['cab'] == st['cab']]
        d['todo'] = {'n': len(m_), 'acierto': round(100 * statistics.mean(c['ok'] for c in m_)), 'repetir': round(100 * statistics.mean(c['ok'] for c in n_)) if n_ else None, 'mae': round(statistics.mean(c['mae'] for c in m_), 1)}
        pe[st['cab']] = d
    nac = {t: {'solo': round(100 * statistics.mean(c['ok'] for c in M if c['t'] == t)), 'encuesta': round(enc['encuesta_error_3'][t]['acierto']) if enc['encuesta_error_3'].get(t) else None} for t in TARGETS if any(c['t'] == t for c in M)}
    # 7) probabilidad por simulación de bloques (la que usa la plataforma) y su tabla de calibración
    rng2 = np.random.default_rng(3); cb_ = {}; cbt_ = {}  # cbt_: la misma tabla por cargo (ayuntamientos es más incierto)
    for st in ST:
        for Y, prmY in ((2024, best[2021]), (2021, best[2024])):
            for ek in objetivos(st, Y):
                e = st['E'][ek]; T = e['t']; pr = base_proy(st, Y, T, *prmY[st['cab']][Y])
                if pr is None: continue
                w = st['ln'] * turnout(st, Y)
                P = bloques_unidad(st, pr, w, T, e['bl'], ek=ek, pred=True); R = bloques_unidad(st, e['sh'], np.nan_to_num(e['val']), T, e['bl'], ek=ek)
                us = [u for u in P if u in R and not any(math.isnan(x) for x in P[u])]
                if not us or T not in sig: continue
                nb = max(len(P[u]) for u in us)  # cada unidad puede tener distinto número de bloques: se rellena
                S_ = np.array([P[u] + [-1.0] * (nb - len(P[u])) for u in us]) * 100; A = np.array([R[u] + [-1.0] * (nb - len(R[u])) for u in us])
                cbs = rng2.normal(0, sig[T]['comun'] / math.sqrt(2), (1500, 1, nb)); loc = rng2.normal(0, sig[T]['local'] / math.sqrt(2), (1500, len(us), nb))
                # el error medido es el del margen entre los dos primeros; a los partidos menores se les aplica en proporción a su tamaño
                # (si no, un partido con 3 % "gana" en algunos escenarios solo por el ruido)
                seg = np.sort(S_, 1)[:, -2:-1] if nb > 1 else S_; g_ = np.clip(S_ / np.maximum(seg, 1e-6), 0, 1)
                fav = S_.argmax(1); pf = ((S_[None] + g_[None] * (cbs + loc)).argmax(2) == fav[None]).mean(0); okv = A.argmax(1) == fav
                for p_, o_ in zip(pf, okv):
                    k_ = min(9, int(p_ * 10)); cb_.setdefault(k_, [0, 0]); cb_[k_][0] += 1; cb_[k_][1] += int(o_)
                    cbt_.setdefault(T, {}).setdefault(k_, [0, 0]); cbt_[T][k_][0] += 1; cbt_[T][k_][1] += int(o_)
    cal_sim = [[round(k_ / 10 + .05, 2), round(v[1] / v[0], 3), v[0]] for k_, v in sorted(cb_.items()) if v[0] >= 20]
    print('calibración de la simulación', cal_sim)
    cal_sim_t = {T: [[round(k_ / 10 + .05, 2), round(v[1] / v[0], 3), v[0]] for k_, v in sorted(t_.items()) if v[0] >= 20] for T, t_ in cbt_.items()}
    print('calibración por cargo', cal_sim_t)
    # cargos con pocos casos (gubernatura: uno por estado y año) usan la tabla de los cargos que no son municipales:
    # en ayuntamientos el favorito pierde más seguido y arrastraría la tabla general hacia abajo
    cm_ = {}
    for T, t_ in cbt_.items():
        if T == 'AYU': continue
        for k_, v in t_.items(): cm_.setdefault(k_, [0, 0]); cm_[k_][0] += v[0]; cm_[k_][1] += v[1]
    cal_sim_m = [[round(k_ / 10 + .05, 2), round(v[1] / v[0], 3), v[0]] for k_, v in sorted(cm_.items()) if v[0] >= 20]
    print('calibración sin ayuntamientos', cal_sim_m, 'casos de gubernatura', {k: v for k, v in sorted(cbt_.get('GOB', {}).items())})
    MOD = {'version': 1, 'cal_sim': cal_sim, 'cal_sim_t': cal_sim_t, 'cal_sim_m': cal_sim_m, 'metodo': rep['metodo'], 'pesos': fin, 'a': rep['logistica_final'], 'sigma': sig,
           'calibracion': rep['calibracion'], 'nacional': nac, 'estados': pe}
    vs = REPO / 'pipeline' / 'insumos' / 'validacion_secciones.json'  # ver pipeline/val_secciones.py
    if vs.exists():
        MOD['sec'] = json.loads(vs.read_text(encoding='utf-8'))
    (REPO / 'data' / 'modelo.json').write_text(json.dumps(MOD, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    out = REPO / 'pipeline' / 'insumos' / 'validacion.json'
    out.write_text(json.dumps(rep, ensure_ascii=False, indent=1), encoding='utf-8')
    print(json.dumps(rep['global'], ensure_ascii=False)); print(json.dumps(rep['por_tipo'], ensure_ascii=False)); print('sigma', sig); print('calibración', rep['calibracion'], 'brier', rep['brier'])


if __name__ == '__main__':
    main()
