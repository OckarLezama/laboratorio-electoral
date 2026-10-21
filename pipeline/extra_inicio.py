"""Datos para el inicio: partido que gobierna cada municipio (último ayuntamiento) y participación 2024 por edad y sexo."""
import csv, glob, io, json, os, re, sys, zipfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun import BASE, ESTADOS, PIPE, REPO, ruta
from nacional import leer, bloques, MAIN, num
mun, err = {}, []
for e in ESTADOS:
    ent = e['ent']; ds = sorted(glob.glob(str(ruta('local') / e['carpeta_local'] / '*')), reverse=True)
    for d in ds:
        fs = [f for f in glob.glob(d + '/AYUNTAMIENTOS/*_MUN.csv') + glob.glob(d + '/ALCALDIAS/*_MUN.csv') if 'EXT' not in os.path.basename(f)]
        if not fs: continue
        y = int(os.path.basename(d))
        agg, used = leer(fs[0], lambda r: ['%d_%d' % (ent, int(num(r.get('ID_MUNICIPIO'))))])
        for k, (t, ln, vv, n) in agg.items():
            if k.endswith('_0'): continue
            val = sum(vv.values()) or 1
            ps = [p for p in vv if p != 'OTROS' and vv[p] > 0]
            if not ps: continue
            bl = bloques(used, ps, vv)
            b = max(bl, key=lambda b: sum(vv.get(p, 0) for p in b[1]))
            w = max(b[1], key=lambda p: vv.get(p, 0))
            mun[k] = [w, y, round(100 * sum(vv.get(p, 0) for p in b[1]) / val, 1)]
        break
    else:
        err.append(e['clave'])
G = [(18, 24), (25, 29), (30, 39), (40, 49), (50, 59), (60, 64), (65, 200)]
age = {}
z = zipfile.ZipFile(BASE / 'FUENTES_COMPLEMENTARIAS/INE_CONTEOS_CENSALES_PARTICIPACION/DatosAbiertos_DECEyEC_ConteosCensales2024.zip')
for n in z.namelist():
    if not n.endswith('.csv'): continue
    for r in csv.DictReader(io.TextIOWrapper(z.open(n), encoding='utf-8-sig')):
        e = int(r['EDOCVE']); a = int(r['EDAD']); s = r['SEXO']; g = next(i for i, (lo, hi) in enumerate(G) if lo <= a <= hi)
        for k in (str(e), '0'):
            A = age.setdefault(k, {'h': [[0, 0] for _ in G], 'm': [[0, 0] for _ in G]})
            if s in ('0', '1'):
                x = A['h' if s == '0' else 'm'][g]; x[0] += int(r['SV'] or 0); x[1] += int(r['SV'] or 0) + int(r['NV'] or 0)
json.dump({'mun': mun, 'age': age}, open(PIPE / 'insumos' / 'ayuntamientos_edad.json', 'w'), separators=(',', ':'))
print(len(mun), 'municipios; sin ayuntamientos:', err)
