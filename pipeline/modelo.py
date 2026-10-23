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
TARGETS = {'AYU': 'm', 'DIPL': 'dl', 'DIPF': 'df', 'GOB': None}
CYCLE = lambda y: 'mid' if y in (2015, 2021, 2027) else 'pres' if y in (2018, 2024) else 'off'
GRID = {'wt': [0.25, 0.5, 1.0], 'wc': [1.0, 2.0, 4.0], 'decay': [0.6, 0.8, 1.0], 'lam': [0.0, 0.3, 0.6]}


def cargar(cab):
    d = json.loads((REPO / 'data' / f'{cab}.json').read_text(encoding='utf-8'))
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
                 'cc': e.get('cc', [])}
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


def turnout(st, Y):
    """Participación esperada por sección: promedio de las elecciones del mismo tipo de año (o todas si no hay)."""
    xs = [e['tp'] for e in st['E'].values() if e['y'] < Y and CYCLE(e['y']) == CYCLE(Y)] or [e['tp'] for e in st['E'].values() if e['y'] < Y]
    with np.errstate(invalid='ignore'):
        m = np.nanmean(np.vstack(xs), 0)
    return np.where(np.isnan(m), np.nanmean(m), m)


def unidades(st, T):
    k = TARGETS[T]
    return np.zeros(st['N'], int) if k is None else st['unit'][k]


def bloques_unidad(st, sh, w, T, bl):
    """Participación de cada bloque por unidad, ponderando secciones por w."""
    P = st['P']; ix = {p: j for j, p in enumerate(P)}; U = unidades(st, T)
    ok = ~np.isnan(sh[:, 0]) & (w > 0)
    out = {}
    for u in np.unique(U[ok]):
        m = ok & (U == u); ww = w[m]; s = (sh[m] * ww[:, None]).sum(0) / ww.sum()
        out[int(u)] = [sum(s[ix[p]] for p in b if p in ix) for b in bl]
    return out


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
    R = bloques_unidad(st, e['sh'], np.nan_to_num(e['val']), T, e['bl'])
    P = st['P']; ix = {p: j for j, p in enumerate(P)}
    return {u: max(e['bl'][max(range(len(v)), key=lambda j: v[j])], key=lambda p: -MAIN_ORD.get(p, 99)) for u, v in R.items() if v and not any(math.isnan(x) for x in v)}


MAIN_ORD = {p: -i for i, p in enumerate(['MORENA', 'PAN', 'PRI', 'MC', 'PVEM', 'PT', 'PRD'])}


def evaluar(st, ek, prm, encuesta=None, rng=None, inc=0.0):
    """Predice la elección ek con datos anteriores y compara por unidad. Devuelve lista de casos.
    encuesta=None: solo resultados. encuesta=e (puntos): se simula una encuesta estatal con error e (0 = perfecta),
    que corrige el nivel estatal de cada bloque; el reparto territorial sigue saliendo del histórico."""
    e = st['E'][ek]; T, Y = e['t'], e['y']
    pr = base(st, Y, T, **prm)
    w_pred = st['ln'] * turnout(st, Y)
    w_true = np.nan_to_num(e['val'])
    P = bloques_unidad(st, pr, w_pred, T, e['bl'])
    R = bloques_unidad(st, e['sh'], w_true, T, e['bl'])
    if inc and T in ('AYU', 'GOB'):
        gp = ganador_previo(st, T, Y)
        P = {u: [v + (inc / 100 if gp.get(u) in e['bl'][j] else 0) for j, v in enumerate(p)] for u, p in P.items()}
    if encuesta is not None:
        pe = estatal(st, pr, w_pred, e['bl']); re_ = estatal(st, e['sh'], w_true, e['bl'])
        enc = [x + (rng.normal(0, encuesta / 100) if encuesta else 0) for x in re_]
        P = {u: [v + (enc[j] - pe[j]) for j, v in enumerate(p)] for u, p in P.items()}
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
    P = bloques_unidad(st, sh, st['ln'] * turnout(st, Y), T, e['bl'])
    R = bloques_unidad(st, e['sh'], np.nan_to_num(e['val']), T, e['bl'])
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
    combos = [dict(zip(GRID, v)) for v in itertools.product(*GRID.values())]
    # 1) búsqueda de pesos: puntaje = error medio por unidad (cada estado pesa lo mismo)
    def puntaje(Y, prm):
        cs = [c for st in ST for ek in objetivos(st, Y) for c in evaluar(st, ek, prm)]
        return statistics.mean(c['mae'] for c in cs) + 2 * (1 - statistics.mean(c['ok'] for c in cs))
    best = {}
    for Y in (2021, 2024):
        sc = sorted(((puntaje(Y, p), i) for i, p in enumerate(combos)))
        best[Y] = combos[sc[0][1]]
        print(f'mejores pesos ajustando con {Y}: {best[Y]}  (puntaje {sc[0][0]:.2f})')
    # pesos finales para 2027: los que mejor predicen 2021 y 2024 juntos
    scf = sorted(((puntaje(2021, p) + puntaje(2024, p), i) for i, p in enumerate(combos)))
    final = combos[scf[0][1]]; print('pesos finales', final)
    # 1b) efecto de quien ya gobierna (solo ayuntamientos): se prueba +0, +3, +6 puntos
    def p_inc(Y, prm, inc):
        cs = [c for st in ST for ek in objetivos(st, Y) if st['E'][ek]['t'] == 'AYU' for c in evaluar(st, ek, prm, inc=inc)]
        return statistics.mean(c['mae'] for c in cs) + 2 * (1 - statistics.mean(c['ok'] for c in cs)), resumen(cs)
    INC = {}
    for Y in (2021, 2024):
        res = {i: p_inc(Y, best[Y], i) for i in (0, 3, 6)}
        INC[Y] = min(res, key=lambda i: res[i][0]); print('incumbencia', Y, {i: v[1] for i, v in res.items()})
    # 2) validación cruzada: pesos de un año aplicados al otro
    rep = {'metodo': 'base histórica ponderada + tendencia amortiguada + incertidumbre común/local; validación cruzada 2021↔2024',
           'pesos': {}, 'por_tipo': {}, 'por_estado': {}, 'calibracion': {}}
    todos = []
    for Y, prmY in ((2024, best[2021]), (2021, best[2024])):
        rep['pesos'][str(Y)] = prmY
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
    fin = {k: round(statistics.mean([best[2021][k], best[2024][k]]), 3) for k in GRID}
    pe = {}
    for st in ST:
        d = {}
        for t in TARGETS:
            m_ = [c for c in M if c['cab'] == st['cab'] and c['t'] == t]; n_ = [c for c in NV if c['cab'] == st['cab'] and c['t'] == t]
            if m_: d[t] = {'n': len(m_), 'acierto': round(100 * statistics.mean(c['ok'] for c in m_)), 'repetir': round(100 * statistics.mean(c['ok'] for c in n_)) if n_ else None, 'mae': round(statistics.mean(c['mae'] for c in m_), 1)}
        m_ = [c for c in M if c['cab'] == st['cab']]; n_ = [c for c in NV if c['cab'] == st['cab']]
        d['todo'] = {'n': len(m_), 'acierto': round(100 * statistics.mean(c['ok'] for c in m_)), 'repetir': round(100 * statistics.mean(c['ok'] for c in n_)) if n_ else None, 'mae': round(statistics.mean(c['mae'] for c in m_), 1)}
        pe[st['cab']] = d
    nac = {t: {'solo': round(100 * statistics.mean(c['ok'] for c in M if c['t'] == t)), 'encuesta': round(enc['encuesta_error_3'][t]['acierto']) if enc['encuesta_error_3'].get(t) else None} for t in TARGETS if any(c['t'] == t for c in M)}
    # 7) probabilidad por simulación de bloques (la que usa la plataforma) y su tabla de calibración
    rng2 = np.random.default_rng(3); cb_ = {}
    for st in ST:
        for Y, prmY in ((2024, best[2021]), (2021, best[2024])):
            for ek in objetivos(st, Y):
                e = st['E'][ek]; T = e['t']; pr = base(st, Y, T, **prmY); w = st['ln'] * turnout(st, Y)
                P = bloques_unidad(st, pr, w, T, e['bl']); R = bloques_unidad(st, e['sh'], np.nan_to_num(e['val']), T, e['bl'])
                us = [u for u in P if u in R and not any(math.isnan(x) for x in P[u])]
                if not us or T not in sig: continue
                S_ = np.array([P[u] for u in us]) * 100; A = np.array([R[u] for u in us]); nb = S_.shape[1]
                cbs = rng2.normal(0, sig[T]['comun'] / math.sqrt(2), (1500, 1, nb)); loc = rng2.normal(0, sig[T]['local'] / math.sqrt(2), (1500, len(us), nb))
                fav = S_.argmax(1); pf = ((S_[None] + cbs + loc).argmax(2) == fav[None]).mean(0); okv = A.argmax(1) == fav
                for p_, o_ in zip(pf, okv):
                    k_ = min(9, int(p_ * 10)); cb_.setdefault(k_, [0, 0]); cb_[k_][0] += 1; cb_[k_][1] += int(o_)
    cal_sim = [[round(k_ / 10 + .05, 2), round(v[1] / v[0], 3), v[0]] for k_, v in sorted(cb_.items()) if v[0] >= 20]
    print('calibración de la simulación', cal_sim)
    MOD = {'version': 1, 'cal_sim': cal_sim, 'metodo': rep['metodo'], 'pesos': fin, 'a': rep['logistica_final'], 'sigma': sig,
           'calibracion': rep['calibracion'], 'nacional': nac, 'estados': pe}
    (REPO / 'data' / 'modelo.json').write_text(json.dumps(MOD, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    out = REPO / 'pipeline' / 'insumos' / 'validacion.json'
    out.write_text(json.dumps(rep, ensure_ascii=False, indent=1), encoding='utf-8')
    print(json.dumps(rep['global'], ensure_ascii=False)); print(json.dumps(rep['por_tipo'], ensure_ascii=False)); print('sigma', sig); print('calibración', rep['calibracion'], 'brier', rep['brier'])


if __name__ == '__main__':
    main()
