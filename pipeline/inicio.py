"""Paso 3b. Datos ligeros para la página de inicio (inicio.html).

A partir de cada data/<clave>.json genera data/inicio/<clave>.json con lo que usa el tablero de inicio:
resultados por estado, municipio, distrito local y federal; competencia por sección; ficha del estado;
participación por edad y geometría simplificada. También genera data/inicio/mx32.json (mapa de los 32 estados).
No necesita las bases crudas. Lo corre solo `python pipeline/lab.py sitio`.
"""
import glob
import json
import math
import os

from comun import PIPE, REPO

MAIN = ['MORENA', 'PAN', 'PRI', 'PRD', 'PVEM', 'PT', 'MC']
C = {'MORENA': '#A9455E', 'PAN': '#3F72B5', 'PRI': '#2F8F64', 'PRD': '#D9A928', 'PVEM': '#7FB24E', 'PT': '#CF4B42', 'MC': '#E9813F', 'OTROS': '#A0A7A6'}
NM = {'MORENA': 'Morena', 'PAN': 'PAN', 'PRI': 'PRI', 'PRD': 'PRD', 'PVEM': 'PVEM', 'PT': 'PT', 'MC': 'MC', 'OTROS': 'Otros'}
NMX = {'PES': 'PES', 'RSP': 'RSP', 'FXM': 'FxM', 'NA': 'Nueva Alianza', 'IND': 'Independientes', 'PH': 'Humanista', 'PCHU': 'Chiapas Unido', 'PMCH': 'Mover a Chiapas',
       'PPCH': 'Popular Chiapaneco', 'PUP': 'PUP', 'PSD': 'PSD', 'PRS': 'PRS', 'MUJER': 'PMR', 'PMR': 'PMR', 'MAS': 'MAS', 'CQROO': 'Confianza por QRoo',
       'AVE': 'Alternativa Veracruzana', 'PC': 'Cardenista', 'TXVER': 'Todos por Veracruz', 'PODEMOS': 'Podemos', 'UC': 'Unidad Ciudadana', 'PLC': 'PLC', 'PESC': 'PESC'}
XPAL = ['#8C6BB1', '#4E9BB9', '#B07A8C', '#6D8A96', '#B98B4F', '#7C9A6D', '#9A8C5B', '#5E6B8C']


def _bb(d):
    n = [float(x) for x in d.replace('M', ' ').replace('Z', ' ').replace(',', ' ').split()]
    xs, ys = n[0::2], n[1::2]
    return min(xs), min(ys), max(xs), max(ys)


def _subs(d):
    return ['M' + p for p in d.split('M') if p.strip()]


def estado(D):
    M0, CFG = D['meta'], D['meta'].get('cfg') or {}
    P8 = D['P8']; NP = len(P8)
    nm, col = dict(NM), dict(C)
    for j, p in enumerate([p for p in P8 if p not in MAIN and p != 'OTROS']):
        nm[p] = NMX.get(p, p); col[p] = '#7E8A89' if p == 'IND' else XPAL[j % len(XPAL)]
    S = [{'m': a[1], 'dl': a[2], 'df': a[3], 't': a[4], 'ln': a[5] or 0} for a in D['S']]
    N = len(S)
    UN = {}
    for i, s in enumerate(S):
        for u in ('e', f"m{s['m']}", f"d{s['dl']}", f"f{s['df']}"):
            UN.setdefault(u, []).append(i)
    ks = sorted(D['E'], key=lambda k: (D['E'][k]['year'], k))
    uyc = {int(x) for x in (M0.get('uyc') or [])}

    def suma(ek, idx):
        r0 = D['E'][ek]['r']; v = {}; t = ln = 0; any_ = False
        for i in idx:
            r = r0[i] if i < len(r0) else None
            if not r:
                continue
            any_ = True
            for j, p in enumerate(P8):
                if r[j]:
                    v[p] = v.get(p, 0) + r[j]
            t += r[NP]; ln += r[NP + 1]
        return [t, ln, v] if any_ and sum(v.values()) > 0 else None

    EL, used = {}, set()
    for ek in ks:
        E = D['E'][ek]
        bl = [[b['lead'], [m for m in b['members'] if m != 'OTROS']] for b in E['blocs'] if b['lead'] != 'OTROS']
        v = {u: x for u in UN if (x := suma(ek, UN[u]))}
        if 'e' not in v:
            continue
        used.update(v['e'][2])
        sec = []
        for i in range(N):
            r = E['r'][i] if i < len(E['r']) else None
            if not r:
                sec.append(-1); continue
            val = sum(r[:NP])
            if not val:
                sec.append(-1); continue
            bv = sorted(((sum(r[P8.index(p)] for p in ms if p in P8), j) for j, (_, ms) in enumerate(bl)), key=lambda x: (-x[0], x[1]))
            m = 100 * (bv[0][0] - (bv[1][0] if len(bv) > 1 else 0)) / val
            sec.append(bv[0][1] * 3 + (0 if m < 5 else 1 if m < 15 else 2))
        EL[ek] = {'t': ek.split('_')[0], 'y': E['year'], 'bl': bl, 'v': v, 'sec': sec}

    def tot(ek, idx):
        s = suma(ek, idx)
        val = sum(s[2].values())
        b = sorted(({'l': l, 'ms': ms, 'v': sum(s[2].get(p, 0) for p in ms)} for l, ms in EL[ek]['bl']), key=lambda x: -x['v'])
        for x in b:
            x['p'] = 100 * x['v'] / val
        return b, s[2]

    def bn(b, vv):
        ps = sorted(b['ms'], key=lambda p: (p != b['l'], -vv.get(p, 0)))
        ps = [p for p in ps if vv.get(p)]
        return '-'.join(nm.get(p, p) for p in ps[:3]) + (f' y {len(ps) - 3} más' if len(ps) > 3 else '')

    yrs = lambda t: [EL[k]['y'] for k in EL if k.startswith(t + '_')]
    gy = yrs('GOB'); gk = f'GOB_{gy[-1]}'; gb, gv = tot(gk, list(range(N)))
    ay = yrs('AYU'); ak = f'AYU_{ay[-1]}'; ayc = {}; ayn = 0
    for mid in M0['municipios']:
        if int(mid) in uyc or f'm{mid}' not in UN or not suma(ak, UN[f'm{mid}']):
            continue
        b, _ = tot(ak, UN[f'm{mid}'])
        ayc[b[0]['l']] = ayc.get(b[0]['l'], 0) + 1; ayn += 1

    # congreso: misma regla que la plataforma (MR por distrito actual + RP con umbral y tope de +8 puntos)
    dy = yrs('DIPL'); ekc = f'DIPL_{dy[-1]}'; DLS = sorted({s['dl'] for s in S}); mr = {}
    for d in DLS:
        if suma(ekc, UN[f'd{d}']):
            b, _ = tot(ekc, UN[f'd{d}']); mr[b[0]['l']] = mr.get(b[0]['l'], 0) + 1
    NRP = CFG.get('rp') or 0; NT = (CFG.get('mr') or len(DLS)) + NRP; U = CFG.get('umbral') or .03
    _, T = tot(ekc, list(range(N))); RP = [p for p in P8 if p not in ('OTROS', 'IND')]; vv = {p: T.get(p, 0) for p in RP}; tv = sum(vv.values())
    q = [p for p in RP if tv and vv[p] / tv >= U]; cap = lambda p: math.floor((vv[p] / tv + .08) * NT); rp = {p: 0 for p in q}
    elig = [p for p in q if mr.get(p, 0) < cap(p)]; left = NRP; guard = 0
    while left > 0 and elig and guard < 50:
        guard += 1; qt = sum(vv[p] for p in elig); nb = left; rem = []
        for p in elig:
            e = nb * vv[p] / qt; f = math.floor(e); rem.append([p, f, e - f])
        for p, f, _ in rem:
            g = min(f, cap(p) - mr.get(p, 0) - rp[p]); rp[p] += g; left -= g
        for p, _, _ in sorted(rem, key=lambda x: -x[2]):
            if left > 0 and cap(p) - mr.get(p, 0) - rp[p] > 0:
                rp[p] += 1; left -= 1
        elig = [p for p in elig if cap(p) - mr.get(p, 0) - rp[p] > 0]
    cs = {p: mr.get(p, 0) + rp.get(p, 0) for p in set(mr) | set(rp) if mr.get(p, 0) + rp.get(p, 0)}

    # participación por edad (conteo censal más reciente) y sexo
    V = D['V']; agey = sorted(V['age'])[-1]; A = V['age'][agey]; age = {}
    for u, idx in UN.items():
        l = [0] * 7; s_ = [0] * 7
        for i in idx:
            a = A[i] if i < len(A) else None
            if not a:
                continue
            for j in range(7):
                l[j] += a[j]; s_[j] += a[7 + j]
        age[u] = [round(100 * s_[j] / l[j], 1) if l[j] else None for j in range(7)]
    h = sum(r[2] for r in D['DM'] if r); mj = sum(r[3] for r in D['DM'] if r)

    # geometría: sin islas lejanas
    g = D['geo']; bbs = [_bb(p) for x in g['mun'] for p in _subs(x['d'])]
    ext = max(max(b[2] for b in bbs) - min(b[0] for b in bbs), max(b[3] for b in bbs) - min(b[1] for b in bbs))
    big = [b for b in bbs if max(b[2] - b[0], b[3] - b[1]) > ext * .04]
    MB = [min(b[0] for b in big), min(b[1] for b in big), max(b[2] for b in big), max(b[3] for b in big)]; pd = ext * .02
    keep = lambda d: ''.join(p for p in _subs(d) if not ((b := _bb(p))[2] < MB[0] - pd or b[0] > MB[2] + pd or b[3] < MB[1] - pd or b[1] > MB[3] + pd))
    cl = lambda arr: [{'id': x['id'], 'd': keep(x['d'])} for x in arr]
    geo = {'m': cl(g['mun']), 'd': cl(g['dl']), 'f': cl(g['df']), 'ctx': [{'n': x['n'], 'd': x['d']} for x in g['ctx']], 'ent': keep(g['ent']),
           'lab': [l for l in g['lab'] if any(c['n'] == l['n'] or c['n'].startswith(l['n']) for c in g['ctx'])], 'sb': MB}
    names = {f'm{k}': v for k, v in M0['municipios'].items()}
    for d in sorted({s['dl'] for s in S}):
        names[f'd{d}'] = f'Distrito local {d}' + (f" · {M0['cabDL'][str(d)]}" if str(d) in (M0.get('cabDL') or {}) else '')
    for d in sorted({s['df'] for s in S}):
        names[f'f{d}'] = f'Distrito federal {d}' + (f" · {M0['cabDF'][str(d)]}" if str(d) in (M0.get('cabDF') or {}) else '')
    names['e'] = M0['estado']
    used.update(ayc); used.update(cs); used.add(gb[0]['l'])
    pc = {p: col.get(p, '#A0A7A6') for p in set(used) | set(MAIN)}; pn = {p: nm.get(p, p) for p in pc}
    lnU = {u: sum(S[i]['ln'] for i in idx) for u, idx in UN.items()}
    return {'est': M0['estado'], 'cab': M0['cab'], 'base': M0['base'], 'EL': EL, 'order': [k for k in ks if k in EL],
            'sm': [s['m'] for s in S], 'sd': [s['dl'] for s in S], 'sf': [s['df'] for s in S], 'uyc': sorted(uyc),
            'fi': {'gob': {'l': gb[0]['l'], 'n': bn(gb[0], gv), 'y': gy[-1], 'p': round(gb[0]['p'], 1)},
                   'cong': {'s': cs, 'n': sum(cs.values()), 'y': dy[-1]}, 'ay': {'s': ayc, 'n': ayn, 'y': ay[-1], 'u': len(uyc)},
                   'nm': len(M0['municipios']), 'ndl': len(DLS), 'ndf': len({s['df'] for s in S}), 'ln': lnU['e'], 'nsec': N,
                   'pm': round(100 * mj / (h + mj), 1) if h + mj else None,
                   'c27': {'g': bool(CFG.get('gob2027')), 'c': bool(CFG.get('cong2027')), 'a': bool(CFG.get('ayu2027'))}},
            'names': names, 'lnU': lnU, 'age': age, 'agey': agey, 'pc': pc, 'pn': pn, 'geo': geo}


def mx32():
    from shapely.geometry import shape
    gj = json.loads((PIPE / 'insumos' / 'estados_mx.geojson').read_text(encoding='utf-8'))
    k = math.cos(math.radians(23)); geo = []; X = []; Y = []
    for f in gj['features']:
        s = shape(f['geometry']).simplify(0.02, preserve_topology=True)
        ps = [s] if s.geom_type == 'Polygon' else list(s.geoms)
        geo.append((f['properties']['state_code'], ps))
        for p in ps:
            for x, y in p.exterior.coords:
                X.append(x); Y.append(y)
    x0, x1, y0, y1 = min(X), max(X), min(Y), max(Y); sc = 1000 / ((x1 - x0) * k)
    pj = lambda x, y: (round((x - x0) * k * sc, 1), round((y1 - y) * sc, 1))
    out = []
    for ent, ps in geo:
        d = ''.join('M' + ' '.join(f'{a},{b}' for a, b in (pj(*c) for c in p.exterior.coords)) + 'Z' for p in ps if p.area >= .003)
        c = max(ps, key=lambda p: p.area).representative_point(); cx, cy = pj(c.x, c.y)
        out.append({'ent': ent, 'd': d, 'x': cx, 'y': cy})
    return {'w': 1000, 'h': round((y1 - y0) * sc), 'st': out}


def generar():
    dst = REPO / 'data' / 'inicio'; dst.mkdir(parents=True, exist_ok=True)
    for f in sorted(glob.glob(str(REPO / 'data' / '*.json'))):
        b = os.path.basename(f)
        if b in ('estados.json', 'capas.json', 'nacional.json'):
            continue
        D = json.load(open(f, encoding='utf-8'))
        out = estado(D)
        (dst / b).write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        print(f'  inicio/{b}: {os.path.getsize(dst / b) / 1e6:.1f} MB')
    if not (dst / 'mx32.json').exists():
        (dst / 'mx32.json').write_text(json.dumps(mx32(), separators=(',', ':')), encoding='utf-8')
        print('  inicio/mx32.json')
    if not (REPO / 'data' / 'nacional.json').exists():
        print('  Aviso: falta data/nacional.json. Córrelo con: python pipeline/lab.py nacional')


if __name__ == '__main__':
    generar()
