"""Registro de personas que ganaron un cargo (constancias de mayoría y asignaciones), por estado → meta.gan.

Fuente: archivos de integración / candidaturas ganadoras del INE (locales 2018–2025, federales 2000–2024 y
elección judicial 2025), unificados en BASE/GANADORES/ganadores_todos.csv (los arma la computadora con las
carpetas de "Resultados INE"). Solo trae a quien GANÓ: no dice quién compitió y perdió.
La misma persona se reconoce por su nombre escrito igual (sin acentos ni mayúsculas, en cualquier orden): dos personas con el mismo
nombre en el mismo estado se verían como una sola; se avisa en la plataforma.

uso: python pipeline/lab.py ganadores
"""
import collections
import csv
import json
import re
import unicodedata

from comun import BASE, PLANO

FUENTE = BASE / 'GANADORES' / 'ganadores_todos.csv'
ALCN = 'Alcaldía'


def _n(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s)) if unicodedata.category(c) != 'Mn').upper()
    return re.sub(r'\s+', ' ', re.sub(r'[^A-Z ]', ' ', s)).strip()


def _num(x):
    try:
        return int(float(x))
    except (TypeError, ValueError):
        return None


MIN = {'de', 'del', 'la', 'las', 'los', 'y', 'e', 'da', 'van', 'von'}


def nombre(s):
    """'LAURA DE LA CRUZ' → 'Laura de la Cruz' (los archivos vienen en mayúsculas)."""
    w = re.sub(r'\s+', ' ', s.strip()).lower().split(' ')
    return ' '.join(x if (j and x in MIN) else '-'.join(y[:1].upper() + y[1:] for y in x.split('-')) for j, x in enumerate(w))


def cargo(c, lista, amb):
    c = (c or '').upper()
    if amb == 'jud':
        return 'Cargo judicial'
    if c in ('PRES_MUN', 'PRE_MUN_MR') or (c == 'AYUN' and (lista in ('', '1', '1.0'))):
        return 'Presidencia municipal'
    if c in ('ALC', 'AYUN_ALC'):
        return 'Alcaldía'
    if c.startswith('REG') and 'JUN' not in c or c == 'AYUN' or c == 'AYUN_RP':
        return 'Regiduría' + (' (plurinominal)' if c.endswith('RP') else '')
    if c.startswith('SIN'):
        return 'Sindicatura' if 'JUN' not in c else 'Junta municipal'
    if c.startswith('CONC'):
        return 'Concejalía'
    if c == 'DIP_LOC_MR':
        return 'Diputación local'
    if c == 'DIP_LOC_RP':
        return 'Diputación local (plurinominal)'
    if c in ('GOB', 'GUB'):
        return 'Gubernatura'
    if c == 'DIP_MR':
        return 'Diputación federal'
    if c == 'DIP_RP':
        return 'Diputación federal (plurinominal)'
    if c == 'SEN_MR':
        return 'Senaduría'
    if c == 'SEN_RP':
        return 'Senaduría (plurinominal)'
    if c == 'PRE':
        return 'Presidencia de la República'
    if c.startswith('PRE_COM'):
        return 'Presidencia de comunidad'
    if 'JUN' in c:
        return 'Junta municipal'
    return c.title() or 'Cargo'


def resultado(d, ek, ii, tokens):
    """(% del ganador, ventaja en puntos) en la elección ek sobre las secciones ii, si el bloque ganador incluye
    el partido o la coalición de la persona; None si no hay datos o no coincide."""
    e = d['E'].get(ek)
    if not e or not ii:
        return None
    P = d['P8']; NP = len(P); tot = [0] * NP
    for i in ii:
        r = e['r'][i]
        if r:
            for j in range(NP):
                tot[j] += r[j]
    V = sum(tot)
    if not V:
        return None
    ix = {p: j for j, p in enumerate(P)}
    bl = sorted(((sum(tot[ix[x]] for x in b['members'] if x in ix), b['members']) for b in e['blocs']), key=lambda x: -x[0])
    if not bl or not tokens & set(bl[0][1]):
        return None
    return [round(100 * bl[0][0] / V, 1), round(100 * (bl[0][0] - (bl[1][0] if len(bl) > 1 else 0)) / V, 1)]


def generar():
    if not FUENTE.exists():
        print(f'[ganadores] falta {FUENTE}')
        return
    porent = collections.defaultdict(list)
    with open(FUENTE, encoding='utf-8', newline='') as fh:
        for r in csv.DictReader(fh):
            e = _num(r['ent'])
            if e and r['nombre'].strip():
                porent[e].append(r)
    for f in sorted(PLANO.glob('*.json')):
        if f.stem == 'claves':
            continue
        d = json.loads(f.read_text(encoding='utf-8')); m = d['meta']; e = int(m['ent']); rs = porent.get(e, [])
        P, pid, C, cid, R, PM = [], {}, [], {}, [], collections.defaultdict(list)
        MI, DLI, DFI = collections.defaultdict(list), collections.defaultdict(list), collections.defaultdict(list)
        for i, s_ in enumerate(d['S']):
            MI[s_[1]].append(i); DLI[s_[2]].append(i); DFI[s_[3]].append(i)
        ys = lambda t: sorted(int(k.split('_')[1]) for k in d['E'] if k.startswith(t + '_'))
        YAY, YDLs = ys('AYU'), ys('DIPL'); YDL = YDLs[-1] if YDLs else None
        for r in sorted(rs, key=lambda r: (_num(r['anio']) or 0)):
            # mismas palabras en cualquier orden = misma persona (algunos archivos ponen primero los apellidos)
            k = ' '.join(sorted(_n(r['nombre']).split()))
            if not k:
                continue
            if k not in pid:
                pid[k] = len(P); P.append(nombre(r['nombre']))
            elif r['amb'] != 'jud':
                P[pid[k]] = nombre(r['nombre'])  # se muestra como aparece en su registro más reciente
            cl = cargo(r['cargo'], (r['lista'] or '').strip(), r['amb'])
            if r['amb'] == 'jud' and r['esp']:
                cl = 'Cargo judicial · ' + r['esp'].strip().lower()
            if cl not in cid:
                cid[cl] = len(C); C.append(cl)
            mid = _num(r['mid'])
            if cl in ('Presidencia municipal', 'Alcaldía', 'Regiduría', 'Regiduría (plurinominal)', 'Sindicatura', 'Concejalía', 'Presidencia de comunidad', 'Junta municipal'):
                u = m['municipios'].get(str(mid)) or (r['mun'] or '').title()
            elif cl.startswith('Diputación local'):
                u = f"Distrito local {_num(r['dl'])}" if _num(r['dl']) else ''
            elif cl == 'Diputación federal':
                u = f"Distrito federal {_num(r['df'])}" if _num(r['df']) else ''
            else:
                u = ''
            par = (r['partido'] or '').strip().upper(); act = (r['actor'] or '').strip().upper()
            if r['amb'] == 'jud':  # la elección judicial no tiene partidos (el actor es el poder que postuló)
                par = act = ''
            y = _num(r['anio']); tok = set(re.split(r'[_\-\s]+', par + ' ' + act)) - {''}; res = loc = None
            if cl in ('Presidencia municipal', 'Alcaldía') and mid and str(mid) in m['municipios']:
                res = resultado(d, f'AYU_{y}', MI.get(mid, []), tok); loc = ['m', mid]
            elif cl == 'Diputación local' and _num(r['dl']) and y == YDL:  # distritos de hoy: solo la última elección local
                res = resultado(d, f'DIPL_{y}', DLI.get(_num(r['dl']), []), tok); loc = ['dl', _num(r['dl'])]
            elif cl == 'Diputación federal' and _num(r['df']) and y == 2024:  # distritación federal vigente desde 2024
                res = resultado(d, f'DIPF_{y}', DFI.get(_num(r['df']), []), tok); loc = ['df', _num(r['df'])]
            elif cl == 'Gubernatura':
                res = resultado(d, f'GOB_{y}', list(range(len(d['S']))), tok)
            R.append([pid[k], y, cid[cl], u, par, act if act != par else '', res, loc])
            if cl in ('Presidencia municipal', 'Alcaldía') and mid and str(mid) in m['municipios']:
                PM[str(mid)].append([_num(r['anio']), pid[k], par or act, act if act != par else ''])
        # quién puede reelegirse en 2027 (regla general vigente hasta 2030: alcaldías una vez, diputaciones locales
        # hasta cuatro periodos seguidos). Solo si el estado elige ese cargo en 2027 y su elección anterior fue en 2024.
        cfg = m.get('cfg') or {}; RE = {}
        if cfg.get('ayu2027', True) and YAY and YAY[-1] == 2024:
            for mid, L in PM.items():
                yy = {x[0]: x[1] for x in L}
                prev = [a for a in YAY if a < 2024]
                if 2024 in yy and not (prev and yy.get(prev[-1]) == yy[2024]):
                    RE[yy[2024]] = (ALCN if m['cab'] == 'cdmx' else 'Presidencia municipal') + ' · primer periodo'
        if cfg.get('cong2027', True) and YDL == 2024:
            dl_by = collections.defaultdict(set)
            for x in R:
                if C[x[2]] == 'Diputación local':
                    dl_by[x[0]].add(x[1])
            for q, yrs in dl_by.items():
                if 2024 in yrs:
                    n = 0
                    for a in reversed(YDLs):
                        if a in yrs:
                            n += 1
                        else:
                            break
                    if n < 4:
                        RE.setdefault(q, f'Diputación local · {n}.º periodo seguido')
        m['gan'] = {'p': P, 'c': C, 'r': R, 'pm': dict(PM), 're': {str(k): v for k, v in RE.items()},
                    'fuente': 'INE, integración de cargos y candidaturas ganadoras: locales 2018–2025, federales 2000–2024 y elección judicial 2025'}
        f.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        rep = sum(1 for v in collections.Counter(x[0] for x in R).values() if v > 1)
        print(f"[ganadores] {m['cab']}: {len(P):,} personas, {len(R):,} cargos ganados, {rep:,} ganaron más de una vez, presidencias en {len(PM)}/{len(m['municipios'])} municipios, {len(RE)} pueden reelegirse en 2027, {sum(1 for x in R if x[6]):,} con votación")


if __name__ == '__main__':
    generar()
