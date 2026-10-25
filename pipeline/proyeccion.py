"""Calibración del modelo de proyección 2027 (se guarda en data/<clave>.json, meta.proy).

Método
1. Votación por sección: mezcla de la última elección del mismo cargo y del promedio de las elecciones
   del año más reciente, con o sin oscilación proporcional estatal (la última elección del mismo cargo
   se ajusta al cambio que cada partido tuvo en todo el estado). Se prueban 10 combinaciones y se elige UNA para todo el país (con los 32 estados juntos).
2. Prueba contra el pasado: cada combinación "pronostica" las elecciones de 2021 y 2024 (después del cambio
   de 2018 en el sistema de partidos) usando solo
   datos anteriores, y se compara contra el resultado real (error en la diferencia entre 1.º y 2.º lugar
   y acierto del ganador, por estado y por municipio o distrito). Se elige la de menor error.
3. Participación: se prueban tres reglas (misma elección de hace 6 años, mismo ciclo electoral; la última
   elección; el promedio) y se elige la de menor error por sección.
4. Alianzas: en la plataforma se suman completos los votos de sus partidos (en la boleta cada partido conserva su logo
   y sus votos se suman al candidato común). Aquí todavía se calcula, solo como diagnóstico, un "rendimiento" comparando
   elecciones del mismo día donde fueron juntos y separados; NO se usa porque mezcla el arrastre de la otra elección
   (p. ej. la presidencial de 2024) y da valores sin sentido (más de 100 %).
5. Rango: el 80 % de los errores de la prueba fue menor a este valor; se muestra como ± en la diferencia.

Uso: python pipeline/proyeccion.py   (procesa todos los data/*.json)
"""
import json
import os
import statistics as stt
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
PLANO = ROOT / 'privado'  # datos completos sin cifrar (solo local)
NIV = {'GOB': 'est', 'SEN': 'est', 'PRE': 'est', 'DIPL': 'dl', 'DIPF': 'df', 'AYU': 'mun'}
DESDE = 2021  # el sistema de partidos cambió en 2018 (llegada de Morena); se prueba con 2021 y 2024
GRID = [(a, sw) for sw in (0, 1) for a in (0, .25, .5, .75, 1)]


def q(v, p):
    v = sorted(v)
    if not v:
        return None
    k = (len(v) - 1) * p
    f = int(k)
    return v[f] + (v[min(f + 1, len(v) - 1)] - v[f]) * (k - f)


def carga(c):
    d = json.load(open(PLANO / f'{c}.json', encoding='utf-8'))
    P = d['P8']; NP = len(P); S = d['S']; E = {}
    for ek, e in d['E'].items():
        sh, tp, val = {}, {}, {}
        for i, r in enumerate(e['r']):
            if not r:
                continue
            v = sum(r[:NP])
            if v <= 0:
                continue
            sh[i] = [x / v for x in r[:NP]]
            val[i] = v
            if r[NP + 1]:
                tp[i] = r[NP] / r[NP + 1]
        if not sh:
            continue          # elección sin votos por sección (p. ej. sin archivo): no sirve para calibrar
        E[ek] = {'t': e['type'], 'y': int(e['year']), 'sh': sh, 'tp': tp, 'val': val, 'bl': [[P.index(m) for m in b['members'] if m in P] for b in e['blocs']]}
    return d, P, S, E


def estatal(E, ek):
    e = E[ek]; tot = None; V = 0
    for i, s in e['sh'].items():
        w = e['val'][i]; V += w
        tot = [w * x for x in s] if tot is None else [a + w * x for a, x in zip(tot, s)]
    return [x / V for x in tot] if tot else None


def reciente(E, y):
    ks = [k for k, e in E.items() if e['y'] == y]
    out = {}
    for k in ks:
        for i, s in E[k]['sh'].items():
            a = out.setdefault(i, [[0] * len(s), 0])
            a[0] = [p + x for p, x in zip(a[0], s)]; a[1] += 1
    return {i: [x / n for x in v] for i, (v, n) in out.items()}, ks


def predice(E, L, R, Rks, a, sw):
    """Votación prevista por sección (lista de proporciones por partido)."""
    base = E[L]['sh']
    if sw:
        sL = estatal(E, L)
        rs = [x for x in (estatal(E, k) for k in Rks) if x]
        if not sL or not rs:
            sw = False
    if sw:
        sR = [sum(x[j] for x in rs) / len(rs) for j in range(len(sL))]
        f = [min(5, max(.2, sR[j] / sL[j])) if sL[j] > 1e-4 else 0 for j in range(len(sL))]
    out = {}
    for i in set(base) | set(R):
        b = base.get(i) or R.get(i); r = R.get(i) or b
        if sw:
            b = [x * f[j] for j, x in enumerate(b)]; t = sum(b) or 1; b = [x / t for x in b]
        p = [a * x + (1 - a) * y for x, y in zip(b, r)]; t = sum(p) or 1
        out[i] = [x / t for x in p]
    return out


def margen(sh_by_i, val, ii, bl):
    tot = None; V = 0
    for i in ii:
        s = sh_by_i.get(i)
        if s is None or i not in val:
            continue
        w = val[i]; V += w
        tot = [w * x for x in s] if tot is None else [a + w * x for a, x in zip(tot, s)]
    if not V:
        return None
    b = sorted(((sum(tot[j] for j in m) / V, k) for k, m in enumerate(bl)), reverse=True)
    return b


def unidades(S, niv):
    g = {}
    for i, s in enumerate(S):
        k = 0 if niv == 'est' else s[1] if niv == 'mun' else s[2] if niv == 'dl' else s[3]
        g.setdefault(k, []).append(i)
    return g


def objetivos(E):
    """Elecciones que se pueden pronosticar con datos anteriores."""
    out = []
    for ek, e in E.items():
        prev_same = sorted([k for k, x in E.items() if x['t'] == e['t'] and x['y'] < e['y']], key=lambda k: E[k]['y'])
        prev_years = sorted({x['y'] for x in E.values() if x['y'] < e['y']})
        if prev_same and prev_years and e['y'] >= DESDE:
            out.append((ek, prev_same[-1], prev_years[-1]))
    return out


def ajusta(pr, act):
    """Ajuste proporcional al resultado estatal conocido (equivale a tener una encuesta estatal exacta)."""
    sA = estatal_d(act['sh'], act['val']); sP = estatal_d(pr, act['val'])
    f = [sA[j] / sP[j] if sP[j] > 1e-6 else 0 for j in range(len(sA))]
    out = {}
    for i, s in pr.items():
        v = [x * f[j] for j, x in enumerate(s)]; t = sum(v) or 1; out[i] = [x / t for x in v]
    return out


def estatal_d(sh, val):
    tot = None; V = 0
    for i, s in sh.items():
        w = val.get(i, 0); V += w
        tot = [w * x for x in s] if tot is None else [a + w * x for a, x in zip(tot, s)]
    return [x / V for x in tot]


def errores(S, act, pr, niv):
    e, h = [], []
    for k, ii in unidades(S, niv).items():
        A = margen(act['sh'], act['val'], ii, act['bl']); B = margen(pr, act['val'], ii, act['bl'])
        if not A or not B or len(A) < 2:
            continue
        w1, w2 = A[0][1], A[1][1]; pb = dict((kk, v) for v, kk in B)
        e.append(abs((pb[w1] - pb[w2]) - (A[0][0] - A[1][0])) * 100); h.append(1 if B[0][1] == w1 else 0)
    return e, h


def resumen(e, h=None):
    if not e:
        return None
    o = {'n': len(e), 'mae': round(stt.mean(e), 1), 'q80': round(q(e, .8), 1)}
    if h:
        o['hit'] = round(100 * stt.mean(h))
    return o


def errores_grid(d, P, S, E):
    """Errores de cada combinación (a, sw) en este estado, para elegir una sola combinación nacional."""
    objs = objetivos(E); res = {}
    for a, sw in GRID:
        est, uni = [], []
        for ek, L, Ry in objs:
            R, Rks = reciente(E, Ry); pr = predice(E, L, R, Rks, a, sw); act = E[ek]
            est += errores(S, act, pr, 'est')[0]
            if NIV[act['t']] != 'est':
                uni += errores(S, act, pr, NIV[act['t']])[0]
        res[(a, sw)] = (est, uni)
    return res


def prueba(d, P, S, E, best):
    """Errores y participación del estado con la combinación nacional `best`."""
    objs = objetivos(E)
    est, tipos = [], {}
    for ek, L, Ry in objs:
        R, Rks = reciente(E, Ry); pr = predice(E, L, R, Rks, *best); act = E[ek]; t = act['t']; niv = NIV[t]
        est += errores(S, act, pr, 'est')[0]
        if niv != 'est':
            T = tipos.setdefault(t, {'e': [], 'h': [], 'ee': [], 'eh': []})
            e, h = errores(S, act, pr, niv); T['e'] += e; T['h'] += h
            e, h = errores(S, act, ajusta(pr, act), niv); T['ee'] += e; T['eh'] += h
    # participación
    tpr = {'ciclo': [], 'ultima': [], 'prom': []}
    for ek, L, Ry in objs:
        e = E[ek]
        c6 = [k for k, x in E.items() if x['t'] == e['t'] and x['y'] == e['y'] - 6] or [k for k, x in E.items() if x['y'] == e['y'] - 6]
        lr = [k for k, x in E.items() if x['y'] == Ry]
        for i, t in e['tp'].items():
            def av(ks):
                v = [E[k]['tp'][i] for k in ks if i in E[k]['tp']]
                return sum(v) / len(v) if v else None
            a6, al = av(c6), av(lr)
            if a6 is not None:
                tpr['ciclo'].append(abs(a6 - t))
            if al is not None:
                tpr['ultima'].append(abs(al - t))
            if a6 is not None and al is not None:
                tpr['prom'].append(abs((a6 + al) / 2 - t))
    tsel = min((k for k in tpr if tpr[k]), key=lambda k: stt.mean(tpr[k]))
    return {'a': best[0], 'sw': best[1], 'objs': [o[0] for o in objs], 'est': resumen(est),
            'tipos': {t: {'hist': resumen(v['e'], v['h']), 'enc': resumen(v['ee'], v['eh'])} for t, v in tipos.items()},
            'tp': tsel, 'tp_err': round(100 * stt.mean(tpr[tsel]), 1)}


def transferencias(P, E):
    """Rendimiento de alianzas en elecciones del mismo día (estatal)."""
    out = []
    years = {e['y'] for e in E.values()}
    for y in years:
        ks = [k for k, e in E.items() if e['y'] == y]
        for A in ks:
            for B in ks:
                if A == B:
                    continue
                sA, sB = estatal(E, A), estatal(E, B)
                for m in E[A]['bl']:
                    m = [j for j in m if sA[j] > 0]
                    if len(m) < 2:
                        continue
                    sep = all(any(set(b) == {j} for b in E[B]['bl']) for j in m)
                    if not sep:
                        continue
                    sb = sorted((sB[j] for j in m), reverse=True)
                    if sb[0] <= 0 or sum(sb[1:]) < .01:
                        continue
                    coal = sum(sA[j] for j in m)
                    out.append(((coal - sb[0]) / sum(sb[1:]), A, B, [P[j] for j in m], E[A]['y']))
    return out


def regla_mov(c):
    """Secciones que un partido perdió por menos de 10 puntos y ganó en la siguiente elección del mismo cargo
    (2018 en adelante): ¿ganó sacando más votantes (movilización) o quitándole votos al rival (convencimiento)?
    Se prueba la regla: movilizar si la participación quedó al menos `th` por debajo del máximo histórico de la sección."""
    d = json.load(open(PLANO / f'{c}.json', encoding='utf-8')); P = d['P8']; NP = len(P); E = d['E']; out = []
    for t in ('DIPL', 'DIPF', 'AYU'):
        ys = sorted(int(e['year']) for e in E.values() if e['type'] == t and int(e['year']) >= 2018)
        for y0, y1 in zip(ys, ys[1:]):
            A = E[f'{t}_{y0}']['r']; B = E[f'{t}_{y1}']['r']; prev = [k for k, e in E.items() if int(e['year']) <= y0]
            for q in ('MORENA', 'PAN', 'PRI', 'MC'):
                if q not in P:
                    continue
                j = P.index(q)
                for i, (a, b) in enumerate(zip(A, B)):
                    if not a or not b or not a[NP + 1] or not b[NP + 1] or sum(a[:NP]) <= 0:
                        continue
                    rk = max((k for k in range(NP) if k != j), key=lambda k: a[k]); mg0 = 100 * (a[j] - a[rk]) / sum(a[:NP])
                    if not (-10 < mg0 < 0) or b[j] <= max(b[k] for k in range(NP) if k != j):
                        continue
                    dr = b[rk] - a[rk]; dt = b[NP] - a[NP]
                    tps = [E[k]['r'][i][NP] / E[k]['r'][i][NP + 1] for k in prev if E[k]['r'][i] and E[k]['r'][i][NP + 1]]
                    out.append((dr >= 0 or dt > abs(dr), max(tps) - a[NP] / a[NP + 1]))
    return out


def registro(c, d):
    """Partidos que no tendrían registro en 2027 en el estado (ver pipeline/insumos/registro_2027.json)."""
    cf = json.load(open(ROOT / 'pipeline' / 'insumos' / 'registro_2027.json', encoding='utf-8'))
    ec = cf['estados'].get(c, {}); P = d['P8']; NP = len(P); E = d['E']
    ks = [k for k, e in E.items() if e['type'] in ('DIPL', 'GOB')]
    ym = max(E[k]['year'] for k in ks); ks = [k for k in ks if E[k]['year'] == ym]
    sh = {}
    for k in ks:
        t = [0] * NP
        for r in E[k]['r']:
            if r:
                for q in range(NP):
                    t[q] += r[q]
        for j, p in enumerate(P):
            sh[p] = max(sh.get(p, 0), 100 * t[j] / (sum(t) or 1))
    sin, conf, est = [], [], []
    for p in P:
        if p in cf['nacionales'] or p in ('OTROS', 'IND'):
            continue
        if p in ec.get('conservan', []):
            conf.append(p)
        elif p in cf['ex_nacionales'] or sh.get(p, 0) < 3:
            sin.append(p)
        else:
            est.append(p)
    return {'sin': sin, 'conf': conf, 'por_confirmar': est, 'nuevos': ec.get('nuevos', []) + cf['nacionales_nuevos'], 'fuentes': ec.get('fuentes', []), 'año': ym}


def main():
    cabs = sorted(p.stem for p in PLANO.glob('*.json') if p.stem != 'claves')
    todos, tr = {}, []
    # Una sola combinación (a, sw) para todo el país: probada con los 32 estados juntos predice mejor que elegir una
    # por estado (con pocos municipios o distritos, elegir por estado se ajusta al azar de esas pocas elecciones).
    grid = {g: ([], []) for g in GRID}; cargados = {}
    for c in cabs:
        d, P, S, E = carga(c); cargados[c] = (d, P, S, E)
        for g, (es, un) in errores_grid(d, P, S, E).items():
            grid[g][0].extend(es); grid[g][1].extend(un)
        tr += [(c,) + t for t in transferencias(P, E)]
    best = min(GRID, key=lambda g: (stt.mean(grid[g][0]) if grid[g][0] else 0) + (stt.mean(grid[g][1]) if grid[g][1] else 0))
    print('combinación nacional', best)
    for c in cabs:
        d, P, S, E = cargados[c]
        todos[c] = (d, prueba(d, P, S, E, best))
    mv = []
    for c in cabs:
        mv += regla_mov(c)
    base = sum(m for m, _ in mv) / len(mv) if mv else 0
    best = max((.05, .1, .15, .2), key=lambda th: (sum(m for m, u in mv if u >= th) / max(1, sum(1 for _, u in mv if u >= th))) if sum(1 for _, u in mv if u >= th) >= 200 else 0)
    sel = [m for m, u in mv if u >= best]
    mov = {'th': best, 'prec': round(100 * sum(sel) / max(1, len(sel))), 'base': round(100 * base), 'n': len(mv), 'n_sel': len(sel)}
    # rendimiento de alianzas: solo 2021 en adelante (el sistema de alianzas cambió mucho desde 2018) y, cuando hay
    # suficientes casos, por alianza (mismos partidos); si no, el de todas las alianzas recientes
    rec = [t for t in tr if t[5] >= 2021]
    rs = [max(0, min(1.3, t[1])) for t in rec] or [max(0, min(1.3, t[1])) for t in tr]
    rmed = round(stt.median(rs), 2) if rs else 1.0
    rq = (round(q(rs, .25), 2), round(q(rs, .75), 2)) if rs else (1, 1)
    gk = {}
    for t in rec:
        gk.setdefault('+'.join(sorted(t[4])), []).append(max(0, min(1.3, t[1])))
    rk = {k: [round(stt.median(v), 2), round(q(v, .25), 2), round(q(v, .75), 2), len(v)] for k, v in gk.items() if len(v) >= 5}
    print('Rendimiento por alianza (2021+):', rk)
    for c, (d, pr) in todos.items():
        pr.update({'r': rmed, 'r_q': rq, 'r_n': len(rs), 'rk': rk, 'mov': mov, 'reg': registro(c, d)})
        print(c, 'registro', pr['reg']['sin'], 'conservan', pr['reg']['conf'], 'por confirmar', pr['reg']['por_confirmar'])
        d['meta']['proy'] = pr
        json.dump(d, open(PLANO / f'{c}.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print(c, pr['a'], pr['sw'], 'estado', pr['est'], {t: (v['hist'] or {}).get('mae') for t, v in pr['tipos'].items()}, 'con encuesta', {t: ((v['enc'] or {}).get('mae'), (v['enc'] or {}).get('hit')) for t, v in pr['tipos'].items()}, pr['tp'], pr['tp_err'])
    print('Regla movilizar/convencer:', mov)
    print(f'Rendimiento de alianzas: mediana {rmed} (25-75%: {rq}) en {len(rs)} casos')


if __name__ == '__main__':
    main()
