"""Ficha pública por municipio para el buscador de la entrada (data/municipios.json).
Solo totales del municipio, nada por sección. Sale de privado/<estado>.json."""
import collections
import glob
import json

from comun import PLANO, REPO


def generar():
    out = {}
    for f in sorted(glob.glob(str(PLANO / '*.json'))):
        if f.endswith('claves.json'):
            continue
        d = json.load(open(f, encoding='utf-8')); P = d['P8']; NP = len(P); S = d['S']; m = d['meta']
        g = collections.defaultdict(list)
        for i, s in enumerate(S):
            g[s[1]].append(i)
        ayus = sorted((k for k in d['E'] if k.startswith('AYU_')), key=lambda k: int(k.split('_')[1]))
        res = {}
        for mu, idx in g.items():
            ps = []
            for e in d['E'].values():
                t = sum(e['r'][i][NP] for i in idx if e['r'][i]); l = sum(e['r'][i][NP + 1] for i in idx if e['r'][i])
                if l:
                    ps.append(t / l)
            w = None
            for ek in reversed(ayus):  # última elección de ayuntamiento con votos en este municipio
                v = collections.Counter(); e = d['E'][ek]
                for i in idx:
                    r = e['r'][i]
                    if r:
                        for j, p in enumerate(P):
                            v[p] += r[j]
                bl = sorted(((sum(v[x] for x in b['members']), b['lead']) for b in e['blocs']), reverse=True)
                if bl and bl[0][0] > 0:
                    T = sum(x for x, _ in bl)
                    w = [bl[0][1], int(ek.split('_')[1]), round(100 * (bl[0][0] - bl[1][0]) / T, 1) if len(bl) > 1 else None]
                    break
            dm = [0] * 18
            for i in idx:
                r = d['DM'][i]
                if r:
                    for j in range(18):
                        dm[j] += r[j]
            tt = (dm[2] + dm[3]) or 1
            # cuántas secciones reúnen el 70% de la lista nominal del municipio (misma medida que "dónde está el voto" del estado)
            fil = sorted(((S[i][5] or 0, S[i][7] if len(S[i]) > 7 else 1) for i in idx), reverse=True)
            T70 = .7 * sum(x for x, _ in fil); a = n70 = 0
            for x, k in fil:
                if a >= T70:
                    break
                a += x; n70 += k
            res[str(mu)] = {'n': m['municipios'].get(str(mu), str(mu)), 'ln': sum(S[i][5] or 0 for i in idx),
                            'sec': sum(S[i][7] if len(S[i]) > 7 else 1 for i in idx),
                            'p': round(100 * sum(ps) / len(ps), 1) if ps else None, 'w': w,
                            'dl': sorted({S[i][2] for i in idx}), 'df': sorted({S[i][3] for i in idx}),
                            's70': n70, 'mj': round(100 * dm[3] / tt, 1), 'jv': round(100 * (dm[4] + dm[11] + dm[5] + dm[12]) / tt, 1)}
        out[m['cab']] = res
    (REPO / 'data' / 'municipios.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'[municipios] data/municipios.json ({sum(len(v) for v in out.values())} municipios)')


if __name__ == '__main__':
    generar()
