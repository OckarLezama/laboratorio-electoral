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
import glob
import json
import os
import re
import unicodedata

from comun import BASE, ESTADOS, PLANO

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


def _bloques(d, ek, ii, solos=()):
    """votos por bloque en las secciones ii; los partidos de `solos` (candidatura propia ahí) cuentan aparte de su coalición."""
    e = d['E'].get(ek)
    if not e or not ii:
        return None, 0
    P = d['P8']; NP = len(P); tot = [0] * NP
    for i in ii:
        r = e['r'][i]
        if r:
            for j in range(NP):
                tot[j] += r[j]
    V = sum(tot); ix = {p: j for j, p in enumerate(P)}
    bl = [(sum(tot[ix[x]] for x in b['members'] if x in ix), set(b['members'])) for b in e['blocs']]
    grupos = [{t} for t in solos]  # cada partido con candidatura propia va solo
    if e.get('sx'):  # coaliciones que no fueron en todo el estado (pipeline/coaliciones.py): grupos que fueron aparte
        m = {}
        for gs, jj in e['sx']:
            k = {tuple(g) for g in gs}
            for j in jj:
                m.setdefault(j, set()).update(k)
        sp = None
        for i in ii:
            sp = set(m.get(i, ())) if sp is None else sp & m.get(i, set())
            if not sp:
                break
        grupos += [set(g) for g in (sp or ())]
    for G in grupos:
        for j, (v, ms) in enumerate(bl):
            if G & ms and len(ms - G) > 0:
                Gi = G & ms; vg = sum(tot[ix[t]] for t in Gi if t in ix)
                bl[j] = (v - vg, ms - Gi); bl.append((vg, Gi))
                break
    bl.sort(key=lambda x: -x[0])
    return bl, V


def resultado(d, ek, ii, tokens, solos=()):
    """(% del ganador, ventaja en puntos) en la elección ek sobre las secciones ii, si el bloque ganador incluye
    el partido o la coalición de la persona; None si no hay datos o no coincide."""
    bl, V = _bloques(d, ek, ii, solos)
    if not bl or not V or not tokens & bl[0][1]:
        return None
    return [round(100 * bl[0][0] / V, 1), round(100 * (bl[0][0] - (bl[1][0] if len(bl) > 1 else 0)) / V, 1)]


DATOS = BASE / 'LAB_POLITICO_DATOS'
CANDF = BASE / 'GANADORES' / 'candidaturas_fed_2024.csv'  # candidaturas federales 2024 del INE (solo nombre, cargo, lugar y partido)
SIGLA = {'SIGAMOS HACIENDO HISTORIA': 'MORENA_PT_PVEM', 'FUERZA Y CORAZON POR MEXICO': 'PAN_PRI_PRD', 'MOVIMIENTO CIUDADANO': 'MC',
         'PARTIDO REVOLUCIONARIO INSTITUCIONAL': 'PRI', 'PARTIDO ACCION NACIONAL': 'PAN', 'MORENA': 'MORENA', 'PARTIDO VERDE ECOLOGISTA DE MEXICO': 'PVEM',
         'PARTIDO DEL TRABAJO': 'PT', 'PARTIDO DE LA REVOLUCION DEMOCRATICA': 'PRD', 'CANDIDATURA INDEPENDIENTE': 'IND'}


def lugar(d, ek, ii, tokens, solos=()):
    """(% de votos, distancia al ganador en puntos, lugar) del bloque que incluye a la persona."""
    bl, V = _bloques(d, ek, ii, set(solos) | (set(tokens) if len(tokens) == 1 else set()))
    if not bl or not V:
        return None
    for n, (v, ms) in enumerate(bl):
        if tokens & ms:
            return [round(100 * v / V, 1), round(100 * (v - bl[0][0]) / V, 1)], n + 1
    return None


_SOLO = {}


def solos_df(ent):
    """{distrito federal: partidos que postularon candidatura propia en 2024} (de las candidaturas del INE)."""
    if ent not in _SOLO:
        S_ = collections.defaultdict(set)
        for r in candidaturas(next(x for x in ESTADOS if x['ent'] == ent)):
            sg = SIGLA.get(_n(r['PARTIDO_COALICION']), _n(r['PARTIDO_COALICION']))
            if 'DIPUTA' in _n(r['CARGO']) and '_' not in sg:
                S_[_num((r['DISTRITO_FEDERAL'] or '').split('-')[0])].add(sg)
        _SOLO[ent] = S_
    return _SOLO[ent]


def candidaturas(e):
    """Propietarias de mayoría relativa (diputaciones y senadurías) de 2024 en el estado e."""
    if not CANDF.exists():
        return []
    out = []
    with open(CANDF, encoding='utf-8', newline='') as fh:
        for r in csv.DictReader(fh):
            if r['TIPO_CANDIDATO'] != 'Persona Propietaria' or 'MR' not in r['CARGO']:
                continue
            en = _n(r['ENTIDAD']); ent = 15 if en in ('MEXICO', 'ESTADO DE MEXICO') else next((x['ent'] for x in ESTADOS if _n(x['nombre']) == en), None)
            if ent is None:  # nombres cortos: Coahuila, Michoacán, Veracruz
                ent = next((x['ent'] for x in ESTADOS if _n(x['nombre']).startswith(en + ' ') or en.startswith(_n(x['nombre']) + ' ')), None)
            if ent != e['ent']:
                continue
            out.append(r)
    return out
_FED = {}


def _secdist(f, col, ent=None):
    out = {}
    with open(f, encoding='utf-8-sig', errors='ignore', newline='') as fh:
        for r in csv.DictReader(fh):
            if ent is not None and _num(r.get('ID_ESTADO')) != ent:
                continue
            s_, d_ = _num(r.get('SECCION')), _num(r.get(col))
            if s_ and d_:
                out[s_] = d_
    return out


def vigentes(e, S):
    """Elecciones de diputaciones cuyos distritos son los del mapa de hoy: se compara, sección por sección, el
    distrito con el que se votó (archivo del INE) contra el distrito de hoy. Si coincide en 97 % o más, es la misma
    distritación y se puede llevar al mapa; si no, hubo redistritación. Así se ajusta solo cuando cambie el mapa."""
    hoy_dl = {s_[0]: s_[2] for s_ in S}; hoy_df = {s_[0]: s_[3] for s_ in S}; ok = set()
    def compara(m, hoy):
        com = [k for k in m if k in hoy]
        return len(com) >= 20 and sum(m[k] == hoy[k] for k in com) >= .97 * len(com)
    for y in (2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025):
        fs = glob.glob(str(DATOS / '02_LOCAL' / e['carpeta_local'] / str(y) / 'DIPUTACIONES_LOC_MR*' / '*_SEC.[cC][sS][vV]'))
        fs = [f for f in fs if 'EXT' not in os.path.basename(f).upper()]
        if fs and compara(_secdist(fs[0], 'ID_DISTRITO_LOCAL'), hoy_dl):
            ok.add(('dl', y))
        if y in (2015, 2018, 2021, 2024):
            if y not in _FED:
                ff = glob.glob(str(DATOS / '01_FEDERAL' / 'DIPUTACIONES_FED_MR' / str(y) / '*NAL_SEC.[cC][sS][vV]'))
                _FED[y] = collections.defaultdict(dict)
                if ff:
                    with open(ff[0], encoding='utf-8-sig', errors='ignore', newline='') as fh:
                        for r in csv.DictReader(fh):
                            en, s_, d_ = _num(r.get('ID_ESTADO')), _num(r.get('SECCION')), _num(r.get('ID_DISTRITO_FEDERAL'))
                            if en and s_ and d_:
                                _FED[y][en][s_] = d_
            if compara(_FED[y].get(e['ent'], {}), hoy_df):
                ok.add(('df', y))
    return ok


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
        VIG = vigentes(next(x for x in ESTADOS if x['ent'] == e), d['S']); Y0 = min(int(k.split('_')[1]) for k in d['E'])
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
            y = _num(r['anio']); tok = set(re.split(r'[_\-\s]+', par + ' ' + act)) - {''}; res = loc = why = None
            MUNI = ('Presidencia municipal', 'Alcaldía', 'Regiduría', 'Regiduría (plurinominal)', 'Sindicatura', 'Concejalía')
            if r['amb'] == 'jud':
                pass
            elif y and y < Y0:
                why = 'pre'  # sin resultados por sección en la plataforma
            elif cl in MUNI and mid and str(mid) in m['municipios']:
                if cl in ('Presidencia municipal', 'Alcaldía'):
                    res = resultado(d, f'AYU_{y}', MI.get(mid, []), tok)
                loc = ['m', mid, f'AYU_{y}']
            elif cl == 'Diputación local' and _num(r['dl']):
                if ('dl', y) in VIG:  # mismos distritos que el mapa de hoy (comprobado sección por sección)
                    res = resultado(d, f'DIPL_{y}', DLI.get(_num(r['dl']), []), tok); loc = ['dl', _num(r['dl']), f'DIPL_{y}']
                else:
                    why = 'redis'
            elif cl == 'Diputación federal' and _num(r['df']):
                if ('df', y) in VIG:
                    res = resultado(d, f'DIPF_{y}', DFI.get(_num(r['df']), []), tok, solos_df(e).get(_num(r['df']), ()) if y == 2024 else ()); loc = ['df', _num(r['df']), f'DIPF_{y}']
                else:
                    why = 'redis'
            elif cl == 'Gubernatura':
                res = resultado(d, f'GOB_{y}', list(range(len(d['S']))), tok); loc = ['e', 0, f'GOB_{y}']
            elif cl == 'Senaduría':
                loc = ['e', 0, f'SEN_{y}']
            R.append([pid[k], y, cid[cl], u, par, act if act != par else '', res, loc, why])
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
        # quienes compitieron por una diputación o senaduría federal de mayoría en 2024 y no ganaron
        gan24 = {(x[0], C[x[2]]) for x in R if x[1] == 2024}; nperd = 0
        SOLO = solos_df(e)
        for r in candidaturas(next(x for x in ESTADOS if x['ent'] == e)):
            k = ' '.join(sorted(_n(r['NOMBRE_CANDIDATO']).split()))
            if not k:
                continue
            cl = 'Diputación federal' if 'DIPUTA' in _n(r['CARGO']) else 'Senaduría'
            if k in pid and (pid[k], cl) in gan24:
                continue
            if k not in pid:
                pid[k] = len(P); P.append(nombre(r['NOMBRE_CANDIDATO']))
            if cl not in cid:
                cid[cl] = len(C); C.append(cl)
            sig = SIGLA.get(_n(r['PARTIDO_COALICION']), _n(r['PARTIDO_COALICION'])); tok = set(sig.split('_'))
            dfn = _num((r['DISTRITO_FEDERAL'] or '').split('-')[0]); res = loc = why = None; pl = None
            if cl == 'Diputación federal':
                if not dfn:
                    continue
                u = f'Distrito federal {dfn}'
                if ('df', 2024) in VIG:
                    x = lugar(d, 'DIPF_2024', DFI.get(dfn, []), tok, SOLO.get(dfn, ())); loc = ['df', dfn, 'DIPF_2024']
                    if x: res, pl = x
                else:
                    why = 'redis'
            elif cl == 'Senaduría':
                u = ''; x = lugar(d, 'SEN_2024', list(range(len(d['S']))), tok); loc = ['e', 0, 'SEN_2024']
                if x: res, pl = x
            par = sig if '_' not in sig else ''
            R.append([pid[k], 2024, cid[cl], u, par, sig if '_' in sig else '', res, loc, why, pl or 0]); nperd += 1
        # distritos federales 2024 donde un partido de coalición postuló candidatura propia: ahí sus votos van aparte
        if ('df', 2024) in VIG and 'DIPF_2024' in d['E']:
            ek = d['E']['DIPF_2024']; multi = {x for b in ek['blocs'] if len(b['members']) > 1 for x in b['members']}
            so = {str(k): sorted(v & multi) for k, v in solos_df(e).items() if v & multi}
            if so:
                ek['so'] = so
            else:
                ek.pop('so', None)
        m['gan'] = {'p': P, 'c': C, 'r': R, 'pm': dict(PM), 're': {str(k): v for k, v in RE.items()},
                    'fuente': 'INE, integración de cargos y candidaturas ganadoras: locales 2018–2025, federales 2000–2024 y elección judicial 2025; candidaturas federales de mayoría 2024 (quienes no ganaron)'}
        f.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        rep = sum(1 for v in collections.Counter(x[0] for x in R if len(x) < 10).values() if v > 1)
        print(f"[ganadores] {m['cab']}: {len(P):,} personas, {len(R):,} cargos ganados, {rep:,} ganaron más de una vez, presidencias en {len(PM)}/{len(m['municipios'])} municipios, {len(RE)} pueden reelegirse en 2027, {nperd} candidaturas federales 2024 que no ganaron, {sum(1 for x in R if x[6]):,} con votación, distritos vigentes {sorted(VIG)}")


if __name__ == '__main__':
    generar()
