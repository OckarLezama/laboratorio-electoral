"""Acceso por usuario y clave, y datos cifrados para publicar.

Lee el Excel de usuarios (fuera del repositorio) y genera:
  data/acceso.json          usuarios (sin nombres ni claves legibles) y las llaves de cada estado cifradas con su clave
  data/seguro/<clave>.bin   datos de cada estado comprimidos y cifrados (AES-256-GCM)

El Excel y la carpeta privado/ NUNCA se suben a GitHub.

uso:
  python pipeline/lab.py acceso                 usa <carpeta base>/USUARIOS/usuarios.xlsx
  python pipeline/lab.py acceso ruta.xlsx       usa otro archivo
  python pipeline/lab.py acceso --plantilla     crea el Excel vacío con instrucciones y catálogo
"""
import base64
import datetime as dt
import gzip
import hashlib
import json
import os
import secrets
import sys

from comun import BASE, ESTADOS, PLANO, REPO, estado

IT = 210_000
NIVELES = {1: 'Administrador: todos los estados', 2: 'Estado completo', 3: 'Distritos federales', 4: 'Distritos locales', 5: 'Municipios'}
COLS = ['USUARIO', 'NIVEL', 'ESTADO', 'AMBITO', 'CLAVE', 'VIGENCIA', 'ACTIVO', 'NOTAS']
b64 = lambda b: base64.b64encode(b).decode()


def _excel_defecto():
    return BASE / 'USUARIOS' / 'usuarios.xlsx'


def _llaves():
    f = PLANO / 'claves.json'
    k = json.loads(f.read_text(encoding='utf-8')) if f.exists() else {}
    if '_sal' not in k:
        k['_sal'] = b64(secrets.token_bytes(16))
    return k, f


def plantilla(ruta):
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment
    from openpyxl.worksheet.datavalidation import DataValidation
    if ruta.exists():
        raise SystemExit(f'Ya existe {ruta}. No lo sobrescribo; bórralo o usa otra ruta.')
    ruta.parent.mkdir(parents=True, exist_ok=True)
    wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Usuarios'
    ws.append(COLS)
    ej = [['admin_ockar', 1, 'TODOS', '', 'cambia-esta-clave-1', '', 'NO', 'Ejemplo: administrador (pon SI cuando cambies la clave)'],
          ['coord_cdmx', 2, 'cdmx', '', 'cambia-esta-clave-2', '2027-07-31', 'NO', 'Ejemplo: todo el estado'],
          ['enlace_df12', 3, 'cdmx', '12', 'cambia-esta-clave-3', '2027-07-31', 'NO', 'Ejemplo: un distrito federal'],
          ['enlace_dl05', 4, 'cdmx', '5, 6', 'cambia-esta-clave-4', '', 'NO', 'Ejemplo: dos distritos locales (inactivo)'],
          ['enlace_tlalpan', 5, 'cdmx', '12', 'cambia-esta-clave-5', '', 'NO', 'Ejemplo: municipio por su clave (ver hoja Catálogo)']]
    for r in ej:
        ws.append(r)
    for c in ws[1]:
        c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='1C7F79')
    for col, w in zip('ABCDEFGH', (20, 8, 12, 18, 24, 12, 8, 40)):
        ws.column_dimensions[col].width = w
    dv = DataValidation(type='list', formula1='"1,2,3,4,5"', allow_blank=False); ws.add_data_validation(dv); dv.add('B2:B500')
    dv2 = DataValidation(type='list', formula1='"SI,NO"', allow_blank=True); ws.add_data_validation(dv2); dv2.add('G2:G500')
    ws.freeze_panes = 'A2'
    ins = wb.create_sheet('Instrucciones')
    txt = ['Cómo llenar la hoja Usuarios',
           '',
           'USUARIO: alias sin espacios (ej. coord_cdmx). No uses nombres completos de personas.',
           'NIVEL: 1 administrador (todos los estados) · 2 estado completo · 3 distritos federales · 4 distritos locales · 5 municipios.',
           'ESTADO: clave del estado (cdmx, jal, chis…) o su nombre. Para nivel 1 escribe TODOS. Para dar varios estados a un nivel 2, sepáralos con coma.',
           'AMBITO: solo niveles 3, 4 y 5. Números separados por coma: distrito federal, distrito local o clave de municipio (ver hoja Catálogo).',
           'CLAVE: mínimo 10 caracteres. Mezcla letras y números. Cada persona con su propia clave.',
           'VIGENCIA: fecha en que deja de funcionar (AAAA-MM-DD). Vacío = sin fecha de vencimiento.',
           'ACTIVO: SI o NO. Con NO, el usuario no puede entrar aunque siga en la lista.',
           '',
           'Después de editar: python pipeline/lab.py acceso  y sube a GitHub data/acceso.json y la carpeta data/seguro/.',
           'Este archivo tiene claves: NUNCA lo subas a GitHub ni lo mandes por correo.',
           'Los niveles 3, 4 y 5 solo reciben los datos de su distrito o municipio: no pueden ver el resto del estado.']
    for t in txt:
        ins.append([t])
    ins['A1'].font = Font(bold=True, size=13); ins.column_dimensions['A'].width = 120
    cat = wb.create_sheet('Catálogo')
    cat.append(['ESTADO', 'CLAVE ESTADO', 'MUNICIPIO', 'CLAVE MUNICIPIO', 'DISTRITOS LOCALES', 'DISTRITOS FEDERALES'])
    for c in cat[1]:
        c.font = Font(bold=True)
    for e in ESTADOS:
        f = PLANO / f'{e["clave"]}.json'
        if not f.exists():
            continue
        d = json.loads(f.read_text(encoding='utf-8'))
        dl, df = {}, {}
        for s in d['S']:
            dl.setdefault(s[1], set()).add(s[2]); df.setdefault(s[1], set()).add(s[3])
        for m, n in sorted(d['meta']['municipios'].items(), key=lambda x: x[1]):
            cat.append([d['meta']['estado'], e['clave'], n, int(m), ', '.join(map(str, sorted(dl.get(int(m), [])))), ', '.join(map(str, sorted(df.get(int(m), []))))])
    for col, w in zip('ABCDEF', (22, 12, 34, 16, 22, 22)):
        cat.column_dimensions[col].width = w
    cat.auto_filter.ref = f'A1:F{cat.max_row}'; cat.freeze_panes = 'A2'
    wb.save(ruta)
    print(f'[acceso] Plantilla creada en {ruta}')


def _cifra(clave_aes, datos, iv=None):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    iv = iv or secrets.token_bytes(12)
    return iv + AESGCM(clave_aes).encrypt(iv, datos, None)


def generar(ruta):
    import openpyxl
    if not ruta.exists():
        raise SystemExit(f'No encuentro el Excel de usuarios: {ruta}\nCréalo con: python pipeline/lab.py acceso --plantilla')
    llaves, fk = _llaves()
    cabs = sorted(p.stem for p in PLANO.glob('*.json') if p.stem != 'claves')
    sec = {}
    if cabs:
        for c in cabs:
            if c not in llaves:
                llaves[c] = b64(secrets.token_bytes(32))
        # 1) datos cifrados
        out = REPO / 'data' / 'seguro'; out.mkdir(parents=True, exist_ok=True)
        for c in cabs:
            raw = (PLANO / f'{c}.json').read_bytes()
            d = json.loads(raw)
            sec[c] = {1: {s[1] for s in d['S']}, 2: {s[2] for s in d['S']}, 3: {s[3] for s in d['S']}}
            (out / f'{c}.bin').write_bytes(b'LAB1' + _cifra(base64.b64decode(llaves[c]), gzip.compress(raw, 9, mtime=0)))
    else:
        # solo usuarios: sin datos completos en esta computadora; usa las llaves de privado/claves.json
        # y los números de municipio y distrito de data/estados.json. Los datos cifrados ya publicados no cambian.
        if not (PLANO / 'claves.json').exists():
            raise SystemExit('Falta privado/claves.json (las llaves de los estados). Cópialo a la carpeta privado/ del repositorio.')
        for x in json.loads((REPO / 'data' / 'estados.json').read_text(encoding='utf-8')):
            if x['cab'] in llaves and x.get('ids'):
                sec[x['cab']] = {1: set(x['ids']['m']), 2: set(x['ids']['dl']), 3: set(x['ids']['df'])}
        cabs = sorted(sec)
        print('[acceso] Modo solo usuarios: no hay datos completos aquí; los datos cifrados publicados no se tocan.')
    # 2) usuarios
    ws = openpyxl.load_workbook(ruta, data_only=True)['Usuarios']
    filas = list(ws.iter_rows(values_only=True))
    h = [str(x or '').strip().upper() for x in filas[0]]
    falta = [c for c in COLS[:7] if c not in h]
    if falta:
        raise SystemExit(f'Al Excel le faltan columnas: {", ".join(falta)}')
    ix = {c: h.index(c) for c in COLS if c in h}
    U, err, avisos, vistos = {}, [], [], set()
    hoy = dt.date.today()
    for n, r in enumerate(filas[1:], start=2):
        g = lambda c: r[ix[c]] if ix.get(c) is not None and ix[c] < len(r) else None
        us = str(g('USUARIO') or '').strip()
        if not us:
            continue
        pref = f'fila {n} ({us})'
        if str(g('ACTIVO') or 'SI').strip().upper() not in ('SI', 'SÍ', 'S', '1', 'TRUE'):
            continue
        if us.lower() in vistos:
            err.append(f'{pref}: usuario repetido'); continue
        vistos.add(us.lower())
        try:
            niv = int(g('NIVEL'))
            assert niv in NIVELES
        except Exception:
            err.append(f'{pref}: NIVEL debe ser 1, 2, 3, 4 o 5'); continue
        cl = str(g('CLAVE') or '')
        if len(cl) < 8:
            err.append(f'{pref}: la CLAVE debe tener al menos 8 caracteres'); continue
        if len(cl) < 10 or cl.isalpha() or cl.isdigit():
            avisos.append(f'{pref}: clave débil (usa 10+ caracteres con letras y números)')
        vig = g('VIGENCIA')
        if vig:
            try:
                vig = vig.date() if isinstance(vig, dt.datetime) else vig if isinstance(vig, dt.date) else dt.date.fromisoformat(str(vig).strip()[:10])
            except Exception:
                err.append(f'{pref}: VIGENCIA no es una fecha (usa AAAA-MM-DD)'); continue
            if vig < hoy:
                avisos.append(f'{pref}: vigencia vencida ({vig}); no se exporta'); continue
        if niv == 1:
            est = cabs
        else:
            try:
                est = [estado(x)['clave'] for x in str(g('ESTADO') or '').replace(';', ',').split(',') if x.strip()]
            except SystemExit as e:
                err.append(f'{pref}: {e}'); continue
            if not est:
                err.append(f'{pref}: falta ESTADO'); continue
            if any(c not in cabs for c in est):
                err.append(f'{pref}: no hay datos construidos para {", ".join(c for c in est if c not in cabs)}'); continue
        amb = []
        if niv >= 3:
            if len(est) != 1:
                err.append(f'{pref}: los niveles 3, 4 y 5 llevan un solo ESTADO'); continue
            try:
                amb = sorted({int(float(x)) for x in str(g('AMBITO') or '').replace(';', ',').split(',') if x.strip()})
            except ValueError:
                err.append(f'{pref}: AMBITO debe ser números separados por coma'); continue
            if not amb:
                err.append(f'{pref}: falta AMBITO'); continue
            col = {3: 3, 4: 2, 5: 1}[niv]
            malos = [a for a in amb if a not in sec[est[0]][col]]
            if malos:
                err.append(f'{pref}: {", ".join(map(str, malos))} no existe en {est[0]} como {NIVELES[niv].lower()[:-1]} (ver hoja Catálogo)'); continue
        s = secrets.token_bytes(16)
        kek = hashlib.pbkdf2_hmac('sha256', cl.encode(), s, IT, 32)
        hu = hashlib.sha256((llaves['_sal'] + '|' + us.lower()).encode()).hexdigest()
        U[hu] = {'s': b64(s), 'n': niv, 'a': amb, 'vig': vig.isoformat() if vig else None,
                 'k': {c: b64(_cifra(kek, base64.b64decode(llaves[c]))) for c in est}}
    if err:
        print('[acceso] No se generó nada. Corrige el Excel:')
        for e in err:
            print('   ·', e)
        raise SystemExit(1)
    PLANO.mkdir(exist_ok=True)
    fk.write_text(json.dumps(llaves, indent=1), encoding='utf-8')
    (REPO / 'data' / 'acceso.json').write_text(json.dumps({'v': 1, 'it': IT, 'sal': llaves['_sal'], 'u': U}, separators=(',', ':')), encoding='utf-8')
    for a in avisos:
        print('   aviso ·', a)
    por = {}
    for u in U.values():
        por[u['n']] = por.get(u['n'], 0) + 1
    solo = not any(PLANO.glob('*.json')) or not (REPO / 'data' / 'seguro').exists() or len(list(PLANO.glob('*.json'))) <= 1
    print(f'[acceso] {len(U)} usuarios activos (' + ', '.join(f'{v} de nivel {k}' for k, v in sorted(por.items())) + ')' + ('' if solo else f'; {len(cabs)} estados cifrados en data/seguro/') + '.')
    print('[acceso] Sube a GitHub: data/acceso.json' + ('' if solo else ' y la carpeta data/seguro/') + '. NO subas privado/ ni el Excel.')


def main(args):
    if args and args[0] == '--plantilla':
        from pathlib import Path
        plantilla(Path(args[1]) if len(args) > 1 else _excel_defecto())
    else:
        from pathlib import Path
        generar(Path(args[0]) if args else _excel_defecto())


if __name__ == '__main__':
    main(sys.argv[1:])
