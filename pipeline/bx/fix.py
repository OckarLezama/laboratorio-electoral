import json, gzip, re, sys, collections, csv, io, glob, unicodedata, copy
from an import X, toks, unidades, particion, CL
UP = '/mnt/user-data/uploads/Resultados INE/LAB_POLITICO_DATOS/02_LOCAL'
NONVOTE = re.compile(r'^(DEMARCACION|NO_REG|CNR|NULOS|VOTOS_NULOS|CIRCUNSCRIPCION|ID_|NOMBRE_|CABECERA|MUNICIPIO|SECCION|CASILLAS|ACTA|NUM_VOTOS|TOTAL_VOTOS|LISTA_NOMINAL|TIPO|DISTRITO|EXT|OBSERV|RUTA|ESTADO)')
def hk(k):
    k = unicodedata.normalize('NFD', (k or '').strip()).encode('ascii','ignore').decode().upper()
    return 'SECCION' if k in ('SECCIONES','SECCIN') else k
def num(x):
    try: return float(x)
    except: return 0.0
def leer(f):
    t = open(f, encoding='utf-8-sig', errors='ignore').read(); l0 = t.split('\n',1)[0]
    d = '\t' if l0.count('\t') > l0.count(',') else ','
    return [{hk(k): (v or '').strip() for k, v in r.items() if k} for r in csv.DictReader(io.StringIO(t), delimiter=d)]
def votos_seccion(r):
    v = collections.Counter()
    for c, x in r.items():
        if not c or NONVOTE.match(c) or c.startswith('CAND_IND'): continue
        n = num(x)
        if not n: continue
        ps = toks(c) if '_' in c else [c]
        for p in ps: v[p] += n/len(ps)
    return v
CARP = {'AYU': ('AYUNTAMIENTOS','ALCALDIAS'), 'DIPL': ('DIPUTACIONES_LOC_MR',)}
def sec_file(edo, ek):
    t, y = ek.split('_')
    for c in CARP.get(t, ()):
        g = glob.glob(f'{UP}/{edo}/{y}/{c}/*_SEC.[cC][sS][vV]')
        if g: return g[0]
def grupos_unidad(Cu, base_comp):
    """grupos (candidaturas) de la unidad con los partidos que aparecen en más de una columna resueltos"""
    gs = [toks(c) for c in Cu if not c.startswith('CAND_IND') and (Cu[c] or 0) > 0]
    cnt = collections.Counter(p for g in gs for p in set(g))
    out = []
    for g in gs:
        h = []
        for p in g:
            if cnt[p] > 1:
                # se queda en la columna que más comparte con su bloque estatal; empate: la de más partidos de su bloque
                cand = [x for x in gs if p in x]
                mejor = max(cand, key=lambda x: (len(set(x) & base_comp.get(p, {p})), -len(x)))
                if x_is(mejor, g): h.append(p)
            else: h.append(p)
        out.append(h)
    return out
def x_is(a, b): return a is b
DUPS = {('BCS','DIPL_2015'),('MOR','AYU_2018'),('MOR','DIPL_2018'),('OAX','AYU_2018'),('OAX','DIPL_2018'),('PUE','AYU_2018'),('PUE','DIPL_2018'),('SLP','AYU_2018')}
def delta_dups(f, P):
    # columnas repetidas en el archivo del INE: el lector anterior se quedaba con la última (casi siempre vacía) y perdía votos
    t = open(f, encoding='utf-8-sig', errors='ignore').read(); rd = csv.reader(io.StringIO(t)); h = [hk(x) for x in next(rd)]
    cnt = collections.Counter(h); dup = {c for c, n in cnt.items() if n > 1 and c}
    isec = h.index('SECCION'); out = {}
    for row in rd:
        if len(row) < len(h): continue
        s = int(num(row[isec]))
        if not s: continue
        full = collections.Counter(); last = {}
        for k, c in enumerate(h):
            if c in dup:
                full[c] += num(row[k]); last[c] = num(row[k])
        d = collections.Counter()
        for c in dup:
            x = full[c] - last[c]
            if not x: continue
            ps = toks(c)
            for p in ps: d[p if p in P else 'OTROS'] += x / len(ps)
        if d: out.setdefault(s, collections.Counter()).update(d)
    return out
def procesa(cl, edo, rep):
    D = json.load(open(f'dec/{cl}.json')); P = D['P8']; ix = {p:j for j,p in enumerate(P)}
    idx = {int(s[0]): i for i, s in enumerate(D['S'])}
    for ek, info in (X.get(edo) or {}).items():
        if ek not in D['E'] or not info or 'S' not in info: continue
        e = D['E'][ek]; U = unidades(info, idx, D['S'], e['r'], ek.split('_')[0])
        C = {int(k): v for k, v in (info.get('C') or {}).items()}
        cand = any('_' in c and not c.startswith('CAND_IND') for v in C.values() for c in v)
        partidos = [p for p in P if p not in ('OTROS', 'IND')]
        base = [[m for m in b['members'] if m in partidos] for b in e['blocs']]
        base = [b for b in base if b]
        base_comp = {p: set(b) for b in base for p in b}
        base_set = {frozenset(b) for b in base}
        if (edo, ek) in DUPS:
            f = sec_file(edo, ek); dd = delta_dups(f, set(P)); nn = 0
            for s_, d in dd.items():
                i = idx.get(s_)
                if i is None or not e['r'][i]: continue
                for p, x in d.items(): e['r'][i][ix[p]] = round(e['r'][i][ix[p]] + x)
                nn += 1
            rep.append(f'{cl} {ek}: votos recuperados de columnas repetidas en {nn} secciones ({round(sum(sum(d.values()) for d in dd.values())):,} votos)')
        # 1) candidatura común consolidada donde en realidad fueron separados: se recuperan los votos de cada partido
        reparados = 0
        if e.get('cc') and cand:
            f = sec_file(edo, ek); rows = None
            for u, ii in U.items():
                if u not in C: continue
                gs = grupos_unidad(C[u], base_comp)
                for g in e['cc']:
                    if len(particion(g, gs)) > 1:
                        if rows is None:
                            if not f: rep.append(f'{cl} {ek}: falta el archivo por sección para reparar la candidatura común'); rows = {}; break
                            rows = {}
                            for r in leer(f):
                                s = int(num(r.get('SECCION')))
                                if s: rows.setdefault(s, collections.Counter()).update(votos_seccion(r))
                        for i in ii:
                            s = D['S'][i][0]; v = rows.get(s)
                            if v is None or not e['r'][i]: continue
                            for p in g:
                                if p in ix: e['r'][i][ix[p]] = round(v.get(p, 0))
                            reparados += 1
        # 2) cómo compitió cada lugar
        bx = collections.defaultdict(list); ok0 = ok1 = n = 0; malos = []
        for u, ii in U.items():
            v = [0.0]*len(P)
            for i in ii:
                r = e['r'][i]
                if r:
                    for j in range(len(P)): v[j] += r[j]
            if cand and u in C:
                gs = grupos_unidad(C[u], base_comp)
                comp = particion(partidos, gs)
                # partido sin candidatura propia en ese lugar: se queda con su bloque estatal si alguno de su bloque compitió
            elif not cand:
                st = info['U'].get(str(u), {}); metodo = 'blank' if any(s == 'b' for vv in info['U'].values() for s in vv.values()) else 'votos'
                gs = [toks(c) for c, s in st.items() if (s != 'b' if metodo == 'blank' else s == 'v')]
                comp = []
                for b in base: comp += particion(b, gs) if len(b) > 1 else [b]
            else:
                comp = base
            comp = [c for c in comp if c]
            if {frozenset(c) for c in comp if sum(v[ix[p]] for p in c) > 0} != {frozenset(b) for b in base if sum(v[ix[p]] for p in b) > 0}:
                bl = sorted(([sum(v[ix[p]] for p in c), sorted(c, key=lambda p: -v[ix[p]])] for c in comp), key=lambda x: -x[0])
                key = json.dumps([m for _, m in bl])
                bx[key].extend(ii)
                vb1 = bl
            else:
                vb1 = sorted(([sum(v[ix[p]] for p in c), c] for c in base), key=lambda x: -x[0])
            EXT=[[p] for p in ('IND','OTROS') if p in ix]
            vb0 = sorted(([sum(v[ix[p]] for p in c), c] for c in base+EXT), key=lambda x: -x[0])
            vb1 = sorted(vb1 + [[sum(v[ix[p]] for p in c), c] for c in EXT], key=lambda x: -x[0])
            if u in C and C[u]:
                n += 1; wc = max(C[u], key=lambda c: C[u][c] or 0); wt = set(toks(wc)); wt = wt if any(p in ix for p in wt) else {'OTROS'}
                ok0 += bool(wt & set(vb0[0][1])); a1 = bool(wt & set(vb1[0][1])); ok1 += a1
                if not a1: malos.append((u, wc, '/'.join(vb1[0][1]), round(vb1[0][0]), round(C[u][wc] or 0)))
        if bx:
            e['bx'] = [[json.loads(k) + [[p] for p in ('IND', 'OTROS') if p in ix], sorted(set(ii))] for k, ii in bx.items()]
        else:
            e.pop('bx', None)
        rep.append(dict(cl=cl, ek=ek, metodo='cand' if cand else 'otro', n=n, antes=ok0, despues=ok1, lugares=len(bx), secc=sum(len(x) for x in bx.values()), reparados=reparados, malos=malos))
    return D
if __name__ == '__main__':
    rep = []; tot = collections.Counter()
    for edo in sorted(X):
        cl = CL.get(edo, edo.lower())
        D = procesa(cl, edo, rep)
        json.dump(D, open(f'fix/{cl}.json', 'w'), separators=(',', ':'), ensure_ascii=False)
    for r in rep:
        if isinstance(r, str): print(r); continue
        tot['n'] += r['n']; tot['a'] += r['antes']; tot['d'] += r['despues']
        if r['antes'] != r['despues'] or r['n'] != r['despues'] or r['reparados']:
            print(f"{r['cl']:5} {r['ek']:10} {r['metodo']:4} {r['antes']:4}→{r['despues']:4} de {r['n']:4}  lugares distintos {r['lugares']:3} reparadas {r['reparados']}  {r['malos'][:2]}")
    print(tot); json.dump(rep, open('rep.json', 'w'))
