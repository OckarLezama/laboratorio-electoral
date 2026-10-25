"""Laboratorio Político · comando único del proceso de datos.

  python pipeline/lab.py preparar chis      paso 1: extrae insumos de las bases crudas
  python pipeline/lab.py construir chis     paso 2: genera privado/chis.json (datos completos, solo en tu computadora)
  python pipeline/lab.py capas chis         paso 2b: genera las bases adicionales de pipeline/capas.json
  python pipeline/lab.py proyeccion         paso 2c: calibra la proyección 2027 con todos los estados
  python pipeline/lab.py referencias        paso 2d: revocación 2022, consulta 2021 y afiliados por partido (meta.ref)
  python pipeline/lab.py escenarios         alianzas y encuestas 2027 del Excel de escenarios (--plantilla lo crea)
  python pipeline/lab.py ganadores          registro de personas que ganaron (corre también dentro de sitio)
  python pipeline/lab.py sitio              paso 3: arma index.html, inicio.html, css/, js/, data/estados.json y data/inicio/
  python pipeline/lab.py nacional           paso 4: resumen de los 32 estados para la vista general (data/nacional.json y data/inicio/nac_zonas.json)
  python pipeline/lab.py panorama           paso 4d: datos del Panorama nacional (data/inicio/panorama.json); requiere el padrón
  python pipeline/lab.py zonas              paso 4b: mapas nacionales de estados, distritos federales y municipios (solo si cambia la cartografía)
  python pipeline/lab.py acceso             paso 5: usuarios y datos cifrados para publicar (data/acceso.json y data/seguro/)
  python pipeline/lab.py acceso --plantilla crea el Excel de usuarios con instrucciones y catálogo
  python pipeline/lab.py todo chis oax      los tres pasos para uno o varios estados
  python pipeline/lab.py estados            lista las claves disponibles

Las rutas a las bases crudas están en pipeline/config.json.
"""
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comun import ESTADOS, estado  # noqa: E402


def construir(e):
    print(f'[2/2] Construyendo data/{e["clave"]}.json')
    r = subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'construir.py'), e['clave']])
    if r.returncode:
        raise SystemExit(f'Falló la construcción de {e["nombre"]}.')


def main(a):
    if not a or a[0] in ('-h', '--help', 'ayuda'):
        print(__doc__); return
    if a[0] == 'escenarios':
        from escenarios import generar as escs, plantilla
        plantilla() if '--plantilla' in a else escs()
        return
    if a[0] == 'acceso':
        from acceso import main as acc
        acc(a[1:]); return
    cmd, est = a[0], [estado(x) for x in a[1:]]
    if cmd == 'estados':
        for e in ESTADOS:
            print(f'{e["clave"]:6} {e["ent"]:2}  {e["nombre"]}')
        return
    if cmd in ('preparar', 'construir', 'capas', 'todo') and not est:
        raise SystemExit('Indica al menos un estado, por ejemplo: python pipeline/lab.py todo chis')
    if cmd in ('preparar', 'todo'):
        from preparar import preparar
        for e in est:
            preparar(e)
    if cmd in ('construir', 'todo'):
        for e in est:
            construir(e)
    if cmd in ('capas', 'todo'):
        from capas import capas
        for e in est:
            print(f'[capas] {e["nombre"]}'); capas(e)
    if cmd in ('proyeccion', 'todo'):
        print('[proyección] Calibrando el modelo 2027 con todos los estados de privado/')
        r = subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proyeccion.py')])
        if r.returncode:
            raise SystemExit('Falló la calibración de la proyección.')
        print('[proyección] Modelo de proyección 2027 (data/modelo.json)')
        r = subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'modelo.py')])
        if r.returncode:
            raise SystemExit('Falló el modelo de proyección.')
    if cmd in ('referencias', 'ganadores', 'sitio', 'todo'):
        from referencias import generar as refs
        refs()
        from ganadores import generar as gans
        gans()
        from escenarios import generar as escs
        escs()
    if cmd in ('sitio', 'todo'):
        from sitio import sitio
        sitio()
        from acceso import _excel_defecto, generar
        if _excel_defecto().exists():
            generar(_excel_defecto())
        else:
            print('[acceso] Aviso: no encontré el Excel de usuarios; los datos cifrados no se actualizaron. Créalo con: python pipeline/lab.py acceso --plantilla')
    if cmd == 'panorama':
        print('[panorama] Datos del Panorama nacional')
        r = subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'panorama.py')])
        if r.returncode:
            raise SystemExit('Falló la generación del Panorama nacional.')
        from sitio import sitio
        sitio()
        return
    if cmd == 'zonas':
        print('[zonas] Mapas nacionales de estados, distritos federales y municipios (Marco Geográfico Seccional)')
        r = subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'zonas_mx.py')])
        if r.returncode:
            raise SystemExit('Falló la generación de mapas nacionales.')
        return
    if cmd == 'nacional':
        print('[nacional] Resumen de los 32 estados con los archivos nacionales del INE')
        r = subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'nacional.py')])
        if r.returncode:
            raise SystemExit('Falló el resumen nacional.')
        from sitio import sitio
        sitio()
    if cmd not in ('preparar', 'construir', 'capas', 'todo', 'sitio', 'proyeccion', 'nacional', 'zonas', 'panorama', 'acceso', 'referencias', 'ganadores'):
        raise SystemExit(f'Comando no reconocido: {cmd}. Usa: preparar, construir, capas, proyeccion, sitio, nacional, zonas, todo o estados.')


if __name__ == '__main__':
    main(sys.argv[1:])
