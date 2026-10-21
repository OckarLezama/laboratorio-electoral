"""Paso 4. Resumen nacional para la vista general (32 estados).

Lee los archivos nacionales por sección (federales) y la última gubernatura de cada estado,
y genera data/nacional.json: resultados por estado y por país, distritos federales ganados,
quién ganó la última gubernatura y qué se elige en 2027. Pesa poco para que la vista general abra al instante.

uso: python pipeline/lab.py nacional
"""
import csv, glob, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun import CFG, PIPE, REPO, ruta, ESTADOS

MAIN = ['MORENA', 'PAN', 'PRI', 'PRD', 'PVEM', 'PT', 'MC']
NONVOTE = re.compile(r'^(DEMARCACION|NO_REG|CNR|NULOS|VOTOS_NULOS|CIRCUNSCRIPCION|ID_|NOMBRE_|CABECERA|MUNICIPIO|SECCION|CASILLAS|ACTA|NUM_VOTOS|TOTAL_VOTOS|LISTA_NOMINAL|TIPO|DISTRITO|EXT|OBSERV|RUTA)')
ALIAS = {'ES': 'PES', 'FXMO': 'FXM', 'FXMV': 'FXM', 'NAO': 'NA', 'NAY': 'NA', 'PNA': 'NA', 'PANAL': 'NA'}
FED = [('PRESIDENCIA', 'PRE'), ('SENADURIAS_MR', 'SEN'), ('DIPUTACIONES_FED_MR', 'DIPF')]
# circunscripciones plurinominales vigentes (acuerdo INE 2023, proceso 2023-2024)
CIRC = {1: [2, 3, 8, 10, 14, 18, 25, 26], 2: [1, 5, 11, 19, 22, 24, 28, 32], 3: [4, 7, 20, 23, 27, 30, 31],
        4: [9, 12, 17, 21, 29], 5: [6, 13, 15, 16]}
CIRC_DE = {e: c for c, es in CIRC.items() for e in es}


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return 0.0


def toks(c):
    if c.startswith('PLANILLA'):
        return ['OTROS']
    c = re.sub(r'^C_(COMUN_)?', '', c.replace('NVA_ALIANZA', 'NA'))
    return [ALIAS.get(p, p) for p in c.split('_') if p and not p.isdigit() and p not in ('CAND', 'COM', 'COMUN', 'CC')]


def leer(f, claves):
    """Suma votos por partido (coaliciones repartidas en partes iguales) para cada clave de agrupación."""
    agg, used = {}, []
    with open(f, encoding='utf-8-sig', errors='ignore') as fh:
        r = csv.DictReader(fh)
        r.fieldnames = [c.strip() for c in r.fieldnames]
        cols = [c for c in r.fieldnames if c and not NONVOTE.match(c)]
        ind = [c for c in cols if c.startswith('CAND_IND')]
        combos = [c for c in cols if '_' in c and c not in ind]
        csum = {c: 0.0 for c in combos}
        for row in r:
            vv = {}
            for c in cols:
                if c in ind:
                    continue
                n = num(row.get(c))
                if not n:
                    continue
                if c in combos:
                    csum[c] += n
                ps = toks(c) if c in combos else [ALIAS.get(c, c)]
                for p in ps:
                    vv[p] = vv.get(p, 0) + n / len(ps)
            iv = sorted((num(row.get(c)) for c in ind), reverse=True)
            if iv and iv[0]:
                vv['IND'] = vv.get('IND', 0) + iv[0]
                vv['OTROS'] = vv.get('OTROS', 0) + sum(iv[1:])
            t, ln = num(row.get('TOTAL_VOTOS')), num(row.get('LISTA_NOMINAL'))
            for k in claves(row):
                a = agg.setdefault(k, [0.0, 0.0, {}, 0])
                a[0] += t; a[1] += ln; a[3] += 1
                for p, n in vv.items():
                    a[2][p] = a[2].get(p, 0) + n
        used = [toks(c) for c, s in csum.items() if s > 0]
    return agg, used


def bloques(used, partidos):
    par = {}
    def fnd(a):
        par.setdefault(a, a)
        while par[a] != a:
            a = par[a]
        return a
    for ps in used:
        m = [p for p in ps if p in partidos and p != 'OTROS']
        for p in m[1:]:
            par[fnd(p)] = fnd(m[0])
    g = {}
    for p in partidos:
        if p == 'OTROS':
            continue
        g.setdefault(fnd(p), []).append(p)
    out = []
    for ms in g.values():
        lead = next((p for p in MAIN if p in ms), ms[0])
        out.append([lead, sorted(ms, key=lambda p: (p != lead, MAIN.index(p) if p in MAIN else 99))])
    return out


def ganador(bl, v):
    val = sum(v.values()) or 1
    r = sorted(((sum(v.get(p, 0) for p in ms), l) for l, ms in bl), reverse=True)
    return r[0][1], 100 * r[0][0] / val, 100 * (r[0][0] - (r[1][0] if len(r) > 1 else 0)) / val


def main():
    amin = CFG.get('anio_minimo', 2015)
    est = {e['ent']: e for e in ESTADOS}
    EL, secs = {}, {}
    for cargo, t in FED:
        for d in sorted(glob.glob(str(ruta('federal') / cargo / '*'))):
            y = os.path.basename(d)
            if not y.isdigit() or int(y) < amin:
                continue
            fs = [f for f in glob.glob(d + '/*NAL_SEC.csv') if 'EXT' not in os.path.basename(f)]
            if not fs:
                continue
            claves = lambda r: ['e0', 'e%d' % int(num(r.get('ID_ESTADO'))), 'f%d_%d' % (int(num(r.get('ID_ESTADO'))), int(num(r.get('ID_DISTRITO_FEDERAL') or r.get('ID_DISTRITO') or 0)))]
            agg, used = leer(fs[0], claves)
            tot = agg['e0'][2]; val = sum(tot.values()) or 1
            partidos = [p for p in tot if p in MAIN or p == 'IND' or tot[p] / val >= .02]
            bl = bloques(used, partidos)
            v = {}
            for k, (tt, ln, vv, n) in agg.items():
                if k[0] != 'e':
                    continue
                o = {p: round(vv.get(p, 0)) for p in partidos if vv.get(p)}
                o['OTROS'] = round(sum(n for p, n in vv.items() if p not in partidos))
                v[k] = [round(tt), round(ln), o]
                if t == 'DIPF' and int(y) == max(int(os.path.basename(x)) for x in glob.glob(str(ruta('federal') / cargo / '*')) if os.path.basename(x).isdigit()):
                    secs[k] = n
            df = {}
            for k, (tt, ln, vv, n) in agg.items():
                if k[0] == 'f' and not k.endswith('_0'):
                    w = ganador(bl, vv)[0]
                    e = k[1:].split('_')[0]
                    df.setdefault('e0', {}); df.setdefault('e' + e, {})
                    df['e0'][w] = df['e0'].get(w, 0) + 1; df['e' + e][w] = df['e' + e].get(w, 0) + 1
            EL[f'{t}_{y}'] = {'t': t, 'y': int(y), 'bl': bl, 'v': v, 'df': df}
            print(f'  {t} {y}: {len(v) - 1} estados')
    # última gubernatura de cada estado
    cat = {int(r['ID_ESTADO']): r for r in csv.DictReader(open(PIPE / 'insumos' / 'catalogo_eleccion_2027.csv', encoding='utf-8-sig'))}
    out = []
    for ent, e in sorted(est.items()):
        g = None
        for d in sorted(glob.glob(str(ruta('local') / e['carpeta_local'] / '*')), reverse=True):
            fs = [f for f in glob.glob(d + '/GUBERNATURA/*_SEC.csv') + glob.glob(d + '/JEFATURA_GOBIERNO/*_SEC.csv') if 'EXT' not in os.path.basename(f)]
            if fs:
                yy = int(re.match(r'(\d{4})', os.path.basename(fs[0])).group(1))
                agg, used = leer(fs[0], lambda r: ['e'])
                vv = agg['e'][2]; ps = [p for p in vv if p != 'OTROS']
                bl = bloques(used, ps); w, p, m = ganador(bl, vv)
                ms = next(ms for l, ms in bl if l == w)
                w = max(ms, key=lambda q: vv.get(q, 0)); ms = sorted(ms, key=lambda q: -vv.get(q, 0))
                g = {'y': yy, 'l': w, 'ms': ms, 'p': round(p, 1), 'm': round(m, 1)}
                break
        c = cat.get(ent, {})
        out.append({'ent': ent, 'clave': e['clave'], 'n': e['nombre'], 'circ': CIRC_DE.get(ent), 'nsec': secs.get('e%d' % ent),
                    'gob': g, 'c27': {'g': c.get('GUBERNATURA_2027') == 'SI', 'c': c.get('CONGRESO_2027') == 'SI', 'a': c.get('AYUNTAMIENTOS_2027') == 'SI', 'na': c.get('N_AYUNTAMIENTOS_2027', ''), 'mr': c.get('DIP_MR', ''), 'rp': c.get('DIP_RP', ''), 'dt': c.get('DIP_TOTAL', '')}})
        print(f'  {e["nombre"]}: gubernatura {g["y"] if g else "—"}')
    (REPO / 'data' / 'nacional.json').write_text(json.dumps({'est': out, 'EL': EL}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print('data/nacional.json listo')


if __name__ == '__main__':
    main()
