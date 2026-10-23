"""Ficha pública de cada estado para la pantalla de entrada (va en data/estados.json, sin cifrar).

Solo lleva totales del estado: nada por sección. Todo sale de privado/<clave>.json.
"""
import collections


def _gana(d, ek, grupos, omitir=()):
    """Partido que encabeza el bloque ganador en cada unidad (municipio, distrito o estado)."""
    P = d['P8']; e = d['E'][ek]; cuenta = collections.Counter()
    for u, idx in grupos.items():
        if u in omitir:
            continue
        v = collections.Counter()
        for i in idx:
            r = e['r'][i]
            if r:
                for j, p in enumerate(P):
                    v[p] += r[j]
        bl = sorted(((sum(v[m] for m in b['members']), b['lead']) for b in e['blocs']), reverse=True)
        if bl and bl[0][0] > 0:
            cuenta[bl[0][1]] += 1
    return dict(cuenta), bl if grupos.keys() == {0} else None


def _ultima(d, tipo):
    """Última elección de ese tipo que sí tiene resultados."""
    P = len(d['P8'])
    ks = [k for k, e in d['E'].items() if k.startswith(tipo + '_') and any(r and sum(r[:P]) for r in e['r'])]
    return max(ks, key=lambda k: int(k.split('_')[1])) if ks else None


def ficha(d):
    S = d['S']; P = len(d['P8']); m = d['meta']
    por = lambda col: {k: v for k, v in _agrupa(S, col).items() if k}
    f = {'ndl': len(por(2)), 'ndf': len(por(3))}
    # participación promedio de todas las elecciones con lista nominal
    ps = []
    for e in d['E'].values():
        t = sum(r[P] for r in e['r'] if r); l = sum(r[P + 1] for r in e['r'] if r)
        if l:
            ps.append(t / l)
    f['pavg'] = round(100 * sum(ps) / len(ps), 1) if ps else None
    f['nel'] = len(ps)
    # dónde está el voto: cuántos municipios reúnen el 70% de la lista nominal
    lnm = collections.Counter()
    for s in S:
        lnm[s[1]] += s[5] or 0
    v = sorted(lnm.values(), reverse=True); T = sum(v); a = n = 0
    for x in v:
        a += x; n += 1
        if a >= .7 * T:
            break
    f['v70'] = [n, len(v)]
    # electorado por sexo y edad (lista nominal)
    t = [0] * 18
    for r in d['DM']:
        if r:
            for j in range(18):
                t[j] += r[j]
    f['dem'] = {'h': t[2], 'm': t[3], 'g': [t[4 + k] + t[11 + k] for k in range(7)]}
    f['nv'] = m.get('nv')
    # quién gobierna hoy: ganador de la última elección de cada tipo
    q = {}
    for clave, tipo, col in (('ayu', 'AYU', 1), ('dl', 'DIPL', 2), ('df', 'DIPF', 3)):
        ek = _ultima(d, tipo)
        if not ek:
            q[clave] = None; continue
        c = _gana(d, ek, por(col))[0]
        q[clave] = [int(ek.split('_')[1]), c]
        if tipo == 'AYU':  # municipios sin votación por partidos (usos y costumbres o elección anulada sin extraordinaria)
            q[clave].append(len(por(col)) - sum(c.values()))
    ek = _ultima(d, 'SEN')
    if ek:
        _, bl = _gana(d, ek, {0: range(len(S))})
        sen = {bl[0][1]: 2}
        sen[bl[1][1]] = sen.get(bl[1][1], 0) + 1
        q['sen'] = [int(ek.split('_')[1]), sen]
    f['q'] = q
    f['muns'] = sorted(m['municipios'].values())
    # números válidos de municipio y distrito (para revisar el Excel de usuarios sin tener los datos completos)
    f['ids'] = {'m': sorted(map(int, m['municipios'])), 'dl': sorted(por(2)), 'df': sorted(por(3))}
    return f


def _agrupa(S, col):
    g = collections.defaultdict(list)
    for i, s in enumerate(S):
        g[s[col]].append(i)
    return g
