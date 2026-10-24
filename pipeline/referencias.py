"""Datos de referencia que no son elecciones de partidos: revocación de mandato 2022, consulta popular 2021
y padrón de afiliados por partido. Se guardan en privado/<estado>.json → meta.ref.

- Revocación y consulta: el INE las reporta por "sección sede" (una casilla agrupa varias secciones), así que
  no se pueden repartir por sección sin inventar. Se agregan por municipio y por estado, que sí son exactos.
- Afiliados: solo conteos por partido y estado (los archivos no traen municipio). Nunca se guardan nombres.
  Los conteos salen de BASE/AFILIADOS/afiliados_conteos.json (se generan en la computadora a partir de los
  padrones del INE, sin copiar los nombres).

uso: python pipeline/lab.py referencias
"""
import collections
import csv
import json
import unicodedata

from comun import BASE, ESTADOS, PLANO

CONS = BASE / 'LAB_POLITICO_DATOS' / '03_CONSULTAS'
FUENTES = {
    'rm22': (CONS / 'REVOCACION_MANDATO_2022' / '2022_SEE_RM_NAL_SEC.csv', 'QUE_SIGA_EN_LA_PRESIDENCIA_DE_LA_REPÚBLICA', 'TOTAL_VOTOS'),
    'cp21': (CONS / 'CONSULTA_POPULAR_2021' / 'DEOE-DatosAbiertos-2021_SEE_CP_NAL_SEC.csv', 'SI', 'TOTAL'),
}
AFIL = BASE / 'AFILIADOS' / 'afiliados_conteos.json'


def _n(s):
    return ''.join(c for c in unicodedata.normalize('NFD', str(s)) if unicodedata.category(c) != 'Mn').upper().strip()


def _num(x):
    try:
        return int(float(x))
    except (TypeError, ValueError):
        return 0


def consultas():
    """{ent: {'rm22': {'est': [...], 'm': {id_municipio: [...]}}, ...}}  con [votos, ln, a_favor]"""
    out = collections.defaultdict(dict)
    for k, (f, fav, tot) in FUENTES.items():
        if not f.exists():
            print(f'[referencias] falta {f}')
            continue
        est = collections.defaultdict(lambda: [0, 0, 0]); mun = collections.defaultdict(lambda: [0, 0, 0])
        with open(f, encoding='utf-8-sig', newline='') as fh:
            for r in csv.DictReader(fh):
                e = _num(r['ID_ESTADO'])
                if not e:
                    continue
                v = [_num(r[tot]), _num(r['LISTA_NOMINAL']), _num(r[fav])]
                for a in (est[e], mun[(e, str(_num(r['ID_MUNICIPIO'])))]):
                    for j in range(3):
                        a[j] += v[j]
        for e, v in est.items():
            out[e][k] = {'est': v, 'm': {}}
        for (e, m), v in mun.items():
            out[e][k]['m'][m] = v
    return out


def afiliados():
    if not AFIL.exists():
        print(f'[referencias] falta {AFIL}')
        return {}
    A = json.loads(AFIL.read_text(encoding='utf-8'))
    noms = {_n(e['nombre']): e['ent'] for e in ESTADOS}
    alias = {'MEXICO': 15, 'ESTADO DE MEXICO': 15, 'CAMP': 4, 'COAHUILA DE ZARAGOZA': 5, 'MICHOACAN DE OCAMPO': 16,
             'VERACRUZ DE IGNACIO DE LA LLAVE': 30, 'DISTRITO FEDERAL': 9, 'TAMS': 28}

    def ent(x):
        x = _n(x)
        if x in alias:
            return alias[x]
        if x in noms:
            return noms[x]
        for k, v in noms.items():
            if k.startswith(x) or x.startswith(k):
                return v
        return None
    out = collections.defaultdict(lambda: {'p': {}, 'y': collections.defaultdict(dict)})
    for p, d in A.items():
        for e, n in d['ent'].items():
            i = ent(e)
            if i is None:
                print(f'[referencias] afiliados {p}: estado no reconocido {e!r}')
                continue
            out[i]['p'][p] = out[i]['p'].get(p, 0) + n
        for ky, n in d['anio'].items():
            e, y = ky.split('|'); i = ent(e)
            if i is not None:
                out[i]['y'][p][y] = out[i]['y'][p].get(y, 0) + n
    return out


def generar():
    C = consultas(); F = afiliados()
    for f in sorted(PLANO.glob('*.json')):
        if f.name == 'claves.json':
            continue
        d = json.loads(f.read_text(encoding='utf-8')); m = d['meta']; e = int(m['ent'])
        ref = {}
        for k in ('rm22', 'cp21'):
            c = C.get(e, {}).get(k)
            if not c:
                continue
            mm, sin = {}, []
            for mid, v in c['m'].items():  # mismo número de municipio del INE que usa la plataforma
                if mid in m['municipios']:
                    mm[mid] = v
                else:
                    sin.append(mid)
            ref[k] = {'est': c['est'], 'm': mm, 'sin': sin}
        if e in F:
            ref['af'] = {'p': F[e]['p'], 'y': {p: dict(sorted(v.items())) for p, v in F[e]['y'].items()},
                         'corte': 'padrones de afiliados del INE, 2026'}
        m['ref'] = ref
        f.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        nm_ok = {k: f"{len(v['m'])}/{len(m['municipios'])}" for k, v in ref.items() if k != 'af'}
        print(f"[referencias] {m['cab']}: municipios {nm_ok}" + (f" sin cruce {sum(len(v['sin']) for k, v in ref.items() if k != 'af')}" if any(ref.get(k, {}).get('sin') for k in ('rm22', 'cp21')) else '')
              + (f" · afiliados {sum(ref['af']['p'].values()):,}" if 'af' in ref else ''))


if __name__ == '__main__':
    generar()
