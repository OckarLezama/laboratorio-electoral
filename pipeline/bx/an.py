import json, gzip, re, sys, collections, math
X = json.load(gzip.open('/mnt/user-data/uploads/Downloads/_coaliciones_lab.json.gz','rt'))
ALIAS={'ES':'PES','FXMO':'FXM','FXMV':'FXM','FXMQROO':'FXM','NAO':'NA','NAY':'NA','PNA':'NA','PANAL':'NA','CXQROO':'CQROO','PCU':'PCHU','MVC':'PMCH','ESQROO':'PES'}
def toks(c):
    if c.startswith('CAND_IND'): return ['IND']
    c=re.sub(r'^C_(COMUN_)?','',c.replace('NVA_ALIANZA','NA'))
    return [ALIAS.get(p,p) for p in c.split('_') if p and not p.isdigit()]
CL = {'TAMPS':'tam'}
def unidades(info, idx, S=None, r=None, t=None):
    U = collections.defaultdict(list); de = {}
    for u, rg in info['S'].items():
        for a, b in rg:
            for s in range(a, b+1):
                if s in idx: U[int(u)].append(idx[s]); de[idx[s]] = int(u)
    if S is not None and r is not None:
        # secciones nuevas (reseccionamiento) que recibieron votos de las dadas de baja: van al lugar que tiene la
        # mayoría de las secciones de su mismo municipio y distrito
        c2 = 2 if t == 'DIPL' else 3
        k1 = collections.defaultdict(collections.Counter); k2 = collections.defaultdict(collections.Counter)
        for i, u in de.items():
            k1[(S[i][1], S[i][c2])][u] += 1; k2[S[i][1]][u] += 1
        for i in range(len(S)):
            if i in de or not r[i]: continue
            c = k1.get((S[i][1], S[i][c2])) or k2.get(S[i][1])
            if c: U[c.most_common(1)[0][0]].append(i)
    return U
def particion(members, groups):
    par = {p: p for p in members}
    def f(a):
        while par[a] != a: a = par[a]
        return a
    for g in groups:
        m = [p for p in g if p in par]
        for p in m[1:]: par[f(p)] = f(m[0])
    comp = collections.defaultdict(list)
    for p in members: comp[f(p)].append(p)
    return list(comp.values())
def analiza(cl, edo, verbose=False):
    D = json.load(open(f'dec/{cl}.json')); P = D['P8']; ix = {p:j for j,p in enumerate(P)}
    idx = {int(s[0]): i for i, s in enumerate(D['S'])}
    out = {}
    for ek, info in (X.get(edo) or {}).items():
        if ek not in D['E'] or not info or 'S' not in info: continue
        e = D['E'][ek]; U = unidades(info, idx)
        C = {int(k): v for k, v in (info.get('C') or {}).items()}
        cand_multi = any('_' in c and not c.startswith('CAND_IND') for v in C.values() for c in v)
        blank = any(st == 'b' for v in info['U'].values() for st in v.values())
        metodo = 'cand' if cand_multi else ('blank' if blank else 'votos')
        grupos_bloc = [[m for m in b['members'] if m != 'OTROS'] for b in e['blocs']]
        sx = collections.defaultdict(list); n=ok0=ok1=nw=0; cambios=[]; malos=[]
        for u, ii in U.items():
            v = [0.0]*len(P)
            for i in ii:
                r = e['r'][i]
                if r:
                    for j in range(len(P)): v[j] += r[j]
            if metodo == 'cand' and u in C:
                gs = [toks(c) for c in C[u]]
            else:
                st = info['U'].get(str(u), {})
                gs = [toks(c) for c, s in st.items() if (s != 'b' if metodo=='blank' else s == 'v')]
            blocs = []; apart = []
            for g in grupos_bloc:
                if len(g) < 2: blocs.append(g); continue
                comp = particion(g, gs)
                if len(comp) > 1:
                    comp.sort(key=lambda c: -sum(v[ix[p]] for p in c if p in ix))
                    apart += [sorted(c) for c in comp[1:]]
                blocs += comp
            if apart: sx[tuple(tuple(c) for c in sorted(apart))].extend(ii)
            vb0 = sorted(([sum(v[ix[p]] for p in g if p in ix), g] for g in grupos_bloc), key=lambda x: -x[0])
            vb1 = sorted(([sum(v[ix[p]] for p in g if p in ix), g] for g in blocs), key=lambda x: -x[0])
            # ganador oficial por candidatura (archivo CAND)
            if u in C and C[u]:
                n += 1
                wc = max(C[u], key=lambda c: C[u][c] or 0); wt = set(toks(wc))
                a0 = bool(wt & set(vb0[0][1])); a1 = bool(wt & set(vb1[0][1]))
                ok0 += a0; ok1 += a1
                if a0 != a1: cambios.append((u, wc, vb0[0][1][0], vb1[0][1][0]))
                if not a1: malos.append((u, wc, '/'.join(vb1[0][1]), round(vb1[0][0]), round(vb1[1][0]) if len(vb1)>1 else 0, round(C[u][wc] or 0)))
        out[ek] = dict(metodo=metodo, units=len(U), n=n, ok_antes=ok0, ok_despues=ok1, sx=[[[list(c) for c in k], sorted(set(v))] for k, v in sx.items()], cambios=cambios, malos=malos)
    return D, out
if __name__ == '__main__':
    edo = sys.argv[1]; cl = CL.get(edo, edo.lower())
    D, out = analiza(cl, edo)
    for ek, o in sorted(out.items()):
        print(f"{ek:10} {o['metodo']:6} unidades {o['units']:4} con dato oficial {o['n']:4} | aciertos antes {o['ok_antes']:4} después {o['ok_despues']:4} | lugares separados {sum(len(x[1]) for x in o['sx'])} secc")
        for m in o['malos'][:6]: print('    falla:', m, D['meta']['municipios'].get(str(m[0]),'') if ek.startswith('AYU') else '')
