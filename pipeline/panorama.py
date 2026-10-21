"""Paso 4d. Datos del Panorama nacional (inicio.html). Requiere openpyxl.

Genera data/inicio/panorama.json a partir de:
  data/nacional.json, data/inicio/nac_zonas.json, data/inicio/nac_extra.json   (pasos 4 y 4c)
  pipeline/insumos/ayuntamientos_edad.json                                       (extra_inicio.py)
  data/<estado>.json de los estados cargados (congreso local: distritos ganados)
  padrón y lista nominal por sección de la DERFE (ruta "padron" de config.json)
Los mapas (mx32, mx_df, mx_mun) se cargan aparte; no se repiten aquí.
Solo cifras agregadas: no contiene datos personales.

uso: python pipeline/panorama.py
"""
import collections
import json

import openpyxl
from comun import REPO, PIPE, ruta

INI = REPO / 'data' / 'inicio'
GRUPOS = [['18', '19', '20_24'], ['25_29'], ['30_34', '35_39'], ['40_44', '45_49'], ['50_54', '55_59'], ['60_64'], ['65_Y_MAS']]
HOW = {'MR': 'Mayoría relativa', 'RP': 'Plurinominal', 'LN': 'Lista nacional', 'PM': 'Primera minoría'}


def j(p):
    return json.loads(p.read_text(encoding='utf-8'))


def padron(mname):
    """Padrón y lista nominal por estado, municipio y distrito federal; secciones por zona; 70% del electorado."""
    ws = openpyxl.load_workbook(ruta('padron'), read_only=True).worksheets[0]
    it = ws.iter_rows(values_only=True)
    H = [str(h).replace('\n', ' ') for h in next(it)]
    ix = {h: i for i, h in enumerate(H)}
    E = collections.defaultdict(lambda: {'pad': 0, 'ln': 0, 'h': 0, 'm': 0, 'nb': 0, 'ah': [0] * 7, 'am': [0] * 7, 'sec': 0, 'mun': set(), 'df': set()})
    PZ = collections.defaultdict(lambda: [0, 0, 0, 0, [0] * 7, [0] * 7])
    PS = collections.Counter()
    MUNL = collections.Counter()
    for r in it:
        if r[0] is None or not str(r[0]).isdigit() or not r[4]:
            continue
        e = int(r[0])
        ah = [sum(r[ix[f'LISTA_{c}_HOMBRES']] for c in cs) for cs in GRUPOS]
        am = [sum(r[ix[f'LISTA_{c}_MUJERES']] for c in cs) for cs in GRUPOS]
        for k in ('0', str(e)):
            a = E[k]
            a['pad'] += r[ix['PADRON ELECTORAL']]; a['ln'] += r[ix['LISTA NOMINAL']]; a['h'] += r[ix['LISTA HOMBRES']]
            a['m'] += r[ix['LISTA MUJERES']]; a['nb'] += r[ix['LISTA NO BINARIO']]; a['sec'] += 1
            a['mun'].add(f'{e}_{r[3]}'); a['df'].add(f'{e}_{r[2]}')
            for g in range(7):
                a['ah'][g] += ah[g]; a['am'][g] += am[g]
        for k in (f'm{e}_{r[3]}', f'f{e}_{r[2]}'):
            z = PZ[k]
            z[0] += r[ix['PADRON ELECTORAL']]; z[1] += r[ix['LISTA NOMINAL']]; z[2] += r[ix['LISTA HOMBRES']]; z[3] += r[ix['LISTA MUJERES']]
            for g in range(7):
                z[4][g] += ah[g]; z[5][g] += am[g]
            PS[k] += 1
        MUNL[f'{e}_{r[3]}'] += r[ix['LISTA NOMINAL']]
    pad = {k: {**{x: v for x, v in a.items() if x not in ('mun', 'df')}, 'nmun': len(a['mun']), 'ndf': len(a['df'])} for k, a in E.items()}
    tot = sum(MUNL.values()); acc = 0; top = []
    for k, v in MUNL.most_common():
        acc += v; top.append([k, mname.get(k, k), v])
        if acc >= .7 * tot:
            break
    con = {'n': len(top), 'N': len(MUNL), 'top': top, 'byst': collections.Counter(int(k.split('_')[0]) for k, _, _ in top)}
    return pad, con, dict(PZ), dict(PS)


def votos(EL, Z):
    """Votos por partido por estado, distrito federal y municipio de cada elección federal y de gubernatura."""
    V = {}
    for k, E in EL.items():
        if k == 'GOB_vig':
            continue
        v = {u: [x[0], x[1], {p: n for p, n in x[2].items() if n}] for u, x in E['v'].items()}
        if k in Z:
            ps = Z[k]['p']
            for zid, a in Z[k]['z'].items():
                v[zid] = [a[0], a[1], {p: a[i + 2] for i, p in enumerate(ps) if a[i + 2]}]
        V[k] = {'t': E['t'], 'y': int(E['y']), 'bl': E['bl'], 'v': v}
        if E.get('bls'):
            V[k]['bls'] = E['bls']
    return V


def gana(bl, vv):
    """Bloque ganador y el partido que lo encabeza."""
    b = max(bl, key=lambda b: sum(vv.get(p, 0) for p in b[1]))
    return b, max(b[1], key=lambda p: vv.get(p, 0))


def congreso_local(av):
    """Distritos locales ganados en la última elección de diputaciones locales de cada estado cargado."""
    CL = {}
    for cab in av:
        d = j(REPO / 'data' / f'{cab}.json'); m = d['meta']; P = d['P8']
        ks = sorted(x for x in d['E'] if x.startswith('DIPL'))
        if not ks:
            continue
        E = d['E'][ks[-1]]; bl = [(b['lead'], b['members']) for b in E['blocs']]
        acc = collections.defaultdict(lambda: [0] * len(P))
        for row, r in zip(d['S'], E['r']):
            if r:
                a = acc[row[2]]
                for i in range(len(P)):
                    a[i] += r[i]
        mr = []
        for dl, a in sorted(acc.items()):
            vv = dict(zip(P, a)); tot = sum(vv.values()) or 1
            bs = sorted(((sum(vv.get(p, 0) for p in ms), l, ms) for l, ms in bl), reverse=True)
            mr.append({'d': dl, 'p': bs[0][1], 'm': round(100 * (bs[0][0] - bs[1][0]) / tot, 1), 'c': len(bs[0][2]) > 1})
        cfg = m.get('cfg', {})
        CL[str(int(m['ent']))] = {'y': int(E['year']), 'mr': mr, 'rp': cfg.get('rp', 0), 'nmr': cfg.get('mr', len(mr)), 'met': cfg.get('metodo', ''), 'cab': m.get('cabDL', {})}
    return CL


def panorama():
    NAC = j(REPO / 'data' / 'nacional.json'); EL = NAC['EL']
    Z = j(INI / 'nac_zonas.json'); NX = j(INI / 'nac_extra.json')
    MUN = j(INI / 'mx_mun.json'); mname = {m['id']: m['n'] for m in MUN}
    AE = j(PIPE / 'insumos' / 'ayuntamientos_edad.json')
    av = [x['cab'] for x in j(REPO / 'data' / 'estados.json')]

    pad, con, pz, ps = padron(mname)
    V = votos(EL, Z)

    gob = {}
    for k, E in sorted(EL.items(), key=lambda x: x[1]['y']):
        if k.startswith('GOB_') and not E.get('comp'):
            for u, x in E['v'].items():
                if u == 'e0':
                    continue
                vv = x[2]; b, lead = gana(E.get('bls', {}).get(u) or E['bl'], vv)
                gob.setdefault(u, []).append([int(E['y']), lead, round(100 * sum(vv.get(p, 0) for p in b[1]) / max(1, sum(vv.values())), 1)])

    dfw = {}
    for y in (2015, 2018, 2021, 2024):
        k = f'DIPF_{y}'; zz = Z[k]; pp = zz['p']; out = {}
        for zid, a in zz['z'].items():
            if zid[0] == 'f':
                b, lead = gana(EL[k]['bl'], {p: a[i + 2] for i, p in enumerate(pp)})
                out[zid[1:]] = b[0] if b[0] in b[1] else lead
        dfw[y] = out
    pres = {y: {u: gana(EL[f'PRE_{y}']['bl'], x[2])[0][0] for u, x in EL[f'PRE_{y}']['v'].items() if u != 'e0'} for y in (2018, 2024)}
    zw = {k: {u: gana(V[k]['bl'], x[2])[0][0] for u, x in V[k]['v'].items() if u[0] in 'fm' and x[2]} for k in V if V[k]['t'] in ('DIPF', 'PRE')}

    legs = {y: [{'c': x[0], 'p': x[1], 'n': x[2], 'e': x[3], 'd': x[4], 'ci': x[5], 'h': HOW[x[6]]} for x in L] for y, L in NX['leg'].items()}
    est = [{'ent': e['ent'], 'n': e['n'], 'clave': e['clave'], 'circ': e['circ'], 'c27': e['c27']} for e in NAC['est']]

    D = {'pad': pad, 'con': con, 'pz': pz, 'ps': ps, 'gob': gob, 'dfw': dfw, 'pres': pres, 'zw': zw, 'V': V,
         'legs': legs, 'est': est, 'av': av, 'mun': NX['mun'], 'age': AE['age'], 'cl': congreso_local(av)}
    out = INI / 'panorama.json'
    out.write_text(json.dumps(D, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'[panorama] {out.relative_to(REPO)} · {out.stat().st_size / 1e6:.1f} MB · {pad["0"]["sec"]:,} secciones · {len(con["top"])} municipios con el 70%')


if __name__ == '__main__':
    panorama()
